# Custom Error Pages - Implementation Guide

## 📄 Created Error Pages

Your ECMS now has beautiful, custom-designed error pages for all common HTTP errors:

### 1. **404 - Page Not Found** (`errors/404.ejs`)
- **Color Theme**: Blue/Indigo gradient
- **Icon**: Confused face emoji
- **When shown**: User tries to access a non-existent page
- **Features**:
  - Friendly error message
  - "Go to Home" button
  - "Go Back" button
  - Quick links to Login, Docs, System Status

### 2. **401 - Unauthorized** (`errors/401.ejs`)
- **Color Theme**: Orange/Red gradient
- **Icon**: Lock symbol
- **When shown**: User tries to access protected content without logging in
- **Features**:
  - Clear authentication message
  - "Sign In" button (primary action)
  - "Go to Home" button
  - Explains why (not logged in, session expired)
  - Shows test credentials for easy access

### 3. **403 - Forbidden** (`errors/403.ejs`)
- **Color Theme**: Yellow/Orange gradient
- **Icon**: Padlock
- **When shown**: Logged-in user tries to access content they don't have permission for
- **Features**:
  - Role-based access explanation
  - "Go to Home" and "Go Back" buttons
  - Explains different access levels (Student, Teacher, Admin)
  - Helpful context about why access was denied

### 4. **500 - Internal Server Error** (`errors/500.ejs`)
- **Color Theme**: Red/Orange gradient
- **Icon**: Warning triangle
- **When shown**: Server encounters an error while processing request
- **Features**:
  - Apologetic message
  - "Go to Home" button
  - "Try Again" (reload) button
  - Development mode: Shows error stack trace
  - Helpful suggestions (refresh, wait, go back)

### 5. **Generic Error Page** (`errors/error.ejs`)
- **Color Theme**: Adaptive based on error code
- **When shown**: For any other HTTP error codes
- **Features**:
  - Dynamic status code display
  - Customizable title and message
  - Appropriate icon based on error type
  - Context-aware action buttons

## 🎨 Design Features

### Consistent Styling
- ✅ Tailwind CSS for all pages (via CDN)
- ✅ Gradient backgrounds matching error severity
- ✅ Large, bold error codes
- ✅ Smooth animations on hover
- ✅ Responsive design (mobile-friendly)
- ✅ Beautiful SVG icons

### User Experience
- ✅ Clear, non-technical language
- ✅ Helpful explanations of what went wrong
- ✅ Multiple action options
- ✅ Quick access to important pages
- ✅ ECMS branding in footer

### Developer Experience
- ✅ Error details shown in development mode
- ✅ Stack traces for debugging (dev only)
- ✅ Clean JSON responses for API routes
- ✅ Separate error handling for web vs API

## 🛠️ Implementation Details

### Server Configuration
Updated `backend/src/server.ts` with:
1. **404 Handler**: Catches all unmatched routes
2. **Global Error Handler**: Catches all errors thrown in the app
3. **Smart Routing**: API routes get JSON, web routes get HTML

### Error Handling Middleware
Updated `backend/src/middleware/session.ts`:
- `requireRole()` now renders 403 error page for unauthorized access

### Test Routes (Development Only)
Added test routes in `backend/src/routes/views.ts`:
- `/test-404` - Test 404 page
- `/test-401` - Test 401 page
- `/test-403` - Test 403 page
- `/test-500` - Test 500 page
- `/test-error-throw` - Test actual error throwing

## 🧪 Testing Error Pages

### Test URLs (Development Mode)
```
http://localhost:5000/test-404      # 404 Page Not Found
http://localhost:5000/test-401      # 401 Unauthorized
http://localhost:5000/test-403      # 403 Forbidden
http://localhost:5000/test-500      # 500 Server Error
http://localhost:5000/test-error-throw  # Triggers error handler
```

### Real-World Scenarios

#### Test 404
```
http://localhost:5000/nonexistent-page
http://localhost:5000/random/path
```

#### Test 401
```
# Try accessing dashboard without login:
http://localhost:5000/student/dashboard
http://localhost:5000/teacher/dashboard
http://localhost:5000/admin/dashboard
```

#### Test 403
```
# Login as student, then try to access:
http://localhost:5000/admin/dashboard
# (Students don't have admin access)
```

## 📱 Error Page Features by Code

| Code | Name | Colors | Primary Action | Secondary Action |
|------|------|--------|----------------|------------------|
| 404 | Not Found | Blue/Indigo | Go to Home | Go Back |
| 401 | Unauthorized | Orange/Red | Sign In | Go to Home |
| 403 | Forbidden | Yellow/Orange | Go to Home | Go Back |
| 500 | Server Error | Red/Orange | Go to Home | Try Again |

## 🎯 How Error Pages Work

### 1. User Encounters Error
```
User → Request → Server
```

### 2. Server Determines Error Type
```javascript
// In server.ts
app.use((err, req, res, next) => {
  const status = err.status || 500;
  
  // Check if API request
  if (req.path.startsWith('/api/')) {
    return res.status(status).json({ error: message });
  }
  
  // Render appropriate error page
  res.status(status).render('errors/404', { ... });
});
```

### 3. Template Rendered with Data
```ejs
<!-- In error.ejs -->
<span class="text-8xl"><%= status %></span>
<h1><%= title %></h1>
<p><%= message %></p>
```

### 4. Beautiful Page Displayed
- User sees friendly, branded error page
- Clear actions available
- Context about what went wrong

## 💡 Customization Tips

### Change Error Messages
Edit the template files in `backend/src/views/errors/`:
```ejs
<h1>Your Custom Title</h1>
<p>Your custom message here</p>
```

### Add Custom Actions
Add more buttons in any error template:
```html
<a href="/your-page" class="btn-custom">
  Custom Action
</a>
```

### Change Color Schemes
Update the gradient classes:
```html
<!-- From -->
<body class="bg-gradient-to-br from-blue-50 to-indigo-50">

<!-- To -->
<body class="bg-gradient-to-br from-purple-50 to-pink-50">
```

### Add More Error Types
Create new template: `backend/src/views/errors/429.ejs` (Rate Limited)
Update server.ts:
```javascript
if (status === 429) {
  res.status(429).render('errors/429', { ... });
}
```

## 🔒 Security Considerations

### Production vs Development
- ✅ Stack traces only shown in development
- ✅ Detailed errors hidden in production
- ✅ Generic messages for production users
- ✅ Logs errors server-side for debugging

### Error Information
```javascript
// Development
error: { stack: err.stack }  // Full details

// Production  
error: null  // No sensitive info exposed
```

## 📊 Error Page Statistics

All error pages include:
- ✨ 5 custom-designed templates
- 🎨 Unique color schemes per error type
- 🔍 Development-friendly debugging info
- 📱 Fully responsive design
- ♿ Accessible HTML structure
- ⚡ Fast load times (CDN assets)

## 🚀 Next Steps

1. **Monitor Errors**: Check server logs for frequent errors
2. **Update Messages**: Customize error messages for your users
3. **Add Analytics**: Track error page visits
4. **Create More Pages**: Add specific error pages for your needs
5. **Test Scenarios**: Test all error paths in your app

---

**All error pages are now live on port 5000!** 🎉
