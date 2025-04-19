const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  // YouTube Video ID
  youtubeId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Basic Information from YouTube API
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  
  // YouTube Channel Information
  channelId: {
    type: String,
    required: true
  },
  channelTitle: {
    type: String,
    required: true
  },
  
  // Statistics
  viewCount: {
    type: Number,
    default: 0
  },
  
  // Metadata
  publishedAt: {
    type: Date,
    required: true
  },
  
  // Caching metadata
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    default: 'uncategorized'
  },
  sort: {
    type: String,
    default: 'date'
  },
  
  // User Interaction Data
  watchHistory: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    watchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Playlists that include this video
  includedInPlaylists: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    playlistName: String
  }]
}, {
  timestamps: true
});

// Index for search functionality
videoSchema.index({ title: 'text', description: 'text' });
// Index for YouTube ID lookups
videoSchema.index({ youtubeId: 1 });
// Index for category and sort filtering
videoSchema.index({ category: 1, sort: 1 });
// Index for last accessed time (for cache management)
videoSchema.index({ lastAccessed: 1 });

// Method to add to user's watch history
videoSchema.methods.addToWatchHistory = async function(userId) {
  // Remove if user already watched this video
  this.watchHistory = this.watchHistory.filter(item => 
    item.userId.toString() !== userId.toString()
  );
  
  // Add new watch record to the beginning
  this.watchHistory.unshift({
    userId,
    watchedAt: new Date()
  });
  
  await this.save();
};

// Method to add to user's playlist
videoSchema.methods.addToPlaylist = async function(userId, playlistName) {
  // Check if already in this playlist
  const existingEntry = this.includedInPlaylists.find(
    item => item.userId.toString() === userId.toString() && 
            item.playlistName === playlistName
  );
  
  if (!existingEntry) {
    this.includedInPlaylists.push({
      userId,
      playlistName
    });
    await this.save();
  }
};

// Method to remove from user's playlist
videoSchema.methods.removeFromPlaylist = async function(userId, playlistName) {
  this.includedInPlaylists = this.includedInPlaylists.filter(
    item => !(item.userId.toString() === userId.toString() && 
              item.playlistName === playlistName)
  );
  await this.save();
};

const Video = mongoose.model('Video', videoSchema);

module.exports = Video; 