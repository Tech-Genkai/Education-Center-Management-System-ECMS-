# Email Provider Setup Guide for Vercel

Comprehensive guide to setting up email providers for your ECMS deployment on Vercel.

## Quick Comparison

| Provider | Free Tier | Best For | Setup Time | Reliability |
|----------|-----------|----------|------------|-------------|
| **SendGrid** | 100/day | Production | 5 min | ⭐⭐⭐⭐⭐ |
| **Resend** | 100/day | Modern apps | 3 min | ⭐⭐⭐⭐⭐ |
| **Brevo** | 300/day | High volume | 10 min | ⭐⭐⭐⭐ |
| **Gmail** | 500/day | Testing only | 5 min | ⭐⭐⭐ |

## 1. SendGrid (Recommended for Production)

### Why Choose SendGrid?
- ✅ Industry standard
- ✅ Excellent documentation
- ✅ 100 free emails/day
- ✅ Reliable delivery
- ✅ Great analytics

### Setup Steps

1. **Sign up** at [sendgrid.com](https://sendgrid.com)

2. **Verify your sender email**:
   - Go to Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Enter your email and details
   - Check email and verify

3. **Create API Key**:
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name it "ECMS-Production"
   - Select "Full Access" or "Restricted Access" → Mail Send
   - Copy the API key (you won't see it again!)

4. **Configure ECMS**:
   ```bash
   vercel env add SMTP_HOST
   # Enter: smtp.sendgrid.net
   
   vercel env add SMTP_PORT
   # Enter: 587
   
   vercel env add SMTP_USER
   # Enter: apikey
   
   vercel env add SMTP_PASSWORD
   # Paste your SendGrid API key
   
   vercel env add SMTP_FROM_EMAIL
   # Enter your verified email
   
   vercel env add SMTP_FROM_NAME
   # Enter: ECMS Portal
   ```

### Testing SendGrid

```bash
# Send test email using curl
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer YOUR_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "personalizations": [{"to": [{"email": "test@example.com"}]}],
    "from": {"email": "your-verified@email.com"},
    "subject": "Test from ECMS",
    "content": [{"type": "text/plain", "value": "Testing email!"}]
  }'
```

### SendGrid Pricing
- **Free**: 100 emails/day forever
- **Essentials**: $15/mo - 40,000 emails
- **Pro**: $60/mo - 120,000 emails

---

## 2. Resend (Recommended for Developers)

### Why Choose Resend?
- ✅ Modern, developer-friendly
- ✅ Beautiful dashboard
- ✅ Simple setup
- ✅ Great documentation
- ✅ 100 free emails/day

### Setup Steps

1. **Sign up** at [resend.com](https://resend.com)

2. **Add your domain** (optional but recommended):
   - Go to Domains → Add Domain
   - Follow DNS configuration steps
   - Verify domain

3. **Create API Key**:
   - Go to API Keys
   - Click "Create API Key"
   - Name it "ECMS-Production"
   - Copy the key

4. **Configure ECMS**:
   ```bash
   vercel env add SMTP_HOST
   # Enter: smtp.resend.com
   
   vercel env add SMTP_PORT
   # Enter: 587
   
   vercel env add SMTP_USER
   # Enter: resend
   
   vercel env add SMTP_PASSWORD
   # Paste your Resend API key
   
   vercel env add SMTP_FROM_EMAIL
   # Enter: noreply@yourdomain.com (or onboarding@resend.dev for testing)
   
   vercel env add SMTP_FROM_NAME
   # Enter: ECMS Portal
   ```

### Testing Resend

Using their SDK:
```typescript
import { Resend } from 'resend';

const resend = new Resend('your-api-key');

await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: 'test@example.com',
  subject: 'Test from ECMS',
  html: '<p>Testing email!</p>'
});
```

### Resend Pricing
- **Free**: 100 emails/day, 3,000/month
- **Pro**: $20/mo - 50,000 emails/month
- **Business**: Custom pricing

---

## 3. Brevo (formerly Sendinblue)

### Why Choose Brevo?
- ✅ Highest free tier (300/day)
- ✅ Marketing features included
- ✅ SMS capabilities
- ✅ Good for growing projects

### Setup Steps

1. **Sign up** at [brevo.com](https://www.brevo.com)

2. **Verify your email**:
   - Check your inbox for verification email
   - Click verify link

3. **Get SMTP credentials**:
   - Go to SMTP & API
   - Find your SMTP credentials:
     - Login: Your Brevo email
     - Password: Your SMTP key (click to reveal)

4. **Configure ECMS**:
   ```bash
   vercel env add SMTP_HOST
   # Enter: smtp-relay.brevo.com
   
   vercel env add SMTP_PORT
   # Enter: 587
   
   vercel env add SMTP_USER
   # Enter: your Brevo login email
   
   vercel env add SMTP_PASSWORD
   # Paste your SMTP key
   
   vercel env add SMTP_FROM_EMAIL
   # Enter your verified email
   
   vercel env add SMTP_FROM_NAME
   # Enter: ECMS Portal
   ```

### Brevo Pricing
- **Free**: 300 emails/day
- **Starter**: $25/mo - 20,000 emails/month
- **Business**: $65/mo - 100,000 emails/month

---

## 4. Gmail (Testing Only)

### Why Choose Gmail?
- ✅ Quick setup for testing
- ✅ Free and familiar
- ❌ Not for production (limited to 500/day)
- ❌ May flag as spam

### Setup Steps

1. **Enable 2-Step Verification**:
   - Go to [myaccount.google.com/security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to App passwords
   - Select "Mail" and "Other"
   - Name it "ECMS"
   - Copy the 16-character password

3. **Configure ECMS**:
   ```bash
   vercel env add SMTP_HOST
   # Enter: smtp.gmail.com
   
   vercel env add SMTP_PORT
   # Enter: 587
   
   vercel env add SMTP_USER
   # Enter: your-email@gmail.com
   
   vercel env add SMTP_PASSWORD
   # Paste your 16-character app password
   
   vercel env add SMTP_FROM_EMAIL
   # Enter: your-email@gmail.com
   
   vercel env add SMTP_FROM_NAME
   # Enter: ECMS Portal
   ```

### Gmail Limits
- 500 emails/day for free Gmail accounts
- 2,000 emails/day for Google Workspace

---

## 5. Other Providers

### Mailgun
- **Free**: 100 emails/day (with credit card)
- **Setup**: Similar to SendGrid
- **Best for**: High-volume production apps

### AWS SES
- **Pricing**: $0.10 per 1,000 emails
- **Free**: 62,000 emails/month from EC2
- **Setup**: More complex, requires AWS account
- **Best for**: Enterprise/AWS infrastructure

### Postmark
- **Free trial**: 100 emails
- **Pricing**: $10/mo for 10,000 emails
- **Best for**: Transactional emails
- **Reliability**: Excellent

---

## Environment Variables Summary

Regardless of provider, you'll need:

```env
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASSWORD=your-password-or-api-key
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=ECMS Portal
SMTP_SECURE=false  # Optional: true for port 465, false for 587
```

## Testing Your Setup

After configuration, test with the password reset feature:

1. Deploy to Vercel: `vercel --prod`
2. Go to your app's login page
3. Click "Forgot Password?"
4. Enter a registered email
5. Check the inbox for OTP email

## Troubleshooting

### Email Not Sending

1. **Check Vercel logs**:
   ```bash
   vercel logs --follow
   ```

2. **Verify credentials**:
   ```bash
   vercel env ls
   ```

3. **Common issues**:
   - ❌ Wrong SMTP_PORT (use 587, not 465)
   - ❌ SMTP_USER incorrect (check provider docs)
   - ❌ Email not verified with provider
   - ❌ API key expired or invalid
   - ❌ Sender domain not verified

### Email Going to Spam

1. **Verify sender domain** with your provider
2. **Add SPF record** to your DNS
3. **Add DKIM record** to your DNS
4. **Use professional sender address** (not @gmail.com)
5. **Avoid spam trigger words** in subject/body

### Rate Limiting

If you hit rate limits:

1. **Free tier limits**:
   - SendGrid: 100/day
   - Resend: 100/day
   - Brevo: 300/day

2. **Solutions**:
   - Upgrade to paid plan
   - Use multiple providers with fallback
   - Implement email queuing

## Best Practices

### 1. Sender Email
```
✅ noreply@yourdomain.com
✅ support@yourdomain.com
✅ hello@yourdomain.com
❌ youremail@gmail.com
❌ no-reply@vercel.app
```

### 2. Email Content
- Use clear, concise subject lines
- Include plain text version
- Make emails mobile-friendly
- Add unsubscribe link (for marketing emails)

### 3. Security
- Never commit API keys to git
- Use Vercel environment variables
- Rotate keys periodically
- Monitor for suspicious activity

### 4. Monitoring
- Set up email delivery webhooks
- Track bounce rates
- Monitor spam complaints
- Review failed deliveries

## Automated Setup

Use the provided script to set up environment variables:

```bash
chmod +x setup-vercel-env.sh
./setup-vercel-env.sh
```

The script will guide you through choosing a provider and configuring credentials.

## Migration Path

### From Testing to Production

1. **Start with Gmail** for local testing
2. **Move to SendGrid/Resend** for staging
3. **Use custom domain** for production
4. **Monitor and scale** as needed

### Upgrading Plans

When to upgrade from free tier:

- ✅ Sending > 100 emails/day consistently
- ✅ Need better delivery rates
- ✅ Want advanced analytics
- ✅ Need dedicated IP address
- ✅ Require priority support

## Cost Calculator

Estimate your monthly email costs:

| Users | Emails/User/Month | Total/Month | Recommended | Cost |
|-------|-------------------|-------------|-------------|------|
| 50 | 2 | 100 | SendGrid Free | $0 |
| 200 | 3 | 600 | Brevo Free | $0 |
| 500 | 5 | 2,500 | Resend Free | $0 |
| 1000 | 8 | 8,000 | SendGrid Essentials | $15 |
| 5000 | 10 | 50,000 | Resend Pro | $20 |
| 10000 | 12 | 120,000 | SendGrid Pro | $60 |

## Support Resources

- **SendGrid**: [docs.sendgrid.com](https://docs.sendgrid.com)
- **Resend**: [resend.com/docs](https://resend.com/docs)
- **Brevo**: [help.brevo.com](https://help.brevo.com)
- **Gmail**: [support.google.com/mail](https://support.google.com/mail)

## Recommended Choice for ECMS

For most ECMS deployments, we recommend:

### 🥇 **SendGrid** (Production)
- Proven reliability
- Industry standard
- Great for educational institutions
- Comprehensive documentation

### 🥈 **Resend** (Modern Alternative)
- Excellent developer experience
- Modern API
- Beautiful dashboard
- Growing community

### 🥉 **Brevo** (High Volume)
- Best free tier (300/day)
- Good for testing and small deployments
- Marketing features included

---

**Ready to set up email?** Choose a provider above and follow the setup steps, or use the automated script: `./setup-vercel-env.sh`
