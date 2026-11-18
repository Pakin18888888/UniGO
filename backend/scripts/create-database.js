
'use strict';

const path = require('node:path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({
    path: path.resolve(__dirname, '../.env'),
    quiet: true
});

async function createDatabase() {
    const name = process.env.DB_NAME;
    const target = process.env.DB_MIGRATION_TARGET;

    // Allow only the UniGO development and test databases.
    const allowed = [
        'unigo_mariadb_test',
        'unigo_db'
    ];

    if (!allowed.includes(name) || target !== name) {
        throw new Error('Unsafe database target.');
    }

    if (process.env.DB_DIALECT !== 'mariadb') {
        throw new Error('DB_DIALECT must be mariadb.');
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('Automatic setup is disabled in production.');
    }

    if (
        !process.env.DB_USER ||
        process.env.DB_USER === 'root' ||
        !process.env.DB_PASSWORD
    ) {
        throw new Error('Use a dedicated migration account.');
    }

    let connection;

    try {
        // Connect to MariaDB without selecting a database.
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: Number(process.env.DB_PORT || 3306),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectTimeout: 10000
        });

        // Verify that this is really MariaDB.
        const [serverRows] = await connection.query(
            'SELECT VERSION() AS version'
        );

        const version = serverRows[0].version;

        if (!/mariadb/i.test(version)) {
            throw new Error(
                `Expected MariaDB, connected to: ${version}`
            );
        }

        console.log('Connected to MariaDB:', version);

        // Check whether the database already exists.
        const [databases] = await connection.execute(
            `SELECT
         DEFAULT_CHARACTER_SET_NAME AS charset_name,
         DEFAULT_COLLATION_NAME AS collation_name
       FROM information_schema.SCHEMATA
       WHERE SCHEMA_NAME = ?`,
            [name]
        );

        if (databases.length === 0) {
            // The database name is safe because of the allowlist.
            await connection.query(
                `CREATE DATABASE \`${name}\`
         CHARACTER SET utf8mb4
         COLLATE utf8mb4_unicode_ci`
            );

            console.log(`Database created: ${name}`);
        } else {
            const current = databases[0];

            if (
                current.charset_name !== 'utf8mb4' ||
                current.collation_name !== 'utf8mb4_unicode_ci'
            ) {
                throw new Error(
                    'Database exists with an unexpected charset or collation.'
                );
            }

            console.log(`Database already exists: ${name}`);
        }

        console.log('Database setup check passed.');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createDatabase().catch(error => {
    console.error('Database setup failed:', error.message);
    process.exitCode = 1;
});
