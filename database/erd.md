# UniGO! Entity Relationship Diagram (ERD)

> **สถานะเอกสาร:** ส่วนของ **บอล (University Explorer, Exam Library, Live Chat)**  
> ส่วนของ **คิน** (`users`, `profiles`, `posts`, `portfolios`, `saved`, `reports`, ฯลฯ) จะนำมาเติมรวมในไฟล์นี้ภายหลัง  
> **ข้อตกลงสำคัญสำหรับคิน:** ตาราง `chat_rooms`, `chat_participants`, `chat_messages` อ้างอิง Foreign Key ไปที่ `users(id)` โดยปัจจุบันกำหนดชนิดเป็น `INT UNSIGNED` *(กรุณาตรวจสอบให้ตรงกับ `users.id` ใน migration `001` ก่อน merge)*

---

## แผนภาพ ERD (ส่วนของบอล + จุดเชื่อม `users` ของคิน)

```mermaid
erDiagram
    %% ===== ส่วนของคิน (Placeholder สำหรับแสดง Foreign Key) =====
    users {
        INT_UNSIGNED id PK "ตารางของคิน (migration 001)"
    }

    %% ===== 1. University Explorer (migration 004) =====
    universities {
        INT_UNSIGNED id PK
        VARCHAR name_th
        VARCHAR name_en
        VARCHAR short_name
        ENUM type "public | autonomous | private | rajabhat | rajamangala"
        VARCHAR province
        VARCHAR region
        TEXT description
        VARCHAR logo_url
        VARCHAR cover_url
        VARCHAR website_url
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    faculties {
        INT_UNSIGNED id PK
        INT_UNSIGNED university_id FK
        VARCHAR name_th
        VARCHAR name_en
        TEXT description
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    programs {
        INT_UNSIGNED id PK
        INT_UNSIGNED faculty_id FK
        VARCHAR name_th
        VARCHAR name_en
        ENUM degree_level "bachelor | master | doctoral"
        ENUM study_type "regular | special | international"
        INT_UNSIGNED tuition_fee
        TINYINT_UNSIGNED duration_years
        TEXT description
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    admission_details {
        INT_UNSIGNED id PK
        INT_UNSIGNED program_id FK
        SMALLINT_UNSIGNED academic_year
        TINYINT_UNSIGNED tcas_round "1-4"
        VARCHAR round_name
        INT_UNSIGNED quota_seats
        DECIMAL min_gpax
        VARCHAR required_exams
        TEXT criteria_summary
        VARCHAR application_url
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    %% ===== 2. Exam Library (migration 004) =====
    exam_categories {
        INT_UNSIGNED id PK
        VARCHAR slug UK "เช่น tgat, tpat, a-level"
        VARCHAR name
        TEXT description
        TIMESTAMP created_at
    }

    exams {
        INT_UNSIGNED id PK
        INT_UNSIGNED category_id FK
        VARCHAR title
        VARCHAR subject
        SMALLINT_UNSIGNED exam_year
        ENUM difficulty "easy | medium | hard"
        SMALLINT_UNSIGNED duration_minutes
        SMALLINT_UNSIGNED total_questions
        TEXT summary
        VARCHAR file_url
        VARCHAR answer_key_url
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    %% ===== 3. Live Chat (migration 006) =====
    chat_rooms {
        INT_UNSIGNED id PK
        ENUM room_type "direct | group"
        VARCHAR name
        VARCHAR direct_key UK "เช่น 12:45 กันห้อง 1-ต่อ-1 ซ้ำ"
        INT_UNSIGNED created_by FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    chat_participants {
        INT_UNSIGNED id PK
        INT_UNSIGNED room_id FK
        INT_UNSIGNED user_id FK
        ENUM role "member | admin"
        TIMESTAMP joined_at
        TIMESTAMP last_read_at
    }

    chat_messages {
        BIGINT_UNSIGNED id PK
        INT_UNSIGNED room_id FK
        INT_UNSIGNED sender_id FK
        TEXT content
        TIMESTAMP created_at
    }

    %% ===== ความสัมพันธ์ (Relationships) =====
    universities ||--o{ faculties : "มีหลายคณะ"
    faculties ||--o{ programs : "เปิดสอนหลายสาขา"
    programs ||--o{ admission_details : "มีหลายรอบรับสมัคร TCAS"

    exam_categories ||--o{ exams : "จัดหมวดหมู่ข้อสอบ"

    users ||--o{ chat_rooms : "สร้างห้อง (created_by)"
    chat_rooms ||--o{ chat_participants : "มีสมาชิก"
    users ||--o{ chat_participants : "เข้าร่วมห้อง"
    chat_rooms ||--o{ chat_messages : "เก็บข้อความ"
    users ||--o{ chat_messages : "เป็นผู้ส่ง (sender_id)"
```

---

## สรุปความสัมพันธ์หลัก

1. **University Explorer (4 ตาราง):**
   - `universities` (1) → `faculties` (N): มหาวิทยาลัย 1 แห่งมีได้หลายคณะ
   - `faculties` (1) → `programs` (N): คณะ 1 คณะเปิดสอนได้หลายสาขา/หลักสูตร
   - `programs` (1) → `admission_details` (N): 1 สาขามีข้อมูลรับสมัครได้หลายรอบ (TCAS รอบ 1–4) และหลายปีการศึกษา
2. **Exam Library (2 ตาราง):**
   - `exam_categories` (1) → `exams` (N): หมวดหมู่ข้อสอบ 1 หมวด (เช่น `tgat`, `tpat`, `a-level`) มีข้อสอบได้หลายชุด
3. **Live Chat (3 ตาราง):**
   - `chat_rooms` ↔ `users` แบบ Many-to-Many ผ่านตารางกลาง `chat_participants` (กำหนด `UNIQUE(room_id, user_id)` กันเข้าห้องซ้ำ)
   - `chat_rooms.direct_key` เป็นค่า Unique เช่น `"3:15"` (เรียง `user_id` น้อยไปมาก) เพื่อการันตีว่าห้องแชต 1-ต่อ-1 ของคู่เดิมจะไม่ถูกสร้างซ้ำ
   - `chat_messages` ผูกกับ `chat_rooms(id)` และ `users(id)` เพื่อเก็บประวัติข้อความและผู้ส่ง

