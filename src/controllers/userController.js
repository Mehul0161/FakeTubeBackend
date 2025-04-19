const User = require('../models/User');
const Video = require('../models/Video');

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is valid
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await User.findById(id)
      .select('-password')
      .populate('videos', 'title thumbnailUrl views createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
};

// Subscribe/Unsubscribe to user
const toggleSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is valid
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot subscribe to yourself' });
    }

    const isSubscribed = req.user.subscriptions.includes(targetUser._id);
    if (isSubscribed) {
      // Unsubscribe
      req.user.subscriptions = req.user.subscriptions.filter(
        id => id.toString() !== targetUser._id.toString()
      );
      targetUser.subscribers = targetUser.subscribers.filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      // Subscribe
      req.user.subscriptions.push(targetUser._id);
      targetUser.subscribers.push(req.user._id);
    }

    await req.user.save();
    await targetUser.save();

    res.json({
      isSubscribed: !isSubscribed,
      subscriberCount: targetUser.subscribers.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling subscription', error: error.message });
  }
};

// Get user's watch history
const getWatchHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'watchHistory.video',
        select: 'title thumbnailUrl views createdAt creator',
        populate: {
          path: 'creator',
          select: 'displayName avatar'
        }
      });

    res.json(user.watchHistory);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching watch history', error: error.message });
  }
};

// Get user's liked videos
const getLikedVideos = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'likedVideos',
        select: 'title thumbnailUrl views createdAt creator',
        populate: {
          path: 'creator',
          select: 'displayName avatar'
        }
      });

    res.json(user.likedVideos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching liked videos', error: error.message });
  }
};

// Get user's playlists
const getPlaylists = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'playlists.videos',
        select: 'title thumbnailUrl views createdAt creator',
        populate: {
          path: 'creator',
          select: 'displayName avatar'
        }
      });

    res.json(user.playlists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching playlists', error: error.message });
  }
};

// Create playlist
const createPlaylist = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);

    user.playlists.push({ name });
    await user.save();

    res.status(201).json(user.playlists[user.playlists.length - 1]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating playlist', error: error.message });
  }
};

// Add video to playlist
const addToPlaylist = async (req, res) => {
  try {
    const { videoId } = req.body;
    const user = await User.findById(req.user._id);
    const playlist = user.playlists.id(req.params.playlistId);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    if (!playlist.videos.includes(videoId)) {
      playlist.videos.push(videoId);
      await user.save();
    }

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: 'Error adding video to playlist', error: error.message });
  }
};

// Remove video from playlist
const removeFromPlaylist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const playlist = user.playlists.id(req.params.playlistId);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    playlist.videos = playlist.videos.filter(
      id => id.toString() !== req.params.videoId
    );

    await user.save();
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: 'Error removing video from playlist', error: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { displayName, bio } = req.body;
    const updates = {};

    if (displayName) updates.displayName = displayName;
    if (bio) updates.bio = bio;

    // Upload new avatar if provided
    if (req.file) {
      const avatarUrl = await uploadAvatar(req.file.path);
      updates.avatar = avatarUrl;
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

module.exports = {
  getUserProfile,
  toggleSubscription,
  getWatchHistory,
  getLikedVideos,
  getPlaylists,
  createPlaylist,
  addToPlaylist,
  removeFromPlaylist,
  updateUserProfile
}; 