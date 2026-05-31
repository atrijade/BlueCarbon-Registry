const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  reportSite,
  getSites,
  submitObservation,
  getObservations,
  submitValidation,
  getValidationsForProject,
  submitComplaint,
  getComplaints,
  submitActivity,
  getActivities,
  getAiAssistantResponse,
  getRestorationSuggestions
} = require('../controllers/communityController');

// 1. Sites Suggestions
router.post('/sites', protect, reportSite);
router.get('/sites', getSites);

// 2. Observations
router.post('/observations', protect, submitObservation);
router.get('/observations', getObservations);

// 3. Project Validations
router.post('/validations', protect, submitValidation);
router.get('/validations/project/:projectId', getValidationsForProject);

// 4. Complaints / Issues
router.post('/complaints', protect, submitComplaint);
router.get('/complaints', getComplaints);

// 5. Activities drives
router.post('/activities', protect, submitActivity);
router.get('/activities', getActivities);

// 6. AI Endpoints
router.post('/ai/assistant', getAiAssistantResponse);
router.post('/ai/recommendation', getRestorationSuggestions);

module.exports = router;
