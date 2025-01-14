const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// Route สำหรับการลงทะเบียน
router.post('/register', authController.register);

// Route สำหรับการยืนยันอีเมล
router.get('/verify', authController.verifyEmail);

// Route สำหรับ Login
router.post('/login', authController.login);

module.exports = router;
