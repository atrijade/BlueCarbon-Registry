const express = require('express');
const router = express.Router();
const { createProject, getMyProjects, getAllProjects, getProjectById } = require('../controllers/projectController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// All project routes require authentication
router.use(protect);

// Get my projects list
router.get('/my', getMyProjects);

// Get project by ID
router.get('/:id', getProjectById);

// Get all registry projects (filtered by status in query if needed)
router.get('/', getAllProjects);

// Create a new restoration project
router.post('/', requireRole(['ngo', 'community', 'admin']), createProject);

module.exports = router;
