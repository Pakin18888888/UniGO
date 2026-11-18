/**
 * สคริปต์ JS ช่วยรันไฟล์ .sql (Migration + Seed) ของบอลเข้า MySQL อัตโนมัติ
 * ใช้เฉพาะในเครื่องบอล (ถูก ignore ใน .gitignore ไม่ต้อง commit)
 *
 * วิธีรัน:
 *   npm --prefix backend run db:seed:ball
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ROOT_DIR = path.join(__dirname, '..', '..');

// รายการไฟล์ SQL ที่จะรันตามลำดับ:
// 1) local_tmp/000_temp_users.sql = ตาราง users จำลองเฉพาะเครื่องบอล (ไม่ commit)
// 2) 004_universities_exams.sql + seeds = ตารางและข้อมูล มหาวิทยาลัย (เน้น มจธ.) + ข้อสอบ
// 3) 006_chat.sql = ตารางระบบ Live Chat (อ้าง FK ไปยัง users.id)
const SQL_FILES = [
  'database/local_tmp/000_temp_users.sql',
  'database/migrations/004_universities_exams.sql',
  'database/seeds/universities.sql',
  'database/seeds/exams.sql',
  'database/migrations/006_chat.sql',
];

async function runSqlFiles() {
  let connection;
  try {
    console.log('🔌 กำลังเชื่อมต่อ MySQL เพื่อรัน Migration + Seed ทั้งหมด...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4',
      multipleStatements: true,
    });

    for (const relPath of SQL_FILES) {
      const fullPath = path.join(ROOT_DIR, relPath);
      const sql = fs.readFileSync(fullPath, 'utf8');
      console.log(`▶️ กำลังรัน: ${relPath}`);
      await connection.query(sql);
      console.log(`✅ สำเร็จ: ${relPath}`);
    }

    // สร้างห้องแชตตัวอย่าง 1 ห้อง (บอล <-> พีค) ถ้ายังไม่มี เพื่อให้ทดสอบหน้าแชตได้ทันที
    const [[existingRoom]] = await connection.query(
      "SELECT id FROM chat_rooms WHERE direct_key = '1:2'"
    );
    if (!existingRoom) {
      const [roomRes] = await connection.query(
        "INSERT INTO chat_rooms (room_type, name, direct_key, created_by) VALUES ('direct', NULL, '1:2', 1)"
      );
      const roomId = roomRes.insertId;
      await connection.query(
        'INSERT IGNORE INTO chat_participants (room_id, user_id, role) VALUES (?, 1, ?), (?, 2, ?)',
        [roomId, 'member', roomId, 'member']
      );
      await connection.query(
        'INSERT INTO chat_messages (room_id, sender_id, content) VALUES (?, 1, ?), (?, 2, ?)',
        [
          roomId,
          'สวัสดีครับพี่พีค อยากสอบถามเรื่องคณะ SIT กับวิศวะคอม มจธ. ครับ',
          roomId,
          'สวัสดีครับน้องบอล ยินดีเลย! ถามเรื่องสาขาหรือพอร์ต TCAS ของ มจธ. ได้เลยนะ',
        ]
      );
      console.log('✅ สร้างห้องแชตตัวอย่าง (บอล <-> พีค) พร้อมข้อความเริ่มต้นเรียบร้อย');
    }

    // สรุปจำนวนข้อมูลทุกตาราง
    const tables = [
      'users',
      'universities',
      'faculties',
      'programs',
      'admission_details',
      'exam_categories',
      'exams',
      'chat_rooms',
      'chat_participants',
      'chat_messages',
    ];

    console.log('\n📊 สรุปจำนวนข้อมูลในฐานข้อมูล unigo:');
    for (const table of tables) {
      const [[row]] = await connection.query(`SELECT COUNT(*) AS total FROM \`${table}\``);
      console.log(`   - ${table}: ${row.total} แถว`);
    }

    // เช็กคณะของ มจธ. (id = 6)
    const [kmuttFaculties] = await connection.query(
      `SELECT f.id, f.name_th, COUNT(p.id) AS program_count
       FROM faculties f
       LEFT JOIN programs p ON p.faculty_id = f.id
       WHERE f.university_id = 6
       GROUP BY f.id, f.name_th
       ORDER BY f.id`
    );
    console.log('\n🎓 สรุปคณะและจำนวนสาขาของ มจธ. (university_id = 6):');
    console.table(kmuttFaculties);
  } catch (err) {
    console.error('❌ รันไฟล์ SQL ไม่สำเร็จ:', err.code || '', err.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSqlFiles();
