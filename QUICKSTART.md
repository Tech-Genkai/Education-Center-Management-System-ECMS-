# ECMS - Quick Start Guide

## ✅ Server-Side Rendering is Now Active

Your Education Center Management System now runs entirely on **port 5000** with server-side rendering.

## 🚀 How to Run

### Start the Server (Port 5000)
```bash
cd backend
npm run dev
```

**That's it!** Everything runs on port 5000 with server-side rendering.

The server provides:
- Login page with session-based authentication
- Student dashboard
- Teacher dashboard  
- Admin dashboard
- API endpoints
- Static assets (CSS, JavaScript)

## 🌐 Access URLs

### Login Page
```
http://localhost:5000/login
```

### Dashboards (Requires Login)
```
http://localhost:5000/student/dashboard   # For students
http://localhost:5000/teacher/dashboard   # For teachers
http://localhost:5000/admin/dashboard     # For admins
```

### Home Page (Auto-redirects)
```
http://localhost:5000/
```
- If not logged in → redirects to `/login`
- If logged in → redirects to your role's dashboard

## 🔐 Test Credentials

### Student Account
- **Email**: `student@test.com`
- **Password**: `Student@123`

### Teacher Account
- **Email**: `teacher@test.com`
- **Password**: `Teacher@123`

### Admin Account
- **Email**: `admin@test.com`
- **Password**: `Admin@123`

## ❌ Frontend Port 3000 is No Longer Needed

The old client-side routing on port 3000 has been replaced with server-side rendering. You can now:
1. **Stop any Vite dev servers** running on port 3000
2. Use **only the backend server** on port 5000
3. Access all pages through clean URLs (no more `/pages/student/dashboard.html`)

## 🎯 Key Benefits

### Clean URLs
- ✅ `localhost:5000/login` (instead of `localhost:3000/pages/public/login.html`)
- ✅ `localhost:5000/student/dashboard` (instead of `localhost:3000/pages/student/dashboard.html`)
- ✅ `localhost:5000/admin/dashboard` (instead of `localhost:3000/pages/admin/dashboard.html`)

### Security
- ✅ HTTP-only session cookies (protected from XSS)
- ✅ Server-side authentication validation
- ✅ Role-based access control
- ✅ Automatic redirects for unauthorized access

### Better UX
- ✅ No manual URL typing with `.html` extensions
- ✅ Auto-redirect after login based on user role
- ✅ Protected routes (can't access dashboards without login)
- ✅ Logout redirects back to login

## 🔄 Login Flow

1. Navigate to `http://localhost:5000/login`
2. Enter credentials
3. Click "Sign In"
4. **Automatic redirect** to your dashboard:
   - Students → `/student/dashboard`
   - Teachers → `/teacher/dashboard`
   - Admins → `/admin/dashboard`

## 🛠️ Development Notes

### Session Duration
- Sessions last **24 hours**
- "Remember me" option stores email for convenience
- Logout clears session immediately

### Port Configuration
- Application runs on port **5000** (configurable via `PORT` env variable)
- MongoDB connection required (set `MONGODB_URI` in `.env`)
- No separate frontend server needed - all served via backend

### Environment Variables
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
NODE_ENV=development
```

## 📝 Common Tasks

### Change Port
Edit `backend/.env`:
```env
PORT=8080
```
Then access at `http://localhost:8080/login`

### View API Documentation
```
http://localhost:5000/docs
```

### Health Check
```
http://localhost:5000/healthz
```

## 🐛 Troubleshooting

### "Cannot GET /student/dashboard"
- Make sure you're **logged in first** at `/login`
- Check that backend server is running on port 5000

### CSS Not Loading
- CSS is now loaded via Tailwind CDN (no build step needed)
- Refresh the page if styles don't appear

### Session Lost After Refresh
- Check that `SESSION_SECRET` is set in `.env`
- Verify MongoDB is connected

### Wrong Dashboard After Login
- Each role redirects to their specific dashboard
- `superadmin` role → `/admin/dashboard`
- Clear cookies and login again if issues persist

## 📚 Next Steps

1. **Customize Dashboards**: Edit EJS templates in `backend/src/views/`
2. **Add Real Data**: Update view routes in `backend/src/routes/views.ts`
3. **Create New Pages**: Add new routes and EJS templates
4. **Enhance Security**: Add CSRF protection and rate limiting

---

**Remember**: Everything now runs on **port 5000** with server-side rendering. No need for the frontend Vite server on port 3000!
