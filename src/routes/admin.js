const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  getPlatformStats,
  getReportedVideos,
  handleVideoReport,
  toggleUserBan,
  getAllUsers,
  getAllVideos
} = require('../controllers/adminController');

// All admin routes require authentication and admin privileges
router.use(auth, adminAuth);

// Admin routes
router.get('/stats', getPlatformStats);
router.get('/reported-videos', getReportedVideos);
router.post('/videos/:id/report', handleVideoReport);
router.post('/users/:id/ban', toggleUserBan);
router.get('/users', getAllUsers);
router.get('/videos', getAllVideos);

module.exports = router; 