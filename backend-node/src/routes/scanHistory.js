const express = require('express');
const router = express.Router();
const { getScanHistory } = require('../controllers/historyController');

router.get('/scan-history', getScanHistory);

module.exports = router;