const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  setupTfa, 
  verifyTfa, 
  loginVerifyTfa,
  forgotPassword,
  resetPassword,
  verifyEmail,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/change-password', protect, changePassword);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);

router.post('/tfa/setup', protect, setupTfa);
router.post('/tfa/verify', protect, verifyTfa);
router.post('/tfa/login-verify', loginVerifyTfa);

module.exports = router;
