const path = require('node:path');
const dotenv = require('dotenv');

const database = 'unigo_friend_demo';
const config = {};
dotenv.config({ path: path.join(__dirname, '..', '.env'), processEnv: config });

if (config.DB_NAME !== database || config.DB_MIGRATION_TARGET !== database) {
  throw new Error('Set DB_NAME and DB_MIGRATION_TARGET to unigo_friend_demo in backend/.env.');
}

if (config.DB_USER !== 'unigo_migrator' || !config.DB_PASSWORD) {
  throw new Error('Set DB_USER to unigo_migrator and supply DB_PASSWORD in backend/.env.');
}

// Standalone entry points share this target with the model fallback pools.
Object.assign(process.env, {
  DB_HOST: config.DB_HOST || '127.0.0.1',
  DB_PORT: config.DB_PORT || '3306',
  DB_USER: config.DB_USER,
  DB_PASSWORD: config.DB_PASSWORD,
  DB_NAME: database,
  DB_MIGRATION_TARGET: database,
});

module.exports = {
  port: Number(config.FRIEND_DEMO_PORT || 3001),
  sessionSecret: config.SESSION_SECRET,
};
