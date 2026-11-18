# UniGO! API Contract (ส่วนของบอล)

> **ผู้รับผิดชอบ:** บอล (ปฐณวรรณ จารุนงคราญ)  
> **Base URL:** `/api/v1`  
> **ผู้ใช้งาน API ส่วนนี้:**
> - **พีค (Frontend):** University Explorer (`/universities/*`)
> - **แจน (Frontend):** Exam Library (`/exams/*`) และ Live Chat (`/chat/*` + Socket.IO)
> - **คิน (Backend Lead):** ต่อ Route + `requireAuth` + Session Middleware + Socket.IO Server

---

## รูปแบบ Response มาตรฐาน (ใช้เหมือนกันทั้งทีม)

**เมื่อสำเร็จ:**
```json
{
  "success": true,
  "data": { ... }
}
```

**เมื่อผิดพลาด:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "ไม่พบข้อมูลที่ต้องการ"
  }
}
```

**Error Codes ที่ใช้:**
| HTTP Status | `error.code` | ความหมาย |
|---|---|---|
| `400` | `INVALID_INPUT` | พารามิเตอร์ไม่ถูกต้อง (เช่น `:id` ไม่ใช่ตัวเลขบวก, ข้อความว่าง/ยาวเกินกำหนด) |
| `401` | `UNAUTHORIZED` | ยังไม่ได้เข้าสู่ระบบ (ต้องมี Session จาก `requireAuth` ของคิน) |
| `403` | `FORBIDDEN` | ไม่มีสิทธิ์เข้าถึง (เช่น พยายามอ่านหรือส่งข้อความในห้องแชตที่ไม่ได้เป็นสมาชิก) |
| `404` | `NOT_FOUND` | ไม่พบมหาวิทยาลัย ข้อสอบ หรือห้องแชตที่ระบุ |
| `500` | `INTERNAL_ERROR` | เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ |

---

## 1. University Explorer API (สำหรับพีค)

### 1.1 `GET /api/v1/universities`
ดึงรายชื่อมหาวิทยาลัย พร้อมค้นหาและกรอง

**Query Parameters:**
| พารามิเตอร์ | ชนิด | ค่าเริ่มต้น | ข้อจำกัด / คำอธิบาย |
|---|---|---|---|
| `q` | string | `""` | ค้นหาจาก `name_th`, `name_en`, `short_name` |
| `type` | string | `""` | กรองประเภท: `public`, `autonomous`, `private`, `rajabhat`, `rajamangala` |
| `province` | string | `""` | กรองจังหวัด (เช่น `กรุงเทพมหานคร`, `เชียงใหม่`) |
| `page` | integer | `1` | หน้า (ขั้นต่ำ `1`) |
| `limit` | integer | `10` | จำนวนต่อหน้า (ขั้นต่ำ `1`, สูงสุด `50`) |

**ตัวอย่าง Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 6,
        "name_th": "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
        "name_en": "King Mongkut University of Technology Thonburi",
        "short_name": "มจธ. / KMUTT",
        "type": "autonomous",
        "province": "กรุงเทพมหานคร",
        "region": "กลาง",
        "description": "มหาวิทยาลัยวิจัยชั้นนำด้านวิศวกรรมศาสตร์ วิทยาศาสตร์ และเทคโนโลยีดิจิทัล",
        "logo_url": null,
        "cover_url": null,
        "website_url": "https://www.kmutt.ac.th",
        "faculty_count": 6,
        "program_count": 17
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

---

### 1.2 `GET /api/v1/universities/:id`
ดึงรายละเอียดของมหาวิทยาลัย 1 แห่ง พร้อมจำนวนคณะและจำนวนสาขา

**Path Parameters:** `id` (ตัวเลขจำนวนเต็มบวก เช่น `6` คือ มจธ.)

**ตัวอย่าง Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "name_th": "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
    "name_en": "King Mongkut University of Technology Thonburi",
    "short_name": "มจธ. / KMUTT",
    "type": "autonomous",
    "province": "กรุงเทพมหานคร",
    "region": "กลาง",
    "description": "มหาวิทยาลัยวิจัยชั้นนำด้านวิศวกรรมศาสตร์ วิทยาศาสตร์ และเทคโนโลยีดิจิทัล",
    "logo_url": null,
    "cover_url": null,
    "website_url": "https://www.kmutt.ac.th",
    "faculty_count": 6,
    "program_count": 17
  }
}
```

---

### 1.3 `GET /api/v1/universities/:id/programs`
ดึงรายชื่อคณะ สาขาที่เปิดสอน และรายละเอียดการรับสมัคร TCAS ของมหาวิทยาลัยนั้น

**Query Parameters (เสริม):**
- `faculty_id` (optional, integer): กรองเฉพาะคณะที่เลือก
- `q` (optional, string): ค้นหาชื่อสาขา/คณะ

**ตัวอย่าง Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "university": {
      "id": 6,
      "name_th": "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
      "short_name": "มจธ. / KMUTT"
    },
    "faculties": [
      {
        "id": 8,
        "name_th": "คณะเทคโนโลยีสารสนเทศ",
        "name_en": "School of Information Technology",
        "description": "โดดเด่นด้าน Computer Science, IT และ Data Science ภาคปฏิบัติ",
        "programs": [
          {
            "id": 19,
            "name_th": "เทคโนโลยีสารสนเทศ (IT)",
            "name_en": "Information Technology",
            "degree_level": "bachelor",
            "study_type": "regular",
            "tuition_fee": 26000,
            "duration_years": 4,
            "description": "เน้นการออกแบบและพัฒนาเว็บแอปพลิเคชัน...",
            "admissions": [
              {
                "id": 14,
                "academic_year": 2569,
                "tcas_round": 1,
                "round_name": "Portfolio",
                "quota_seats": 90,
                "min_gpax": "2.75",
                "required_exams": "Portfolio โครงงาน IT / Web / เขียนโปรแกรม",
                "criteria_summary": "โครงการคัดเลือกตรง...",
                "application_url": "https://join.kmutt.ac.th"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## 2. Exam Library API (สำหรับแจน)

### 2.1 `GET /api/v1/exams`
ดึงรายการข้อสอบทั้งหมด พร้อมกรองหมวดหมู่และค้นหา (แถมรายการ `categories` กลับไปให้ทำปุ่มกรองได้เลย)

**Query Parameters:**
| พารามิเตอร์ | ชนิด | ค่าเริ่มต้น | ข้อจำกัด / คำอธิบาย |
|---|---|---|---|
| `category` | string | `""` | รหัส `slug` ของหมวดหมู่ เช่น `tgat`, `tpat`, `a-level`, `ielts`, `sat` (หรือส่ง `category_id` เป็นตัวเลขก็ได้) |
| `q` | string | `""` | ค้นหาจาก `title`, `subject`, `summary` |
| `page` | integer | `1` | หน้า (ขั้นต่ำ `1`) |
| `limit` | integer | `10` | จำนวนต่อหน้า (ขั้นต่ำ `1`, สูงสุด `50`) |

**ตัวอย่าง Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "categories": [
      { "id": 1, "slug": "tgat", "name": "TGAT", "description": "..." }
    ],
    "items": [
      {
        "id": 5,
        "category_id": 2,
        "category_slug": "tpat",
        "category_name": "TPAT",
        "title": "TPAT3 ความถนัดด้านวิทยาศาสตร์ เทคโนโลยี และวิศวกรรมศาสตร์ ปี 2567",
        "subject": "ความถนัดวิศวกรรม",
        "exam_year": 2567,
        "difficulty": "hard",
        "duration_minutes": 180,
        "total_questions": 70,
        "summary": "เน้นการคิดเชิงวิศวกรรม...",
        "file_url": "https://example.unigo.local/exams/tpat3-2567.pdf",
        "answer_key_url": "https://example.unigo.local/exams/tpat3-2567-key.pdf"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

---

### 2.2 `GET /api/v1/exams/:id`
ดึงรายละเอียดข้อสอบ 1 ชุด

**ตัวอย่าง Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "category_id": 2,
    "category_slug": "tpat",
    "category_name": "TPAT",
    "title": "TPAT3 ความถนัดด้านวิทยาศาสตร์ เทคโนโลยี และวิศวกรรมศาสตร์ ปี 2567",
    "subject": "ความถนัดวิศวกรรม",
    "exam_year": 2567,
    "difficulty": "hard",
    "duration_minutes": 180,
    "total_questions": 70,
    "summary": "เน้นการคิดเชิงวิศวกรรม...",
    "file_url": "https://example.unigo.local/exams/tpat3-2567.pdf",
    "answer_key_url": "https://example.unigo.local/exams/tpat3-2567-key.pdf"
  }
}
```

---

## 3. Live Chat REST API (สำหรับแจน — ต้อง Login ผ่าน `requireAuth` ของคินทุกเส้น)

> **ตัวแปรที่คาดหวังจากคิน:** `req.session.userId` (ตัวเลข `INT UNSIGNED` ของผู้ใช้ที่ล็อกอินอยู่)

### 3.1 `GET /api/v1/chat/rooms`
ดึงรายชื่อห้องแชตทั้งหมดที่ผู้ใช้ปัจจุบันเป็นสมาชิก เรียงจากห้องที่มีความเคลื่อนไหวล่าสุด

**ตัวอย่าง Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": 1,
        "room_type": "direct",
        "name": null,
        "updated_at": "2026-11-18T06:00:00.000Z",
        "participants": [
          { "user_id": 1, "username": "ball", "display_name": "บอล (น้อง ม.6)" },
          { "user_id": 2, "username": "peak", "display_name": "พีค (รุ่นพี่ มจธ.)" }
        ],
        "last_message": {
          "id": 2,
          "sender_id": 2,
          "content": "สวัสดีครับ สอบถามเรื่อง มจธ. ได้เลยนะ!",
          "created_at": "2026-11-18T06:00:00.000Z"
        }
      }
    ]
  }
}
```

---

### 3.2 `POST /api/v1/chat/rooms`
สร้างหรือเปิดห้องสนทนา (ถ้าเป็นห้อง 1-ต่อ-1 และมีห้องของคู่นี้อยู่แล้ว จะส่งห้องเดิมกลับไปพร้อม `created: false`)

**Request Body (ห้อง 1-ต่อ-1):**
```json
{
  "targetUserId": 2
}
```

**Request Body (ห้องกลุ่ม — เสริม):**
```json
{
  "roomType": "group",
  "name": "ติวเข้า มจธ. TCAS69",
  "participantIds": [2, 3, 4]
}
```

**ตัวอย่าง Response (`201 Created` ถ้าสร้างใหม่ / `200 OK` ถ้าเจอห้อง 1-ต่อ-1 เดิม):**
```json
{
  "success": true,
  "data": {
    "created": false,
    "room": {
      "id": 1,
      "room_type": "direct",
      "name": null,
      "participants": [
        { "user_id": 1, "username": "ball", "display_name": "บอล (น้อง ม.6)" },
        { "user_id": 2, "username": "peak", "display_name": "พีค (รุ่นพี่ มจธ.)" }
      ]
    }
  }
}
```

---

### 3.3 `GET /api/v1/chat/rooms/:id/messages`
ดึงประวัติข้อความในห้องแชต (**ต้องเป็นสมาชิกห้องนั้นเท่านั้น** มิฉะนั้นคืน `403 FORBIDDEN`)

**Query Parameters:**
| พารามิเตอร์ | ชนิด | ค่าเริ่มต้น | ข้อจำกัด |
|---|---|---|---|
| `page` | integer | `1` | ขั้นต่ำ `1` |
| `limit` | integer | `30` | ขั้นต่ำ `1`, สูงสุด `100` |

**ตัวอย่าง Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "roomId": 1,
    "messages": [
      {
        "id": 1,
        "room_id": 1,
        "sender_id": 1,
        "sender_name": "บอล (น้อง ม.6)",
        "content": "สวัสดีครับพี่พีค คณะ SIT มจธ. ต้องเตรียมพอร์ตยังไงบ้างครับ",
        "created_at": "2026-11-18T05:59:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 30,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

## 4. Socket.IO Events (Live Chat Real-time — ตกลงกับแจนและคิน)

> **การเชื่อมต่อ Session (ฝั่งคินใน `server.js`):**  
> แชร์ Express Session Middleware ให้ Socket.IO ผ่าน `io.engine.use(sessionMiddleware)` เพื่อให้ `socket.request.session.userId` มีค่าผู้ใช้ที่ล็อกอินจริง

| ทิศทาง | ชื่อ Event | Payload ตัวอย่าง | คำอธิบาย |
|---|---|---|---|
| Client → Server | `chat:join` | `{ "roomId": 1 }` | ขอเข้าห้องแชต — Server ตรวจใน DB ก่อนว่า `userId` เป็นสมาชิกห้องจริง แล้วค่อย `socket.join("room:1")` (รองรับ callback `{ success, roomId }`) |
| Client → Server | `chat:send` | `{ "roomId": 1, "content": "สวัสดีครับ" }` | ส่งข้อความ — Server ตรวจสิทธิ์สมาชิก + ความยาวข้อความ (`1–2000` ตัวอักษร) + บันทึกลง `chat_messages` แล้วกระจายให้ทุกคนในห้อง |
| Server → Client | `chat:message` | `{ "id": 10, "room_id": 1, "sender_id": 1, "sender_name": "บอล", "content": "สวัสดีครับ", "created_at": "..." }` | ข้อความใหม่ที่ Server ส่งให้สมาชิกทุกคนในห้องแบบเรียลไทม์ |
| Server → Client | `chat:error` | `{ "code": "FORBIDDEN", "message": "คุณไม่ได้เป็นสมาชิกของห้องแชตนี้" }` | แจ้งเมื่อไม่มีสิทธิ์หรือข้อมูลไม่ถูกต้อง |

