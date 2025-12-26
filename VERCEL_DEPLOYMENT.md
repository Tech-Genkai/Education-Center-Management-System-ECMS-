# Vercel Deployment Guide for ECMS

This guide will help you deploy the Education Center Management System (ECMS) to Vercel with full email functionality.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed: `npm install -g vercel`
3. A MongoDB Atlas account for database hosting
4. An email service provider account (recommended options below)

## Email Service Setup

Vercel supports SMTP email sending. Here are recommended free/affordable email providers:

### Option 1: SendGrid (Recommended - Free tier: 100 emails/day)

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API Key:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Choose "Full Access" or "Restricted Access" (Mail Send only)
   - Copy the API key
3. Your SMTP credentials:
   - **SMTP_HOST**: `smtp.sendgrid.net`
   - **SMTP_PORT**: `587`
   - **SMTP_USER**: `apikey` (literally the word "apikey")
   - **SMTP_PASSWORD**: Your SendGrid API key
   - **SMTP_FROM_EMAIL**: Your verified sender email
   - **SMTP_FROM_NAME**: `ECMS Portal`

### Option 2: Resend (Modern alternative - Free tier: 100 emails/day)

1. Sign up at [resend.com](https://resend.com)
2. Create an API Key in the dashboard
3. Your SMTP credentials:
   - **SMTP_HOST**: `smtp.resend.com`
   - **SMTP_PORT**: `587`
   - **SMTP_USER**: `resend`
   - **SMTP_PASSWORD**: Your Resend API key
   - **SMTP_FROM_EMAIL**: Your verified domain email
   - **SMTP_FROM_NAME**: `ECMS Portal`

### Option 3: Gmail SMTP (For testing only)

1. Enable 2-Step Verification on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → App passwords
   - Create a new app password
3. Your SMTP credentials:
   - **SMTP_HOST**: `smtp.gmail.com`
   - **SMTP_PORT**: `587`
   - **SMTP_USER**: Your Gmail address
   - **SMTP_PASSWORD**: The generated app password (16 characters)
   - **SMTP_FROM_EMAIL**: Your Gmail address
   - **SMTP_FROM_NAME**: `ECMS Portal`

⚠️ **Note**: Gmail has sending limits (500/day) and is not recommended for production.

### Option 4: Brevo (formerly Sendinblue - Free tier: 300 emails/day)

1. Sign up at [brevo.com](https://www.brevo.com)
2. Go to SMTP & API → SMTP Settings
3. Your SMTP credentials:
   - **SMTP_HOST**: `smtp-relay.brevo.com`
   - **SMTP_PORT**: `587`
   - **SMTP_USER**: Your Brevo login email
   - **SMTP_PASSWORD**: Your SMTP key from Brevo dashboard
   - **SMTP_FROM_EMAIL**: Your verified sender email
   - **SMTP_FROM_NAME**: `ECMS Portal`

## Deployment Steps

### 1. Prepare Your Project

Build the backend:
```bash
cd backend
npm install
npm run build
cd ..
```

### 2. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 3. Login to Vercel

```bash
vercel login
```

### 4. Deploy to Vercel

From the project root directory:

```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Choose your account
- Link to existing project? **N**
- Project name? `ecms-backend` (or your preferred name)
- In which directory is your code located? `./`

### 5. Configure Environment Variables

After the initial deployment, add your environment variables:

```bash
# Database
vercel env add MONGODB_URI
# Paste your MongoDB Atlas connection string

# Session & Security
vercel env add SESSION_SECRET
# Generate: openssl rand -base64 32

vercel env add JWT_SECRET
# Generate: openssl rand -base64 32

vercel env add JWT_ACCESS_SECRET
# Generate: openssl rand -base64 32

# Email Configuration (choose your provider from above)
vercel env add SMTP_HOST
# Example for SendGrid: smtp.sendgrid.net

vercel env add SMTP_PORT
# Usually: 587

vercel env add SMTP_USER
# Your SMTP username (provider-specific)

vercel env add SMTP_PASSWORD
# Your SMTP password or API key

vercel env add SMTP_FROM_EMAIL
# Your verified sender email

vercel env add SMTP_FROM_NAME
# ECMS Portal

# Optional: SMTP Security
vercel env add SMTP_SECURE
# true or false (true for port 465, false for 587)

# App Configuration
vercel env add APP_NAME
# ECMS Portal

vercel env add APP_URL
# Your Vercel deployment URL (e.g., https://ecms-backend.vercel.app)

# Other Settings
vercel env add BCRYPT_ROUNDS
# 12

vercel env add PROFILE_UPLOAD_RETENTION_DAYS
# 1

vercel env add PROFILE_UPLOAD_CLEANUP_INTERVAL_MS
# 3600000
```

### 6. Redeploy with Environment Variables

```bash
vercel --prod
```

## Alternative: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Output Directory**: `backend/dist`
4. Add all environment variables in the dashboard:
   - Go to Project Settings → Environment Variables
   - Add each variable from the list above
5. Deploy

## MongoDB Atlas Setup

If you don't have MongoDB Atlas configured:

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user:
   - Go to Database Access
   - Add a new database user with password
4. Whitelist Vercel's IP addresses:
   - Go to Network Access
   - Add IP Address: `0.0.0.0/0` (allows all IPs)
   - ⚠️ For production, use Vercel's specific IP ranges
5. Get your connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your database name (e.g., `ecms`)

Example connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ecms?retryWrites=true&w=majority
```

## Testing Email Functionality

After deployment, test the password reset feature:

1. Go to your deployed app's login page
2. Click "Forgot Password?"
3. Enter a registered email address
4. Check the email inbox for the OTP

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/ecms` |
| `SESSION_SECRET` | Secret for session encryption | Random 32-character string |
| `JWT_SECRET` | Secret for JWT tokens | Random 32-character string |
| `JWT_ACCESS_SECRET` | Secret for access tokens | Random 32-character string |
| `SMTP_HOST` | SMTP server hostname | `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | Provider-specific |
| `SMTP_PASSWORD` | SMTP password/API key | Provider-specific |
| `SMTP_FROM_EMAIL` | Sender email address | `noreply@yourdomain.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_FROM_NAME` | Sender name | `ECMS Portal` |
| `SMTP_SECURE` | Use TLS/SSL | `false` |
| `APP_NAME` | Application name | `ECMS Portal` |
| `APP_URL` | Application URL | Your Vercel URL |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |
| `PROFILE_UPLOAD_RETENTION_DAYS` | Days to keep temp uploads | `1` |
| `PROFILE_UPLOAD_CLEANUP_INTERVAL_MS` | Cleanup interval | `3600000` |

## Vercel-Specific Configuration

### Build Settings

The `vercel.json` file in the project root configures:
- Build process using the compiled Node.js output
- Static file serving from `backend/public`
- All other routes handled by the Express app
- Production environment variables

### Performance Optimizations

Vercel automatically provides:
- Global CDN for static assets
- Automatic HTTPS/SSL
- Compression (gzip/brotli)
- Edge caching where applicable

### Limitations to Consider

1. **Serverless Function Timeout**: Free tier has 10s timeout, Pro tier has 60s
2. **Cold Starts**: First request after inactivity may be slower
3. **File System**: Temporary and read-only (use MongoDB GridFS for uploads)
4. **WebSockets**: Limited support (Socket.io may need configuration)

## Troubleshooting

### Email Not Sending

1. Check Vercel logs: `vercel logs`
2. Verify SMTP credentials are correct
3. Check sender email is verified with your provider
4. Look for firewall or security blocks
5. Verify environment variables are set: `vercel env ls`

### Database Connection Issues

1. Verify MongoDB connection string format
2. Check Network Access whitelist in MongoDB Atlas
3. Ensure database user has correct permissions
4. Check connection string password encoding (use URL encoding for special characters)

### Build Failures

1. Ensure all dependencies are in `package.json`
2. Check build logs: `vercel logs --build`
3. Verify TypeScript compiles locally: `npm run build`
4. Check Node.js version compatibility

### Static Files Not Loading

1. Verify files exist in `backend/public/`
2. Check route configuration in `vercel.json`
3. Clear Vercel cache: Deploy with `--force`

## Monitoring and Logs

View deployment logs:
```bash
# Real-time logs
vercel logs --follow

# Build logs
vercel logs --build

# Specific deployment
vercel logs <deployment-url>
```

## Custom Domain Setup

1. Go to your project in Vercel dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Update DNS records as instructed
5. Update `APP_URL` environment variable to your custom domain

## Security Best Practices

1. **Never commit secrets**: Use Vercel environment variables
2. **Use strong secrets**: Generate with `openssl rand -base64 32`
3. **Enable CORS properly**: Configure allowed origins
4. **Use HTTPS only**: Vercel provides this by default
5. **Rotate secrets regularly**: Update JWT secrets periodically
6. **Monitor logs**: Check for suspicious activity

## Useful Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview (staging)
vercel

# View deployments
vercel ls

# View environment variables
vercel env ls

# Remove deployment
vercel rm <deployment-url>

# Open deployment in browser
vercel open
```

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [SendGrid Documentation](https://docs.sendgrid.com/)

## Production Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Database user created with secure password
- [ ] Network access configured (whitelist IPs)
- [ ] Email provider account created and verified
- [ ] SMTP credentials obtained and tested
- [ ] All environment variables set in Vercel
- [ ] Application deployed successfully
- [ ] Email functionality tested (password reset)
- [ ] Custom domain configured (optional)
- [ ] Monitoring and logging configured
- [ ] Security best practices implemented

## Cost Estimates

### Free Tier
- **Vercel**: Free (Hobby plan)
- **MongoDB Atlas**: Free (512MB storage)
- **SendGrid**: Free (100 emails/day)
- **Total**: $0/month

### Production Tier
- **Vercel Pro**: $20/month (better performance, analytics)
- **MongoDB Atlas M10**: $57/month (2GB RAM, auto-scaling)
- **SendGrid Essentials**: $15-19/month (100K emails/month)
- **Total**: ~$92-96/month

Choose the tier based on your expected traffic and email volume.

---

## Quick Start Summary

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Build the project
cd backend && npm run build && cd ..

# 3. Login to Vercel
vercel login

# 4. Deploy
vercel

# 5. Add environment variables (do this for each variable)
vercel env add MONGODB_URI
vercel env add SMTP_HOST
vercel env add SMTP_USER
vercel env add SMTP_PASSWORD
# ... (add all required variables)

# 6. Deploy to production with variables
vercel --prod
```

Your ECMS application is now live on Vercel with full email functionality! 🚀
