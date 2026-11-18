/**
 * Controller: Exam Library
 * ผู้รับผิดชอบ: บอล (ปฐณวรรณ จารุนงคราญ)
 */

const examModel = require('../models/exam.model');

const MAX_LIMIT = 50;

function parsePositiveInt(value) {
  if (!/^\d+$/.test(String(value))) return null;
  const num = Number(value);
  return num > 0 ? num : null;
}

/**
 * GET /api/v1/exams
 * Query: category, q, page, limit
 */
async function listExams(req, res) {
  try {
    const category =
      typeof req.query.category === 'string' ? req.query.category.trim().slice(0, 50) : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';

    const rawPage = req.query.page !== undefined ? Number(req.query.page) : 1;
    const rawLimit = req.query.limit !== undefined ? Number(req.query.limit) : 10;

    if (!Number.isInteger(rawPage) || rawPage < 1) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'พารามิเตอร์ page ต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป' },
      });
    }

    if (!Number.isInteger(rawLimit) || rawLimit < 1) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'พารามิเตอร์ limit ต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป' },
      });
    }

    const page = rawPage;
    const limit = Math.min(rawLimit, MAX_LIMIT);

    // ดึงหมวดหมู่และรายการข้อสอบพร้อมกันเพื่อลดเวลาตอบสนอง
    const [categories, examResult] = await Promise.all([
      examModel.findAllCategories(),
      examModel.findExams({ category, q, page, limit }),
    ]);

    return res.json({
      success: true,
      data: {
        categories,
        items: examResult.items,
        pagination: {
          page,
          limit,
          total: examResult.total,
          totalPages: Math.ceil(examResult.total / limit) || 1,
        },
      },
    });
  } catch (err) {
    console.error('[exam.controller] listExams error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'ไม่สามารถดึงรายการข้อสอบได้' },
    });
  }
}

/**
 * GET /api/v1/exams/:id
 */
async function getExamDetail(req, res) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'รหัสข้อสอบ (id) ต้องเป็นตัวเลขจำนวนเต็มบวก' },
      });
    }

    const exam = await examModel.findExamById(id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'ไม่พบชุดข้อสอบที่ระบุ' },
      });
    }

    return res.json({
      success: true,
      data: exam,
    });
  } catch (err) {
    console.error('[exam.controller] getExamDetail error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'ไม่สามารถดึงรายละเอียดข้อสอบได้' },
    });
  }
}

module.exports = {
  listExams,
  getExamDetail,
};

