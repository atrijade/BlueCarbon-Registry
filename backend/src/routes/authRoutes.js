const express = require('express');
const router = express.Router();
const { 
  getPendingUsers, 
  approveUser,
  getAllUsers,
  updateUserStatus,
  updateUserRole
} = require('../controllers/authController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// All node management routes require authentication
router.use(protect);

// Fetch pending registrations (admin/auditor access)
router.get('/pending-users', requireRole(['admin', 'auditor']), getPendingUsers);
router.put('/approve-user/:id', requireRole(['admin', 'auditor']), approveUser);

// General User Governance (strictly admin access)
router.get('/users', requireRole(['admin']), getAllUsers);
router.put('/users/:id/status', requireRole(['admin']), updateUserStatus);
router.put('/users/:id/role', requireRole(['admin']), updateUserRole);

module.exports = router;
