/**
 * Model: Live Chat (จัดการ SQL ของตาราง chat_rooms, chat_participants, chat_messages)
 * ผู้รับผิดชอบ: บอล (ปฐณวรรณ จารุนงคราญ)
 *
 * หมายเหตุจุดเชื่อมกับคิน:
 * - อ้างอิงตาราง users(id, username, display_name) ของคิน
 * - ถ้าคอลัมน์ชื่อแสดงผลของคินไม่ใช่ display_name (เช่น name หรือ full_name)
 *   ให้ปรับเฉพาะคอลัมน์ที่ SELECT จากตาราง users ในไฟล์นี้ได้เลยครับ
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
 * ตรวจสอบว่าห้องแชตมีอยู่จริงหรือไม่
 */
async function findRoomById(roomId) {
  const [rows] = await pool.query(
    'SELECT id, room_type, name, direct_key, created_by, created_at, updated_at FROM chat_rooms WHERE id = ?',
    [Number(roomId)]
  );
  return rows[0] || null;
}

/**
 * ตรวจสอบว่าผู้ใช้เป็นสมาชิกในห้องแชตนั้นจริงหรือไม่ (ใช้กันคนอื่นแอบอ่าน/ส่งข้อความ)
 */
async function isRoomParticipant(roomId, userId) {
  const [rows] = await pool.query(
    'SELECT 1 AS is_member FROM chat_participants WHERE room_id = ? AND user_id = ? LIMIT 1',
    [Number(roomId), Number(userId)]
  );
  return rows.length > 0;
}

/**
 * ตรวจสอบว่ามีผู้ใช้ตามรายการ ID อยู่จริงในตาราง users หรือไม่
 */
async function findUsersByIds(userIds) {
  if (!userIds || userIds.length === 0) return [];
  const uniqueIds = [...new Set(userIds.map(Number))];
  const placeholders = uniqueIds.map(() => '?').join(', ');
  const [rows] = await pool.query(
    `SELECT id, username, display_name FROM users WHERE id IN (${placeholders})`,
    uniqueIds
  );
  return rows;
}

/**
 * ดึงรายชื่อสมาชิกทั้งหมดของห้องที่ระบุ
 */
async function findParticipantsByRoomIds(roomIds) {
  if (!roomIds || roomIds.length === 0) return new Map();
  const placeholders = roomIds.map(() => '?').join(', ');
  const [rows] = await pool.query(
    `SELECT
       cp.room_id,
       cp.user_id,
       cp.role,
       u.username,
       u.display_name
     FROM chat_participants cp
     INNER JOIN users u ON u.id = cp.user_id
     WHERE cp.room_id IN (${placeholders})
     ORDER BY cp.id ASC`,
    roomIds
  );

  return rows.reduce((map, row) => {
    if (!map.has(row.room_id)) {
      map.set(row.room_id, []);
    }
    map.get(row.room_id).push({
      user_id: row.user_id,
      username: row.username,
      display_name: row.display_name,
      role: row.role,
    });
    return map;
  }, new Map());
}

/**
 * ดึงรายชื่อห้องแชตทั้งหมดของผู้ใช้ที่ล็อกอินอยู่ พร้อมสมาชิกและข้อความล่าสุด
 */
async function findRoomsByUserId(userId) {
  const [rooms] = await pool.query(
    `SELECT
       r.id,
       r.room_type,
       r.name,
       r.created_by,
       r.created_at,
       r.updated_at
     FROM chat_rooms r
     INNER JOIN chat_participants cp ON cp.room_id = r.id
     WHERE cp.user_id = ?
     ORDER BY r.updated_at DESC, r.id DESC`,
    [Number(userId)]
  );

  if (rooms.length === 0) {
    return [];
  }

  const roomIds = rooms.map((r) => r.id);
  const participantsMap = await findParticipantsByRoomIds(roomIds);

  // ดึงข้อความล่าสุดของแต่ละห้อง
  const placeholders = roomIds.map(() => '?').join(', ');
  const [lastMessages] = await pool.query(
    `SELECT m.id, m.room_id, m.sender_id, u.display_name AS sender_name, m.content, m.created_at
     FROM chat_messages m
     INNER JOIN (
       SELECT room_id, MAX(id) AS max_id
       FROM chat_messages
       WHERE room_id IN (${placeholders})
       GROUP BY room_id
     ) latest ON latest.max_id = m.id
     INNER JOIN users u ON u.id = m.sender_id`,
    roomIds
  );

  const lastMessageMap = new Map(lastMessages.map((msg) => [msg.room_id, msg]));

  return rooms.map((room) => ({
    ...room,
    participants: participantsMap.get(room.id) || [],
    last_message: lastMessageMap.get(room.id) || null,
  }));
}

/**
 * สร้างหรือคืนค่าห้องแชต 1-ต่อ-1 เดิม (ใช้ direct_key รูปแบบ "minId:maxId" กันห้องซ้ำ)
 */
async function findOrCreateDirectRoom(currentUserId, targetUserId) {
  const userA = Math.min(Number(currentUserId), Number(targetUserId));
  const userB = Math.max(Number(currentUserId), Number(targetUserId));
  const directKey = `${userA}:${userB}`;

  // เช็กก่อนว่ามีห้อง 1-ต่อ-1 ของคู่นี้อยู่แล้วหรือไม่
  const [existingRows] = await pool.query(
    'SELECT id, room_type, name, created_by, created_at, updated_at FROM chat_rooms WHERE direct_key = ? LIMIT 1',
    [directKey]
  );

  if (existingRows.length > 0) {
    const room = existingRows[0];
    const participantsMap = await findParticipantsByRoomIds([room.id]);
    return {
      created: false,
      room: { ...room, participants: participantsMap.get(room.id) || [] },
    };
  }

  // ใช้ Transaction เพื่อให้สร้างห้อง + เพิ่มสมาชิก 2 คนสำเร็จพร้อมกัน
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [insertRes] = await conn.query(
      `INSERT INTO chat_rooms (room_type, name, direct_key, created_by)
       VALUES ('direct', NULL, ?, ?)`,
      [directKey, Number(currentUserId)]
    );
    const roomId = insertRes.insertId;

    await conn.query(
      `INSERT INTO chat_participants (room_id, user_id, role)
       VALUES (?, ?, 'member'), (?, ?, 'member')`,
      [roomId, userA, roomId, userB]
    );

    await conn.commit();

    const room = await findRoomById(roomId);
    const participantsMap = await findParticipantsByRoomIds([roomId]);
    return {
      created: true,
      room: { ...room, participants: participantsMap.get(roomId) || [] },
    };
  } catch (err) {
    await conn.rollback();

    // กรณีกดสร้างพร้อมกัน 2 ฝั่งแล้วชน UNIQUE direct_key ให้ดึงห้องเดิมคืนกลับไปแทน
    if (err.code === 'ER_DUP_ENTRY') {
      const [dupRows] = await pool.query(
        'SELECT id, room_type, name, created_by, created_at, updated_at FROM chat_rooms WHERE direct_key = ? LIMIT 1',
        [directKey]
      );
      if (dupRows.length > 0) {
        const room = dupRows[0];
        const participantsMap = await findParticipantsByRoomIds([room.id]);
        return {
          created: false,
          room: { ...room, participants: participantsMap.get(room.id) || [] },
        };
      }
    }
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * สร้างห้องแชตกลุ่ม (Group Room)
 */
async function createGroupRoom(creatorId, name, participantIds) {
  const uniqueMembers = [...new Set([Number(creatorId), ...participantIds.map(Number)])];
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [insertRes] = await conn.query(
      `INSERT INTO chat_rooms (room_type, name, direct_key, created_by)
       VALUES ('group', ?, NULL, ?)`,
      [name, Number(creatorId)]
    );
    const roomId = insertRes.insertId;

    for (const memberId of uniqueMembers) {
      const role = memberId === Number(creatorId) ? 'admin' : 'member';
      await conn.query(
        'INSERT INTO chat_participants (room_id, user_id, role) VALUES (?, ?, ?)',
        [roomId, memberId, role]
      );
    }

    await conn.commit();

    const room = await findRoomById(roomId);
    const participantsMap = await findParticipantsByRoomIds([roomId]);
    return {
      created: true,
      room: { ...room, participants: participantsMap.get(roomId) || [] },
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * ดึงประวัติข้อความของห้องแชต (เรียงจากเก่าไปใหม่ในชุดที่ดึงมา)
 */
async function findMessagesByRoomId(roomId, { page = 1, limit = 30 }) {
  const offset = (page - 1) * limit;

  const [[countRow]] = await pool.query(
    'SELECT COUNT(*) AS total FROM chat_messages WHERE room_id = ?',
    [Number(roomId)]
  );

  // ดึงข้อความล่าสุดก่อนตามหน้า แล้วค่อยกลับลำดับเป็นเก่า -> ใหม่ สำหรับแสดงผลในแชต
  const [rows] = await pool.query(
    `SELECT
       m.id,
       m.room_id,
       m.sender_id,
       u.username AS sender_username,
       u.display_name AS sender_name,
       m.content,
       m.created_at
     FROM chat_messages m
     INNER JOIN users u ON u.id = m.sender_id
     WHERE m.room_id = ?
     ORDER BY m.id DESC
     LIMIT ? OFFSET ?`,
    [Number(roomId), Number(limit), Number(offset)]
  );

  return {
    messages: rows.reverse(),
    total: Number(countRow.total),
  };
}

/**
 * บันทึกข้อความใหม่ลงฐานข้อมูล และอัปเดตเวลา updated_at ของห้องแชต
 */
async function createMessage(roomId, senderId, content) {
  const [insertRes] = await pool.query(
    'INSERT INTO chat_messages (room_id, sender_id, content) VALUES (?, ?, ?)',
    [Number(roomId), Number(senderId), content]
  );

  await pool.query(
    'UPDATE chat_rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [Number(roomId)]
  );

  const [rows] = await pool.query(
    `SELECT
       m.id,
       m.room_id,
       m.sender_id,
       u.username AS sender_username,
       u.display_name AS sender_name,
       m.content,
       m.created_at
     FROM chat_messages m
     INNER JOIN users u ON u.id = m.sender_id
     WHERE m.id = ?`,
    [insertRes.insertId]
  );

  return rows[0];
}

module.exports = {
  findRoomById,
  isRoomParticipant,
  findUsersByIds,
  findRoomsByUserId,
  findOrCreateDirectRoom,
  createGroupRoom,
  findMessagesByRoomId,
  createMessage,
};

