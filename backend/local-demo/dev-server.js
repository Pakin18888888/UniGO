/**
 * เซิร์ฟเวอร์ทดสอบเฉพาะเครื่องของบอล (Standalone Dev Server)
 * ⚠️ ไม่ใช่ไฟล์ app.js / server.js ของคิน (ห้ามเอาไปทับไฟล์ของคินตอน merge)
 *
 * หน้าที่:
 * 1. รัน API ส่วนของบอลทั้ง 3 ระบบ (/api/v1/universities, /api/v1/exams, /api/v1/chat)
 * 2. รัน Socket.IO (chat.socket.js) โดยแชร์ express-session เดียวกัน
 * 3. เสิร์ฟหน้า HTML ดิบ ๆ (ไม่ต้องตกแต่ง) เพื่อทดสอบและส่งต่อให้พีค/แจนเอาไปตกแต่ง
 *
 * วิธีรัน:
 *   npm --prefix backend run dev:demo
 */

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');

const demoConfig = require('./database-env');

const universityRoutes = require('../src/routes/university.routes');
const examRoutes = require('../src/routes/exam.routes');
const chatRoutes = require('../src/routes/chat.routes');
const chatModel = require('../src/models/chat.model');
const registerChatSocket = require('../src/sockets/chat.socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = demoConfig.port;

// ตั้งค่า Session Middleware (ใช้ร่วมกันทั้ง Express และ Socket.IO)
// TODO: เมื่อรวมกับคิน ให้ใช้ config/session.js ของคินแทน
const sessionMiddleware = session({
  name: 'unigo_friend_demo.sid',
  secret: demoConfig.sessionSecret || 'unigo_local_dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24, // 1 วัน
  },
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);

// แชร์ Session เดียวกันให้ Socket.IO เพื่อให้ socket.request.session.userId ใช้งานได้จริง
io.engine.use(sessionMiddleware);
registerChatSocket(io);

// ============================================================================
// API จริงของบอล (ส่วนที่คินจะนำไปต่อใน app.js หลัก)
// ============================================================================
app.use('/api/v1/universities', universityRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/chat', chatRoutes);

// ============================================================================
// Endpoint ช่วยสลับผู้ใช้จำลอง (เฉพาะโหมดทดสอบของบอลเท่านั้น - ตอนรวมกับคินให้ใช้ Login ของคิน)
// ============================================================================
const demoPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
});

// ดึงรายชื่อผู้ใช้จำลองทั้งหมด + บอกว่าตอนนี้ล็อกอินเป็นใครอยู่
app.get('/api/local-demo/users', async (req, res) => {
  try {
    const [users] = await demoPool.query(
      'SELECT id, username, display_name, role FROM users ORDER BY id ASC'
    );
    res.json({
      success: true,
      data: {
        currentUserId: req.session.userId || null,
        users,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// สลับผู้ใช้ใน Session เพื่อลองแชตโต้ตอบระหว่าง 2 ฝั่งได้ทันที
app.post('/api/local-demo/session', async (req, res) => {
  try {
    const userId = Number(req.body?.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'userId ไม่ถูกต้อง' },
      });
    }

    const [rows] = await demoPool.query(
      'SELECT id, username, display_name, role FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'ไม่พบผู้ใช้จำลองนี้' },
      });
    }

    req.session.userId = rows[0].id;
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'บันทึก session ไม่สำเร็จ' },
        });
      }
      return res.json({
        success: true,
        data: { user: rows[0] },
      });
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// เสิร์ฟหน้า HTML แบบดิบ ๆ (ไม่ต้องตกแต่ง - ส่งต่อให้พีค/แจนตกแต่ง)
// Endpoint จำลองการพิมพ์ตอบกลับจากอีกฝั่ง (เฉพาะโหมดทดสอบคุย 2 ฝั่งในเครื่องบอลเท่านั้น)
app.post('/api/local-demo/simulate-reply', async (req, res) => {
  try {
    const roomId = Number(req.body?.roomId);
    const senderId = Number(req.body?.senderId);
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

    if (!Number.isInteger(roomId) || roomId <= 0 || !Number.isInteger(senderId) || senderId <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'roomId หรือ senderId ไม่ถูกต้อง' },
      });
    }

    if (!content || content.length > 2000) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'ข้อความต้องมีความยาว 1–2000 ตัวอักษร' },
      });
    }

    const isMember = await chatModel.isRoomParticipant(roomId, senderId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'ผู้ใช้ที่เลือกไม่ได้เป็นสมาชิกของห้องนี้' },
      });
    }

    // บันทึกข้อความลง MySQL จริง และ broadcast ผ่าน Socket.IO จริง
    const savedMessage = await chatModel.createMessage(roomId, senderId, content);
    io.to(`room:${roomId}`).emit('chat:message', savedMessage);

    return res.status(201).json({
      success: true,
      data: savedMessage,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// รองรับลิงก์เก่า /kmutt.html โดยพาไปหน้าข้อมูลมหาวิทยาลัยรวมแทน
app.get('/kmutt.html', (req, res) => {
  res.redirect('/universities.html');
});

app.use(express.static(path.join(__dirname, 'public')));

// จัดการ Route ที่ไม่พบสำหรับ API
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'ไม่พบ API endpoint ที่เรียกใช้งาน' },
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 UniGO! Local Demo Server (ส่วนของบอล) ทำงานแล้วที่ http://127.0.0.1:${PORT}`);
  console.log(`   - หน้าหลักรวมลิงก์:   http://127.0.0.1:${PORT}/`);
  console.log(`   - ข้อมูลมหาวิทยาลัย:  http://127.0.0.1:${PORT}/universities.html`);
  console.log(`   - คลังแนวข้อสอบ:    http://127.0.0.1:${PORT}/exams.html`);
  console.log(`   - ห้องแชตเรียลไทม์:  http://127.0.0.1:${PORT}/chat.html`);
});

