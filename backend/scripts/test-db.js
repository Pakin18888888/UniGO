/**
 * สคริปต์ทดสอบการเชื่อมต่อ MySQL ด้วย Connection Pool (ใช้เฉพาะในเครื่อง ไม่ต้อง commit)
 * ใช้บัญชี unigo_user จากไฟล์ .env เหมือนที่ระบบ Backend จริงจะใช้
 */

const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testDatabaseConnection() {
  // สร้าง Connection Pool (วิธีเดียวกับที่ config/db.js ของคินจะใช้)
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    console.log('🔌 กำลังทดสอบเชื่อมต่อ MySQL ด้วย Connection Pool...');

    // 1. ทดสอบคำสั่งพื้นฐาน SELECT 1
    const [pingRows] = await pool.query(
      'SELECT 1 AS ok, DATABASE() AS db_name, CURRENT_USER() AS connected_as'
    );
    console.log('✅ เชื่อมต่อสำเร็จ!', pingRows[0]);

    // 2. ลองดึงรายชื่อตารางทั้งหมดในฐานข้อมูล unigo
    const [tables] = await pool.query('SHOW TABLES');
    if (tables.length === 0) {
      console.log('ℹ️ ตอนนี้ในฐานข้อมูลยังไม่มีตาราง (ปกติครับ เดี๋ยวเราจะสร้างด้วย migration ในขั้นถัดไป)');
    } else {
      const tableNames = tables.map((row) => Object.values(row)[0]);
      console.log(`📋 พบตารางทั้งหมด ${tableNames.length} ตาราง:`, tableNames);
    }
  } catch (err) {
    console.error('❌ เชื่อมต่อฐานข้อมูลไม่สำเร็จ:', err.code, '-', err.message);

    // แสดงคำแนะนำตาม error ที่พบบ่อย
    if (err.code === 'ECONNREFUSED') {
      console.error('👉 แก้ไข: เปิด XAMPP แล้วกด Start MySQL ให้ขึ้นสีเขียว (และเช็ก DB_PORT ใน .env)');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('👉 แก้ไข: เช็ก DB_USER / DB_PASSWORD ใน .env หรือรัน npm run db:setup ใหม่');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('👉 แก้ไข: ไม่พบฐานข้อมูลชื่อนี้ เช็ก DB_NAME ใน .env หรือรัน npm run db:setup');
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testDatabaseConnection();

