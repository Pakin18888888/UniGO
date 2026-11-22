
'use strict';

function validateRegister(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { ok: false, message: 'ข้อมูลสมัครสมาชิกไม่ถูกต้อง' };
    }

    const {
        firstName,
        lastName,
        username,
        email,
        password,
        confirmPassword,
        acceptTerms
    } = body;

    const validString = value => typeof value === 'string';

    if (![firstName, lastName, username, email, password, confirmPassword]
        .every(validString)) {
        return { ok: false, message: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' };
    }

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
        !cleanFirstName ||
        !cleanLastName ||
        cleanFirstName.length > 100 ||
        cleanLastName.length > 100
    ) {
        return { ok: false, message: 'ชื่อหรือนามสกุลไม่ถูกต้อง' };
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
        return {
            ok: false,
            message: 'Username ต้องมี 3–30 ตัว และใช้ภาษาอังกฤษ ตัวเลข หรือ _'
        };
    }

    if (
        cleanEmail.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
        return { ok: false, message: 'รูปแบบ Email ไม่ถูกต้อง' };
    }

    if (
        password.length < 8 ||
        Buffer.byteLength(password, 'utf8') > 72
    ) {
        return {
            ok: false,
            message: 'Password ต้องมีอย่างน้อย 8 ตัวอักษร และไม่เกิน 72 ไบต์'
        };
    }

    if (password !== confirmPassword) {
        return { ok: false, message: 'ยืนยันรหัสผ่านไม่ตรงกัน' };
    }

    if (acceptTerms !== true) {
        return { ok: false, message: 'กรุณายอมรับข้อกำหนดการใช้งาน' };
    }

    return {
        ok: true,
        data: {
            firstName: cleanFirstName,
            lastName: cleanLastName,
            username: cleanUsername,
            email: cleanEmail,
            password
        }
    };
}

module.exports = { validateRegister };
