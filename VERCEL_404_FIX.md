# Vercel Deployment Fix - 404 Error

## Problem
The 404 error occurs because Vercel's serverless architecture needs a specific entry point structure.

## Solution Applied

### 1. Created `/api/index.js`
This is Vercel's standard entry point for serverless functions. It imports your built Express app.

### 2. Updated `vercel.json`
- Changed build source to use `api/index.js`
- Added proper build and install commands
- Configured routes to direct all traffic to the API function

### 3. Created root `package.json`
Helps Vercel understand the monorepo structure with backend and shared packages.

## Deploy Steps

### Option 1: Via Vercel Dashboard (Recommended)

1. **Go to your Vercel project settings**
2. **General → Build & Development Settings:**
   - Framework Preset: **Other**
   - Root Directory: `.` (leave empty or select root)
   - Build Command: `npm run build` (or leave default)
   - Output Directory: (leave empty)
   - Install Command: `npm install` (or leave default)

3. **Add Environment Variables** (Settings → Environment Variables):
   ```
   MONGODB_URI=your-mongodb-connection-string
   SESSION_SECRET=your-session-secret
   JWT_SECRET=your-jwt-secret
   JWT_ACCESS_SECRET=your-jwt-access-secret
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=your-sendgrid-api-key
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Redeploy:**
   - Go to Deployments → Click "..." → Redeploy
   - Or push a new commit to trigger auto-deploy

### Option 2: Via Git Push

```bash
# Stage and commit the fixes
git add .
git commit -m "fix: Configure Vercel serverless deployment

- Add api/index.js entry point for Vercel
- Update vercel.json with proper build configuration
- Add root package.json for monorepo structure
- Fix 404 NOT_FOUND error"

# Push to trigger Vercel deployment
git push origin main
```

## What Changed

### File Structure
```
project-root/
├── api/
│   └── index.js          ← NEW: Vercel entry point
├── backend/
│   ├── dist/
│   │   └── src/
│   │       └── server.js ← Built Express app
│   ├── src/
│   └── package.json
├── shared/
│   └── package.json
├── package.json          ← NEW: Root package.json
├── vercel.json           ← UPDATED: Proper config
└── .env.example
```

### How It Works
1. Vercel builds your backend: `cd backend && npm run build`
2. Creates serverless function from `api/index.js`
3. `api/index.js` imports the built Express app
4. All requests route through the serverless function
5. Express handles routing internally

## Verify Deployment

After redeploying, your app should work at:
- `https://your-app.vercel.app/login`
- `https://your-app.vercel.app/api/auth/me`

## Troubleshooting

### Still getting 404?
1. Check Vercel build logs for errors
2. Verify all environment variables are set
3. Ensure MongoDB connection string is correct
4. Check that backend built successfully (look for dist/ folder in logs)

### Build fails?
1. Check that both backend and shared dependencies install
2. Verify TypeScript compiles without errors locally
3. Check Node.js version compatibility (use Node 18+)

### Can't connect to database?
1. Whitelist Vercel's IPs in MongoDB Atlas: `0.0.0.0/0`
2. Check MONGODB_URI format includes username, password, and database name
3. Ensure network access is configured in Atlas

## Next Steps

1. Commit and push these changes
2. Wait for Vercel to redeploy (auto-triggers on push)
3. Check deployment logs in Vercel dashboard
4. Test your application
5. If still issues, check Vercel function logs

## Alternative: Vercel CLI Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from root directory
vercel --prod

# View logs
vercel logs --follow
```

---

**Your 404 error should now be fixed!** 🎉
