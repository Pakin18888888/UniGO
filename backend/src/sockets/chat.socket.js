/**
 * Socket.IO Handler: Live Chat (Real-time)
 * ผู้รับผิดชอบ: บอล (ปฐณวรรณ จารุนงคราญ)
 *
 * Events ที่รองรับ (ต้องตรงกับฝั่ง Frontend ของแจน และ docs/api-contract.md):
 * - Client -> Server: 'chat:join'    ({ roomId })
 * - Client -> Server: 'chat:send'    ({ roomId, content })
 * - Server -> Client: 'chat:message' ({ id, room_id, sender_id, sender_name, content, created_at })
 * - Server -> Client: 'chat:error'   ({ code, message })
 *
 * วิธีที่คินนำไปต่อใน server.js (แชร์ Session เดียวกับ Express):
 *   const registerChatSocket = require('./sockets/chat.socket');
 *   io.engine.use(sessionMiddleware);
 *   registerChatSocket(io);
 */

const chatModel = require('../models/chat.model');

const MAX_MESSAGE_LENGTH = 2000;

function parsePositiveInt(value) {
  if (!/^\d+$/.test(String(value))) return null;
  const num = Number(value);
  return num > 0 ? num : null;
}

function getRoomChannelName(roomId) {
  return `room:${roomId}`;
}

/**
 * ลงทะเบียน event ของ Live Chat บน Socket.IO Server
 * @param {import('socket.io').Server} io
 */
function registerChatSocket(io) {
  io.on('connection', (socket) => {
    // ดึง userId จาก Express Session ที่แชร์เข้ามาใน socket.request.session
    // TODO: ตรวจสอบกับคินว่าชื่อตัวแปรใน session คือ userId ตรงกัน
    const sessionUserId = parsePositiveInt(socket.request?.session?.userId);

    if (!sessionUserId) {
      socket.emit('chat:error', {
        code: 'UNAUTHORIZED',
        message: 'กรุณาเข้าสู่ระบบก่อนเชื่อมต่อ Live Chat',
      });
      socket.disconnect(true);
      return;
    }

    /**
     * Event: chat:join
     * ผู้ใช้ขอเข้าห้องแชต -> ต้องตรวจใน DB ก่อนว่าเป็นสมาชิกห้องนั้นจริง
     */
    socket.on('chat:join', async (payload = {}, ack) => {
      try {
        const roomId = parsePositiveInt(payload.roomId);
        if (!roomId) {
          const errObj = { code: 'INVALID_INPUT', message: 'รหัสห้องแชต (roomId) ไม่ถูกต้อง' };
          socket.emit('chat:error', errObj);
          if (typeof ack === 'function') ack({ success: false, error: errObj });
          return;
        }

        const isMember = await chatModel.isRoomParticipant(roomId, sessionUserId);
        if (!isMember) {
          const errObj = { code: 'FORBIDDEN', message: 'คุณไม่ได้เป็นสมาชิกของห้องแชตนี้' };
          socket.emit('chat:error', errObj);
          if (typeof ack === 'function') ack({ success: false, error: errObj });
          return;
        }

        const channel = getRoomChannelName(roomId);
        await socket.join(channel);

        if (typeof ack === 'function') {
          ack({ success: true, data: { roomId, channel } });
        }
      } catch (err) {
        console.error('[chat.socket] chat:join error:', err);
        const errObj = { code: 'INTERNAL_ERROR', message: 'ไม่สามารถเข้าห้องแชตได้' };
        socket.emit('chat:error', errObj);
        if (typeof ack === 'function') ack({ success: false, error: errObj });
      }
    });

    /**
     * Event: chat:send
     * ส่งข้อความใหม่ -> ตรวจสิทธิ์สมาชิก + ตรวจความยาว -> บันทึกลง DB -> broadcast 'chat:message'
     */
    socket.on('chat:send', async (payload = {}, ack) => {
      try {
        const roomId = parsePositiveInt(payload.roomId);
        const content = typeof payload.content === 'string' ? payload.content.trim() : '';

        if (!roomId) {
          const errObj = { code: 'INVALID_INPUT', message: 'รหัสห้องแชต (roomId) ไม่ถูกต้อง' };
          socket.emit('chat:error', errObj);
          if (typeof ack === 'function') ack({ success: false, error: errObj });
          return;
        }

        if (!content || content.length > MAX_MESSAGE_LENGTH) {
          const errObj = {
            code: 'INVALID_INPUT',
            message: `ข้อความต้องมีความยาว 1–${MAX_MESSAGE_LENGTH} ตัวอักษร`,
          };
          socket.emit('chat:error', errObj);
          if (typeof ack === 'function') ack({ success: false, error: errObj });
          return;
        }

        // กติกาความปลอดภัย: ตรวจซ้ำใน DB ทุกครั้งก่อนบันทึกและส่งข้อความ
        const isMember = await chatModel.isRoomParticipant(roomId, sessionUserId);
        if (!isMember) {
          const errObj = { code: 'FORBIDDEN', message: 'คุณไม่มีสิทธิ์ส่งข้อความในห้องแชตนี้' };
          socket.emit('chat:error', errObj);
          if (typeof ack === 'function') ack({ success: false, error: errObj });
          return;
        }

        const savedMessage = await chatModel.createMessage(roomId, sessionUserId, content);

        // ส่งข้อความให้สมาชิกทุกคนที่อยู่ในห้องนี้แบบเรียลไทม์
        io.to(getRoomChannelName(roomId)).emit('chat:message', savedMessage);

        if (typeof ack === 'function') {
          ack({ success: true, data: savedMessage });
        }
      } catch (err) {
        console.error('[chat.socket] chat:send error:', err);
        const errObj = { code: 'INTERNAL_ERROR', message: 'ไม่สามารถส่งข้อความได้' };
        socket.emit('chat:error', errObj);
        if (typeof ack === 'function') ack({ success: false, error: errObj });
      }
    });
  });
}

module.exports = registerChatSocket;

