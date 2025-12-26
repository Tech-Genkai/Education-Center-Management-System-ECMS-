// Vercel Serverless Function Entry Point for ES Module backend
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function handler(req, res) {
  try {
    // Construct absolute path to the server module
    const serverPath = join(__dirname, '..', 'backend', 'dist', 'src', 'server.js');
    
    // Dynamically import the ES module
    const { app } = await import(serverPath);
    
    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error('Failed to load Express app:', error);
    console.error('Current directory:', __dirname);
    console.error('Attempted path:', join(__dirname, '..', 'backend', 'dist', 'src', 'server.js'));
    
    return res.status(500).json({ 
      error: 'Server initialization failed',
      message: error.message,
      stack: error.stack,
      details: 'Check build logs and environment variables'
    });
  }
}
