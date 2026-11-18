/**
 * ชุดทดสอบอัตโนมัติ: Live Chat REST API (/api/v1/chat) และ Socket.IO (chat.socket.js)
 * ผู้รับผิดชอบ: บอล (ปฐณวรรณ จารุนงคราญ)
 * รันด้วย: npm --prefix backend test
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { EventEmitter } = require('node:events');
const express = require('express');
const session = require('express-session');

const chatRoutes = require('../src/routes/chat.routes');
const registerChatSocket = require('../src/sockets/chat.socket');

describe('Live Chat REST API & Socket.IO', () => {
  let server;
  let baseUrl;
  let ballCookie;
  let janCookie;
  let sampleRoomId;
  const createdMessageIdsForCleanup = [];

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use(
      session({
        secret: 'test_session_secret',
        resave: false,
        saveUninitialized: false,
      })
    );

    // route จำลอง login เฉพาะในไฟล์เทสต์ เพื่อตั้ง req.session.userId
    app.post('/__test-login', (req, res) => {
      req.session.userId = req.body.userId;
      req.session.save(() => res.json({ ok: true }));
    });

    app.use('/api/v1/chat', chatRoutes);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;

    // ล็อกอินเป็น บอล (id=1) และ แจน (id=3)
    const ballLogin = await fetch(`${baseUrl}/__test-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 1 }),
    });
    ballCookie = ballLogin.headers.get('set-cookie');

    const janLogin = await fetch(`${baseUrl}/__test-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 3 }),
    });
    janCookie = janLogin.headers.get('set-cookie');
  });

  after(async () => {
    // ลบข้อความทดสอบที่สร้างระหว่างรันเทสต์ เพื่อให้ DB สะอาดเหมือนเดิม
    if (createdMessageIdsForCleanup.length > 0 && global.__unigoBallFallbackPool) {
      const placeholders = createdMessageIdsForCleanup.map(() => '?').join(', ');
      await global.__unigoBallFallbackPool.query(
        `DELETE FROM chat_messages WHERE id IN (${placeholders})`,
        createdMessageIdsForCleanup
      );
    }

    await new Promise((resolve) => server.close(resolve));
    if (global.__unigoBallFallbackPool) {
      await global.__unigoBallFallbackPool.end();
      global.__unigoBallFallbackPool = null;
    }
  });

  it('GET /api/v1/chat/rooms คืน 401 UNAUTHORIZED เมื่อยังไม่ได้เข้าสู่ระบบ', async () => {
    const res = await fetch(`${baseUrl}/api/v1/chat/rooms`);
    const body = await res.json();

    assert.equal(res.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'UNAUTHORIZED');
  });

  it('POST /api/v1/chat/rooms คืนห้อง 1-ต่อ-1 เดิม (created: false) เมื่อคู่ บอล<->พีค มีห้องอยู่แล้ว', async () => {
    const res = await fetch(`${baseUrl}/api/v1/chat/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: ballCookie },
      body: JSON.stringify({ roomType: 'direct', targetUserId: 2 }),
    });
    const body = await res.json();

    assert.ok(res.status === 200 || res.status === 201);
    assert.equal(body.success, true);
    assert.ok(body.data.room.id > 0);
    sampleRoomId = body.data.room.id;

    // ยิงซ้ำอีกครั้ง ต้องคืนห้องเดิมและ created === false (ไม่สร้างซ้ำ)
    const secondRes = await fetch(`${baseUrl}/api/v1/chat/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: ballCookie },
      body: JSON.stringify({ roomType: 'direct', targetUserId: 2 }),
    });
    const secondBody = await secondRes.json();

    assert.equal(secondRes.status, 200);
    assert.equal(secondBody.data.created, false);
    assert.equal(secondBody.data.room.id, sampleRoomId);
  });

  it('POST /api/v1/chat/rooms ดักการแชตกับตัวเอง (400) และผู้ใช้ไม่มีตัวตน (404)', async () => {
    const selfRes = await fetch(`${baseUrl}/api/v1/chat/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: ballCookie },
      body: JSON.stringify({ roomType: 'direct', targetUserId: 1 }),
    });
    assert.equal(selfRes.status, 400);

    const ghostRes = await fetch(`${baseUrl}/api/v1/chat/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: ballCookie },
      body: JSON.stringify({ roomType: 'direct', targetUserId: 999999 }),
    });
    assert.equal(ghostRes.status, 404);
  });

  it('GET /api/v1/chat/rooms คืนรายการห้องแชตของผู้ใช้ที่ล็อกอินอยู่', async () => {
    const res = await fetch(`${baseUrl}/api/v1/chat/rooms`, {
      headers: { cookie: ballCookie },
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.rooms.some((r) => r.id === sampleRoomId));
  });

  it('GET /api/v1/chat/rooms/:id/messages อนุญาตเฉพาะสมาชิก (200) และบล็อกคนนอกห้อง (403 FORBIDDEN)', async () => {
    // บอลเป็นสมาชิกห้อง -> อ่านได้
    const memberRes = await fetch(`${baseUrl}/api/v1/chat/rooms/${sampleRoomId}/messages`, {
      headers: { cookie: ballCookie },
    });
    const memberBody = await memberRes.json();
    assert.equal(memberRes.status, 200);
    assert.equal(memberBody.success, true);
    assert.ok(Array.isArray(memberBody.data.messages));

    // แจน (id=3) ไม่ได้อยู่ในห้อง บอล<->พีค -> ต้องโดน 403 FORBIDDEN
    const outsiderRes = await fetch(`${baseUrl}/api/v1/chat/rooms/${sampleRoomId}/messages`, {
      headers: { cookie: janCookie },
    });
    const outsiderBody = await outsiderRes.json();
    assert.equal(outsiderRes.status, 403);
    assert.equal(outsiderBody.success, false);
    assert.equal(outsiderBody.error.code, 'FORBIDDEN');
  });

  it('Socket.IO (chat.socket.js) ตัดการเชื่อมต่อถ้าไม่มี Session, บล็อกคนนอกห้อง, และส่งข้อความให้สมาชิกได้จริง', async () => {
    // สร้าง Fake Socket.IO Server เพื่อทดสอบตรรกะ chat.socket.js กับ DB จริงโดยไม่ต้องลงแพ็กเกจเพิ่ม
    const ioEmitter = new EventEmitter();
    const broadcastedEvents = [];
    ioEmitter.to = (channel) => ({
      emit: (event, data) => broadcastedEvents.push({ channel, event, data }),
    });

    registerChatSocket(ioEmitter);

    function createMockSocket(userId) {
      const sock = new EventEmitter();
      sock.request = { session: userId ? { userId } : {} };
      sock.emitted = [];
      sock.joinedRooms = [];
      sock.disconnected = false;
      sock.emit = (event, data) => sock.emitted.push({ event, data });
      sock.join = async (channel) => sock.joinedRooms.push(channel);
      sock.disconnect = () => {
        sock.disconnected = true;
      };
      // ใช้ triggerClientEvent เพื่อจำลองฝั่ง client ยิง event เข้ามา
      sock.trigger = (event, payload, ack) => EventEmitter.prototype.emit.call(sock, event, payload, ack);
      return sock;
    }

    // 1. ไม่มี session -> ต้องโดน chat:error UNAUTHORIZED + disconnect
    const unauthSock = createMockSocket(null);
    ioEmitter.emit('connection', unauthSock);
    assert.equal(unauthSock.disconnected, true);
    assert.equal(unauthSock.emitted[0].event, 'chat:error');
    assert.equal(unauthSock.emitted[0].data.code, 'UNAUTHORIZED');

    // 2. แจน (ไม่ใช่สมาชิกห้อง sampleRoomId) ขอ chat:join -> ต้องโดน FORBIDDEN
    const janSock = createMockSocket(3);
    ioEmitter.emit('connection', janSock);
    const janJoinAck = await new Promise((resolve) =>
      janSock.trigger('chat:join', { roomId: sampleRoomId }, resolve)
    );
    assert.equal(janJoinAck.success, false);
    assert.equal(janJoinAck.error.code, 'FORBIDDEN');

    // 3. บอล (สมาชิกห้อง) ขอ chat:join -> สำเร็จและเข้า channel room:<id>
    const ballSock = createMockSocket(1);
    ioEmitter.emit('connection', ballSock);
    const ballJoinAck = await new Promise((resolve) =>
      ballSock.trigger('chat:join', { roomId: sampleRoomId }, resolve)
    );
    assert.equal(ballJoinAck.success, true);
    assert.ok(ballSock.joinedRooms.includes(`room:${sampleRoomId}`));

    // 4. ส่งข้อความยาวเกิน 2,000 ตัวอักษร -> ต้องโดน INVALID_INPUT
    const tooLongAck = await new Promise((resolve) =>
      ballSock.trigger('chat:send', { roomId: sampleRoomId, content: 'ก'.repeat(2001) }, resolve)
    );
    assert.equal(tooLongAck.success, false);
    assert.equal(tooLongAck.error.code, 'INVALID_INPUT');

    // 5. ส่งข้อความถูกต้อง -> บันทึกลง DB และ broadcast event 'chat:message'
    const sendAck = await new Promise((resolve) =>
      ballSock.trigger('chat:send', { roomId: sampleRoomId, content: 'ข้อความทดสอบอัตโนมัติ (ลบหลังเทสต์)' }, resolve)
    );
    assert.equal(sendAck.success, true);
    assert.ok(sendAck.data.id > 0);
    createdMessageIdsForCleanup.push(sendAck.data.id);

    const broadcast = broadcastedEvents.find(
      (e) => e.channel === `room:${sampleRoomId}` && e.event === 'chat:message'
    );
    assert.ok(broadcast);
    assert.equal(broadcast.data.content, 'ข้อความทดสอบอัตโนมัติ (ลบหลังเทสต์)');
  });
});

