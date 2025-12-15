import { defineConfig } from 'vite';

// NOTE: This Vite configuration is NO LONGER USED in development.
// The application now uses server-side rendering (SSR) with EJS templates.
// All pages are served from the backend on port 5000.
//
// This configuration is kept for:
// 1. Building static assets if needed in the future
// 2. Reference purposes
//
// To run the application, use: cd backend && npm run dev

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
