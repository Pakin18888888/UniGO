
'use strict';

const { pool } = require('../src/config/database');

async function checkDatabase() {
  try {
    const [serverRows] = await pool.query(`
      SELECT
        CURRENT_USER() AS account,
        DATABASE() AS database_name,
        VERSION() AS version
    `);

    const server = serverRows[0];

    if (
      server.account !== 'unigo_app@127.0.0.1' ||
      server.database_name !== 'unigo_db' ||
      !/mariadb/i.test(server.version)
    ) {
      throw new Error('Connected to an unexpected database.');
    }

    const [tableRows] = await pool.execute(`
      SELECT COUNT(*) AS total_tables
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_TYPE = 'BASE TABLE'
    `, ['unigo_db']);

    const [userRows] = await pool.query(`
      SELECT COUNT(*) AS total_users
      FROM users
    `);

    console.log('Database connection: SUCCESS');
    console.log('Account:', server.account);
    console.log('Database:', server.database_name);
    console.log('Server:', server.version);
    console.log('Tables:', tableRows[0].total_tables);
    console.log('Users:', userRows[0].total_users);

    if (Number(tableRows[0].total_tables) !== 16) {
      throw new Error('Expected 16 tables.');
    }

    console.log('Database check passed.');
  } catch (error) {
    console.error('Database check failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

checkDatabase();
