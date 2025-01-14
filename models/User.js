const mongoose = require('mongoose');

// สร้าง Schema สำหรับผู้ใช้
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    verificationToken: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,  // ค่าพื้นฐานเป็น false
    },
    tokens: [
        {
            token: {
                type: String,
                required: true,
            },
        },
    ],
});

// สร้าง Model จาก Schema
module.exports = mongoose.model('User', userSchema);
