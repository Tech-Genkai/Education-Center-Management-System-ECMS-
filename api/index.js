// Vercel Serverless Function Entry Point for ES Module backend
export default async function handler(req, res) {
  try {
    // Dynamically import the ES module
    const { app } = await import('../backend/dist/src/server.js');
    
    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error('Failed to load Express app:', error);
    return res.status(500).json({ 
      error: 'Server initialization failed',
      message: error.message,
      details: 'Check build logs and environment variables'
    });
  }
}
