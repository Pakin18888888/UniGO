/**
 * Controller: Live Chat REST API
 * ผู้รับผิดชอบ: บอล (ปฐณวรรณ จารุนงคราญ)
 *
 * ตัวแปรที่คาดหวังจากระบบ Session ของคิน:
 *   req.session.userId (ตัวเลข ID ของผู้ใช้ที่ล็อกอินอยู่)
 *   (รองรับ req.user?.id เผื่อคินผูกไว้ใน req.user ด้วย)
 */

const chatModel = require('../models/chat.model');

const MAX_MESSAGE_LIMIT = 100;
const MAX_ROOM_NAME_LENGTH = 150;

function parsePositiveInt(value) {
  if (!/^\d+$/.test(String(value))) return null;
  const num = Number(value);
  return num > 0 ? num : null;
}

// ดึง userId จาก Session ของคิน
function getCurrentUserId(req) {
  const raw = req.session?.userId ?? req.user?.id;
  return parsePositiveInt(raw);
}

/**
 * GET /api/v1/chat/rooms
 * คืนรายการห้องแชตทั้งหมดของผู้ใช้ที่ล็อกอินอยู่
 */
async function listRooms(req, res) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบก่อนใช้งานห้องแชต' },
      });
    }

    const rooms = await chatModel.findRoomsByUserId(userId);
    return res.json({
      success: true,
      data: { rooms },
    });
  } catch (err) {
    console.error('[chat.controller] listRooms error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'ไม่สามารถดึงรายการห้องแชตได้' },
    });
  }
}

/**
 * POST /api/v1/chat/rooms
 * สร้าง/เริ่มห้องสนทนา (1-ต่อ-1 หรือกลุ่ม)
 * - ห้อง 1-ต่อ-1: ส่ง { targetUserId: 2 } -> ถ้ามีห้องเดิมอยู่แล้วจะคืนห้องเดิม (200)
 * - ห้องกลุ่ม: ส่ง { roomType: "group", name: "ชื่อห้อง", participantIds: [2, 3] }
 */
async function createOrGetRoom(req, res) {
  try {
    const currentUserId = getCurrentUserId(req);
    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบก่อนสร้างห้องแชต' },
      });
    }

    const { roomType = 'direct', targetUserId, name, participantIds } = req.body || {};

    // กรณีที่ 1: ห้องแชต 1-ต่อ-1 (Direct Chat)
    if (roomType === 'direct') {
      const targetId = parsePositiveInt(targetUserId);
      if (!targetId) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'กรุณาระบุ targetUserId เป็นตัวเลขจำนวนเต็มบวก' },
        });
      }

      if (targetId === currentUserId) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'ไม่สามารถสร้างห้องแชต 1-ต่อ-1 กับตัวเองได้' },
        });
      }

      // ตรวจว่าผู้ใช้ปลายทางมีตัวตนจริงในตาราง users
      const foundUsers = await chatModel.findUsersByIds([targetId]);
      if (foundUsers.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'ไม่พบผู้ใช้ปลายทางที่ต้องการสนทนา' },
        });
      }

      const result = await chatModel.findOrCreateDirectRoom(currentUserId, targetId);
      return res.status(result.created ? 201 : 200).json({
        success: true,
        data: result,
      });
    }

    // กรณีที่ 2: ห้องแชตกลุ่ม (Group Chat)
    if (roomType === 'group') {
      const trimmedName = typeof name === 'string' ? name.trim() : '';
      if (!trimmedName || trimmedName.length > MAX_ROOM_NAME_LENGTH) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: `กรุณาระบุชื่อห้องกลุ่ม (1–${MAX_ROOM_NAME_LENGTH} ตัวอักษร)`,
          },
        });
      }

      if (!Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'กรุณาระบุสมาชิกในห้องกลุ่มอย่างน้อย 1 คน' },
        });
      }

      const validIds = participantIds.map(parsePositiveInt);
      if (validIds.some((id) => id === null)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'รหัสสมาชิกใน participantIds ต้องเป็นตัวเลขจำนวนเต็มบวกทั้งหมด' },
        });
      }

      const uniqueIds = [...new Set(validIds)];
      const existingUsers = await chatModel.findUsersByIds(uniqueIds);
      if (existingUsers.length !== uniqueIds.length) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'มีรหัสสมาชิกบางคนไม่พบในระบบ' },
        });
      }

      const result = await chatModel.createGroupRoom(currentUserId, trimmedName, uniqueIds);
      return res.status(201).json({
        success: true,
        data: result,
      });
    }

    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'roomType รองรับเฉพาะ direct หรือ group เท่านั้น' },
    });
  } catch (err) {
    console.error('[chat.controller] createOrGetRoom error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'ไม่สามารถสร้างห้องแชตได้' },
    });
  }
}

/**
 * GET /api/v1/chat/rooms/:id/messages
 * ดึงประวัติข้อความในห้องแชต (ต้องเป็นสมาชิกของห้องนั้นเท่านั้น!)
 */
async function listRoomMessages(req, res) {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบก่อนอ่านข้อความ' },
      });
    }

    const roomId = parsePositiveInt(req.params.id);
    if (!roomId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'รหัสห้องแชต (id) ต้องเป็นตัวเลขจำนวนเต็มบวก' },
      });
    }

    // 1. ตรวจว่าห้องมีอยู่จริงไหม
    const room = await chatModel.findRoomById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'ไม่พบห้องแชตที่ระบุ' },
      });
    }

    // 2. กติกาความปลอดภัยสำคัญ: ตรวจที่ Backend ว่าผู้ใช้เป็นสมาชิกห้องจริง
    const isMember = await chatModel.isRoomParticipant(roomId, userId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'คุณไม่ได้เป็นสมาชิกของห้องแชตนี้' },
      });
    }

    const rawPage = req.query.page !== undefined ? Number(req.query.page) : 1;
    const rawLimit = req.query.limit !== undefined ? Number(req.query.limit) : 30;

    if (!Number.isInteger(rawPage) || rawPage < 1 || !Number.isInteger(rawLimit) || rawLimit < 1) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'พารามิเตอร์ page และ limit ต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป' },
      });
    }

    const page = rawPage;
    const limit = Math.min(rawLimit, MAX_MESSAGE_LIMIT);

    const { messages, total } = await chatModel.findMessagesByRoomId(roomId, { page, limit });

    return res.json({
      success: true,
      data: {
        roomId,
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err) {
    console.error('[chat.controller] listRoomMessages error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'ไม่สามารถดึงประวัติข้อความได้' },
    });
  }
}

module.exports = {
  listRooms,
  createOrGetRoom,
  listRoomMessages,
};

