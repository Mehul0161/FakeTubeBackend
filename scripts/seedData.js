const mongoose = require('mongoose');
const { google } = require('googleapis');
const bcrypt = require('bcryptjs');
const Video = require('../src/models/Video');
const User = require('../src/models/User');
require('dotenv').config();

// YouTube API setup
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

const searchQueries = [
  'React.js tutorial',
  'Gaming highlights',
  'Cooking recipes'
];

async function fetchYoutubeVideos() {
  const allVideos = [];

  for (const query of searchQueries) {
    try {
      // Search for videos
      const searchResponse = await youtube.search.list({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: 3,
        videoEmbeddable: true
      });

      // Get video details (duration, statistics)
      const videoIds = searchResponse.data.items.map(item => item.id.videoId);
      const videoResponse = await youtube.videos.list({
        part: 'contentDetails,statistics',
        id: videoIds.join(',')
      });

      // Combine search results with video details
      const videos = searchResponse.data.items.map((item, index) => {
        const videoDetails = videoResponse.data.items[index];
        const duration = parseDuration(videoDetails.contentDetails.duration);
        
        return {
          title: item.snippet.title,
          description: item.snippet.description,
          videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          thumbnailUrl: item.snippet.thumbnails.high.url,
          category: query.split(' ')[0],
          tags: item.snippet.tags || [],
          isPublic: true,
          views: parseInt(videoDetails.statistics.viewCount),
          likes: [],
          duration: duration,
          createdAt: new Date(item.snippet.publishedAt),
          channel: {
            id: item.snippet.channelId,
            displayName: item.snippet.channelTitle,
            avatar: 'https://picsum.photos/seed/channel1/200'
          }
        };
      });

      allVideos.push(...videos);
    } catch (error) {
      console.error(`Error fetching videos for query "${query}":`, error.message);
    }
  }

  return allVideos;
}

// Convert YouTube duration format (PT1H2M10S) to seconds
function parseDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

const sampleUsers = [
  {
    email: 'test@example.com',
    password: bcrypt.hashSync('password123', 10),
    displayName: 'Test User',
    avatar: 'https://picsum.photos/seed/user1/200',
    subscribers: [],
  },
];

async function seedDatabase() {
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY is required in .env file');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Video.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const users = await User.create(sampleUsers);
    console.log('Created users');

    // Fetch videos from YouTube
    console.log('Fetching videos from YouTube...');
    const videos = await fetchYoutubeVideos();

    // Create videos with creator reference
    const createdVideos = await Video.create(
      videos.map(video => ({
        ...video,
        creator: users[0]._id,
      }))
    );
    console.log('Created videos');

    // Update user with video references
    await User.findByIdAndUpdate(users[0]._id, {
      $push: { videos: { $each: createdVideos.map(v => v._id) } }
    });
    console.log('Updated user with video references');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 