# 📘 คู่มือส่งต่องาน Backend ส่วนของบอล (UniGO!)

> **ผู้จัดทำ:** บอล (ปฐณวรรณ จารุนงคราญ) — Backend Developer  
> **ระบบที่รับผิดชอบ:** University Explorer API, Exam Library API, Live Chat API & Socket.IO  
> **เอกสารนี้เขียนไว้สำหรับ:** **คิน** (Backend + DB Lead), **พีค** (Frontend: University / UI หลัก), และ **แจน** (Frontend: Exam / Live Chat) เพื่อใช้อ่านทำความเข้าใจโครงสร้างงาน จุดเชื่อม Database จุดต่อโค้ด และวิธีนำหน้าตัวอย่างไปตกแต่งตามธีมหลักของทีมครับ

---

## 1. สรุปภาพรวมสิ่งที่ทำเสร็จแล้ว

1. **Database (MySQL / MariaDB ผ่าน XAMPP — `utf8mb4_unicode_ci`):**
   - ออกแบบ ERD และ Schema ครบทั้ง **9 ตาราง** ของ 3 ระบบ
   - เขียนไฟล์ Migration (`004`, `006`) และไฟล์ Seed (มหาวิทยาลัยไทย 15 แห่ง โดยลงข้อมูล **มจธ. 6 คณะ 17 สาขา + รอบรับสมัคร TCAS** อย่างละเอียด, คลังข้อสอบ 5 หมวด 15 ชุด พร้อม **ลิงก์โครงสร้างและแนวข้อสอบจริง** จาก MyTCAS Blueprint, IELTS.org และ College Board SAT)
2. **Backend REST API (`/api/v1`) แบ่งชั้นชัดเจน `routes → controllers → models`:**
   - **University Explorer:** `GET /universities`, `GET /universities/:id`, `GET /universities/:id/programs`
   - **Exam Library:** `GET /exams`, `GET /exams/:id`
   - **Live Chat:** `GET /chat/rooms`, `POST /chat/rooms`, `GET /chat/rooms/:id/messages`
   - ใช้ Parameterized Query (`?`) ทุกคำสั่ง SQL, ตรวจ input (`:id`, `page`, `limit`, ความยาวข้อความ), ส่ง Response รูปแบบ `{ success, data / error }` ตามมาตรฐานทีม
3. **Live Chat Real-time (Socket.IO):**
   - รองรับ events `chat:join`, `chat:send`, `chat:message`, `chat:error`
   - แชร์ Express Session เดียวกับ REST API และตรวจสิทธิ์สมาชิกห้องใน Database ทุกครั้งก่อนเข้าห้องและก่อนส่งข้อความ (ป้องกันคนนอกแอบอ่าน/แอบส่ง)
4. **ชุดทดสอบอัตโนมัติ (Automated Tests):**
   - ครบทั้ง 3 ไฟล์ (`university.test.js`, `exam.test.js`, `chat.test.js`) ใช้ `node:test` ในตัว Node.js — **รันผ่าน 17/17 เคส**
5. **หน้าเว็บตัวอย่าง (Demo UI สำหรับทดสอบและให้ Frontend เอาไปตกแต่งต่อตามธีม):**
   - หน้าค้นหามหาวิทยาลัย คณะ และสาขา สไตล์ MyTCAS (`universities.html` — ดึงข้อมูลแบบไดนามิกทุกมหาวิทยาลัย รองรับการเพิ่มในอนาคต)
   - หน้าคลังแนวข้อสอบสไตล์ MyTCAS Blueprint (`exams.html`)
   - หน้าห้องแชตเรียลไทม์สไตล์ Instagram Direct + ตัวเทสคุย 2 ฝั่งในหน้าเดียว (`chat.html`)

---

## 2. โครงสร้างไฟล์ทั้งหมด (แยกไฟล์งานจริง vs ไฟล์เฉพาะเครื่อง/Demo)

### ✅ กลุ่ม A: 20 ไฟล์งานจริงของบอล (สำหรับ Merge เข้า Repo หลัก `develop`)
```text
backend/
├── src/
│   ├── routes/
│   │   ├── university.routes.js       # เส้นทาง /api/v1/universities
│   │   ├── exam.routes.js             # เส้นทาง /api/v1/exams
│   │   └── chat.routes.js             # เส้นทาง /api/v1/chat (มี TODO ต่อ requireAuth ของคิน)
│   ├── controllers/
│   │   ├── university.controller.js   # ตรวจ input + ตอบ JSON ส่วนมหาวิทยาลัย
│   │   ├── exam.controller.js         # ตรวจ input + ตอบ JSON ส่วนข้อสอบ
│   │   └── chat.controller.js         # ตรวจสิทธิ์สมาชิก + สร้าง/อ่านห้องแชต
│   ├── models/
│   │   ├── university.model.js        # SQL ตาราง universities/faculties/programs/admission_details
│   │   ├── exam.model.js              # SQL ตาราง exam_categories/exams
│   │   └── chat.model.js              # SQL ตาราง chat_rooms/chat_participants/chat_messages
│   └── sockets/
│       └── chat.socket.js             # Socket.IO handler (chat:join, chat:send, chat:message)
└── tests/
    ├── university.test.js             # เทสต์ University API (7 เคส)
    ├── exam.test.js                   # เทสต์ Exam API (4 เคส)
    └── chat.test.js                   # เทสต์ Chat REST + Socket.IO (6 เคส)

database/
├── migrations/
│   ├── 004_universities_exams.sql     # สร้าง 6 ตาราง (University + Exam)
│   └── 006_chat.sql                   # สร้าง 3 ตาราง (Chat - ผูก FK กับ users.id ของคิน)
├── seeds/
│   ├── universities.sql               # มหาวิทยาลัย 15 แห่ง (เน้น มจธ. 6 คณะ 17 สาขา)
│   └── exams.sql                      # ข้อสอบ 5 หมวด 15 ชุด (ลิงก์แนวข้อสอบจริง)
└── erd.md                             # แผนภาพ ERD (Mermaid)

docs/
├── api-contract.md                    # สเปก API + ตัวอย่าง Request/Response + Socket Events
└── database-schema.md                 # รายละเอียดทุกตาราง ทุกคอลัมน์ PK/FK/Index
```

### 🧰 กลุ่ม B: ไฟล์เฉพาะเครื่อง / หน้า Demo (ห้ามเอาไปทับไฟล์หลักของคิน)
```text
backend/
├── .env                               # ⚠️ ค่าลับ DB ของเครื่องบอล (ถูก .gitignore ห้าม commit!)
├── .env.example                       # แม่แบบตัวแปร .env (commit ได้)
├── package.json                       # ไฟล์ package ชั่วคราวสำหรับรันในเครื่องบอล
├── scripts/                           # สคริปต์ JS ช่วยตั้งค่า/ทดสอบ/ยิง SQL เข้า XAMPP
│   ├── setup-local-db.js              # สร้าง DB unigo + user แยก (unigo_user)
│   ├── test-db.js                     # ทดสอบเชื่อมต่อ MySQL Connection Pool
│   └── run-sql.js                     # ยิงไฟล์ migration + seed ทั้งหมดเข้า MySQL อัตโนมัติ
└── local-demo/                        # เซิร์ฟเวอร์ทดสอบ + หน้าเว็บตัวอย่าง (ไม่ใช่ app.js/server.js ของคิน)
    ├── dev-server.js                  # Express + Session + Socket.IO ชั่วคราวสำหรับทดสอบ
    └── public/
        ├── index.html                 # หน้าหลักรวมลิงก์ทั้ง 3 ระบบ
        ├── universities.html          # หน้าค้นหามหาวิทยาลัย คณะ และสาขาแบบไดนามิก (สไตล์ TCAS)
        ├── exams.html                 # หน้าคลังแนวข้อสอบ (สไตล์ TCAS Blueprint)
        └── chat.html                  # หน้าห้องแชต (สไตล์ IG Direct + ตัวเทสคุย 2 ฝั่ง)

database/
└── local_tmp/
    └── 000_temp_users.sql             # ⚠️ ตาราง users จำลองเฉพาะเครื่องบอล (ไม่ commit!)
```

---

## 3. Database เชื่อมตรงไหน? ทำงานยังไง?

### 3.1 การตั้งค่าการเชื่อมต่อฐานข้อมูล (XAMPP MySQL)
- **Database Engine:** MySQL / MariaDB (XAMPP) — Engine `InnoDB`, Charset `utf8mb4`, Collation `utf8mb4_unicode_ci` (รองรับภาษาไทย + อีโมจิ)
- **ชื่อฐานข้อมูล:** `unigo`
- **ตัวแปรแวดล้อมใน `backend/.env`:**
  ```env
  DB_HOST=localhost
  DB_PORT=3306
  DB_USER=unigo_user
  DB_PASSWORD=unigo_pass_1234
  DB_NAME=unigo
  SESSION_SECRET=unigo_ball_dev_secret_2026
  PORT=3000
  ```
  *(มีบัญชี `unigo_user` ที่ได้รับสิทธิ์เฉพาะ `unigo.*` แยกจาก `root` เพื่อความปลอดภัย)*

### 3.2 จุดเชื่อม DB ในโค้ด Backend (`backend/src/models/*.model.js`)
ไฟล์ Model ทั้ง 3 ไฟล์ (`university.model.js`, `exam.model.js`, `chat.model.js`) เชื่อมฐานข้อมูลด้วย **`mysql2/promise` Connection Pool** โดยออกแบบไว้ให้พร้อมเสียบเข้ากับ `config/db.js` ของคินทันที:

```js
// ในทุกไฟล์ backend/src/models/*.model.js
// TODO: เมื่อรวมโค้ดกับคินแล้ว ให้เปลี่ยนเหลือบรรทัดเดียว: const pool = require('../config/db');
let pool;
try {
  pool = require('../config/db'); // <-- ถ้าเอาไปวางใน repo ของคินที่มี config/db.js จะใช้ตัวนี้ทันที!
} catch {
  // ถ้ายังไม่มี config/db.js (ตอนรันแยกเครื่องบอล) จะสร้าง pool จาก .env ชั่วคราว
}
```
> **ข้อตกลงกับคิน:** `backend/src/config/db.js` ของคินต้อง `module.exports = pool;` ที่สร้างจาก `mysql2/promise` (`mysql.createPool(...)`) เพื่อให้ `await pool.query(...)` และ `await pool.getConnection()` ในโค้ดของบอลทำงานได้ทันทีโดยไม่ต้องแก้ Model เลยครับ

### 3.3 รายชื่อตารางทั้ง 9 ตารางและจุดเชื่อม Foreign Key
| ไฟล์ Migration | ตาราง | ความสัมพันธ์ / จุดเชื่อมสำคัญ |
|---|---|---|
| `004_universities_exams.sql` | `universities` | ตารางหลักเก็บข้อมูลมหาวิทยาลัย (มจธ. คือ `id = 6`) |
| `004_universities_exams.sql` | `faculties` | `university_id` → FK `universities(id)` |
| `004_universities_exams.sql` | `programs` | `faculty_id` → FK `faculties(id)` |
| `004_universities_exams.sql` | `admission_details` | `program_id` → FK `programs(id)` (เก็บรอบ TCAS 1–4, GPAX, วิชาสอบ) |
| `004_universities_exams.sql` | `exam_categories` | หมวดหมู่ข้อสอบ (`slug`: `tgat`, `tpat`, `a-level`, `ielts`, `sat`) |
| `004_universities_exams.sql` | `exams` | `category_id` → FK `exam_categories(id)` |
| `006_chat.sql` | `chat_rooms` | `created_by` → FK `users(id)` • มี `direct_key` (`UNIQUE`, เช่น `"1:2"`) กันห้อง 1-ต่อ-1 ซ้ำ |
| `006_chat.sql` | `chat_participants` | `room_id` → FK `chat_rooms(id)`, `user_id` → FK `users(id)` • `UNIQUE(room_id, user_id)` |
| `006_chat.sql` | `chat_messages` | `room_id` → FK `chat_rooms(id)`, `sender_id` → FK `users(id)` |

---

## 4. คู่มือสำหรับ "คิน" (Backend + DB Lead) — วิธีนำโค้ดบอลไปรวมเข้าโปรเจกต์หลัก

### ขั้นที่ 1: เช็กโครงสร้างตาราง `users` ให้ตรงกันก่อนรัน `006_chat.sql`
- ตาราง Chat ของบอลอ้าง Foreign Key ไปที่ **`users(id)`** ชนิด **`INT UNSIGNED`**
  - ถ้า `users.id` ของคินเป็น `INT` (signed) หรือ `BIGINT UNSIGNED` ให้แก้ชนิดคอลัมน์ `created_by`, `user_id`, `sender_id` ใน `database/migrations/006_chat.sql` ให้ตรงกันก่อนรัน migration
- ใน `backend/src/models/chat.model.js` มีการ `SELECT` คอลัมน์จากตาราง `users` 3 คอลัมน์คือ:
  - `id`
  - `username`
  - `display_name` *(หากตารางของคินตั้งชื่อเป็น `name` หรือ `full_name` ให้แก้คำว่า `display_name` ใน `chat.model.js` หรือใส่ alias `name AS display_name`)*

### ขั้นที่ 2: ลำดับการรันไฟล์ SQL
1. รัน Migration ของคินก่อน (`001` ที่มีตาราง `users`, `002`, `003`)
2. รัน `database/migrations/004_universities_exams.sql`
3. รัน `005` ของคิน (ถ้ามี)
4. รัน `database/migrations/006_chat.sql`
5. รัน Seed: `database/seeds/universities.sql` และ `database/seeds/exams.sql` *(ห้ามรัน `database/local_tmp/000_temp_users.sql` บน DB จริง เพราะเป็นแค่ตัวจำลองในเครื่องบอล)*

### ขั้นที่ 3: ต่อ Routes ของบอลใน `backend/src/app.js`
```js
const universityRoutes = require('./routes/university.routes');
const examRoutes = require('./routes/exam.routes');
const chatRoutes = require('./routes/chat.routes');

app.use('/api/v1/universities', universityRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/chat', chatRoutes);
```

### ขั้นที่ 4: เช็ก `requireAuth` และชื่อตัวแปร Session
- ใน `backend/src/routes/chat.routes.js` มี `try { require('../middleware/requireAuth') }` ไว้แล้ว (สามารถลบส่วน mock fallback ออกเมื่อรวมกับของคิน)
- ใน `backend/src/controllers/chat.controller.js` และ `backend/src/sockets/chat.socket.js` อ่านรหัสผู้ใช้ที่ล็อกอินอยู่จาก:
  - REST API: **`req.session.userId`** (และรองรับ `req.user.id` เป็นตัวสำรอง)
  - Socket.IO: **`socket.request.session.userId`**

### ขั้นที่ 5: ต่อ Socket.IO + แชร์ Session ใน `backend/src/server.js`
```js
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const sessionMiddleware = require('./config/session');
const registerChatSocket = require('./sockets/chat.socket');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || true, credentials: true },
});

// แชร์ Session Middleware เดียวกับ Express เพื่อให้ socket.request.session.userId ใช้ได้จริง
io.engine.use(sessionMiddleware);
registerChatSocket(io);
```

---

## 5. คู่มือสำหรับ "พีค" และ "แจน" (Frontend) — วิธีนำไปตกแต่งตามธีม & เชื่อม API

### 5.1 หน้าตัวอย่างที่เอาไปดูโค้ดหรือปรับแต่งธีมต่อได้ทันที
อยู่ในโฟลเดอร์ `backend/local-demo/public/`:
1. **`universities.html` (สำหรับพีค — University Explorer):**
   - ตัวอย่างการดึงรายชื่อมหาวิทยาลัยทั้งหมดแบบไดนามิกจาก `GET /api/v1/universities` (พร้อมค้นหา กรองประเภท/จังหวัด และแบ่งหน้า) และคลิกดูคณะ/สาขาของแต่ละแห่งผ่าน `?id=<id>` (`GET /api/v1/universities/:id` และ `GET /api/v1/universities/:id/programs`)
   - จำนวนมหาวิทยาลัย คณะ และสาขาทั้งหมดคำนวณจากฐานข้อมูลแบบเรียลไทม์ รองรับการเพิ่มข้อมูลใหม่ในอนาคตโดยไม่ต้องแก้โค้ดหน้าเว็บ
2. **`exams.html` (สำหรับแจน — Exam Library):**
   - ตัวอย่างการดึงรายการข้อสอบ + แท็บหมวดหมู่จาก `GET /api/v1/exams` และเปิด Modal รายละเอียดจาก `GET /api/v1/exams/:id`
   - ลิงก์ `file_url` และ `answer_key_url` เป็นลิงก์จริง (MyTCAS Blueprint / IELTS / College Board) เปิดแท็บใหม่ได้ทันที
3. **`chat.html` (สำหรับแจน — Live Chat):**
   - ตัวอย่างการดึงห้องแชต (`GET /api/v1/chat/rooms`), สร้างห้อง 1-ต่อ-1/กลุ่ม (`POST /api/v1/chat/rooms`), โหลดประวัติ (`GET /api/v1/chat/rooms/:id/messages`) และเชื่อม Socket.IO (`chat:join`, `chat:send`, `chat:message`, `chat:error`)
   - **หมายเหตุ:** ในหน้า `chat.html` มีกล่อง **`🧪 ตัวเทสคุย 2 ฝั่ง`** และ Dropdown สลับผู้ใช้ที่เรียก `/api/local-demo/*` — **ตอนขึ้นหน้าจริงของทีม ให้ลบส่วน `/api/local-demo/*` ออกแล้วใช้ระบบ Login จริงของคิน/พีคแทนครับ**

### 5.2 วิธีเปลี่ยนธีมสีและสไตล์ให้เข้ากับดีไซน์หลักของทีม (ไม่ต้องรื้อ Logic API)
ทุกหน้าใน `backend/local-demo/public/` แยกตัวแปรสีไว้ด้านบนสุดใน `<style>` ตรง `:root { ... }` แล้ว เช่นใน `universities.html` และ `exams.html`:
```css
:root {
  --tcas-navy: #142850;      /* สีหัวข้อหลัก / แถบเข้ม */
  --tcas-blue: #2563eb;      /* สีปุ่มหลัก / ลิงก์ */
  --accent: #2563eb;         /* สีไฮไลต์หลัก (เปลี่ยนเป็นสีแบรนด์ UniGO! ได้เลย) */
  --bg: #f4f6fb;             /* สีพื้นหลังหน้าเว็บ */
  --card: #ffffff;           /* สีพื้นหลังการ์ด */
  --border: #e5e7eb;         /* สีเส้นขอบ */
  --text: #1f2937;           /* สีตัวอักษรหลัก */
  --muted: #6b7280;          /* สีตัวอักษรรอง */
}
```
- **ถ้าพีค/แจนใช้ React, Tailwind, หรือ CSS ไฟล์แยก:** สามารถคัดลอกเฉพาะส่วน **การเรียก `fetch(...)`**, **การเชื่อม `io(...)`**, และ **ชื่อ field JSON** จากในแท็ก `<script>` ไปใส่ใน Component ของตัวเองได้เลยครับ

### 5.3 สรุป API & Socket.IO ที่ Frontend ต้องเรียกใช้ (รายละเอียดเต็มอยู่ใน `docs/api-contract.md`)

| ระบบ | Method & Endpoint | Query / Body หลัก | สิ่งที่คืนกลับ (`data`) |
|---|---|---|---|
| University | `GET /api/v1/universities` | `?q=&type=&province=&page=1&limit=10` | `{ items, pagination }` |
| University | `GET /api/v1/universities/:id` | - | ข้อมูลมหาลัย + `faculty_count`, `program_count` |
| University | `GET /api/v1/universities/:id/programs` | `?faculty_id=&q=` | `{ university, faculties: [{ ..., programs: [{ ..., admissions }] }] }` |
| Exam | `GET /api/v1/exams` | `?category=&q=&page=1&limit=10` | `{ categories, items, pagination }` |
| Exam | `GET /api/v1/exams/:id` | - | ข้อมูลข้อสอบ + `file_url`, `answer_key_url` |
| Chat *(ต้อง Login)* | `GET /api/v1/chat/rooms` | - | `{ rooms: [{ ..., participants, last_message }] }` |
| Chat *(ต้อง Login)* | `POST /api/v1/chat/rooms` | `{ roomType: "direct", targetUserId }` หรือ `{ roomType: "group", name, participantIds }` | `{ created, room }` |
| Chat *(ต้อง Login)* | `GET /api/v1/chat/rooms/:id/messages` | `?page=1&limit=30` | `{ roomId, messages, pagination }` |

**Socket.IO Events (แจนใช้คู่กับ `/socket.io/socket.io.js`):**
- Client ส่ง `chat:join` → `{ roomId }`
- Client ส่ง `chat:send` → `{ roomId, content }` *(ยาวไม่เกิน 2,000 ตัวอักษร)*
- Server ส่งกลับ `chat:message` → `{ id, room_id, sender_id, sender_username, sender_name, content, created_at }`
- Server ส่งกลับเมื่อผิดพลาด `chat:error` → `{ code, message }`

> ⚠️ **สำคัญมากสำหรับ Frontend ตอนเรียก Chat API / Socket.IO ข้าม Port (เช่น Frontend รันพอร์ต 5173, Backend รันพอร์ต 3000):**
> - ใน `fetch(...)` ต้องใส่ `{ credentials: 'include' }` เสมอ เพื่อให้เบราว์เซอร์ส่ง Session Cookie ไปด้วย
> - ใน `io(...)` ต้องใส่ `io('http://localhost:3000', { withCredentials: true })`

---

## 6. วิธีรันทดสอบโปรเจกต์ชุดนี้บนเครื่องเพื่อน (Quick Start)

1. เปิด **XAMPP Control Panel** → กด Start **MySQL** ให้ขึ้นสีเขียว (Port `3306`)
2. ติดตั้งแพ็กเกจ:
   ```powershell
   npm --prefix backend install
   ```
3. คัดลอกไฟล์ `backend/.env.example` เป็น `backend/.env` แล้วตั้งค่า (หรือใช้รหัสผ่านที่ต้องการ)
4. รันสร้าง DB + บัญชี `unigo_user` และยิงตาราง/ข้อมูลตัวอย่างเข้า MySQL:
   ```powershell
   npm --prefix backend run db:setup
   npm --prefix backend run db:seed:ball
   ```
5. ทดสอบเชื่อม DB และรันชุดทดสอบอัตโนมัติ (ต้องผ่านครบ 17/17 เคส):
   ```powershell
   npm --prefix backend run db:test
   npm --prefix backend test
   ```
6. เปิดเซิร์ฟเวอร์ทดสอบหน้าเว็บทั้ง 3 ระบบ:
   ```powershell
   npm --prefix backend run dev:demo
   ```
   แล้วเปิดเบราว์เซอร์ที่:
   - หน้าหลัก: `http://localhost:3000/`
   - ข้อมูลมหาวิทยาลัย คณะ และสาขา (สไตล์ TCAS): `http://localhost:3000/universities.html`
   - คลังแนวข้อสอบ (สไตล์ TCAS Blueprint): `http://localhost:3000/exams.html`
   - ห้องแชตเรียลไทม์ (สไตล์ IG Direct + ตัวเทสคุย 2 ฝั่ง): `http://localhost:3000/chat.html`

