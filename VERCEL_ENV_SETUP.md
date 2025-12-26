# Vercel Environment Variables Setup

## ⚠️ CRITICAL: Set These in Vercel Dashboard

Your local `.env` has development values. You **MUST** configure production values in Vercel:

### How to Set Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable below
4. Select **Production**, **Preview**, and **Development** environments
5. Click **Save**

---

## 🔴 REQUIRED Variables (Must Set)

### Application Settings
```bash
NODE_ENV=production
PORT=5000
APP_NAME=ECMS Portal
APP_URL=https://your-project.vercel.app
FRONTEND_URL=https://your-project.vercel.app
CORS_ORIGINS=https://your-project.vercel.app
REQUEST_JSON_LIMIT=1mb
REQUEST_URLENCODED_LIMIT=1mb
```

### Database (MongoDB Atlas)
```bash
MONGODB_URI=mongodb+srv://Aayush0p4r:KLURZw13TCn9OWQt@techgenkai.po8t6sk.mongodb.net/ecms?retryWrites=true&w=majority&appName=ECMS
```
⚠️ **Change password in production!** Create a new user in MongoDB Atlas.

### Authentication Secrets
```bash
JWT_ACCESS_SECRET=3d1a7f4e2c9b8d1f93af6b75fdd14df5f9a27b1e2e5b6f203e12b7d00c7f25ab
JWT_REFRESH_SECRET=a3d8e41f52e9b4c92e12ab94df145f4cb76e2c9d3e6a8c1f04b3f72cde64a2e8
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
SESSION_SECRET=r8cfa2a9e6b0f4f1d93a5e7cb14d23e6f74b91d2a38fcb6e02a5d3f48c9e7a1df
```
⚠️ **Generate NEW secrets for production!** Use: `openssl rand -hex 32`

### Security Settings
```bash
BCRYPT_ROUNDS=12
OTP_EXPIRY_MINUTES=10
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
PASSWORD_EXPIRY_DAYS=90
PASSWORD_HISTORY_COUNT=5
```

### Email/SMTP (Gmail Current Setup)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tech.genkai@gmail.com
SMTP_PASSWORD=akpzpjhdaurfwltz
SMTP_FROM_EMAIL=tech.genkai@gmail.com
SMTP_FROM_NAME=ECMS Portal
EMAIL_SUPPORT=support@ecms.edu
```

⚠️ **Gmail App Password Warning:**
- Your current password (`akpzpjhdaurfwltz`) is an App Password
- Make sure "Less secure app access" is enabled for Gmail
- Consider using SendGrid for production (more reliable)

---

## 📧 Alternative: SendGrid (Recommended for Production)

SendGrid is more reliable than Gmail for production:

### 1. Sign up for SendGrid
- Go to https://sendgrid.com
- Free tier: 100 emails/day (sufficient for testing)

### 2. Get API Key
- Settings → API Keys → Create API Key
- Give it "Full Access" or "Mail Send" permission
- Copy the key (you won't see it again!)

### 3. Set These Variables in Vercel
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=SG.your_actual_sendgrid_api_key_here
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=ECMS Portal
EMAIL_SUPPORT=support@yourdomain.com
```

---

## 🟡 OPTIONAL Variables

### Cache Settings
```bash
CACHE_TTL=300
CACHE_CHECK_PERIOD=120
```

### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=5
```

### Logging
```bash
LOG_LEVEL=info
LOG_DIRECTORY=./logs
```

### File Uploads
```bash
UPLOADS_DIRECTORY=./uploads
UPLOADS_TEMP_DIRECTORY=./uploads/temp
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx,xlsx,xls
```

### OAuth (if using)
```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=https://your-project.vercel.app/api/auth/google/callback

MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_CALLBACK_URL=https://your-project.vercel.app/api/auth/microsoft/callback
```

---

## 🚀 Quick Setup Script

You can use the provided script to quickly set variables:

```bash
chmod +x setup-vercel-env.sh
./setup-vercel-env.sh
```

Or manually using Vercel CLI:
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to project
vercel link

# Set variables
vercel env add NODE_ENV
# (Enter: production)

vercel env add MONGODB_URI
# (Paste your MongoDB connection string)

# ... repeat for all variables
```

---

## ✅ Verification Checklist

After setting variables in Vercel:

- [ ] NODE_ENV is set to `production`
- [ ] MONGODB_URI points to MongoDB Atlas (not localhost)
- [ ] JWT secrets are generated for production (not dev values)
- [ ] SMTP credentials are correct
- [ ] APP_URL and FRONTEND_URL match your Vercel domain
- [ ] CORS_ORIGINS includes your Vercel domain
- [ ] All required variables are set for **Production** environment

---

## 🔍 Debug Environment Variables

To check if variables are loaded in Vercel:

1. Add a temporary API endpoint in your code:
```javascript
app.get('/api/debug/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    hasMongoUri: !!process.env.MONGODB_URI,
    hasJwtSecret: !!process.env.JWT_ACCESS_SECRET,
    hasSMTP: !!process.env.SMTP_USER,
    port: process.env.PORT
  });
});
```

2. Visit: `https://your-project.vercel.app/api/debug/env`

⚠️ **Remove this endpoint after debugging!**

---

## 📝 Notes

1. **Never commit `.env` to git** - it's already in `.gitignore`
2. **Use different values for production** - especially secrets and passwords
3. **MongoDB Atlas**: Allow Vercel's IP ranges in Network Access (or use 0.0.0.0/0)
4. **Redeploy after adding variables**: Vercel needs to rebuild with new env vars
5. **Email testing**: Test emails in development before deploying

---

## 🆘 Common Issues

### "SMTP connection failed"
- Check SMTP credentials are correct
- For Gmail: Enable "Less secure app access" or use App Password
- For SendGrid: Verify API key has correct permissions

### "Cannot connect to MongoDB"
- Check MongoDB Atlas Network Access allows Vercel IPs
- Verify connection string format
- Ensure password doesn't contain special characters (URL encode if needed)

### "JWT token invalid"
- Ensure JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are set
- Secrets must be the same across all deployments
- Generate new tokens if secrets change

---

## 📚 Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/)
- [SendGrid Setup Guide](https://docs.sendgrid.com/for-developers/sending-email/api-getting-started)
