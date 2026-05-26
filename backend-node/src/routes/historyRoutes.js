const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getUserHistory } = require('../controllers/historyController');

router.get('/history', protect, getUserHistory);

module.exports = router;
