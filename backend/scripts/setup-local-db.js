/** เตรียมฐานข้อมูลเดโมด้วยบัญชี migrator ที่มีอยู่แล้ว */

const mysql = require('mysql2/promise');
require('../local-demo/database-env');

async function setupLocalDb() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = Number(process.env.DB_PORT || 3306);
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;

  let connection;
  try {
    console.log(`🔌 กำลังเชื่อมต่อ XAMPP MySQL (${dbHost}:${dbPort}) ด้วยบัญชี ${dbUser}...`);
    connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
    });

    // 1. สร้างฐานข้อมูลเดโม ที่รองรับภาษาไทย + อีโมจิ
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ ฐานข้อมูล '${dbName}' (utf8mb4_unicode_ci) พร้อมใช้งาน`);
  } catch (err) {
    console.error('❌ ตั้งค่าฐานข้อมูลไม่สำเร็จ:', err.code || err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('👉 ตรวจสอบว่าเปิด MySQL ใน XAMPP Control Panel จนขึ้นสีเขียวแล้วหรือยัง');
    } else if (['ER_ACCESS_DENIED_ERROR', 'ER_DBACCESS_DENIED_ERROR'].includes(err.code)) {
      console.error('👉 ตรวจสอบรหัสผ่านและสิทธิ์ของบัญชี unigo_migrator บน unigo_friend_demo');
    }
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupLocalDb();

