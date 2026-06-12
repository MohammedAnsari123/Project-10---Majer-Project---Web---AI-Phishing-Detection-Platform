const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { scanUrl } = require('../controllers/urlScannerController');

router.post(['/scan-url', '/scan/url'], protect, scanUrl);

module.exports = router;

