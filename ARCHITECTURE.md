# 🏗️ ECMS Deployment Architecture

## Current Architecture (Vercel + Email Support)

```
┌─────────────────────────────────────────────────────────────────┐
│                          End Users                               │
│                   (Students, Teachers, Admins)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Vercel Edge Network                         │
│                  (18+ Global Edge Locations)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Static     │  │    CDN       │  │  Serverless  │          │
│  │   Assets     │  │   Caching    │  │  Functions   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────────────────┬───────────────────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         │                               │
                         ▼                               ▼
           ┌──────────────────────────┐   ┌──────────────────────────┐
           │    MongoDB Atlas         │   │   Email Provider         │
           │   (Database)             │   │   (SMTP Service)         │
           │                          │   │                          │
           │  • User Data             │   │  • SendGrid/Resend       │
           │  • Courses               │   │  • Password Reset OTP    │
           │  • Students/Teachers     │   │  • Notifications         │
           │  • File Storage (GridFS) │   │  • 100-300 emails/day    │
           └──────────────────────────┘   └──────────────────────────┘
```

---

## Request Flow

### 1. User Visits Website

```
User Browser
    │
    ├─→ Static Assets (CSS/JS/Images)
    │   └─→ Served from Vercel CDN (Cached)
    │
    └─→ Dynamic Pages (Login, Dashboard, etc.)
        └─→ Vercel Serverless Function
            └─→ Express.js Application
                ├─→ Authentication Check
                ├─→ Database Query (MongoDB)
                └─→ Render EJS Template
                    └─→ Return HTML to User
```

### 2. Password Reset Flow

```
User Clicks "Forgot Password"
    │
    ├─→ POST /api/auth/forgot-password
    │   └─→ Vercel Serverless Function
    │       ├─→ Validate Email (MongoDB)
    │       ├─→ Generate OTP
    │       ├─→ Store OTP (MongoDB)
    │       └─→ Send Email via SMTP
    │           └─→ Email Provider (SendGrid)
    │               └─→ User Receives OTP Email
    │
    └─→ User Enters OTP
        └─→ POST /api/auth/verify-otp
            └─→ Verify OTP (MongoDB)
                └─→ Allow Password Reset
```

---

## Deployment Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                      Development Workflow                         │
└──────────────────────────────────────────────────────────────────┘

Local Development
    │
    ├─→ npm run dev (localhost:5000)
    │   └─→ Hot Reload with Nodemon
    │
    └─→ Ready to Deploy
        │
        ├─→ npm run build
        │   └─→ TypeScript → JavaScript (dist/)
        │
        └─→ vercel (Preview Deployment)
            │
            └─→ vercel --prod (Production Deployment)

┌──────────────────────────────────────────────────────────────────┐
│                       Vercel Build Process                        │
└──────────────────────────────────────────────────────────────────┘

1. Code Push
   └─→ Vercel detects changes

2. Install Dependencies
   └─→ npm install in backend/

3. Build Application
   └─→ npm run build (TypeScript compilation)

4. Create Serverless Functions
   └─→ Convert Express app to serverless

5. Deploy to Edge Network
   └─→ Distribute globally

6. Update DNS
   └─→ Make live at URL

Total Time: ~2-3 minutes
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Actions                            │
└─────────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
    ┌───────┐  ┌────────┐  ┌─────────┐
    │ Login │  │ Upload │  │ Password│
    │       │  │ Profile│  │  Reset  │
    └───┬───┘  └───┬────┘  └────┬────┘
        │          │             │
        ▼          ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express.js Application                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware Stack                                         │  │
│  │  • Session Management                                     │  │
│  │  • Authentication (JWT + Session)                        │  │
│  │  • Rate Limiting                                         │  │
│  │  • CSRF Protection                                       │  │
│  │  • Error Handling                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Route Handlers                                           │  │
│  │  • /api/auth/* (Authentication)                          │  │
│  │  • /api/students/* (Student Management)                  │  │
│  │  • /api/teachers/* (Teacher Management)                  │  │
│  │  • /api/courses/* (Course Management)                    │  │
│  │  • /* (SSR Views)                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Services                                                 │  │
│  │  • Email Service (nodemailer)                            │  │
│  │  • Database Service (mongoose)                           │  │
│  │  • File Upload Service (GridFS)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
    ┌─────────┐ ┌──────────┐ ┌────────┐
    │ MongoDB │ │  Email   │ │ Static │
    │  Atlas  │ │ Provider │ │ Assets │
    └─────────┘ └──────────┘ └────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Security Layers                            │
└─────────────────────────────────────────────────────────────────┘

1. Transport Layer
   └─→ HTTPS/TLS (Automatic via Vercel)
       └─→ All traffic encrypted

2. Application Layer
   ├─→ Helmet.js (Security headers)
   ├─→ CORS (Cross-origin protection)
   ├─→ CSRF Tokens (Form protection)
   └─→ Rate Limiting (DDoS protection)

3. Authentication Layer
   ├─→ Session-based Auth (HTTP-only cookies)
   ├─→ JWT Tokens (API authentication)
   ├─→ Password Hashing (bcrypt, 12 rounds)
   └─→ OTP Verification (Password reset)

4. Data Layer
   ├─→ MongoDB Authentication (User/Pass)
   ├─→ Network Whitelisting (IP restrictions)
   ├─→ Data Validation (express-validator)
   └─→ Input Sanitization (mongoose)

5. Environment Layer
   └─→ Vercel Environment Variables
       ├─→ Encrypted at rest
       ├─→ Not exposed to client
       └─→ Production/Preview separation
```

---

## Email Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Email Service Flow                            │
└─────────────────────────────────────────────────────────────────┘

Application Request
    │
    ├─→ emailService.sendOTPEmail(email, otp)
    │   └─→ Create Email HTML Template
    │       └─→ Nodemailer Transport
    │           └─→ SMTP Connection
    │               │
    │               ├─→ SMTP_HOST (smtp.sendgrid.net)
    │               ├─→ SMTP_PORT (587)
    │               ├─→ SMTP_USER (apikey)
    │               └─→ SMTP_PASSWORD (API Key)
    │
    └─→ Email Provider (SendGrid/Resend/Brevo)
        └─→ Email Delivery
            ├─→ Spam Check
            ├─→ Deliverability Optimization
            └─→ Send to Recipient
                └─→ User Inbox

Email Template Structure:
┌────────────────────────────┐
│ ECMS Portal Logo           │
├────────────────────────────┤
│ Hello, {User Name}         │
│                            │
│ Your OTP: [123456]         │
│                            │
│ Valid for 10 minutes       │
│                            │
│ [Verification Details]     │
├────────────────────────────┤
│ Footer: Support Info       │
└────────────────────────────┘
```

---

## Scalability Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Scaling Strategy                             │
└─────────────────────────────────────────────────────────────────┘

Growth Level 1: MVP/Testing (0-100 users)
├─→ Vercel: Free Tier
├─→ MongoDB: Free Atlas (512MB)
├─→ Email: SendGrid Free (100/day)
└─→ Cost: $0/month

Growth Level 2: Small Institution (100-500 users)
├─→ Vercel: Free Tier (sufficient)
├─→ MongoDB: Free Atlas (still ok)
├─→ Email: Brevo Free (300/day)
└─→ Cost: $0/month

Growth Level 3: Medium Institution (500-2000 users)
├─→ Vercel: Pro Tier ($20/mo)
├─→ MongoDB: M10 Cluster ($57/mo)
├─→ Email: SendGrid Essentials ($15/mo)
└─→ Cost: $92/month

Growth Level 4: Large Institution (2000+ users)
├─→ Vercel: Pro Tier ($20/mo)
├─→ MongoDB: M20 Cluster ($120/mo)
├─→ Email: SendGrid Pro ($60/mo)
├─→ Redis: Upstash ($10/mo)
└─→ Cost: $210/month

Auto-scaling Features:
├─→ Vercel: Automatic serverless scaling
├─→ MongoDB: Auto-scaling storage
├─→ Email: Rate limit adaptation
└─→ CDN: Global edge caching
```

---

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────────┐
│                    Monitoring Stack                              │
└─────────────────────────────────────────────────────────────────┘

Application Logs
    │
    ├─→ Vercel Logs (Runtime logs)
    │   └─→ vercel logs --follow
    │
    ├─→ Database Logs (MongoDB Atlas)
    │   └─→ Query performance
    │
    └─→ Email Logs (Provider dashboard)
        └─→ Delivery/bounce rates

Metrics to Monitor:
├─→ Response Times
├─→ Error Rates
├─→ Database Connections
├─→ Email Delivery Success
├─→ User Sessions
└─→ API Usage

Alerts Setup:
├─→ Deployment failures
├─→ High error rates
├─→ Database connection issues
├─→ Email delivery failures
└─→ Unusual traffic patterns
```

---

## Backup & Recovery

```
┌─────────────────────────────────────────────────────────────────┐
│                 Backup Strategy                                  │
└─────────────────────────────────────────────────────────────────┘

Database Backups (MongoDB Atlas)
├─→ Automatic snapshots (daily)
├─→ Point-in-time recovery
├─→ 7-day retention (free tier)
└─→ 35-day retention (paid tiers)

Code Backups (Git)
├─→ GitHub repository
├─→ All commits versioned
└─→ Easy rollback

Deployment Rollback
├─→ Vercel maintains deployment history
├─→ One-click rollback in dashboard
└─→ vercel rollback command

Recovery Steps:
1. Identify issue
2. Check Vercel logs
3. Rollback deployment if needed
4. Restore database if needed
5. Verify functionality
```

---

## Cost Optimization Tips

```
┌─────────────────────────────────────────────────────────────────┐
│                  Cost Reduction Strategies                       │
└─────────────────────────────────────────────────────────────────┘

1. Optimize Database Queries
   └─→ Add indexes for frequent queries
   └─→ Use projection to limit fields
   └─→ Implement pagination

2. Implement Caching
   └─→ Cache static content (Vercel CDN)
   └─→ Cache database results (Redis)
   └─→ Use stale-while-revalidate

3. Email Optimization
   └─→ Batch emails when possible
   └─→ Use transactional only (no marketing)
   └─→ Monitor bounce/spam rates

4. Asset Optimization
   └─→ Compress images
   └─→ Minify CSS/JS
   └─→ Use WebP format

5. Monitor Usage
   └─→ Track Vercel function invocations
   └─→ Monitor database operations
   └─→ Review email usage
```

## Conclusion

The Vercel architecture provides:

✅ **Email Support** - Full SMTP capabilities
✅ **Global Performance** - 18+ edge locations
✅ **Auto-scaling** - Pay for what you use
✅ **Developer Experience** - Fast deployments
✅ **Cost Effective** - Free tier for testing
✅ **Security** - HTTPS, DDoS protection
✅ **Reliability** - 99.99% uptime SLA

**Next Steps**: Deploy using [VERCEL_QUICK_START.md](VERCEL_QUICK_START.md)
