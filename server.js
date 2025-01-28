const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes'); // เส้นทางสำหรับ auth (login, register)
const bodyParser = require('body-parser');
const cors = require('cors');
const ejs = require('ejs');
const { resetPassword } = require('./controllers/authController'); // ฟังก์ชัน resetPassword

// โหลดตัวแปรจากไฟล์ .env
dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(cors());
app.set('view engine', 'ejs'); // ใช้ EJS ในการเรนเดอร์ HTML

// เชื่อมต่อ MongoDB
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));

// Routes
app.use('/api/auth', authRoutes); // สำหรับ API auth เช่น login, register
app.use('/auth', authRoutes); // สำหรับการเรียกใช้งาน auth ในรูปแบบอื่นๆ

// Route สำหรับแสดงฟอร์ม reset password
app.get('/reset-password', (req, res) => {
    const { token } = req.query;
  
    // ตรวจสอบว่า token มาจากลิงก์ในอีเมล
    if (!token) {
      return res.status(400).send('Invalid or expired token');
    }
  
    // ส่ง token ไปยังหน้า HTML
    res.render('reset-password', { token });
});

// Route สำหรับการรีเซ็ตรหัสผ่านหลังจากกรอกฟอร์ม
app.post('/reset-password', resetPassword); // ตั้งให้ POST route ใช้ฟังก์ชัน resetPassword ที่คุณได้สร้างไว้ใน Controller

// ตั้งค่าพอร์ตที่ต้องการให้เซิร์ฟเวอร์รัน
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
