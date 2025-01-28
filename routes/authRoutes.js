const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const { register, login, forgotPassword, resetPassword , logout , sendVerificationEmail} = require('../controllers/authController');

// Route สำหรับการลงทะเบียน
router.post('/register', register);

// กำหนด Route สำหรับ verifyEmail
router.get('/verify', sendVerificationEmail);

// Route สำหรับ Login
router.post('/login', login);

// POST /logout
router.post('/logout', logout);

// Routing สำหรับ forgot password
router.post('/forgot-password', forgotPassword); 

// Routing สำหรับ reset password
router.post('/reset-password', resetPassword);

module.exports = router;
