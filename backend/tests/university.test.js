/**
 * ชุดทดสอบอัตโนมัติ: University Explorer API (/api/v1/universities)
 * ผู้รับผิดชอบ: บอล (ปฐณวรรณ จารุนงคราญ)
 * รันด้วย: npm --prefix backend test
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

const universityRoutes = require('../src/routes/university.routes');

describe('University Explorer API (/api/v1/universities)', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/v1/universities', universityRoutes);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    if (global.__unigoBallFallbackPool) {
      await global.__unigoBallFallbackPool.end();
      global.__unigoBallFallbackPool = null;
    }
  });

  it('GET /api/v1/universities คืนรายชื่อมหาวิทยาลัยพร้อม pagination มาตรฐาน', async () => {
    const res = await fetch(`${baseUrl}/api/v1/universities?page=1&limit=5`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.items));
    assert.equal(body.data.items.length, 5);
    assert.equal(body.data.pagination.page, 1);
    assert.equal(body.data.pagination.limit, 5);
    assert.ok(body.data.pagination.total >= 15);
  });

  it('GET /api/v1/universities จำกัด limit สูงสุดไม่เกิน 50', async () => {
    const res = await fetch(`${baseUrl}/api/v1/universities?limit=999`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.pagination.limit, 50);
  });

  it('GET /api/v1/universities ค้นหาด้วย q และกรองด้วย type / province ได้ถูกต้อง', async () => {
    const res = await fetch(
      `${baseUrl}/api/v1/universities?q=${encodeURIComponent('พระจอมเกล้าธนบุรี')}&type=autonomous&province=${encodeURIComponent('กรุงเทพ')}`
    );
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.items.length, 1);
    assert.equal(body.data.items[0].id, 6);
  });

  it('GET /api/v1/universities คืน 400 เมื่อค่า type หรือ page ไม่ถูกต้อง', async () => {
    const badTypeRes = await fetch(`${baseUrl}/api/v1/universities?type=invalid_type`);
    const badTypeBody = await badTypeRes.json();
    assert.equal(badTypeRes.status, 400);
    assert.equal(badTypeBody.success, false);
    assert.equal(badTypeBody.error.code, 'INVALID_INPUT');

    const badPageRes = await fetch(`${baseUrl}/api/v1/universities?page=0`);
    const badPageBody = await badPageRes.json();
    assert.equal(badPageRes.status, 400);
    assert.equal(badPageBody.success, false);
    assert.equal(badPageBody.error.code, 'INVALID_INPUT');
  });

  it('GET /api/v1/universities/6 คืนรายละเอียดของ มจธ. (KMUTT) พร้อมจำนวนคณะและสาขา', async () => {
    const res = await fetch(`${baseUrl}/api/v1/universities/6`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.id, 6);
    assert.match(body.data.name_th, /พระจอมเกล้าธนบุรี/);
    assert.ok(body.data.faculty_count >= 6);
    assert.ok(body.data.program_count >= 17);
  });

  it('GET /api/v1/universities/:id คืน 400 เมื่อ id ไม่ใช่ตัวเลข และ 404 เมื่อไม่พบข้อมูล', async () => {
    const invalidRes = await fetch(`${baseUrl}/api/v1/universities/abc`);
    const invalidBody = await invalidRes.json();
    assert.equal(invalidRes.status, 400);
    assert.equal(invalidBody.error.code, 'INVALID_INPUT');

    const notFoundRes = await fetch(`${baseUrl}/api/v1/universities/999999`);
    const notFoundBody = await notFoundRes.json();
    assert.equal(notFoundRes.status, 404);
    assert.equal(notFoundBody.error.code, 'NOT_FOUND');
  });

  it('GET /api/v1/universities/6/programs คืนคณะ สาขา และข้อมูล TCAS ของ มจธ. และกรองได้', async () => {
    const res = await fetch(`${baseUrl}/api/v1/universities/6/programs`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.university.id, 6);
    assert.ok(body.data.faculties.length >= 6);

    // ตรวจว่ามีโครงสร้าง programs และ admissions ครบ
    const sitFaculty = body.data.faculties.find((f) => f.id === 8);
    assert.ok(sitFaculty);
    assert.ok(sitFaculty.programs.length >= 3);
    assert.ok(Array.isArray(sitFaculty.programs[0].admissions));

    // ทดสอบค้นหาสาขาหุ่นยนต์ (FIBO)
    const searchRes = await fetch(
      `${baseUrl}/api/v1/universities/6/programs?q=${encodeURIComponent('หุ่นยนต์')}`
    );
    const searchBody = await searchRes.json();
    assert.equal(searchRes.status, 200);
    assert.equal(searchBody.data.faculties.length, 1);
    assert.match(searchBody.data.faculties[0].programs[0].name_th, /หุ่นยนต์/);
  });
});

