/**
 * ชุดทดสอบอัตโนมัติ: Exam Library API (/api/v1/exams)
 * ผู้รับผิดชอบ: บอล (ปฐณวรรณ จารุนงคราญ)
 * รันด้วย: npm --prefix backend test
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

const examRoutes = require('../src/routes/exam.routes');

describe('Exam Library API (/api/v1/exams)', () => {
  let server;
  let baseUrl;

  before(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/v1/exams', examRoutes);

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

  it('GET /api/v1/exams คืนรายการหมวดหมู่ ข้อสอบ และ pagination', async () => {
    const res = await fetch(`${baseUrl}/api/v1/exams?page=1&limit=5`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.categories));
    assert.ok(body.data.categories.length >= 5);
    assert.equal(body.data.items.length, 5);
    assert.ok(body.data.pagination.total >= 15);
  });

  it('GET /api/v1/exams กรองด้วย category slug และค้นหาด้วย q ได้ถูกต้อง', async () => {
    const catRes = await fetch(`${baseUrl}/api/v1/exams?category=a-level`);
    const catBody = await catRes.json();

    assert.equal(catRes.status, 200);
    assert.equal(catBody.success, true);
    assert.ok(catBody.data.items.length > 0);
    assert.ok(catBody.data.items.every((item) => item.category_slug === 'a-level'));

    const searchRes = await fetch(`${baseUrl}/api/v1/exams?q=${encodeURIComponent('TPAT3')}`);
    const searchBody = await searchRes.json();
    assert.equal(searchRes.status, 200);
    assert.ok(searchBody.data.items.some((item) => item.title.includes('TPAT3')));
  });

  it('GET /api/v1/exams จำกัด limit สูงสุดไม่เกิน 50 และดัก page ผิดรูปแบบ', async () => {
    const capRes = await fetch(`${baseUrl}/api/v1/exams?limit=500`);
    const capBody = await capRes.json();
    assert.equal(capRes.status, 200);
    assert.equal(capBody.data.pagination.limit, 50);

    const badRes = await fetch(`${baseUrl}/api/v1/exams?page=-1`);
    const badBody = await badRes.json();
    assert.equal(badRes.status, 400);
    assert.equal(badBody.success, false);
    assert.equal(badBody.error.code, 'INVALID_INPUT');
  });

  it('GET /api/v1/exams/:id คืนรายละเอียดข้อสอบ และดัก 400 / 404', async () => {
    const okRes = await fetch(`${baseUrl}/api/v1/exams/5`);
    const okBody = await okRes.json();
    assert.equal(okRes.status, 200);
    assert.equal(okBody.success, true);
    assert.equal(okBody.data.id, 5);
    assert.match(okBody.data.title, /TPAT3/);

    const badRes = await fetch(`${baseUrl}/api/v1/exams/not-a-number`);
    const badBody = await badRes.json();
    assert.equal(badRes.status, 400);
    assert.equal(badBody.error.code, 'INVALID_INPUT');

    const notFoundRes = await fetch(`${baseUrl}/api/v1/exams/999999`);
    const notFoundBody = await notFoundRes.json();
    assert.equal(notFoundRes.status, 404);
    assert.equal(notFoundBody.error.code, 'NOT_FOUND');
  });
});

