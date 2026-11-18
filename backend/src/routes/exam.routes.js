/**
 * Routes: Exam Library (/api/v1/exams)
 * ผู้รับผิดชอบ: บอล (ปฐณวรรณ จารุนงคราญ)
 *
 * วิธีที่คินนำไปต่อใน app.js:
 *   const examRoutes = require('./routes/exam.routes');
 *   app.use('/api/v1/exams', examRoutes);
 */

const express = require('express');
const examController = require('../controllers/exam.controller');

const router = express.Router();

// รายการข้อสอบ + กรองหมวดหมู่/ค้นหา
router.get('/', examController.listExams);

// รายละเอียดข้อสอบ 1 ชุด
router.get('/:id', examController.getExamDetail);

module.exports = router;

