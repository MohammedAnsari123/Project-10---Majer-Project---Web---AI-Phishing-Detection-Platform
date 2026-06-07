const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, setupTfa, verifyTfa, loginVerifyTfa } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);

router.post('/tfa/setup', protect, setupTfa);
router.post('/tfa/verify', protect, verifyTfa);
router.post('/tfa/login-verify', loginVerifyTfa);

module.exports = router;
