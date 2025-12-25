# Render Deployment Guide

## Quick Deploy

1. **Connect your GitHub repository to Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `Tech-Genkai/Education-Center-Management-System-ECMS-`

2. **Render will auto-detect the `render.yaml` file** and configure everything automatically

## Manual Configuration (if needed)

### Build Settings
- **Build Command**: `cd backend && npm install && cd ../shared && npm install && cd ../backend && npm run build`
- **Start Command**: `cd backend && npm start`
- **Root Directory**: Leave empty (repository root)

### Environment Variables

#### ✅ Required (Must Set Manually)
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecms?retryWrites=true&w=majority
APP_URL=https://your-app-name.onrender.com
```

#### 🔐 Auto-Generated (Render handles these)
- `SESSION_SECRET` - Auto-generated
- `JWT_SECRET` - Auto-generated  
- `JWT_ACCESS_SECRET` - Auto-generated

#### ✅ Pre-configured
- `NODE_ENV=production`
- `PORT=10000`
- `APP_NAME=ECMS Portal`
- `BCRYPT_ROUNDS=12`
- `SMTP_FROM_NAME=ECMS Portal`
- `PROFILE_UPLOAD_RETENTION_DAYS=1`
- `PROFILE_UPLOAD_CLEANUP_INTERVAL_MS=3600000`

#### 📧 Optional (Email Functionality)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

#### 🔴 Optional (Redis for Session Storage)
```bash
REDIS_URL=redis://username:password@host:port
```

## Post-Deployment

### Check Deployment Status
1. Monitor the build logs in Render dashboard
2. Wait for "Build successful" message
3. Check deployment logs for startup confirmation

### Verify Application
```bash
# Test health endpoint
curl https://your-app-name.onrender.com/

# Test login page
curl https://your-app-name.onrender.com/login
```

## MongoDB Setup (MongoDB Atlas)

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a free cluster
   - Name it: `ecms-cluster`

2. **Configure Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add Render's IP addresses

3. **Create Database User**
   - Go to "Database Access"
   - Add new database user
   - Username: `ecms-admin`
   - Password: Generate strong password
   - Privileges: "Read and write to any database"

4. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `<database>` with `ecms`

Example:
```
mongodb+srv://ecms-admin:YOUR_PASSWORD@ecms-cluster.xxxxx.mongodb.net/ecms?retryWrites=true&w=majority
```

## Common Issues

### Build Fails
```bash
# Check Node version (should be 22.x)
# Check if all dependencies install correctly
# Verify tsconfig.json doesn't have noEmit: true
```

### Runtime Errors
```bash
# Check MONGODB_URI is set correctly
# Verify all required environment variables are present
# Check logs for specific error messages
```

### Connection Issues
```bash
# Verify MongoDB Atlas network access allows Render IPs
# Check MONGODB_URI format is correct
# Ensure database user has proper permissions
```

## Render Free Tier Limitations

- **Spins down after 15 minutes of inactivity**
- **750 hours/month free** (enough for 1 app running 24/7)
- **Cold start time**: ~30-60 seconds
- **No persistent disk storage** (use MongoDB for data)

## Update Deployment

Render automatically rebuilds when you push to your GitHub repository's main branch.

```bash
git add .
git commit -m "Update application"
git push origin main
```

Render will:
1. Detect the push
2. Start a new build
3. Deploy if build succeeds
4. Switch traffic to new version

## Monitoring

- **Logs**: Available in Render dashboard under "Logs" tab
- **Metrics**: View CPU, memory usage in "Metrics" tab
- **Events**: Check deployment history in "Events" tab

## Support

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Application Repository](https://github.com/Tech-Genkai/Education-Center-Management-System-ECMS-)
