-- ============================================================================
-- ⚠️ ไฟล์ชั่วคราวเฉพาะเครื่องบอล (อยู่ใน database/local_tmp/ ซึ่งถูก .gitignore ไม่ commit!)
-- หน้าที่: จำลองตาราง users ของคินชั่วคราว เพื่อให้บอลรัน 006_chat.sql และทดสอบ Live Chat ได้ทันที
-- เมื่อนำไปรวมกับ repo ของคิน ให้ใช้ตาราง users จริงจาก migration 001 ของคินแทน
-- ============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  role ENUM('student', 'senior', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ผู้ใช้จำลองสำหรับทดสอบสลับฝั่งแชตในเครื่องบอล
INSERT IGNORE INTO users (id, username, display_name, email, role)
VALUES
  (1, 'ball', 'บอล (น้อง ม.6)', 'ball@unigo.local', 'student'),
  (2, 'peak', 'พีค (รุ่นพี่ มจธ.)', 'peak@unigo.local', 'senior'),
  (3, 'jan', 'แจน (รุ่นพี่ SIT)', 'jan@unigo.local', 'senior'),
  (4, 'kin', 'คิน (รุ่นพี่ CPE)', 'kin@unigo.local', 'senior');

