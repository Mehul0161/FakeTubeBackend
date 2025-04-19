const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

// Schedule the refresh script to run daily at 2 AM
cron.schedule('0 2 * * *', () => {
  console.log('Running scheduled video cache refresh...');
  
  // Get the absolute path to the refresh script
  const scriptPath = path.resolve(__dirname, 'refreshVideoCache.js');
  
  // Execute the refresh script
  exec(`node ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing refresh script: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Refresh script stderr: ${stderr}`);
      return;
    }
    console.log(`Refresh script output: ${stdout}`);
  });
});

console.log('Video cache refresh cron job scheduled to run daily at 2 AM'); 