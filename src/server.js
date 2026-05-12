// src/server.js

// Load environment variables from .env
require('dotenv').config();

// Import required modules
const mongoose = require('mongoose');
const app = require('./app');

// Read configuration from environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

/*
|--------------------------------------------------------------------------
| Connect to MongoDB and Start Server
|--------------------------------------------------------------------------
| We first connect to MongoDB.
| Only after a successful connection do we start the Express server.
*/
async function startServer() {
  try {
    // Connect to MongoDB Atlas or local MongoDB
    await mongoose.connect(MONGODB_URI);

    console.log('✅ MongoDB connected successfully');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB');
    console.error(error.message);

    // Stop the application if DB connection fails
    process.exit(1);
  }
}

// Start the application
startServer();