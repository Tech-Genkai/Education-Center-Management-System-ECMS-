# Education Center Management System (ECMS)

A comprehensive education center management system with server-side rendering.

## Quick Start

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment** (create `.env` in backend folder):
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_session_secret
   NODE_ENV=development
   ```

3. **Start the server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Open http://localhost:5000/login
   - Use test credentials from `backend/scripts/seedTestUsers.ts`

## Architecture

- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB with Mongoose
- **View Engine**: EJS for server-side rendering
- **Authentication**: Session-based with HTTP-only cookies
- **Styling**: Tailwind CSS (via CDN)
- **Port**: 5000 (single server for everything)

## Features

- ✅ Server-side rendering (SSR)
- ✅ Role-based authentication (Student, Teacher, Admin)
- ✅ Secure session management
- ✅ Custom error pages (404, 401, 403, 500)
- ✅ Clean URL routing
- ✅ RESTful API endpoints

## Test Credentials

- **Student**: `student@test.com` / `Student@123`
- **Teacher**: `teacher@test.com` / `Teacher@123`
- **Admin**: `admin@test.com` / `Admin@123`

For detailed documentation, see `QUICKSTART.md` and `SSR_IMPLEMENTATION.md`.
