
'use strict';

require('./database');

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const secret = process.env.SESSION_SECRET;

if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
  throw new Error('SESSION_SECRET must be at least 32 bytes');
}

const ONE_DAY = 24 * 60 * 60 * 1000;

const sessionStore = new MySQLStore({
  host: process.env.APP_DB_HOST,
  port: Number(process.env.APP_DB_PORT || 3306),
  user: process.env.APP_DB_USER,
  password: process.env.APP_DB_PASSWORD,
  database: process.env.APP_DB_NAME,

  createDatabaseTable: false,
  clearExpired: true,
  expiration: ONE_DAY,
  connectionLimit: 5,

  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
});

const sessionMiddleware = session({
  name: 'unigo.sid',
  secret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,

  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ONE_DAY
  }
});

module.exports = {
  sessionMiddleware,
  sessionStore
};
