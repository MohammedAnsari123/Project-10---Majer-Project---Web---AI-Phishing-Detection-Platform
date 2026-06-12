const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAllUsers,
  updateUserStatus,
  getDetectionLogs,
  getAuditLogs,
  getKeywords,
  addKeyword,
  deleteKeyword,
  getBlacklist,
  addBlacklist,
  deleteBlacklist,
  getWhitelist,
  addWhitelist,
  deleteWhitelist,
  deleteUser
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/admin/dashboard', protect, adminOnly, getAdminDashboard);
router.get('/admin/users', protect, adminOnly, getAllUsers);
router.put('/admin/users/:id/status', protect, adminOnly, updateUserStatus);
router.delete('/admin/users/:id', protect, adminOnly, deleteUser);
router.get('/admin/logs', protect, adminOnly, getDetectionLogs);
router.get('/admin/audit-logs', protect, adminOnly, getAuditLogs);

// Keywords CRUD
router.get('/admin/keywords', protect, adminOnly, getKeywords);
router.post('/admin/keywords', protect, adminOnly, addKeyword);
router.delete('/admin/keywords/:id', protect, adminOnly, deleteKeyword);

// Blacklist CRUD
router.get('/admin/blacklist', protect, adminOnly, getBlacklist);
router.post('/admin/blacklist', protect, adminOnly, addBlacklist);
router.delete('/admin/blacklist/:id', protect, adminOnly, deleteBlacklist);

// Whitelist CRUD
router.get('/admin/whitelist', protect, adminOnly, getWhitelist);
router.post('/admin/whitelist', protect, adminOnly, addWhitelist);
router.delete('/admin/whitelist/:id', protect, adminOnly, deleteWhitelist);

module.exports = router;
