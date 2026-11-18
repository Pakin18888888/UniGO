
'use strict';

const { validateRegister } = require('../validators/auth.validator');
const { registerUser } = require('../services/auth.service');

async function register(req, res) {
    const validation = validateRegister(req.body);

    if (!validation.ok) {
        return res.status(400).json({
            success: false,
            message: validation.message
        });
    }

    try {
        const user = await registerUser(validation.data);

        return res.status(201).json({
            success: true,
            message: 'สมัครสมาชิกสำเร็จ',
            data: { user }
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Username หรือ Email นี้ถูกใช้งานแล้ว'
            });
        }

        console.error('Register failed:', error.code || error.message);

        return res.status(500).json({
            success: false,
            message: 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่'
        });
    }
}

module.exports = { register };
