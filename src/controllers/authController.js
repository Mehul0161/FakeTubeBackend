const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { uploadAvatar } = require('../config/cloudinary');

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    let avatarUrl = '';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Upload avatar if provided
    if (req.file) {
      avatarUrl = await uploadAvatar(req.file.path);
    }

    // Create new user
    const user = new User({
      email,
      password,
      displayName,
      avatar: avatarUrl
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { displayName, bio } = req.body;
    const updates = {};

    if (displayName) updates.displayName = displayName;
    if (bio) updates.bio = bio;

    // Upload new avatar if provided
    if (req.file) {
      updates.avatar = await uploadAvatar(req.file.path);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Register user in MongoDB after Firebase authentication
const registerMongoUser = async (req, res) => {
  try {
    const { firebaseUid, email, displayName, avatar } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(200).json({ message: 'User already exists in MongoDB' });
    }
    
    // Create new user in MongoDB with fallback for displayName
    const user = new User({
      email,
      displayName: displayName || (email ? email.split('@')[0] : 'User'),
      avatar: avatar || '',
      // Generate a random password since we're using Firebase for auth
      password: Math.random().toString(36).slice(-8)
    });
    
    await user.save();
    console.log(`User registered in MongoDB: ${email}`);
    
    res.status(201).json({
      message: 'User registered in MongoDB successfully',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Error registering user in MongoDB:', error);
    res.status(500).json({ message: 'Error creating user in MongoDB', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  registerMongoUser
}; 