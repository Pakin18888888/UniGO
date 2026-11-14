
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({
    path: path.resolve(__dirname, '../.env'),
    quiet: true
});

const MIGRATION_DIR = path.resolve(
    __dirname,
    '../../database/migrations'
);

const DB_NAME = process.env.DB_NAME;
const DB_TARGET = process.env.DB_MIGRATION_TARGET;

const INITIAL_TABLES = [
    'users',
    'profiles',
    'posts',
    'post_media',
    'comments',
    'post_likes',
    'follows',
    'hashtags',
    'post_hashtags',
    'post_reports',
    'portfolios',
    'portfolio_items',
    'password_reset_tokens',
    'sessions',
    'admin_audit_logs'
];

// Confirm the database target before connecting.
function validateConfig() {
    if (
        !DB_NAME ||
        !/^unigo_[a-z0-9_]+$/.test(DB_NAME) ||
        DB_NAME !== DB_TARGET
    ) {
        throw new Error(
            'Unsafe database target. Check DB_NAME and DB_MIGRATION_TARGET.'
        );
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error(
            'Production migrations are disabled in this runner.'
        );
    }

    if (!process.env.DB_USER) {
        throw new Error('DB_USER is missing.');
    }
}

function checksum(content) {
    return crypto
        .createHash('sha256')
        .update(content)
        .digest('hex');
}

// Read and validate migration files.
function loadMigrations() {
    const files = fs.readdirSync(MIGRATION_DIR)
        .filter(name => name.endsWith('.sql'))
        .sort();

    if (files.length < INITIAL_TABLES.length) {
        throw new Error('Expected at least 15 migrations.');
    }

    return files.map((file, index) => {
        const expectedNumber = String(index + 1).padStart(3, '0');

        const match = file.match(
            /^(\d{3})_create_([a-z][a-z0-9_]*)\.sql$/
        );

        if (!match || match[1] !== expectedNumber) {
            throw new Error(`Invalid migration order: ${file}`);
        }

        const table = match[2];

        if (
            index < INITIAL_TABLES.length &&
            table !== INITIAL_TABLES[index]
        ) {
            throw new Error(`Unexpected table in ${file}`);
        }

        const sql = fs.readFileSync(
            path.join(MIGRATION_DIR, file),
            'utf8'
        );

        // Current migrations each contain one CREATE TABLE.
        const withoutComments = sql
            .replace(/^\s*--.*$/gm, '')
            .trim();

        const statements = withoutComments
            .split(';')
            .map(part => part.trim())
            .filter(Boolean);

        if (statements.length !== 1) {
            throw new Error(
                `Expected exactly one SQL statement: ${file}`
            );
        }

        const createMatch = statements[0].match(
            /^CREATE\s+TABLE\s+`?([a-z][a-z0-9_]*)`?\s*\(/i
        );

        if (!createMatch || createMatch[1] !== table) {
            throw new Error(
                `CREATE TABLE does not match filename: ${file}`
            );
        }

        return {
            file,
            table,
            sql,
            hash: checksum(sql)
        };
    });
}

async function getTables(connection) {
    const [rows] = await connection.execute(
        `SELECT TABLE_NAME AS name
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?
       AND TABLE_TYPE = 'BASE TABLE'`,
        [DB_NAME]
    );

    return new Set(rows.map(row => row.name));
}

async function runMigrations() {
    validateConfig();

    // Preflight all files before any database changes.
    const migrations = loadMigrations();

    let connection;
    let locked = false;

    const lockName =
        'unigo_migrate_' +
        checksum(DB_NAME).slice(0, 24);

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: Number(process.env.DB_PORT || 3306),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: DB_NAME,
            multipleStatements: false
        });

        const [dbRows] = await connection.query(
            'SELECT DATABASE() AS db, VERSION() AS version'
        );

        if (dbRows[0].db !== DB_NAME) {
            throw new Error('Connected to the wrong database.');
        }

        console.log(`Database: ${dbRows[0].db}`);
        console.log(`MySQL: ${dbRows[0].version}`);

        // Prevent simultaneous migrations by two processes.
        const [lockRows] = await connection.query(
            'SELECT GET_LOCK(?, 10) AS acquired',
            [lockName]
        );

        if (lockRows[0].acquired !== 1) {
            throw new Error('Could not acquire migration lock.');
        }

        locked = true;

        const existingTables = await getTables(connection);
        const hasHistory = existingTables.has('schema_migrations');

        // Do not adopt an existing unmanaged database.
        if (existingTables.size > 0 && !hasHistory) {
            throw new Error(
                'Database already has tables but no migration history. ' +
                'Use a NEW empty database.'
            );
        }

        if (!hasHistory) {
            await connection.query(`
        CREATE TABLE schema_migrations (
          file_name VARCHAR(128) NOT NULL,
          checksum CHAR(64)
            CHARACTER SET ascii
            COLLATE ascii_bin NOT NULL,
          applied_at TIMESTAMP NOT NULL
            DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (file_name)
        ) ENGINE=InnoDB
        DEFAULT CHARACTER SET utf8mb4
        COLLATE utf8mb4_0900_ai_ci
      `);

            console.log('Created schema_migrations');
        }

        const [historyRows] = await connection.query(
            'SELECT file_name, checksum FROM schema_migrations'
        );

        const applied = new Map(
            historyRows.map(row => [row.file_name, row.checksum])
        );

        const knownFiles = new Set(
            migrations.map(migration => migration.file)
        );

        // Validate history before running anything.
        for (const row of historyRows) {
            if (!knownFiles.has(row.file_name)) {
                throw new Error(
                    `Applied migration file is missing: ${row.file_name}`
                );
            }
        }

        for (const migration of migrations) {
            if (applied.has(migration.file)) {
                if (applied.get(migration.file) !== migration.hash) {
                    throw new Error(
                        `Checksum mismatch: ${migration.file}`
                    );
                }

                if (!existingTables.has(migration.table)) {
                    throw new Error(
                        `Tracked table is missing: ${migration.table}`
                    );
                }
            } else if (existingTables.has(migration.table)) {
                throw new Error(
                    `Untracked table already exists: ${migration.table}`
                );
            }
        }

        // Apply only migrations not recorded in history.
        let count = 0;

        for (const migration of migrations) {
            if (applied.has(migration.file)) {
                console.log(`SKIP: ${migration.file}`);
                continue;
            }

            console.log(`RUN: ${migration.file}`);

            await connection.query(migration.sql);

            await connection.execute(
                `INSERT INTO schema_migrations
           (file_name, checksum)
         VALUES (?, ?)`,
                [migration.file, migration.hash]
            );

            console.log(`OK: ${migration.file}`);
            count++;
        }

        console.log(`Done. New migrations: ${count}`);
        console.log(`Total available: ${migrations.length}`);
    } finally {
        if (connection) {
            if (locked) {
                try {
                    await connection.query(
                        'SELECT RELEASE_LOCK(?)',
                        [lockName]
                    );
                } catch (error) {
                    console.error('Lock release warning:', error.message);
                }
            }

            await connection.end();
        }
    }
}

runMigrations().catch(error => {
    console.error('Migration failed:', error.message);
    console.error(
        'Check the database state before retrying.'
    );
    process.exitCode = 1;
});
