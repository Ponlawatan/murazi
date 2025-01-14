const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const emailController = require('../controllers/emailController');

// ฟังก์ชันสร้าง token แบบสุ่ม
function generateToken() {
    return crypto.randomBytes(16).toString('hex'); // สร้าง token ความยาว 32 ตัวอักษร
}

// Function สำหรับตรวจสอบรูปแบบรหัสผ่าน
function validatePassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/;
    return passwordRegex.test(password);
}

// Register Function
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // ตรวจสอบว่ามีผู้ใช้ที่ลงทะเบียนด้วยอีเมลนี้แล้วหรือไม่
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ msg: "Email already exists" });
        }

        // เข้ารหัสรหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);

        // สร้าง Token สำหรับการยืนยัน
        const verificationToken = crypto.randomBytes(16).toString('hex');

        // บันทึกข้อมูลผู้ใช้
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            verificationToken,
        });
        await newUser.save();

        // ส่งอีเมลยืนยัน
        const emailResponse = await emailController.sendVerificationEmail(email, username, verificationToken);
        
        // ตรวจสอบว่าอีเมลถูกส่งหรือไม่
        if (!emailResponse.success) {
            console.error('Email error:', emailResponse.message); // แสดงข้อผิดพลาดที่เกิดขึ้นจากฟังก์ชันส่งอีเมล
            return res.status(500).json({ msg: "Failed to send verification email." });
        }

        res.status(201).json({ msg: "User registered successfully. Please verify your email." });
    } catch (err) {
        console.error('Server error:', err); // แสดงข้อผิดพลาดจากเซิร์ฟเวอร์
        res.status(500).json({ msg: "Server error" });
    }
};

// ฟังก์ชันสำหรับยืนยันอีเมล
exports.verifyEmail = async (req, res) => {
    const { token } = req.query;  // รับ token จาก query string

    try {
        // ค้นหาผู้ใช้ที่มี token ตรงกับในฐานข้อมูล
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ msg: "Invalid or expired verification token." });
        }

        // เปลี่ยนสถานะ isVerified เป็น true
        user.isVerified = true;
        user.verificationToken = null;  // ลบ token เพื่อไม่ให้ใช้งานได้อีก
        await user.save();  // บันทึกการเปลี่ยนแปลงในฐานข้อมูล

        // ส่งข้อความยืนยันว่าอีเมลถูกยืนยันแล้ว
        res.status(200).json({ msg: "Email verified successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};



// Login Function
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        // ตรวจสอบสถานะการยืนยันอีเมล
        if (!user.isVerified) {
            return res.status(400).json({ msg: "Please verify your email before logging in." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        // ส่ง token (หรือจัดการ session ตามระบบ)
        res.json({ msg: "Logged in successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};
