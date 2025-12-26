# Vercel Deployment Instructions

## 🚨 IMPORTANT: Root Directory Selection

When Vercel asks you to select the Root Directory, **ALWAYS SELECT THE ROOT**:

✅ **SELECT THIS:** `Education-Center-Management-System-ECMS-` (the root/top level)

❌ **DO NOT SELECT:**
- `backend` (subdirectory)
- `shared` (subdirectory)

The vercel.json is configured to build from root and deploy the backend automatically.

---

## Step-by-Step Deployment

### 1. Connect Your Repository
- Go to [vercel.com/new](https://vercel.com/new)
- Import your GitHub repository
- Click "Import"

### 2. Configure Project Settings

When the configuration screen appears:

**Framework Preset:** Other (or Leave as detected)

**Root Directory:** `.` (root - this is the default)
- **Make sure it shows:** `Education-Center-Management-System-ECMS-`
- **If it shows subdirectories, click on the root directory option**

**Build Command:** (Leave as default or use:)
```bash
cd backend && npm install && npm run build
```

**Output Directory:** (Leave empty or use:)
```
backend/dist
```

**Install Command:** (Leave as default or use:)
```bash
npm install
```

### 3. Add Environment Variables

Click on "Environment Variables" and add ALL of these:

#### Required Variables (You MUST set these):

```
MONGODB_URI = mongodb+srv://your-connection-string
SESSION_SECRET = (generate with: openssl rand -base64 32)
JWT_SECRET = (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET = (generate with: openssl rand -base64 32)
SMTP_HOST = smtp.sendgrid.net (or your provider)
SMTP_PORT = 587
SMTP_USER = apikey (for SendGrid) or your username
SMTP_PASSWORD = your-smtp-api-key-or-password
SMTP_FROM_EMAIL = noreply@yourdomain.com
```

#### Optional Variables (Have defaults):

```
SMTP_FROM_NAME = ECMS Portal
SMTP_SECURE = false
APP_NAME = ECMS Portal
APP_URL = https://your-app.vercel.app
BCRYPT_ROUNDS = 12
PROFILE_UPLOAD_RETENTION_DAYS = 1
PROFILE_UPLOAD_CLEANUP_INTERVAL_MS = 3600000
NODE_ENV = production
```

### 4. Deploy

Click **"Deploy"** and wait for the build to complete (2-5 minutes).

---

## Quick Setup with Automated Script

Alternatively, use the automated setup script:

```bash
# Make script executable (if not already)
chmod +x setup-vercel-env.sh

# Run the script
./setup-vercel-env.sh
```

The script will:
- Check if Vercel CLI is installed
- Guide you through email provider selection
- Auto-generate security secrets
- Set all environment variables
- Prepare for deployment

---

## Email Provider Quick Setup

### Option 1: SendGrid (Recommended)
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Go to Settings → API Keys → Create API Key
3. Use these settings in Vercel:
   - `SMTP_HOST`: smtp.sendgrid.net
   - `SMTP_PORT`: 587
   - `SMTP_USER`: apikey
   - `SMTP_PASSWORD`: Your API key (SG.xxx...)

### Option 2: Resend
1. Sign up at [resend.com](https://resend.com)
2. Create API Key
3. Use these settings in Vercel:
   - `SMTP_HOST`: smtp.resend.com
   - `SMTP_PORT`: 587
   - `SMTP_USER`: resend
   - `SMTP_PASSWORD`: Your API key (re_xxx...)

### Option 3: Brevo (300 emails/day free)
1. Sign up at [brevo.com](https://brevo.com)
2. Get SMTP credentials from SMTP & API section
3. Use these settings in Vercel:
   - `SMTP_HOST`: smtp-relay.brevo.com
   - `SMTP_PORT`: 587
   - `SMTP_USER`: Your Brevo email
   - `SMTP_PASSWORD`: Your SMTP key

---

## Troubleshooting

### Issue: "Root Directory" shows backend/shared
**Solution:** Make sure you click on the root directory name `Education-Center-Management-System-ECMS-` at the top of the list.

### Issue: Build fails with "Cannot find module"
**Solution:** Check that vercel.json is in the root and has the correct build configuration.

### Issue: Environment variables not working
**Solution:** 
1. Go to Project Settings → Environment Variables
2. Verify all variables are set for "Production"
3. Redeploy: `vercel --prod --force`

### Issue: Email not sending
**Solution:**
1. Check Vercel logs: `vercel logs --follow`
2. Verify SMTP credentials
3. Ensure sender email is verified with your provider

---

## Verify Deployment

After successful deployment:

1. Visit your Vercel URL
2. Test login page: `/login`
3. Test password reset: `/forgot-password`
4. Check email delivery
5. View logs: `vercel logs --follow`

---

## Re-deploy After Changes

```bash
# From your project root
git add .
git commit -m "your changes"
git push origin main

# Vercel will auto-deploy
# Or manually: vercel --prod
```

---

## Need Help?

- **Full Guide:** [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- **Email Setup:** [EMAIL_PROVIDERS.md](EMAIL_PROVIDERS.md)
- **Quick Start:** [VERCEL_QUICK_START.md](VERCEL_QUICK_START.md)
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Summary Checklist

- [ ] Repository connected to Vercel
- [ ] Root directory selected (not backend or shared)
- [ ] MongoDB Atlas connection string added
- [ ] Email provider configured (SendGrid/Resend/Brevo)
- [ ] All environment variables set
- [ ] Security secrets generated
- [ ] Deployment successful
- [ ] Email tested (password reset)
- [ ] Application accessible at Vercel URL

🎉 **You're all set!**
