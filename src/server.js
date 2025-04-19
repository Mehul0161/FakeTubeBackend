const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Database connection with better error handling
const connectDB = async () => {
  try {
    // Set connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      retryWrites: true,
      w: 'majority'
    };
    
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.error('Connection string (without password):', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    // Check if the error is related to IP whitelist
    if (err.message && err.message.includes('IP whitelist')) {
      console.error('IP whitelist error: Please add your current IP address to MongoDB Atlas whitelist');
      console.error('Visit: https://www.mongodb.com/docs/atlas/security-whitelist/');
    }
    
    // Exit process with failure
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Setup video cache cron job if enabled
if (process.env.ENABLE_VIDEO_CACHE_CRON === 'true') {
  try {
    // Import the cron setup script
    require('./scripts/setupVideoCacheCron');
    console.log('Video cache cron job setup completed');
  } catch (error) {
    console.error('Error setting up video cache cron job:', error);
  }
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/users', require('./routes/users'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/admin', require('./routes/admin'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 