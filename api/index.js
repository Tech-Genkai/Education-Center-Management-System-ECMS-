// Vercel Serverless Function Entry Point for ES Module backend
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache the app import for better cold start performance
let appPromise = null;

async function getApp() {
  if (!appPromise) {
    // Construct path to the compiled server module
    const serverPath = join(__dirname, '..', 'backend', 'dist', 'src', 'server.js');
    appPromise = import(serverPath).then(module => module.app);
  }
  return appPromise;
}

export default async function handler(req, res) {
  try {
    const app = await getApp();
    
    // Ensure proper handling of the request
    if (!app) {
      throw new Error('Express app not exported from server module');
    }
    
    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error('Failed to load Express app:', error);
    console.error('Current directory:', __dirname);
    console.error('Stack:', error.stack);
    
    // Reset cache on error to allow retry
    appPromise = null;
    
    return res.status(500).json({ 
      error: 'Server initialization failed',
      message: error.message,
      hint: 'Check Vercel build logs and environment variables',
      timestamp: new Date().toISOString()
    });
  }
}
