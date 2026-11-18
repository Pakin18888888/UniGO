-- ============================================================================
-- Migration 006: Live Chat (ห้องแชต, สมาชิกห้อง, ข้อความ)
-- ผู้รับผิดชอบ: บอล (ปฐณวรรณ จารุนงคราญ)
-- ฐานข้อมูล: UniGO! (MySQL / MariaDB - utf8mb4_unicode_ci)
--
-- ⚠️ ลำดับการรันสำคัญ:
--   ต้องรันหลังจาก migration 001 ของคิน (ที่มีตาราง users) แล้วเท่านั้น
--   เพราะมี Foreign Key อ้างอิง users(id) ชนิด INT UNSIGNED
--   (หากรันทดสอบในเครื่องบอลก่อนของคินเสร็จ ให้รัน database/local_tmp/000_temp_users.sql ก่อน)
-- ============================================================================

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- 1. ตาราง chat_rooms (ห้องสนทนา 1-ต่อ-1 หรือกลุ่ม)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_rooms (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_type ENUM('direct', 'group') NOT NULL DEFAULT 'direct',
  name VARCHAR(150) DEFAULT NULL COMMENT 'ชื่อห้อง (ห้อง direct เป็น NULL ได้)',
  direct_key VARCHAR(64) DEFAULT NULL COMMENT 'คีย์กันห้อง 1-ต่อ-1 ซ้ำ รูปแบบ minId:maxId เช่น 1:2',
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_chat_rooms_direct_key (direct_key),
  INDEX idx_chat_rooms_updated_at (updated_at),
  CONSTRAINT fk_chat_rooms_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. ตาราง chat_participants (สมาชิกในแต่ละห้องแชต)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_participants (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  role ENUM('member', 'admin') NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_chat_participants_room_user (room_id, user_id),
  INDEX idx_chat_participants_user_id (user_id),
  CONSTRAINT fk_chat_participants_room
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_chat_participants_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. ตาราง chat_messages (ประวัติข้อความในห้องแชต)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id INT UNSIGNED NOT NULL,
  sender_id INT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_chat_messages_room_created (room_id, created_at),
  INDEX idx_chat_messages_sender_id (sender_id),
  CONSTRAINT fk_chat_messages_room
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_chat_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

