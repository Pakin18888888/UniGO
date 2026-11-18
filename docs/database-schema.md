# UniGO! Database Schema (ส่วนของบอล)

> **ผู้รับผิดชอบส่วนนี้:** บอล (ปฐณวรรณ จารุนงคราญ)  
> **ระบบที่ครอบคลุม:** University Explorer, Exam Library, Live Chat  
> **ฐานข้อมูล:** MySQL / MariaDB (`utf8mb4` / `utf8mb4_unicode_ci`, Engine: `InnoDB`)  
> **ไฟล์ Migration:**
> - `database/migrations/004_universities_exams.sql` (6 ตาราง: University + Exam)
> - `database/migrations/006_chat.sql` (3 ตาราง: Live Chat)

> ⚠️ **โน้ตสำหรับคิน (จุดเชื่อมกับตาราง `users`):**  
> ตาราง `chat_rooms.created_by`, `chat_participants.user_id`, และ `chat_messages.sender_id` อ้าง Foreign Key ไปยัง `users(id)` โดยกำหนดชนิดข้อมูลไว้เป็น `INT UNSIGNED`  
> หากตาราง `users(id)` ของคินใช้ `INT` (signed) หรือ `BIGINT UNSIGNED` ให้แจ้งบอลปรับชนิดคอลัมน์ FK ใน `006_chat.sql` ให้ตรงกันก่อน merge ครับ

---

## 1. University Explorer (`004_universities_exams.sql`)

### 1.1 `universities` — ข้อมูลมหาวิทยาลัย
| คอลัมน์ | ชนิดข้อมูล | ข้อกำหนด | คำอธิบาย |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | รหัสมหาวิทยาลัย |
| `name_th` | `VARCHAR(200)` | NOT NULL | ชื่อมหาวิทยาลัยภาษาไทย |
| `name_en` | `VARCHAR(200)` | NULL | ชื่อมหาวิทยาลัยภาษาอังกฤษ |
| `short_name` | `VARCHAR(50)` | NULL | ชื่อย่อ (เช่น จุฬาฯ, มธ., มก.) |
| `type` | `ENUM('public','autonomous','private','rajabhat','rajamangala')` | NOT NULL, DEFAULT `'public'` | ประเภท: รัฐบาล, ในกำกับของรัฐ, เอกชน, ราชภัฏ, ราชมงคล |
| `province` | `VARCHAR(100)` | NOT NULL | จังหวัดที่ตั้ง |
| `region` | `VARCHAR(50)` | NULL | ภูมิภาค (กลาง, เหนือ, อีสาน, ใต้, ตะวันออก) |
| `description` | `TEXT` | NULL | คำอธิบายภาพรวมมหาวิทยาลัย |
| `logo_url` | `VARCHAR(500)` | NULL | URL โลโก้มหาวิทยาลัย |
| `cover_url` | `VARCHAR(500)` | NULL | URL ภาพปก |
| `website_url` | `VARCHAR(500)` | NULL | เว็บไซต์หลัก |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | วันที่สร้างข้อมูล |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | วันที่แก้ไขล่าสุด |

- **Indexes:** `idx_universities_type (type)`, `idx_universities_province (province)`, `idx_universities_name_th (name_th)`

---

### 1.2 `faculties` — ข้อมูลคณะ
| คอลัมน์ | ชนิดข้อมูล | ข้อกำหนด | คำอธิบาย |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | รหัสคณะ |
| `university_id` | `INT UNSIGNED` | NOT NULL, FK → `universities(id)` ON DELETE CASCADE | รหัสมหาวิทยาลัยต้นสังกัด |
| `name_th` | `VARCHAR(200)` | NOT NULL | ชื่อคณะภาษาไทย |
| `name_en` | `VARCHAR(200)` | NULL | ชื่อคณะภาษาอังกฤษ |
| `description` | `TEXT` | NULL | คำอธิบายคณะ |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | วันที่สร้าง |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | วันที่แก้ไขล่าสุด |

- **Indexes:** `idx_faculties_university_id (university_id)`

---

### 1.3 `programs` — ข้อมูลสาขา/หลักสูตร
| คอลัมน์ | ชนิดข้อมูล | ข้อกำหนด | คำอธิบาย |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | รหัสสาขา/หลักสูตร |
| `faculty_id` | `INT UNSIGNED` | NOT NULL, FK → `faculties(id)` ON DELETE CASCADE | รหัสคณะต้นสังกัด |
| `name_th` | `VARCHAR(255)` | NOT NULL | ชื่อสาขาภาษาไทย |
| `name_en` | `VARCHAR(255)` | NULL | ชื่อสาขาภาษาอังกฤษ |
| `degree_level` | `ENUM('bachelor','master','doctoral')` | NOT NULL, DEFAULT `'bachelor'` | ระดับปริญญา |
| `study_type` | `ENUM('regular','special','international')` | NOT NULL, DEFAULT `'regular'` | ภาคปกติ / ภาคพิเศษ / นานาชาติ |
| `tuition_fee` | `INT UNSIGNED` | NULL | ค่าเทอมโดยประมาณต่อภาคเรียน (บาท) |
| `duration_years` | `TINYINT UNSIGNED` | NOT NULL, DEFAULT `4` | ระยะเวลาเรียน (ปี) |
| `description` | `TEXT` | NULL | รายละเอียดหลักสูตร |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | วันที่สร้าง |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | วันที่แก้ไขล่าสุด |

- **Indexes:** `idx_programs_faculty_id (faculty_id)`

---

### 1.4 `admission_details` — รายละเอียดการรับสมัคร (TCAS)
| คอลัมน์ | ชนิดข้อมูล | ข้อกำหนด | คำอธิบาย |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | รหัสรายละเอียดรับสมัคร |
| `program_id` | `INT UNSIGNED` | NOT NULL, FK → `programs(id)` ON DELETE CASCADE | รหัสสาขา/หลักสูตร |
| `academic_year` | `SMALLINT UNSIGNED` | NOT NULL | ปีการศึกษา (พ.ศ. เช่น `2569`) |
| `tcas_round` | `TINYINT UNSIGNED` | NOT NULL | รอบ TCAS (`1`–`4`) |
| `round_name` | `VARCHAR(100)` | NOT NULL | ชื่อรอบ (เช่น `Portfolio`, `Quota`, `Admission`) |
| `quota_seats` | `INT UNSIGNED` | NULL | จำนวนที่นั่งที่เปิดรับ |
| `min_gpax` | `DECIMAL(3,2)` | NULL | เกรดเฉลี่ยขั้นต่ำ (เช่น `3.00`) |
| `required_exams` | `VARCHAR(255)` | NULL | คะแนนสอบที่ใช้ (เช่น `TGAT, TPAT3, A-Level คณิต1`) |
| `criteria_summary` | `TEXT` | NULL | สรุปเกณฑ์การคัดเลือก |
| `application_url` | `VARCHAR(500)` | NULL | ลิงก์หน้ารับสมัคร |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | วันที่สร้าง |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | วันที่แก้ไขล่าสุด |

- **Indexes:** `idx_admission_program_year (program_id, academic_year)`

---

## 2. Exam Library (`004_universities_exams.sql`)

### 2.1 `exam_categories` — หมวดหมู่ข้อสอบ
| คอลัมน์ | ชนิดข้อมูล | ข้อกำหนด | คำอธิบาย |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | รหัสหมวดหมู่ |
| `slug` | `VARCHAR(50)` | NOT NULL, UNIQUE | คีย์สำหรับใช้ใน query string (`tgat`, `tpat`, `a-level`, `ielts`, `sat`) |
| `name` | `VARCHAR(100)` | NOT NULL | ชื่อหมวดหมู่แสดงผล |
| `description` | `TEXT` | NULL | คำอธิบายหมวดหมู่ |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | วันที่สร้าง |

---

### 2.2 `exams` — คลังข้อสอบ
| คอลัมน์ | ชนิดข้อมูล | ข้อกำหนด | คำอธิบาย |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | รหัสชุดข้อสอบ |
| `category_id` | `INT UNSIGNED` | NOT NULL, FK → `exam_categories(id)` ON DELETE RESTRICT | รหัสหมวดหมู่ข้อสอบ |
| `title` | `VARCHAR(255)` | NOT NULL | ชื่อชุดข้อสอบ |
| `subject` | `VARCHAR(100)` | NOT NULL | ชื่อวิชา (เช่น คณิตศาสตร์ประยุกต์ 1, ภาษาอังกฤษ) |
| `exam_year` | `SMALLINT UNSIGNED` | NULL | ปีของข้อสอบ (พ.ศ. เช่น `2567`) |
| `difficulty` | `ENUM('easy','medium','hard')` | NOT NULL, DEFAULT `'medium'` | ระดับความยาก |
| `duration_minutes` | `SMALLINT UNSIGNED` | NULL | เวลาทำข้อสอบ (นาที) |
| `total_questions` | `SMALLINT UNSIGNED` | NULL | จำนวนข้อทั้งหมด |
| `summary` | `TEXT` | NULL | คำอธิบาย/แนวข้อสอบ |
| `file_url` | `VARCHAR(500)` | NULL | ลิงก์ไฟล์ข้อสอบ (PDF) |
| `answer_key_url` | `VARCHAR(500)` | NULL | ลิงก์ไฟล์เฉลย |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | วันที่สร้าง |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | วันที่แก้ไขล่าสุด |

- **Indexes:** `idx_exams_category_id (category_id)`, `idx_exams_year (exam_year)`

---

## 3. Live Chat (`006_chat.sql`)

### 3.1 `chat_rooms` — ห้องสนทนา
| คอลัมน์ | ชนิดข้อมูล | ข้อกำหนด | คำอธิบาย |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | รหัสห้องแชต |
| `room_type` | `ENUM('direct','group')` | NOT NULL, DEFAULT `'direct'` | ประเภทห้อง (1-ต่อ-1 หรือ กลุ่ม) |
| `name` | `VARCHAR(150)` | NULL | ชื่อห้อง (สำหรับห้องกลุ่ม; ห้อง 1-ต่อ-1 เป็น NULL ได้) |
| `direct_key` | `VARCHAR(64)` | NULL, UNIQUE | คีย์เฉพาะห้อง 1-ต่อ-1 รูปแบบ `"minUserId:maxUserId"` กันสร้างห้องซ้ำ |
| `created_by` | `INT UNSIGNED` | NULL, FK → `users(id)` ON DELETE SET NULL | ผู้ใช้ที่สร้างห้อง |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | วันที่สร้างห้อง |
| `updated_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | วันที่อัปเดตล่าสุด (ใช้เรียงห้องที่มีข้อความล่าสุดขึ้นบนได้) |

---

### 3.2 `chat_participants` — สมาชิกในห้องแชต
| คอลัมน์ | ชนิดข้อมูล | ข้อกำหนด | คำอธิบาย |
|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | รหัสแถว |
| `room_id` | `INT UNSIGNED` | NOT NULL, FK → `chat_rooms(id)` ON DELETE CASCADE | รหัสห้องแชต |
| `user_id` | `INT UNSIGNED` | NOT NULL, FK → `users(id)` ON DELETE CASCADE | รหัสผู้ใช้ (อ้าง `users(id)` ของคิน) |
| `role` | `ENUM('member','admin')` | NOT NULL, DEFAULT `'member'` | บทบาทในห้อง |
| `joined_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | เวลาที่เข้าห้อง |
| `last_read_at` | `TIMESTAMP` | NULL | เวลาที่อ่านข้อความล่าสุด |

- **Unique Key:** `uq_chat_participants_room_user (room_id, user_id)` — ป้องกันผู้ใช้คนเดิมซ้ำในห้องเดียว
- **Indexes:** `idx_chat_participants_user_id (user_id)` — ใช้ดึงรายการห้องของผู้ใช้ (`GET /api/v1/chat/rooms`) ได้เร็ว

---

### 3.3 `chat_messages` — ข้อความแชต
| คอลัมน์ | ชนิดข้อมูล | ข้อกำหนด | คำอธิบาย |
|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | PK, AUTO_INCREMENT | รหัสข้อความ (ใช้ BIGINT รองรับข้อความจำนวนมาก) |
| `room_id` | `INT UNSIGNED` | NOT NULL, FK → `chat_rooms(id)` ON DELETE CASCADE | รหัสห้องแชต |
| `sender_id` | `INT UNSIGNED` | NOT NULL, FK → `users(id)` ON DELETE CASCADE | รหัสผู้ส่งข้อความ (อ้าง `users(id)` ของคิน) |
| `content` | `TEXT` | NOT NULL | เนื้อหาข้อความ (Backend จำกัดความยาวสูงสุด 2,000 ตัวอักษร) |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | เวลาที่ส่งข้อความ |

- **Indexes:** `idx_chat_messages_room_created (room_id, created_at)` — ใช้ดึงประวัติข้อความเรียงตามเวลาได้เร็ว

