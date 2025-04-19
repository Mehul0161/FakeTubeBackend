const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxLength: 500,
    default: ''
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  
  // Watch History (limited to last 10 videos)
  watchHistory: [{
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video'
    },
    watchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Playlists
  playlists: [{
    name: String,
    videos: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video'
    }]
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to add video to watch history (maintaining only last 10)
userSchema.methods.addToWatchHistory = async function(videoId) {
  // Remove if video already exists in history
  this.watchHistory = this.watchHistory.filter(item => 
    item.video.toString() !== videoId.toString()
  );
  
  // Add new video to the beginning
  this.watchHistory.unshift({
    video: videoId,
    watchedAt: new Date()
  });
  
  // Keep only last 10 videos
  if (this.watchHistory.length > 10) {
    this.watchHistory = this.watchHistory.slice(0, 10);
  }
  
  await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User; 