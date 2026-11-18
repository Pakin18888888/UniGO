/**
 * Model: Exam Library (จัดการ SQL ของตาราง exam_categories และ exams)
 * ผู้รับผิดชอบ: บอล (ปฐณวรรณ จารุนงคราญ)
 * กติกา: ใช้ Parameterized Query (?) ทุกคำสั่ง และแยก SQL ไว้ในชั้น Model เท่านั้น
 */

// TODO: เมื่อรวมโค้ดกับคินแล้ว ให้เปลี่ยนเหลือบรรทัดเดียว: const pool = require('../config/db');
let pool;
try {
  pool = require('../config/db');
} catch {
  const path = require('path');
  const mysql = require('mysql2/promise');
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

  if (!global.__unigoBallFallbackPool) {
    global.__unigoBallFallbackPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  pool = global.__unigoBallFallbackPool;
}

/**
 * ดึงหมวดหมู่ข้อสอบทั้งหมด (ใช้แสดงปุ่มกรองหน้า Exam Library)
 */
async function findAllCategories() {
  const [rows] = await pool.query(
    'SELECT id, slug, name, description FROM exam_categories ORDER BY id ASC'
  );
  return rows;
}

/**
 * ดึงรายการข้อสอบพร้อมกรองหมวดหมู่ ค้นหา และแบ่งหน้า
 */
async function findExams({ category = '', q = '', page = 1, limit = 10 }) {
  const conditions = [];
  const params = [];

  if (category) {
    // รองรับทั้งส่ง slug (เช่น "tgat", "a-level") หรือส่ง category_id เป็นตัวเลข
    if (/^\d+$/.test(String(category))) {
      conditions.push('e.category_id = ?');
      params.push(Number(category));
    } else {
      conditions.push('c.slug = ?');
      params.push(String(category).toLowerCase());
    }
  }

  if (q) {
    conditions.push('(e.title LIKE ? OR e.subject LIKE ? OR e.summary LIKE ?)');
    const keyword = `%${q}%`;
    params.push(keyword, keyword, keyword);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [[countRow]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM exams e
     INNER JOIN exam_categories c ON c.id = e.category_id
     ${whereClause}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
       e.id,
       e.category_id,
       c.slug AS category_slug,
       c.name AS category_name,
       e.title,
       e.subject,
       e.exam_year,
       e.difficulty,
       e.duration_minutes,
       e.total_questions,
       e.summary,
       e.file_url,
       e.answer_key_url,
       e.created_at
     FROM exams e
     INNER JOIN exam_categories c ON c.id = e.category_id
     ${whereClause}
     ORDER BY e.exam_year DESC, e.id ASC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  return {
    items: rows,
    total: Number(countRow.total),
  };
}

/**
 * ดึงรายละเอียดข้อสอบ 1 ชุดตาม id
 */
async function findExamById(id) {
  const [rows] = await pool.query(
    `SELECT
       e.id,
       e.category_id,
       c.slug AS category_slug,
       c.name AS category_name,
       e.title,
       e.subject,
       e.exam_year,
       e.difficulty,
       e.duration_minutes,
       e.total_questions,
       e.summary,
       e.file_url,
       e.answer_key_url,
       e.created_at,
       e.updated_at
     FROM exams e
     INNER JOIN exam_categories c ON c.id = e.category_id
     WHERE e.id = ?`,
    [Number(id)]
  );

  return rows[0] || null;
}

module.exports = {
  findAllCategories,
  findExams,
  findExamById,
};

