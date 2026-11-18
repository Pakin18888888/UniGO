/**
 * Routes: University Explorer (/api/v1/universities)
 * ผู้รับผิดชอบ: บอล (ปฐณวรรณ จารุนงคราญ)
 *
 * วิธีที่คินนำไปต่อใน app.js:
 *   const universityRoutes = require('./routes/university.routes');
 *   app.use('/api/v1/universities', universityRoutes);
 */

const express = require('express');
const universityController = require('../controllers/university.controller');

const router = express.Router();

// รายชื่อ + ค้นหา/กรองมหาวิทยาลัย
router.get('/', universityController.listUniversities);

// รายละเอียดมหาวิทยาลัย 1 แห่ง
router.get('/:id', universityController.getUniversityDetail);

// คณะ สาขา และรอบรับสมัคร TCAS ของมหาวิทยาลัยนั้น
router.get('/:id/programs', universityController.getUniversityPrograms);

module.exports = router;

