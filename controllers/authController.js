const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const emailController = require('../controllers/emailController');
const { sendResetPasswordEmail } = require('../controllers/resetPasswordEmailController');


// Function สำหรับตรวจสอบรูปแบบรหัสผ่าน
function validatePassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/;
    return passwordRegex.test(password);
}

// Register Function
exports.register = async (req, res) => {
    const { username, lastname, email, password } = req.body; // เพิ่ม lastname

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
            lastname, // เพิ่ม lastname
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
exports.sendVerificationEmail = async (req, res) => {
    const { token } = req.query;

    try {
        console.log('Token received:', token);

        // ค้นหาผู้ใช้
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ msg: "Invalid or expired verification token." });
        }
        console.log('User found:', user);

        // เปลี่ยนสถานะ
        user.isVerified = true;
        user.verificationToken = null;

        await user.save();
        console.log('User updated:', user);

        res.status(200).json({ msg: "Email verified successfully." });
    } catch (err) {
        console.error('Error verifying email:', err);
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

        // ตรวจสอบรหัสผ่าน
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        // สร้าง JWT Token
        const token = jwt.sign(
            { id: user._id, email: user.email }, // ข้อมูล payload
            process.env.JWT_SECRET,             // รหัสลับใน .env
            { expiresIn: '1h' }                 // อายุการใช้งานของ token
        );

        // บันทึก Token ลงใน MongoDB
        user.tokens.push({ token }); // เพิ่ม token ลงในฟิลด์ tokens
        await user.save();           // บันทึกการเปลี่ยนแปลงลงในฐานข้อมูล

        // ส่ง response พร้อม token
        res.json({
            msg: "Logged in successfully",
            token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};


// Logout
exports.logout = async (req, res) => {
    const { email, token } = req.body; // ต้องส่ง token มาใน body

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "User not found" });
        }

        // ลบ Token ที่ระบุออกจากอาร์เรย์ tokens
        user.tokens = user.tokens.filter((item) => item.token !== token);
        await user.save();

        res.json({ msg: "Logged out successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};


// ฟังก์ชัน forgotPassword สำหรับขอรีเซ็ตรหัสผ่าน
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // ตรวจสอบว่าผู้ใช้มีอีเมลนี้อยู่ในระบบหรือไม่
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "User with that email does not exist." });
        }

        // สร้าง token สำหรับการรีเซ็ตรหัสผ่าน
        const resetToken = crypto.randomBytes(20).toString('hex');
        
        // ตั้งค่าช่วงเวลาหมดอายุของ token (1 ชั่วโมง)
        const resetPasswordExpires = Date.now() + 3600000;

        // อัพเดต token และเวลาหมดอายุในฐานข้อมูล
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetPasswordExpires;
        await user.save();

        // ส่งอีเมลรีเซ็ตรหัสผ่าน
        const emailResponse = await sendResetPasswordEmail(email, resetToken);

        if (emailResponse.success) {
            res.status(200).json({ msg: "Password reset email sent successfully." });
        } else {
            res.status(500).json({ msg: emailResponse.message });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};


exports.resetPassword = async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;

    // ตรวจสอบว่า newPassword และ confirmPassword ตรงกันหรือไม่
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        // ค้นหาผู้ใช้จาก token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // เข้ารหัสรหัสผ่านใหม่
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // อัพเดตข้อมูลรหัสผ่านใหม่และลบ token
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // ส่ง response กลับไปที่ client ว่าการรีเซ็ตรหัสผ่านสำเร็จ
        res.status(200).json({ message: 'Password has been reset successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
  