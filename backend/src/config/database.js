
'use strict';

const path = require('node:path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// โหลด Environment ของ Backend โดยเฉพาะ
dotenv.config({
  path: path.resolve(__dirname, '../../.env.app')
});

const required = [
  'APP_DB_HOST',
  'APP_DB_PORT',
  'APP_DB_USER',
  'APP_DB_PASSWORD',
  'APP_DB_NAME'
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

// ป้องกันไม่ให้ Backend ใช้บัญชี Migration หรือ root
if (
  process.env.APP_DB_USER !== 'unigo_app' ||
  process.env.APP_DB_NAME !== 'unigo_db'
) {
  throw new Error('Invalid application database configuration.');
}

const port = Number(process.env.APP_DB_PORT);
const limit = Number(
  process.env.APP_DB_CONNECTION_LIMIT || 10
);

if (
  !Number.isInteger(port) || port < 1 || port > 65535 ||
  !Number.isInteger(limit) || limit < 1 || limit > 50
) {
  throw new Error('Invalid database pool settings.');
}

// สร้าง Connection Pool สำหรับ Backend
const pool = mysql.createPool({
  host: process.env.APP_DB_HOST,
  port,
  user: process.env.APP_DB_USER,
  password: process.env.APP_DB_PASSWORD,
  database: process.env.APP_DB_NAME,

  waitForConnections: true,
  connectionLimit: limit,
  queueLimit: 0,

  charset: 'utf8mb4'
});

module.exports = { pool };
