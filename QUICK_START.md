# ECMS - Quick Start Guide

## 🚀 Server Status

### Backend Server
- **URL:** http://localhost:5000
- **Status:** ✅ Running
- **API Endpoints:** http://localhost:5000/api/*

### Frontend Server
- **URL:** http://localhost:3000
- **Status:** ✅ Running
- **Proxy:** API calls to `/api/*` are proxied to backend

---

## 🔐 Test User Credentials

### Student Account
- **Email:** student@test.com
- **Password:** Student@123
- **Dashboard:** http://localhost:3000/student/dashboard.html

### Teacher Account
- **Email:** teacher@test.com
- **Password:** Teacher@123
- **Dashboard:** http://localhost:3000/teacher/dashboard.html

### Admin Account
- **Email:** admin@test.com
- **Password:** Admin@123
- **Dashboard:** http://localhost:3000/admin/dashboard.html

---

## 📝 Important URLs

- **Login Page:** http://localhost:3000/pages/public/login.html
- **Landing Page:** http://localhost:3000/
- **API Docs:** http://localhost:5000/api-docs (if configured)

---

## 🛠️ Commands

### Start Backend
```bash
cd backend
npm run dev
```

### Start Frontend
```bash
cd frontend
npm run dev
```

### Seed Test Users
```bash
cd backend
npm run seed
```

### Clear Database
```bash
cd backend
npm run clear-db
```

---

## ✅ Fixed Issues

1. ✅ Added API proxy in Vite config to forward `/api/*` requests to backend
2. ✅ Backend running on port 5000
3. ✅ Frontend running on port 3001
4. ✅ Network error resolved - frontend can now communicate with backend

---

## 🔄 Next Steps

1. Open http://localhost:3000/pages/public/login.html
2. Log in with one of the test accounts
3. You should be redirected to the appropriate dashboard based on your role

## 🎨 If UI Styles Don't Load

If the UI appears unstyled (no colors/formatting):
1. Hard refresh your browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Clear browser cache
3. Make sure Vite dev server is running (`npm run dev` in frontend folder)
4. Check browser console (F12) for any CSS loading errors
