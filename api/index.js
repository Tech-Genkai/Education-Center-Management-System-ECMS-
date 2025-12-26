// Vercel Serverless Function Entry Point
const path = require('path');

// Import the built Express app
const { app } = require('../backend/dist/src/server.js');

// Export for Vercel serverless
module.exports = app;
