# Quick Start - Vercel Deployment

Deploy your ECMS application to Vercel in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account
- Email provider account (SendGrid, Resend, Brevo, or Gmail)

## Quick Deployment

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Build the Project

```bash
cd backend
npm install
npm run build
cd ..
```

### 4. Deploy

```bash
vercel
```

### 5. Configure Environment Variables

Use the automated setup script:

```bash
chmod +x setup-vercel-env.sh
./setup-vercel-env.sh
```

Or manually add variables:

```bash
# Required variables
vercel env add MONGODB_URI
vercel env add SMTP_HOST
vercel env add SMTP_PORT
vercel env add SMTP_USER
vercel env add SMTP_PASSWORD
vercel env add SMTP_FROM_EMAIL

# Auto-generated secrets (run these commands)
openssl rand -base64 32 | vercel env add SESSION_SECRET
openssl rand -base64 32 | vercel env add JWT_SECRET
openssl rand -base64 32 | vercel env add JWT_ACCESS_SECRET
```

### 6. Deploy to Production

```bash
vercel --prod
```

## Email Provider Quick Setup

### SendGrid (Recommended)
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API Key → Settings → API Keys
3. Use these settings:
   - SMTP_HOST: `smtp.sendgrid.net`
   - SMTP_PORT: `587`
   - SMTP_USER: `apikey`
   - SMTP_PASSWORD: Your API key

### Resend
1. Sign up at [resend.com](https://resend.com)
2. Create API Key in dashboard
3. Use these settings:
   - SMTP_HOST: `smtp.resend.com`
   - SMTP_PORT: `587`
   - SMTP_USER: `resend`
   - SMTP_PASSWORD: Your API key

## Test Your Deployment

1. Visit your Vercel URL
2. Try password reset feature
3. Check email delivery

## Troubleshooting

### View Logs
```bash
vercel logs --follow
```

### List Environment Variables
```bash
vercel env ls
```

### Redeploy
```bash
vercel --prod --force
```

## Full Documentation

For complete setup instructions, email provider comparisons, and troubleshooting, see [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md).

---

**Need help?** Check the [full deployment guide](VERCEL_DEPLOYMENT.md) or [open an issue](https://github.com/Tech-Genkai/Education-Center-Management-System-ECMS-/issues).
