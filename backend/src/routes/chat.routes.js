/**
 * Routes: Live Chat (/api/v1/chat)
 * ผู้รับผิดชอบ: บอล (ปฐณวรรณ จารุนงคราญ)
 *
 * วิธีที่คินนำไปต่อใน app.js:
 *   const chatRoutes = require('./routes/chat.routes');
 *   app.use('/api/v1/chat', chatRoutes);
 */

const express = require('express');
const chatController = require('../controllers/chat.controller');

// TODO: เปลี่ยนเป็น requireAuth ของคิน เมื่อรวมโค้ดเข้ากับ repo หลัก:
// const requireAuth = require('../middleware/requireAuth');
let requireAuth;
try {
  const authModule = require('../middleware/requireAuth');
  requireAuth = typeof authModule === 'function' ? authModule : authModule.requireAuth;
} catch {
  // Mock ชั่วคราวในไฟล์ของบอลเอง (ตรวจว่ามี req.session.userId จาก Express Session)
  requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'กรุณาเข้าสู่ระบบก่อนใช้งานระบบแชต',
        },
      });
    }
    return next();
  };
}

const router = express.Router();

// ทุกเส้นทางของ Chat ต้องผ่าน requireAuth (ล็อกอินก่อนเท่านั้น)
router.use(requireAuth);

// รายการห้องแชตของผู้ใช้ที่ล็อกอินอยู่
router.get('/rooms', chatController.listRooms);

// สร้าง/เริ่มห้องสนทนา (1-ต่อ-1 หรือกลุ่ม)
router.post('/rooms', chatController.createOrGetRoom);

// ประวัติข้อความในห้องแชต (ตรวจสิทธิ์สมาชิกใน controller)
router.get('/rooms/:id/messages', chatController.listRoomMessages);

module.exports = router;

