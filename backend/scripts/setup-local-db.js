/**
 * สคริปต์ตั้งค่าฐานข้อมูลในเครื่องบอลแบบอัตโนมัติ (ใช้เฉพาะในเครื่อง ไม่ต้อง commit)
 * หน้าที่:
 * 1. เชื่อมต่อ MySQL ใน XAMPP ด้วยบัญชี root (ค่าเริ่มต้นของ XAMPP ไม่มีรหัสผ่าน)
 * 2. สร้างฐานข้อมูล unigo (utf8mb4_unicode_ci) ถ้ายังไม่มี
 * 3. สร้าง user แยก (unigo_user) ตามค่าใน .env และให้สิทธิ์เฉพาะฐานข้อมูล unigo
 */

const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function setupLocalDb() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = Number(process.env.DB_PORT || 3306);
  const dbName = process.env.DB_NAME || 'unigo';
  const dbUser = process.env.DB_USER || 'unigo_user';
  const dbPassword = process.env.DB_PASSWORD || 'unigo_pass_1234';

  // ป้องกันชื่อ DB / User ที่มีอักขระแปลก ๆ
  if (!/^[a-zA-Z0-9_]+$/.test(dbName) || !/^[a-zA-Z0-9_]+$/.test(dbUser)) {
    throw new Error('DB_NAME และ DB_USER ควรมีเฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และ _ เท่านั้น');
  }

  let connection;
  try {
    console.log(`🔌 กำลังเชื่อมต่อ XAMPP MySQL (${dbHost}:${dbPort}) ด้วยบัญชี root...`);
    connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: 'root',
      password: '', // ค่าเริ่มต้นของ XAMPP MySQL คือไม่มีรหัสผ่าน
    });

    // 1. สร้างฐานข้อมูล unigo ที่รองรับภาษาไทย + อีโมจิ
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ ฐานข้อมูล '${dbName}' (utf8mb4_unicode_ci) พร้อมใช้งาน`);

    // 2. สร้าง user แยกทั้ง localhost และ 127.0.0.1 (กันปัญหา IPv4/IPv6 บน Windows)
    await connection.query(
      `CREATE USER IF NOT EXISTS '${dbUser}'@'localhost' IDENTIFIED BY ?`,
      [dbPassword]
    );
    await connection.query(
      `CREATE USER IF NOT EXISTS '${dbUser}'@'127.0.0.1' IDENTIFIED BY ?`,
      [dbPassword]
    );

    // 3. ให้สิทธิ์จัดการได้เฉพาะฐานข้อมูล unigo เท่านั้น
    await connection.query(
      `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'localhost'`
    );
    await connection.query(
      `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'127.0.0.1'`
    );
    await connection.query('FLUSH PRIVILEGES');

    console.log(`✅ สร้างบัญชี '${dbUser}' และให้สิทธิ์บนฐานข้อมูล '${dbName}' เรียบร้อย!`);
  } catch (err) {
    console.error('❌ ตั้งค่าฐานข้อมูลไม่สำเร็จ:', err.code || err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('👉 ตรวจสอบว่าเปิด MySQL ใน XAMPP Control Panel จนขึ้นสีเขียวแล้วหรือยัง');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('👉 บัญชี root ในเครื่องอาจมีการตั้งรหัสผ่านไว้ หรือสิทธิ์ไม่พอ');
    }
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupLocalDb();

