const express = require('express');
const router = express.Router();
const { submitVerification, getVerificationsForProject } = require('../controllers/verificationController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// All verification routes require authentication
router.use(protect);

// Get verifications for a specific project
router.get('/project/:projectId', getVerificationsForProject);

// Submit verification (requires admin or auditor roles)
router.post('/', requireRole(['admin', 'auditor']), submitVerification);

module.exports = router;
