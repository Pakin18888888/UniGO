/**
 * Controller: University Explorer
 * ผู้รับผิดชอบ: บอล (ปฐณวรรณ จารุนงคราญ)
 * หน้าที่: ตรวจความถูกต้องของ input, เรียก Model, และส่ง Response รูปแบบมาตรฐานของทีม
 */

const universityModel = require('../models/university.model');

const ALLOWED_TYPES = new Set(['public', 'autonomous', 'private', 'rajabhat', 'rajamangala']);
const MAX_LIMIT = 50;

// ฟังก์ชันช่วยตรวจว่าเป็นจำนวนเต็มบวกหรือไม่ (สำหรับ :id)
function parsePositiveInt(value) {
  if (!/^\d+$/.test(String(value))) return null;
  const num = Number(value);
  return num > 0 ? num : null;
}

/**
 * GET /api/v1/universities
 * Query: q, type, province, page, limit
 */
async function listUniversities(req, res) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const type = typeof req.query.type === 'string' ? req.query.type.trim().toLowerCase() : '';
    const province =
      typeof req.query.province === 'string' ? req.query.province.trim().slice(0, 100) : '';

    if (type && !ALLOWED_TYPES.has(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'ค่า type ไม่ถูกต้อง (รองรับ: public, autonomous, private, rajabhat, rajamangala)',
        },
      });
    }

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

    // จำกัดค่า limit สูงสุดเพื่อกันการดึงข้อมูลหนักเกินไป
    const page = rawPage;
    const limit = Math.min(rawLimit, MAX_LIMIT);

    const { items, total } = await universityModel.findUniversities({
      q,
      type,
      province,
      page,
      limit,
    });

    return res.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err) {
    console.error('[university.controller] listUniversities error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'ไม่สามารถดึงข้อมูลมหาวิทยาลัยได้' },
    });
  }
}

/**
 * GET /api/v1/universities/:id
 */
async function getUniversityDetail(req, res) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'รหัสมหาวิทยาลัย (id) ต้องเป็นตัวเลขจำนวนเต็มบวก' },
      });
    }

    const university = await universityModel.findUniversityById(id);
    if (!university) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'ไม่พบข้อมูลมหาวิทยาลัยที่ระบุ' },
      });
    }

    return res.json({
      success: true,
      data: university,
    });
  } catch (err) {
    console.error('[university.controller] getUniversityDetail error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'ไม่สามารถดึงรายละเอียดมหาวิทยาลัยได้' },
    });
  }
}

/**
 * GET /api/v1/universities/:id/programs
 * Query (เสริม): faculty_id, q
 */
async function getUniversityPrograms(req, res) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'รหัสมหาวิทยาลัย (id) ต้องเป็นตัวเลขจำนวนเต็มบวก' },
      });
    }

    const university = await universityModel.findUniversityById(id);
    if (!university) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'ไม่พบข้อมูลมหาวิทยาลัยที่ระบุ' },
      });
    }

    let facultyId = null;
    if (req.query.faculty_id !== undefined && req.query.faculty_id !== '') {
      facultyId = parsePositiveInt(req.query.faculty_id);
      if (!facultyId) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'พารามิเตอร์ faculty_id ต้องเป็นตัวเลขจำนวนเต็มบวก' },
        });
      }
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const faculties = await universityModel.findUniversityPrograms(id, { facultyId, q });

    return res.json({
      success: true,
      data: {
        university: {
          id: university.id,
          name_th: university.name_th,
          name_en: university.name_en,
          short_name: university.short_name,
          province: university.province,
          website_url: university.website_url,
        },
        faculties,
      },
    });
  } catch (err) {
    console.error('[university.controller] getUniversityPrograms error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'ไม่สามารถดึงข้อมูลคณะและสาขาได้' },
    });
  }
}

module.exports = {
  listUniversities,
  getUniversityDetail,
  getUniversityPrograms,
};

