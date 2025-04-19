const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const {
  register,
  login,
  getCurrentUser,
  updateProfile,
  registerMongoUser
} = require('../controllers/authController');

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

// Auth routes
router.post('/register', upload.single('avatar'), register);
router.post('/register-mongo', registerMongoUser);
router.post('/login', login);
router.get('/me', auth, getCurrentUser);
router.patch('/profile', auth, upload.single('avatar'), updateProfile);

module.exports = router; 