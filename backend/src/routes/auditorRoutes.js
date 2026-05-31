const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const {
  getAuditorProjects,
  updateProjectStatus,
  getProjectAnalysis,
  verifyProject,
  generateAiAuditReport,
  getContractState
} = require('../controllers/auditorController');

// All auditor routes require authentication and auditor/admin roles
router.use(protect);
router.use(requireRole(['admin', 'auditor']));

// 1. Projects Queue
router.get('/projects', getAuditorProjects);

// 2. Status update
router.put('/projects/:id/status', updateProjectStatus);

// 3. GIS Duplicate / community overlay & AI scoring
router.get('/projects/:id/analysis', getProjectAnalysis);

// 4. Project verification approval/rejection
router.post('/projects/:id/verify', verifyProject);

// 5. PDF/Markdown report generator
postReportHandler = router.post('/projects/:id/report', generateAiAuditReport);

// 6. Smart contract state read RPC emulation
router.get('/projects/:id/contract-state', getContractState);

module.exports = router;
