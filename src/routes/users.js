const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const {
  getUserProfile,
  toggleSubscription,
  getWatchHistory,
  getLikedVideos,
  getPlaylists,
  createPlaylist,
  addToPlaylist,
  removeFromPlaylist,
  updateUserProfile
} = require('../controllers/userController');
const { uploadAvatar } = require('../config/cloudinary');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// User routes
router.get('/:id', getUserProfile);
router.post('/:id/subscribe', auth, toggleSubscription);

// User's personal routes (require authentication)
router.get('/me/history', auth, getWatchHistory);
router.get('/me/liked', auth, getLikedVideos);
router.get('/me/playlists', auth, getPlaylists);
router.post('/me/playlists', auth, createPlaylist);
router.post('/me/playlists/:playlistId/videos', auth, addToPlaylist);
router.delete('/me/playlists/:playlistId/videos/:videoId', auth, removeFromPlaylist);
router.patch('/me', auth, upload.single('avatar'), updateUserProfile);

module.exports = router; 