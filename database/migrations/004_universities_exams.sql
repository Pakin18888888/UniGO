-- ============================================================================
-- Migration 004: University Explorer & Exam Library
-- ผู้รับผิดชอบ: บอล (ปฐณวรรณ จารุนงคราญ)
-- ฐานข้อมูล: UniGO! (MySQL / MariaDB - utf8mb4_unicode_ci)
-- ลำดับการรัน: รันได้ทันทีโดยไม่ต้องรอตาราง users (ไม่มี FK ไปหา users)
-- ============================================================================

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- 1. ตาราง universities (ข้อมูลมหาวิทยาลัย)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS universities (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name_th VARCHAR(200) NOT NULL,
  name_en VARCHAR(200) DEFAULT NULL,
  short_name VARCHAR(50) DEFAULT NULL,
  type ENUM('public', 'autonomous', 'private', 'rajabhat', 'rajamangala') NOT NULL DEFAULT 'public',
  province VARCHAR(100) NOT NULL,
  region VARCHAR(50) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  logo_url VARCHAR(500) DEFAULT NULL,
  cover_url VARCHAR(500) DEFAULT NULL,
  website_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_universities_type (type),
  INDEX idx_universities_province (province),
  INDEX idx_universities_name_th (name_th)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. ตาราง faculties (คณะในมหาวิทยาลัย)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faculties (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  university_id INT UNSIGNED NOT NULL,
  name_th VARCHAR(200) NOT NULL,
  name_en VARCHAR(200) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_faculties_university_id (university_id),
  CONSTRAINT fk_faculties_university
    FOREIGN KEY (university_id) REFERENCES universities(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. ตาราง programs (สาขาวิชา/หลักสูตรในแต่ละคณะ)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS programs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  faculty_id INT UNSIGNED NOT NULL,
  name_th VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) DEFAULT NULL,
  degree_level ENUM('bachelor', 'master', 'doctoral') NOT NULL DEFAULT 'bachelor',
  study_type ENUM('regular', 'special', 'international') NOT NULL DEFAULT 'regular',
  tuition_fee INT UNSIGNED DEFAULT NULL COMMENT 'ค่าเทอมโดยประมาณต่อภาคเรียน (บาท)',
  duration_years TINYINT UNSIGNED NOT NULL DEFAULT 4,
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_programs_faculty_id (faculty_id),
  CONSTRAINT fk_programs_faculty
    FOREIGN KEY (faculty_id) REFERENCES faculties(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. ตาราง admission_details (ข้อมูลการรับสมัคร TCAS ของแต่ละสาขา)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admission_details (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  program_id INT UNSIGNED NOT NULL,
  academic_year SMALLINT UNSIGNED NOT NULL COMMENT 'ปีการศึกษา พ.ศ. เช่น 2569',
  tcas_round TINYINT UNSIGNED NOT NULL COMMENT 'รอบ TCAS (1=Portfolio, 2=Quota, 3=Admission, 4=Direct)',
  round_name VARCHAR(100) NOT NULL,
  quota_seats INT UNSIGNED DEFAULT NULL,
  min_gpax DECIMAL(3, 2) DEFAULT NULL,
  required_exams VARCHAR(255) DEFAULT NULL,
  criteria_summary TEXT DEFAULT NULL,
  application_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_admission_program_year (program_id, academic_year),
  CONSTRAINT fk_admission_program
    FOREIGN KEY (program_id) REFERENCES programs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. ตาราง exam_categories (หมวดหมู่ข้อสอบ)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_exam_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. ตาราง exams (รายการชุดข้อสอบในคลังข้อสอบ)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exams (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  exam_year SMALLINT UNSIGNED DEFAULT NULL COMMENT 'ปี พ.ศ. ของข้อสอบ เช่น 2567',
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
  duration_minutes SMALLINT UNSIGNED DEFAULT NULL,
  total_questions SMALLINT UNSIGNED DEFAULT NULL,
  summary TEXT DEFAULT NULL,
  file_url VARCHAR(500) DEFAULT NULL,
  answer_key_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_exams_category_id (category_id),
  INDEX idx_exams_year (exam_year),
  CONSTRAINT fk_exams_category
    FOREIGN KEY (category_id) REFERENCES exam_categories(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

