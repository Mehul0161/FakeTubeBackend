const User = require('../models/User');
const Video = require('../models/Video');

// Get platform statistics
const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVideos = await Video.countDocuments();
    const totalViews = await Video.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ]);

    res.json({
      totalUsers,
      totalVideos,
      totalViews: totalViews[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching platform stats', error: error.message });
  }
};

// Get reported videos
const getReportedVideos = async (req, res) => {
  try {
    const videos = await Video.find({ 'reports.0': { $exists: true } })
      .populate('creator', 'displayName avatar')
      .populate('reports.user', 'displayName avatar');

    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reported videos', error: error.message });
  }
};

// Handle video report
const handleVideoReport = async (req, res) => {
  try {
    const { action } = req.body;
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (action === 'delete') {
      await Video.findByIdAndDelete(video._id);
      res.json({ message: 'Video deleted successfully' });
    } else if (action === 'ignore') {
      video.reports = [];
      await video.save();
      res.json({ message: 'Reports cleared successfully' });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error handling video report', error: error.message });
  }
};

// Ban/Unban user
const toggleUserBan = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({
      message: user.isBanned ? 'User banned successfully' : 'User unbanned successfully',
      isBanned: user.isBanned
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling user ban', error: error.message });
  }
};

// Get all users (with pagination)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = search
      ? { $or: [{ email: { $regex: search, $options: 'i' } }, { displayName: { $regex: search, $options: 'i' } }] }
      : {};

    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// Get all videos (with pagination)
const getAllVideos = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = search
      ? { $or: [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }] }
      : {};

    const videos = await Video.find(query)
      .populate('creator', 'displayName avatar')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Video.countDocuments(query);

    res.json({
      videos,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching videos', error: error.message });
  }
};

module.exports = {
  getPlatformStats,
  getReportedVideos,
  handleVideoReport,
  toggleUserBan,
  getAllUsers,
  getAllVideos
}; 