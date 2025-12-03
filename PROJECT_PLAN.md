# Student Management System + ERP - Project Plan

## 🎯 Project Overview
An automation-first, enterprise-grade Student Management System with embedded ERP capabilities. The platform delivers fully audited, role-aware experiences for Students, Teachers, Operations, and Super Admins without relying on React—favoring lean, server-rendered UX powered by modern vanilla JavaScript enhancements. Industrial objectives include end-to-end workflow automation (admissions, attendance, finance), real-time insights, autoscaling infrastructure, and compliance-ready observability across every service boundary.

---

## 🏗️ System Architecture

### Technology Stack
- **Frontend**: HTML5, CSS3, Tailwind CSS, Vanilla JS (ES2023), Alpine.js/Web Components, Vite bundler, Chart.js, pure HTML templates (no React)
- **Backend**: Node.js 20 (TypeScript), Express 5, REST + WebSocket services, BullMQ/Agenda for background jobs, Redis for caching/pub-sub
- **AI Services**: Dedicated AI Orchestrator (Node.js/TypeScript) integrating with Azure OpenAI/GPT-4.5 Turbo, LangChain/AutoGen pipelines, semantic caching, safety filters
- **Database**: MongoDB Atlas (sharded), Redis (caching + job queues), ElasticSearch/OpenSearch for full-text search & analytics, Azure Cognitive Search/pgvector for embeddings
- **Integration & Messaging**: SMTP with Nodemailer, Webhooks, optional RabbitMQ/Kafka for heavy async flows, Azure/AWS SES adapters, Vector DB sync jobs
- **Authentication & Security**: JWT (short-lived) + rotating Refresh Tokens, SSO-ready (SAML/OAuth2), bcrypt/argon2 hashing, OpenID Connect provider compatibility
- **Infrastructure**: Docker, Kubernetes (AKS/EKS), NGINX Ingress, GitHub Actions CI/CD, IaC via Terraform/Bicep
- **Observability & Ops**: OpenTelemetry, Prometheus, Grafana, Loki/ELK, Sentry, Winston structured logging, Feature flag service (Unleash/ConfigCat)

### Automation & Environment Topology
- **Environments**: Dev → QA → Staging → Production with automated promotion gates
- **Pipelines**: GitHub Actions workflows for lint/test/build, image scans (Trivy), IaC validation, blue/green deploys
- **Scheduled Jobs**: Cron-backed services for attendance reminders, fee escalations, backup snapshots, SLA monitors
- **Secrets & Config**: dotenv for local, Azure Key Vault/AWS Secrets Manager for hosted deployments

### AI Assistant Capability Model
- **Persona Packs**: Student, Teacher, Super Admin, and Support personas with tailored prompt templates and guardrails.
- **Skills**: FAQ answering, policy lookup, timetable queries, fee breakdown, admissions onboarding guidance, and troubleshooting checklists.
- **Grounding Data**: Combines RAG pipelines over documentation (policies, schedules, knowledge base articles) with live API lookups for marks, attendance, and fee ledgers.
- **Channels**: Embedded chat widget in dashboard (vanilla JS), teacher/admin portals, and optional WhatsApp/MS Teams connectors.
- **Observability**: Conversation analytics, safety event logs, CSAT capture, and feedback loops feeding prompt tuning backlog.
- **Governance**: Content moderation, personally identifiable information (PII) scrubbing, consent banners, and opt-out logging for each user.

---

## 👥 User Roles & Access Levels

### 1. **Student**
- View personal profile with automated data sync from admissions
- View marks/grades and AI-assisted performance insights
- Monitor attendance with anomaly alerts pushed via email/SMS
- View assigned subjects, timetable, and auto-generated study plans
- Update personal information (limited, workflow-routed for approval)
- Download digitally signed reports, admit cards, and fee receipts
- Receive omni-channel announcements (in-app, email, push)
- Access contextual AI study assistant for schedule, assignment, and policy queries with live data grounding

### 2. **Teacher**
- View assigned classes/subjects with capacity/utilization indicators
- Mark attendance (manual, RFID import, or bulk CSV automation)
- Enter/update marks with rubric templates and Excel ingestion
- View student lists enriched with risk scores and escalations
- Generate reports with one-click PDF/email automation
- Manage assignments with plagiarism flags and auto-deadline reminders
- Post announcements and schedule drip communications
- Use AI co-pilot to draft announcements, rubrics, and personalized feedback summaries

### 3. **Super Admin**
- Complete system access with approval workflows & dual-control actions
- Manage omni-channel notifications and automated drip campaigns
- Annual mass student admission (bulk import, OCR pipeline)
- Single student admission/registration with e-sign approvals
- Grant/revoke user roles, RBAC policies, and fine-grained scopes
- Register new users and auto-provision credentials + welcome packs
- Teacher management lifecycle (hire, verify doc, assign, exit)
- Student management (enroll, promote, transfer, alumni transition)
- Subject & curriculum lifecycle with versioning and audit
- Class/Section orchestration with auto-capacity balancing
- Academic calendar automation with blackout windows
- System configuration, feature flags, and regional settings
- Advanced analytics with drill-down dashboards & alerting
- Database backup/restore orchestration with air-gap storage
- Audit logs, anomaly detection, and tamper proofing
- Exam schedule automation, seat allocation, and digital hall tickets
- AI operations co-pilot for analytics insights, anomaly detection, and workflow recommendations

---

## 🗄️ Database Schema Design

### MongoDB Collections

#### 1. **users** (Authentication)
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  role: String (enum: ['student', 'teacher', 'superadmin']),
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **students**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'users'),
  studentId: String (unique),
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  gender: String,
  bloodGroup: String,
  phone: String,
  email: String,
  addressId: ObjectId (ref: 'addresses'),
  guardianName: String,
  guardianPhone: String,
  guardianEmail: String,
  classId: ObjectId (ref: 'classes'),
  section: String,
  admissionDate: Date,
  profilePicture: String,
  status: String (enum: ['active', 'inactive', 'graduated']),
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. **teachers**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'users'),
  teacherId: String (unique),
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  gender: String,
  phone: String,
  email: String,
  addressId: ObjectId (ref: 'addresses'),
  qualification: String,
  experience: Number,
  joiningDate: Date,
  subjects: [ObjectId] (ref: 'subjects'),
  classes: [ObjectId] (ref: 'classes'),
  salary: Number,
  profilePicture: String,
  status: String (enum: ['active', 'inactive', 'onleave']),
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. **superadmins**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'users'),
  adminId: String (unique),
  firstName: String,
  lastName: String,
  phone: String,
  email: String,
  designation: String,
  profilePicture: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. **addresses**
```javascript
{
  _id: ObjectId,
  street: String,
  city: String,
  state: String,
  country: String,
  zipCode: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. **subjects**
```javascript
{
  _id: ObjectId,
  subjectCode: String (unique),
  subjectName: String,
  description: String,
  credits: Number,
  teacherId: ObjectId (ref: 'teachers'),
  classId: ObjectId (ref: 'classes'),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### 7. **classes**
```javascript
{
  _id: ObjectId,
  className: String,
  classCode: String (unique),
  section: String,
  academicYear: String,
  classTeacherId: ObjectId (ref: 'teachers'),
  capacity: Number,
  subjects: [ObjectId] (ref: 'subjects'),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### 8. **marks**
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (ref: 'students'),
  subjectId: ObjectId (ref: 'subjects'),
  classId: ObjectId (ref: 'classes'),
  examType: String (enum: ['midterm', 'final', 'assignment', 'quiz']),
  examName: String,
  maxMarks: Number,
  obtainedMarks: Number,
  percentage: Number,
  grade: String,
  remarks: String,
  enteredBy: ObjectId (ref: 'teachers'),
  examDate: Date,
  academicYear: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 9. **attendance**
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (ref: 'students'),
  classId: ObjectId (ref: 'classes'),
  subjectId: ObjectId (ref: 'subjects'),
  date: Date,
  status: String (enum: ['present', 'absent', 'late', 'excused']),
  remarks: String,
  markedBy: ObjectId (ref: 'teachers'),
  academicYear: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 10. **announcements**
```javascript
{
  _id: ObjectId,
  title: String,
  content: String,
  targetAudience: [String] (enum: ['all', 'students', 'teachers', 'guardians']),
  deliveryChannels: [String] (enum: ['in-app', 'email', 'sms', 'push']),
  createdBy: ObjectId (ref: 'users'),
  priority: String (enum: ['low', 'medium', 'high', 'critical']),
  attachments: [ObjectId] (ref: 'documents'),
  scheduleAt: Date,
  isActive: Boolean,
  expiryDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 11. **timetable**
```javascript
{
  _id: ObjectId,
  classId: ObjectId (ref: 'classes'),
  subjectId: ObjectId (ref: 'subjects'),
  teacherId: ObjectId (ref: 'teachers'),
  dayOfWeek: String (enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  startTime: String,
  endTime: String,
  room: String,
  academicYear: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 12. **automationJobs**
```javascript
{
  _id: ObjectId,
  key: String (unique),
  type: String (enum: ['cron', 'event', 'manual']),
  payload: Object,
  status: String (enum: ['scheduled', 'running', 'success', 'failed']),
  retries: Number,
  lastRunAt: Date,
  nextRunAt: Date,
  handler: String,
  createdBy: ObjectId (ref: 'users'),
  createdAt: Date,
  updatedAt: Date
}
```

#### 13. **fees**
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (ref: 'students'),
  academicYear: String,
  feeType: String (enum: ['tuition', 'transport', 'hostel', 'exam']),
  amountDue: Number,
  amountPaid: Number,
  dueDate: Date,
  status: String (enum: ['pending', 'partial', 'paid', 'overdue']),
  invoiceNumber: String,
  paymentPlanId: ObjectId (ref: 'paymentPlans'),
  automatedReminderCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### 14. **payments**
```javascript
{
  _id: ObjectId,
  feeId: ObjectId (ref: 'fees'),
  transactionId: String,
  gateway: String,
  amount: Number,
  currency: String,
  paidAt: Date,
  status: String (enum: ['initiated', 'success', 'failed', 'refunded']),
  receiptUrl: String,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

#### 15. **paymentPlans**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  frequency: String (enum: ['monthly', 'quarterly', 'annually']),
  amount: Number,
  discountPercent: Number,
  autoDebit: Boolean,
  gracePeriodDays: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### 16. **notifications**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'users'),
  channel: String,
  templateKey: String,
  payload: Object,
  deliveryStatus: String (enum: ['pending', 'sent', 'failed']),
  sentAt: Date,
  error: String,
  correlationId: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 17. **workflowRuns**
```javascript
{
  _id: ObjectId,
  workflowKey: String,
  entityType: String,
  entityId: ObjectId,
  steps: [
    {
      name: String,
      status: String,
      actorId: ObjectId,
      startedAt: Date,
      completedAt: Date,
      metadata: Object
    }
  ],
  status: String (enum: ['pending', 'in_progress', 'approved', 'rejected']),
  slaBreached: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### 18. **auditLogs**
```javascript
{
  _id: ObjectId,
  actorId: ObjectId (ref: 'users'),
  action: String,
  entityType: String,
  entityId: ObjectId,
  before: Object,
  after: Object,
  ipAddress: String,
  userAgent: String,
  correlationId: String,
  createdAt: Date
}
```

#### 19. **knowledgeBases**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  audiences: [String],
  vectorIndex: String,
  status: String (enum: ['draft', 'active', 'archived']),
  lastSyncedAt: Date,
  createdBy: ObjectId (ref: 'users'),
  createdAt: Date,
  updatedAt: Date
}
```

#### 20. **knowledgeBaseDocuments**
```javascript
{
  _id: ObjectId,
  knowledgeBaseId: ObjectId (ref: 'knowledgeBases'),
  sourceType: String (enum: ['policy', 'faq', 'timetable', 'announcement', 'file']),
  title: String,
  content: String,
  embedding: [Number],
  metadata: Object,
  version: Number,
  checksum: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 21. **chatSessions**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'users'),
  persona: String,
  channel: String,
  startedAt: Date,
  lastInteractionAt: Date,
  tokenUsage: Number,
  satisfactionScore: Number,
  isEscalated: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### 22. **chatMessages**
```javascript
{
  _id: ObjectId,
  sessionId: ObjectId (ref: 'chatSessions'),
  role: String (enum: ['user', 'assistant', 'system']),
  content: String,
  citations: [Object],
  groundingSources: [ObjectId] (ref: 'knowledgeBaseDocuments'),
  latencyMs: Number,
  safetyStatus: String (enum: ['clean', 'flagged', 'blocked']),
  createdAt: Date
}
```

#### 23. **aiPolicies**
```javascript
{
  _id: ObjectId,
  key: String,
  description: String,
  prompts: {
    system: String,
    fallback: String
  },
  guardrails: Object,
  complianceTags: [String],
  version: Number,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📁 Project Structure

```
education-center-scms/
├── backend/
│   ├── config/
│   │   ├── database.ts
│   │   ├── email.ts
│   │   ├── redis.ts
│   │   └── jwt.ts
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   ├── emailService.ts
│   │   ├── pdfService.ts
│   │   ├── workflowService.ts
│   │   └── analyticsService.ts
│   ├── jobs/
│   │   ├── cron/
│   │   └── queueHandlers/
│   ├── utils/
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── server.ts
│   └── package.json
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   ├── components/ (web components, partials)
│   ├── layouts/
│   ├── pages/
│   │   ├── student/
│   │   ├── teacher/
│   │   ├── admin/
│   │   └── public/
│   ├── vite.config.js
│   └── package.json
├── shared/
│   ├── dto/
│   ├── constants/
│   └── typings/
├── automation/
│   ├── terraform/
│   ├── github-actions/
│   └── scripts/
├── docs/
│   ├── api/
│   └── architecture/
├── scripts/
│   ├── seed/
│   └── maintenance/
├── uploads/
│   ├── profiles/
│   └── documents/
├── tests/
│   ├── e2e/
│   └── performance/
├── README.md
└── .gitignore
```

---

## 🔐 API Endpoints

### Authentication Routes (`/api/auth`)
```
POST   /register          - Register new user
POST   /login             - Login user
POST   /logout            - Logout user
POST   /forgot-password   - Send password reset email
POST   /reset-password    - Reset password
GET    /verify-token      - Verify JWT token
```

### Student Routes (`/api/students`)
```
GET    /                  - Get all students (Admin/Teacher)
GET    /:id               - Get student by ID
POST   /                  - Create new student (Admin)
PUT    /:id               - Update student (Admin/Student-self)
DELETE /:id               - Delete student (Admin)
GET    /:id/marks         - Get student marks
GET    /:id/attendance    - Get student attendance
GET    /:id/subjects      - Get student subjects
GET    /:id/report        - Generate student report
```

### Teacher Routes (`/api/teachers`)
```
GET    /                  - Get all teachers (Admin)
GET    /:id               - Get teacher by ID
POST   /                  - Create new teacher (Admin)
PUT    /:id               - Update teacher (Admin/Teacher-self)
DELETE /:id               - Delete teacher (Admin)
GET    /:id/classes       - Get teacher's classes
GET    /:id/subjects      - Get teacher's subjects
GET    /:id/students      - Get teacher's students
```

### Admin Routes (`/api/admin`)
```
GET    /dashboard              - Get dashboard statistics
GET    /users                  - Get all users
PUT    /users/:id/status       - Update user status (activate/deactivate)
PUT    /users/:id/role         - Grant/revoke user roles
DELETE /users/:id              - Delete user
GET    /analytics              - Get system analytics
POST   /students/bulk-admit    - Mass student admission (CSV/Excel)
POST   /students/single-admit  - Single student admission
POST   /backup                 - Create system backup
POST   /restore                - Restore from backup
GET    /audit-logs             - Get system audit logs
GET    /notifications          - Get system-wide notifications
POST   /notifications          - Create system notification
```

### Marks Routes (`/api/marks`)
```
GET    /                  - Get all marks (filtered by role)
GET    /:id               - Get marks by ID
POST   /                  - Create new marks entry (Teacher)
PUT    /:id               - Update marks (Teacher)
DELETE /:id               - Delete marks (Admin)
GET    /student/:id       - Get marks for specific student
GET    /subject/:id       - Get marks for specific subject
```

### Attendance Routes (`/api/attendance`)
```
GET    /                  - Get all attendance (filtered)
GET    /:id               - Get attendance by ID
POST   /                  - Mark attendance (Teacher)
PUT    /:id               - Update attendance (Teacher)
DELETE /:id               - Delete attendance (Admin)
GET    /student/:id       - Get attendance for student
GET    /class/:id         - Get attendance for class
GET    /date/:date        - Get attendance by date
```

### Subject Routes (`/api/subjects`)
```
GET    /                  - Get all subjects
GET    /:id               - Get subject by ID
POST   /                  - Create subject (Admin)
PUT    /:id               - Update subject (Admin)
DELETE /:id               - Delete subject (Admin)
```

### Announcement Routes (`/api/announcements`)
```
GET    /                  - Get all announcements
GET    /:id               - Get announcement by ID
POST   /                  - Create announcement (Admin/Teacher)
PUT    /:id               - Update announcement
DELETE /:id               - Delete announcement
```

### Fee Routes (`/api/fees`)
```
GET    /                  - List fee ledgers with filters & pagination
GET    /:id               - Retrieve fee record
POST   /                  - Create fee schedule (Admin)
PUT    /:id               - Update fee (Admin)
DELETE /:id               - Archive fee record
POST   /:id/remind        - Trigger automated reminder workflow
```

### Payment Routes (`/api/payments`)
```
POST   /initiate          - Begin payment via preferred gateway
POST   /webhook/:gateway  - Handle gateway callbacks
GET    /:transactionId    - Retrieve payment status
POST   /:transactionId/refund - Initiate refund (Admin)
```

### Workflow Routes (`/api/workflows`)
```
GET    /definitions       - List workflow templates
POST   /definitions       - Create/Update workflow definition
POST   /runs              - Start a workflow instance
GET    /runs/:id          - View workflow state
POST   /runs/:id/approve  - Approve current step
POST   /runs/:id/reject   - Reject current step
```

### Notification Routes (`/api/notifications`)
```
GET    /templates         - Retrieve message templates
POST   /templates         - Create/update template
POST   /send              - Queue notification (multi-channel)
GET    /logs              - Delivery logs with status filters
```

### Automation Routes (`/api/automation`)
```
GET    /jobs              - List scheduled/queue jobs
POST   /jobs              - Create job definition
POST   /jobs/:id/run      - Manually trigger job
PUT    /jobs/:id/pause    - Pause automation
PUT    /jobs/:id/resume   - Resume automation
```

### AI Assistant Routes (`/api/ai`)
```
POST   /chat                      - Start/continue chat session (student/teacher/admin personas)
GET    /chat/:sessionId           - Retrieve conversation history
POST   /chat/:sessionId/feedback  - Submit satisfaction rating or escalate to human support
POST   /grounding/query           - Perform RAG lookup with citations
POST   /moderation/check          - Run content through safety filters
```

### Knowledge Base Routes (`/api/knowledge-base`)
```
GET    /                           - List knowledge bases
POST   /                           - Create/update knowledge base configuration
POST   /:id/documents/import       - Ingest documents (PDF/CSV/HTML)
GET    /:id/documents              - Paginate documents with status filters
POST   /:id/reindex                - Trigger embedding regeneration job
```

---

## 🔒 Security Features

1. **Identity & Access Hardening**
  - bcrypt/argon2 hashing (min 12 salt rounds) with breached password screening
  - Passwordless/SSO readiness via SAML/OAuth2, optional MFA (email/SMS/app)
  - JWT access tokens (15m) + rotating refresh tokens (7d) stored in httpOnly, SameSite=strict cookies
  - Device fingerprinting and session revocation service

2. **Authorization & Governance**
  - ABAC/RBAC hybrid with policy decision service
  - Route protection middleware enforcing scopes + ownership validation
  - Dual-control approval for destructive operations (bulk deletion, fee refunds)
  - Feature flags to isolate risky rollouts

3. **Input & API Security**
  - Central validation schemas (Zod/express-validator)
  - Auto-sanitization (XSS, NoSQL injection), rate limiting, and bot protection (hCaptcha)
  - Payload signing for inbound webhooks, mTLS for system integrations

4. **Data Protection & Compliance**
  - Secrets in Azure Key Vault/AWS Secrets Manager + runtime rotation
  - Database encryption at rest, TLS 1.3 in transit, field-level encryption for PII
  - Automated backups + PITR, retention policies, GDPR-compliant data deletion workflows
  - Audit logging with immutability (WORM storage option)

5. **Operational Security**
  - Dependency & image scanning (Dependabot, Trivy)
  - Infrastructure drift detection (Terraform Cloud/Atlantis)
  - Continuous compliance checks against CIS benchmarks
  - Incident response runbooks + on-call rotation with PagerDuty/MS Teams hooks

6. **AI Safety & Privacy**
  - Prompt injection and data exfiltration filters, context allowlists, and semantic firewalls
  - Safety classifiers (harmful, biased, or policy-violating content) with auto-block + alerting
  - PII masking before sending context to external LLMs; regional data residency enforcement
  - Conversation transcripts stored with least-privilege access and configurable retention windows

---

## 📧 Email Functionality

### Email Types
1. **Welcome Email** - New user registration and account creation
2. **Password Reset** - Forgot password with secure token
3. **OTP Verification** - One-time password for secure authentication
4. **Attendance Alert** - Low attendance notification to students
5. **Report Card** - Marks summary and academic performance
6. **Admit Card** - Exam hall tickets and registration confirmation
7. **Registration Confirmation** - Class/semester enrollment confirmation
8. **Announcements** - Important system-wide updates
9. **Class Announcements** - Class-specific notifications
10. **Event Notifications** - Upcoming events, seminars, and activities
11. **Account Activation** - Email verification link
12. **Marks Notification** - Individual exam results published
13. **Fee Reminders** - Payment due notifications (future enhancement)
14. **Timetable Changes** - Schedule updates and modifications

### Nodemailer Configuration
```javascript
// Email Templates (backend/templates/emails/)
- welcome.html                    // New user welcome
- password-reset.html             // Password recovery
- otp.html                        // OTP verification
- attendance-alert.html           // Low attendance warning
- report-card.html                // Marks/grades report
- admit-card.html                 // Exam admit card
- registration-confirmation.html  // Class registration
- announcement.html               // General announcements
- class-announcement.html         // Class-specific notices
- event-notification.html         // Event reminders
- marks-notification.html         // Individual exam results
- account-activation.html         // Email verification
- timetable-update.html          // Schedule changes
```

---

## 🤖 Automation & Workflow Orchestration

- **Admission Pipelines**: OCR-based document ingestion, auto-verification queues, escalation to admins if SLAs breach.
- **Attendance Automation**: Optional RFID/biometric import, SMS/email alerts for anomalies, auto-sync to analytics.
- **Fee Reminders**: Multi-channel reminder ladders, auto-escalation to counselors, N+1 retry with configurable windows.
- **Academic Calendar**: Auto-generation of timetables, exam schedules, and room allocations with conflict detection.
- **Workflow Builder**: Low-code interface for configuring approval steps, SLA timers, and conditional routing without redeploying code.
- **Data Lifecycle Jobs**: Nightly ETL to analytics warehouse, archival of graduated student data, auto anonymization.

Automation workloads run on BullMQ queues backed by Redis with horizontal workers, plus cron services packaged as stateless containers.

---

## 🎨 Frontend Features

### Common Features
- Server-rendered HTML templates enhanced with vanilla JS + Alpine.js (explicitly no React usage)
- Responsive design (Mobile, Tablet, Desktop)
- Loading states and spinners
- Error handling and notifications
- Form validation (client-side)
- Dark/Light theme toggle (optional)
- Print functionality for reports
- Embedded AI chat widget with streaming responses and tool-trigger buttons

### Student Dashboard
- Personal information card
- Attendance summary (pie chart)
- Recent marks/grades
- Upcoming exams
- Announcements feed
- Timetable view

### Teacher Dashboard
- Assigned classes overview
- Quick attendance marking
- Recent marks entered
- Student performance analytics
- Class schedule
- Pending tasks

### Admin Dashboard
- Total students/teachers count
- Attendance statistics
- Performance analytics
- Recent activities
- System health
- Quick actions panel

---

## 🛠️ Infrastructure, Deployment & DevOps

- **Containerization**: Backend, frontend, and worker services dockerized with multi-stage builds (Node 20 + distroless runtime).
- **Orchestration**: Kubernetes (AKS/EKS) with HPA, PodDisruptionBudgets, and separate namespaces per environment.
- **CI/CD**: GitHub Actions pipelines covering lint/test/build, Docker buildx, SAST/DAST scans, infrastructure plan/apply, canary + blue/green promotion.
- **IaC**: Terraform modules for VNet, AKS, Cosmos/Mongo Atlas, Redis, Storage, Key Vault, CDN; policy-as-code enforced via Sentinel/Open Policy Agent.
- **Artifact Management**: Container registry (GHCR/ACR/ECR) with image signing (cosign) and retention policies.
- **Disaster Recovery**: Cross-region database replicas, automated failover scripts, RPO < 15m, RTO < 1h.
- **Change Management**: GitOps-style environment promotion with manual approval gates for production.

---

## 📈 Observability & Reliability

- **Metrics**: OpenTelemetry exporters to Prometheus; service-level indicators for latency, error rate, throughput.
- **LLM Telemetry**: Token usage, response latency, deflection rates, and safety flags streamed to analytics warehouse.
- **Tracing**: Distributed traces flowing into Jaeger/Tempo for investigation of cross-service workflows.
- **Logging**: Structured JSON logs (Winston) shipped to ELK/Loki with retention tiers and masking of PII.
- **Alerting**: Grafana alerts + PagerDuty notifications tied to SLAs (attendance sync, fee reminders, API availability).
- **Chaos & Resilience**: Weekly game days, pod/network disruption tests, circuit breakers, bulkheads, and retry/backoff strategies.

---

## 🤝 AI Assistant Experience

- **Chat Widget**: Lightweight vanilla JS widget embedded in dashboards with WebSocket streaming for low-latency responses.
- **Context Chain**: System prompts + persona layers + conversation memory + live data fetchers executed via LangChain-style tools.
- **Toolbox**: Attendance lookup, marks summary, fee breakdown, timetable fetcher, policy search, workflow trigger (e.g., create ticket).
- **Safety Stack**: Pre- and post-response moderation, PII redaction, explicit denial templates for disallowed requests, opt-out controls.
- **Feedback Loop**: Users rate responses; low scores automatically raise Jira/ServiceNow tasks and push transcripts to training backlog.
- **Analytics**: Dashboard covering session volume, deflection rate, CSAT, safety incidents, and frequently asked intents to inform content gaps.

---

## ✅ Quality Engineering & Test Automation

- **Static Analysis**: ESLint, TypeScript strict mode, stylelint, commit hooks via Husky.
- **Unit & Integration Tests**: Jest + supertest for APIs, Vitest for frontend modules, 80%+ coverage targets.
- **Contract Testing**: Pact tests between frontend and backend plus external payment/notification stubs.
- **E2E Testing**: Playwright-driven scenarios covering admissions, attendance, payments, and automation overrides.
- **Performance Testing**: k6/Gatling scripts validating 500 RPS sustained, autoscaling thresholds defined.
- **Accessibility Testing**: axe-core CI checks ensuring WCAG 2.1 AA compliance.
- **Release Readiness**: Automated QA dashboards summarizing coverage, open defects, and regression status per sprint.

---

## 🚀 Development Phases

### Phase 0: Foundation & Tooling (Week 0-1)
- [ ] Finalize requirements, personas, and KPIs
- [ ] Provision CI/CD pipelines, IaC scaffolding, secrets management
- [ ] Set up linting, formatting, commit hooks, shared DTO package

### Phase 1: Identity & Core Platform (Week 1-3)
- [ ] Database schemas + seed scripts
- [ ] Authentication/authorization services, SSO hooks, session management
- [ ] Global UI shell (vanilla JS + Alpine.js) and access control guards

### Phase 2: User & Academic Management (Week 3-6)
- [ ] Student/Teacher/Admin CRUD + workflow approvals
- [ ] Address, document management, profile automation
- [ ] Class/subject/timetable services with conflict detection

### Phase 3: Academic Operations (Week 6-8)
- [ ] Attendance automation (manual + bulk import + cron jobs)
- [ ] Marks & grading pipelines, report generation, analytics widgets
- [ ] Announcement + notification templates
- [ ] AI assistant MVP (chat widget, persona prompts, basic RAG on policies)

### Phase 4: Finance & Advanced ERP (Week 8-10)
- [ ] Fee schedules, payment integrations, reminder automation
- [ ] Workflow builder MVP, audit logging, analytics dashboards
- [ ] Email/SMS orchestration, PDF/excel export automation
- [ ] AI assistant tool integrations (fee lookup, workflow triggers, escalation path)

### Phase 5: Quality, Security & Observability (Week 10-11)
- [ ] Automated tests (unit, integration, E2E) + coverage gates
- [ ] Performance tuning, chaos drills, failover validation
- [ ] Security hardening, compliance review, data retention policies
- [ ] AI red-teaming, guardrail validation, bias & hallucination testing

### Phase 6: Launch & Hypercare (Week 11-12)
- [ ] Blue/green deployment, smoke tests, synthetics
- [ ] Production monitoring dashboards + alert tuning
- [ ] Hypercare support playbooks, knowledge transfer, backlog grooming

---

## 📊 Key Features Summary

### For Students
✅ View personal dashboard
✅ Check marks/grades
✅ Monitor attendance
✅ View timetable
✅ Download reports
✅ Update profile

### For Teachers
✅ Mark attendance
✅ Enter/update marks
✅ View student lists
✅ Generate class reports
✅ Manage subjects
✅ Post announcements

### For Super Admin
✅ Complete user management
✅ Mass student admission (bulk import)
✅ Single student admission
✅ Grant/revoke user roles
✅ System-wide notifications
✅ Advanced analytics and reports
✅ Configuration management
✅ Database backup/restore
✅ Audit logs and activity monitoring
✅ Academic year management
✅ Exam schedule management

---

## 🛠️ Required NPM Packages

```json
{
  "dependencies": {
    "express": "^5.0.0",
    "mongoose": "^8.0.0",
    "bcrypt": "^5.1.1",
    "argon2": "^0.31.2",
    "jsonwebtoken": "^9.0.2",
    "nodemailer": "^6.9.5",
    "dotenv": "^16.3.1",
    "express-validator": "^7.0.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0",
    "multer": "^1.4.5-lts.1",
    "pdfkit": "^0.13.0",
    "luxon": "^3.4.4",
    "cookie-parser": "^1.4.6",
    "redis": "^4.6.7",
    "bullmq": "^4.12.2",
    "socket.io": "^4.7.5",
    "winston": "^3.11.0",
    "pino": "^9.0.0",
    "openapi-types": "^12.1.3",
    "swagger-ui-express": "^5.0.0",
    "@opentelemetry/api": "^1.9.0",
    "@opentelemetry/sdk-node": "^0.53.0",
    "zod": "^3.22.4",
    "alpinejs": "^3.14.1",
    "langchain": "^0.2.0",
    "openai": "^4.20.0",
    "@azure/openai": "^1.0.0",
    "huggingface-hub": "^0.19.0",
    "@pinecone-database/pinecone": "^3.0.0",
    "ai": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.1",
    "eslint": "^9.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "prettier": "^3.1.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0",
    "jest": "^30.0.0",
    "supertest": "^7.0.0",
    "vitest": "^1.2.0",
    "playwright": "^1.40.0",
    "k6": "^0.49.0"
  }
}
```

---

## 🌐 Environment Variables (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/scms
DB_NAME=scms_database

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@scms.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# AI Services
AI_PROVIDER=azure-openai
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
AZURE_OPENAI_API_KEY=your_azure_openai_key
OPENAI_GUARDRAIL_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-large
VECTOR_DB_INDEX=scms-knowledge
AI_SAFETY_WEBHOOK=https://hooks.scms.com/ai-alerts
```

---

## 📐 Non-Functional Requirements

- **Performance**: P95 API latency < 400ms, dashboard paint < 2.5s on 3G, background jobs complete within SLA windows.
- **Scalability**: Horizontal scaling to 200k students, 10k concurrent teacher ops, autoscaling policies defined per workload.
- **Availability**: 99.9% uptime baseline, zero data loss objective via multi-region replicas and queued writes.
- **Reliability**: Idempotent APIs, saga-based compensation for multi-step workflows, retry/backoff with dead-letter queues.
- **Compliance**: GDPR, FERPA-friendly data handling, configurable data retention + right-to-be-forgotten automation.
- **Maintainability**: Modular codebase, shared DTO packages, automated documentation generation (OpenAPI + Storybook-like UI catalog).
- **Observability SLOs**: Error budget tracking, on-call response < 10m, MTTR < 45m.
- **AI Assistant KPIs**: ≥ 85% self-service deflection, CSAT > 4.4/5, hallucination rate < 1%, safety incident MTTR < 30m.

---

## 📝 Notes & Best Practices

1. **Code Organization**
  - Follow modular MVC with domain-driven folders + shared DTOs
  - Enforce TypeScript strictness, async/await, and centralized error handling
  - Isolate automation handlers (queues/cron) from request lifecycle
  - Document APIs via OpenAPI + publish auto-generated docs

2. **Database**
  - Use compound indexes + TTL indexes for logs/notifications
  - Enforce schema validation via Mongoose + JSON schema for queues
  - Automate backups (daily full + hourly incremental) and verify restore monthly
  - Utilize aggregation pipelines/materialized views for dashboards

3. **Security**
  - Never commit .env; use secret managers per environment
  - Sanitize inputs, apply allowlists, and store PII encrypted
  - Run dependency/image scans per pipeline, respond to alerts promptly
  - Schedule penetration testing + tabletop exercises each release

4. **Performance**
   - Implement pagination
   - Use caching where appropriate
   - Optimize database queries
   - Compress responses
   - Lazy load images

5. **Automation & Ops**
  - Keep workflow definitions declarative (YAML/JSON) for quick iteration
  - Tag every job with correlation IDs for traceability
  - Build runbooks for auto-remediation tasks triggered via webhooks

6. **Documentation & Enablement**
  - Maintain living architecture diagrams (C4) and ADRs
  - Provide onboarding playbooks and sandbox datasets for testers

5. **Testing**
   - Unit tests for models
   - Integration tests for APIs
   - E2E tests for critical flows
   - Load testing

7. **AI Operations**
  - Version prompts and knowledge sources in Git; require review before promotion
  - Capture every AI response with citations and safety metadata for auditing
  - Establish data minimization policies for context windows; scrub sensitive payloads
  - Periodically retrain embeddings and evaluate accuracy with curated test suites

---

## 📚 Additional Features (Future Enhancements)

- [ ] SMS notifications
- [ ] Mobile app (React Native/Flutter)
- [ ] Online examination system
- [ ] Library management
- [ ] Fee management
- [ ] Hostel management
- [ ] Transport management
- [ ] Parent portal
- [ ] Alumni management
- [ ] Certificate generation
- [ ] Video conferencing integration
- [ ] Assignment submission
- [ ] Discussion forum
- [ ] Event calendar
- [ ] Grievance management

---

## 🎯 Success Metrics

- User login time < 2 seconds
- API P95 response time < 400ms, websocket events < 200ms
- Automated workflows cover ≥ 90% of admissions/fees/attendance paths
- 99.9% uptime with zero data loss during failover drills
- Deployment pipeline success rate > 95% with <30m mean lead time
- Zero critical security vulnerabilities + quarterly pen tests closed < 2 weeks
- User satisfaction score > 4.5/5, support tickets auto-acknowledged < 1m
- AI assistant deflection rate ≥ 85%, hallucination incidents < 1 per 10k interactions, 100% responses cite data sources

---

**Project Timeline**: 10-12 weeks
**Team Size Recommended**: 2-3 developers
**Budget**: Variable based on hosting and team

---

*Last Updated: December 1, 2025*
