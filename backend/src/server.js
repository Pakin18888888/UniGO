
'use strict';

const http = require('node:http');
const app = require('./app');
if (typeof app !== 'function') {
    throw new Error(
        'Express app is missing. Check src/app.js'
    );
}
const { pool } = require('./config/database');

const HOST = '127.0.0.1';
const PORT = Number(process.env.APP_PORT || 3000);

async function startServer() {
    try {
        if (
            !Number.isInteger(PORT) ||
            PORT < 1 ||
            PORT > 65535
        ) {
            throw new Error('Invalid APP_PORT.');
        }

        // ตรวจ Database ก่อนเริ่มรับ Request
        await pool.query('SELECT 1 AS ok');

        console.log('Database connection: READY');

        const server = http.createServer(app);

        server.listen(PORT, HOST, () => {
            console.log('UniGO! Backend is running');
            console.log(`URL: http://${HOST}:${PORT}`);
            console.log(
                `Health: http://${HOST}:${PORT}/api/health`
            );
        });

    } catch (error) {
        console.error('Server startup failed:', error.message);
        process.exitCode = 1;
        await pool.end();
    }
}

startServer();
