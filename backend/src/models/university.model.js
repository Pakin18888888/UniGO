/**
 * Model: University Explorer (จัดการ SQL ของตาราง universities, faculties, programs, admission_details)
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
 * ดึงรายชื่อมหาวิทยาลัยพร้อมค้นหา กรอง และแบ่งหน้า (Pagination)
 */
async function findUniversities({ q = '', type = '', province = '', page = 1, limit = 10 }) {
  const conditions = [];
  const params = [];

  if (q) {
    conditions.push('(u.name_th LIKE ? OR u.name_en LIKE ? OR u.short_name LIKE ?)');
    const keyword = `%${q}%`;
    params.push(keyword, keyword, keyword);
  }

  if (type) {
    conditions.push('u.type = ?');
    params.push(type);
  }

  if (province) {
    conditions.push('u.province LIKE ?');
    params.push(`%${province}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  // นับจำนวนทั้งหมดที่ตรงเงื่อนไข เพื่อคำนวณ pagination
  const [[countRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM universities u ${whereClause}`,
    params
  );

  // ดึงข้อมูลมหาวิทยาลัยพร้อมจำนวนคณะและสาขา
  const [rows] = await pool.query(
    `SELECT
       u.id,
       u.name_th,
       u.name_en,
       u.short_name,
       u.type,
       u.province,
       u.region,
       u.description,
       u.logo_url,
       u.cover_url,
       u.website_url,
       COUNT(DISTINCT f.id) AS faculty_count,
       COUNT(DISTINCT p.id) AS program_count
     FROM universities u
     LEFT JOIN faculties f ON f.university_id = u.id
     LEFT JOIN programs p ON p.faculty_id = f.id
     ${whereClause}
     GROUP BY u.id
     ORDER BY u.id ASC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  return {
    items: rows,
    total: Number(countRow.total),
  };
}

/**
 * ดึงรายละเอียดมหาวิทยาลัย 1 แห่งตาม id
 */
async function findUniversityById(id) {
  const [rows] = await pool.query(
    `SELECT
       u.id,
       u.name_th,
       u.name_en,
       u.short_name,
       u.type,
       u.province,
       u.region,
       u.description,
       u.logo_url,
       u.cover_url,
       u.website_url,
       u.created_at,
       u.updated_at,
       COUNT(DISTINCT f.id) AS faculty_count,
       COUNT(DISTINCT p.id) AS program_count
     FROM universities u
     LEFT JOIN faculties f ON f.university_id = u.id
     LEFT JOIN programs p ON p.faculty_id = f.id
     WHERE u.id = ?
     GROUP BY u.id`,
    [Number(id)]
  );

  return rows[0] || null;
}

/**
 * ดึงคณะ สาขา และข้อมูลรับสมัคร TCAS ทั้งหมดของมหาวิทยาลัยที่ระบุ
 */
async function findUniversityPrograms(universityId, { facultyId = null, q = '' } = {}) {
  // 1. ดึงคณะของมหาวิทยาลัย
  const facultyConditions = ['university_id = ?'];
  const facultyParams = [Number(universityId)];

  if (facultyId) {
    facultyConditions.push('id = ?');
    facultyParams.push(Number(facultyId));
  }

  const [faculties] = await pool.query(
    `SELECT id, university_id, name_th, name_en, description
     FROM faculties
     WHERE ${facultyConditions.join(' AND ')}
     ORDER BY id ASC`,
    facultyParams
  );

  if (faculties.length === 0) {
    return [];
  }

  // 2. ดึงสาขาในคณะเหล่านั้น (กรองด้วยคำค้นหา q ถ้ามี)
  const facultyIds = faculties.map((f) => f.id);
  const placeholders = facultyIds.map(() => '?').join(', ');
  const programConditions = [`p.faculty_id IN (${placeholders})`];
  const programParams = [...facultyIds];

  if (q) {
    programConditions.push('(p.name_th LIKE ? OR p.name_en LIKE ? OR p.description LIKE ?)');
    const keyword = `%${q}%`;
    programParams.push(keyword, keyword, keyword);
  }

  const [programs] = await pool.query(
    `SELECT
       p.id,
       p.faculty_id,
       p.name_th,
       p.name_en,
       p.degree_level,
       p.study_type,
       p.tuition_fee,
       p.duration_years,
       p.description
     FROM programs p
     WHERE ${programConditions.join(' AND ')}
     ORDER BY p.id ASC`,
    programParams
  );

  // 3. ดึงรายละเอียดการรับสมัคร TCAS ของทุกสาขาที่เจอ
  let admissionsByProgram = new Map();
  if (programs.length > 0) {
    const programIds = programs.map((p) => p.id);
    const progPlaceholders = programIds.map(() => '?').join(', ');
    const [admissions] = await pool.query(
      `SELECT
         id,
         program_id,
         academic_year,
         tcas_round,
         round_name,
         quota_seats,
         min_gpax,
         required_exams,
         criteria_summary,
         application_url
       FROM admission_details
       WHERE program_id IN (${progPlaceholders})
       ORDER BY academic_year DESC, tcas_round ASC`,
      programIds
    );

    admissionsByProgram = admissions.reduce((map, item) => {
      if (!map.has(item.program_id)) {
        map.set(item.program_id, []);
      }
      map.get(item.program_id).push(item);
      return map;
    }, new Map());
  }

  // 4. จัดโครงสร้างซ้อนกัน: คณะ -> สาขา -> รอบรับสมัคร TCAS
  const programsByFaculty = programs.reduce((map, prog) => {
    if (!map.has(prog.faculty_id)) {
      map.set(prog.faculty_id, []);
    }
    map.get(prog.faculty_id).push({
      ...prog,
      admissions: admissionsByProgram.get(prog.id) || [],
    });
    return map;
  }, new Map());

  const result = faculties.map((fac) => ({
    ...fac,
    programs: programsByFaculty.get(fac.id) || [],
  }));

  // ถ้ามีการค้นหาคำค้น q ให้แสดงเฉพาะคณะที่มีสาขาตรงกับคำค้น
  return q ? result.filter((fac) => fac.programs.length > 0) : result;
}

module.exports = {
  findUniversities,
  findUniversityById,
  findUniversityPrograms,
};

