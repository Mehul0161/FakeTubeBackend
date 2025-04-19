const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import Video model
const Video = require('../models/Video');

// Function to refresh a single video
async function refreshVideo(video) {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY;
    if (!API_KEY) {
      console.error('YouTube API key is not configured');
      return;
    }

    console.log(`Refreshing video: ${video.youtubeId} - ${video.title}`);
    
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${video.youtubeId}&key=${API_KEY}`
    );
    
    if (!response.data.items || response.data.items.length === 0) {
      console.log(`Video ${video.youtubeId} not found on YouTube, might have been deleted`);
      return;
    }
    
    const youtubeData = response.data.items[0];
    
    // Update video document
    video.title = youtubeData.snippet.title;
    video.description = youtubeData.snippet.description;
    video.thumbnailUrl = youtubeData.snippet.thumbnails.high?.url || youtubeData.snippet.thumbnails.default?.url;
    video.duration = youtubeData.contentDetails.duration;
    video.channelId = youtubeData.snippet.channelId;
    video.channelTitle = youtubeData.snippet.channelTitle;
    video.viewCount = parseInt(youtubeData.statistics.viewCount || '0');
    video.publishedAt = youtubeData.snippet.publishedAt;
    video.lastUpdated = new Date();
    
    await video.save();
    console.log(`Successfully refreshed video: ${video.youtubeId}`);
  } catch (error) {
    console.error(`Error refreshing video ${video.youtubeId}:`, error.message);
  }
}

// Function to refresh all videos
async function refreshAllVideos() {
  try {
    console.log('Starting video cache refresh...');
    
    // Get all videos that haven't been updated in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const videosToRefresh = await Video.find({
      lastUpdated: { $lt: oneDayAgo }
    }).limit(50); // Limit to 50 videos per run to avoid API quota issues
    
    console.log(`Found ${videosToRefresh.length} videos to refresh`);
    
    // Refresh each video
    for (const video of videosToRefresh) {
      await refreshVideo(video);
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('Video cache refresh completed');
  } catch (error) {
    console.error('Error refreshing video cache:', error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
  }
}

// Run the refresh function
refreshAllVideos(); 