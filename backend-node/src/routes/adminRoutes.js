const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAllUsers,
  updateUserStatus,
  getDetectionLogs,
  getAuditLogs
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/admin/dashboard', protect, adminOnly, getAdminDashboard);
router.get('/admin/users', protect, adminOnly, getAllUsers);
router.put('/admin/users/:id/status', protect, adminOnly, updateUserStatus);
router.get('/admin/logs', protect, adminOnly, getDetectionLogs);
router.get('/admin/audit-logs', protect, adminOnly, getAuditLogs);

module.exports = router;
