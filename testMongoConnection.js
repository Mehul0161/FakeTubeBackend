require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    
    // Log connection string (with password masked)
    const maskedUri = process.env.MONGODB_URI.replace(
      /mongodb\+srv:\/\/([^:]+):([^@]+)@/,
      'mongodb+srv://$1:****@'
    );
    console.log('Connection string:', maskedUri);
    
    // Set connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Attempt connection
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test database operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

  } catch (error) {
    console.error('\n❌ MongoDB Connection Error:');
    
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\nThis is likely due to one of these issues:');
      console.error('1. IP Address not whitelisted');
      console.error('2. Network connectivity issues');
      console.error('3. Invalid connection string');
      
      if (error.message.includes('IP whitelist')) {
        console.error('\n🔒 IP Whitelist Issue Detected:');
        console.error('Please follow these steps to whitelist your IP:');
        console.error('1. Go to MongoDB Atlas (https://cloud.mongodb.com)');
        console.error('2. Select your cluster');
        console.error('3. Click "Network Access" in the left sidebar');
        console.error('4. Click "Add IP Address"');
        console.error('5. Click "Add Current IP Address" or enter your IP manually');
        console.error('6. Click "Confirm"');
      }
    }
    
    console.error('\nDetailed error:', error.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
  }
}

// Run the test
testConnection(); 