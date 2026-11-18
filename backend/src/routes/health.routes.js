
'use strict';

const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// GET /api/health
router.get('/', async (req, res) => {
    try {
        // ตรวจสอบว่า Database ตอบสนองจริง
        await pool.query('SELECT 1 AS ok');

        return res.status(200).json({
            status: 'ok',
            service: 'unigo-backend',
            database: 'connected'
        });
    } catch (error) {
        console.error('Health check failed:', error.message);

        return res.status(503).json({
            status: 'error',
            service: 'unigo-backend',
            database: 'unavailable'
        });
    }
});

module.exports = router;
