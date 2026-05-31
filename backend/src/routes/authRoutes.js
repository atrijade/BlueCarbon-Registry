const express = require('express');
const router = express.Router();
const { getPendingUsers, approveUser } = require('../controllers/authController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// All node management routes require authentication and admin/auditor clearance
router.use(protect);
router.use(requireRole(['admin', 'auditor']));

// Fetch pending registrations
router.get('/pending-users', getPendingUsers);

// Approve a registration
router.put('/approve-user/:id', approveUser);

module.exports = router;
