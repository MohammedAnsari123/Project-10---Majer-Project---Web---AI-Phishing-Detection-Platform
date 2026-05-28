const express = require('express');
const router = express.Router();
const { scanEmail } = require('../controllers/emailController');
const { protect } = require('../middleware/authMiddleware');

router.post(['/scan-email', '/scan/email'], protect, scanEmail);

module.exports = router;
