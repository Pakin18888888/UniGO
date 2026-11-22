
'use strict';

const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function registerUser(data) {
    // Hash ก่อนเริ่ม Transaction เพื่อลดเวลาล็อกฐานข้อมูล
    const passwordHash = await bcrypt.hash(data.password, 12);

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // สร้างบัญชีผู้ใช้
        const [result] = await connection.execute(
            `INSERT INTO users
         (username, email, password_hash)
       VALUES (?, ?, ?)`,
            [data.username, data.email, passwordHash]
        );

        const userId = result.insertId;

        // สร้าง Profile ด้วย user_id เดียวกัน
        await connection.execute(
            `INSERT INTO profiles
         (user_id, first_name, last_name)
       VALUES (?, ?, ?)`,
            [userId, data.firstName, data.lastName]
        );

        await connection.commit();

        return {
            id: String(userId),
            username: data.username,
            email: data.email
        };

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        throw error;

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = { registerUser };
