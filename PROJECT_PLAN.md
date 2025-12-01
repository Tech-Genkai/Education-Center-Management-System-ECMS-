# Student Management System + ERP - Project Plan

## 🎯 Project Overview
A comprehensive web-based Student Management System with ERP capabilities featuring role-based access control for Students, Teachers, and Super Admins.

---

## 🏗️ System Architecture

### Technology Stack
- **Frontend**: HTML5, CSS3, Bootstrap/Tailwind CSS, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Email Service**: SMTP with Nodemailer
- **Authentication**: JWT (JSON Web Tokens)
- **Additional Libraries**: 
  - Mongoose (MongoDB ODM)
  - bcrypt (Password hashing)
  - express-validator (Input validation)
  - dotenv (Environment variables)
  - multer (File uploads)
  - pdfkit (PDF generation)

---

## 👥 User Roles & Access Levels

### 1. **Student**
- View personal profile
- View marks/grades
- View attendance records
- View assigned subjects
- Update personal information (limited)
- Download reports
- View announcements

### 2. **Teacher**
- View assigned classes/subjects
- Mark attendance
- Enter/update student marks
- View student lists
- Generate reports
- Manage assignments
- Post announcements

### 3. **Super Admin**
- Complete system access
- Manage system-wide notifications
- Annual mass student admission (bulk import)
- Single student admission/registration
- Grant/revoke user roles and permissions
- Register new users (students/teachers/admins)
- User management (CRUD operations)
- Teacher management (hire, assign, remove)
- Student management (enroll, promote, transfer)
- Subject management (create, assign, archive)
- Class/Section management (organize, restructure)
- Academic year management
- System configuration and settings
- Advanced analytics and reports
- Database backup and restore
- Audit logs and activity monitoring
- Manage exam schedules and types

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
  targetAudience: [String] (enum: ['all', 'students', 'teachers']),
  createdBy: ObjectId (ref: 'users'),
  priority: String (enum: ['low', 'medium', 'high']),
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
  dayOfWeek: String (enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  startTime: String,
  endTime: String,
  room: String,
  academicYear: String,
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
│   │   ├── database.js
│   │   ├── email.js
│   │   └── jwt.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── teacherController.js
│   │   ├── adminController.js
│   │   ├── marksController.js
│   │   ├── attendanceController.js
│   │   ├── subjectController.js
│   │   └── announcementController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── validationMiddleware.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   ├── SuperAdmin.js
│   │   ├── Address.js
│   │   ├── Subject.js
│   │   ├── Class.js
│   │   ├── Marks.js
│   │   ├── Attendance.js
│   │   ├── Announcement.js
│   │   └── Timetable.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── teacherRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── marksRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── subjectRoutes.js
│   │   └── announcementRoutes.js
│   ├── services/
│   │   ├── emailService.js
│   │   ├── pdfService.js
│   │   └── reportService.js
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   └── constants.js
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── style.css
│   │   │   ├── dashboard.css
│   │   │   └── responsive.css
│   │   ├── js/
│   │   │   ├── app.js
│   │   │   ├── auth.js
│   │   │   ├── student.js
│   │   │   ├── teacher.js
│   │   │   ├── admin.js
│   │   │   └── utils.js
│   │   └── images/
│   ├── pages/
│   │   ├── index.html (Login)
│   │   ├── student/
│   │   │   ├── dashboard.html
│   │   │   ├── profile.html
│   │   │   ├── marks.html
│   │   │   ├── attendance.html
│   │   │   └── timetable.html
│   │   ├── teacher/
│   │   │   ├── dashboard.html
│   │   │   ├── profile.html
│   │   │   ├── mark-attendance.html
│   │   │   ├── enter-marks.html
│   │   │   ├── student-list.html
│   │   │   └── reports.html
│   │   └── admin/
│   │       ├── dashboard.html
│   │       ├── manage-students.html
│   │       ├── manage-teachers.html
│   │       ├── manage-subjects.html
│   │       ├── manage-classes.html
│   │       ├── reports.html
│   │       └── settings.html
│   └── components/
│       ├── navbar.html
│       ├── sidebar.html
│       └── footer.html
├── uploads/
│   ├── profiles/
│   └── documents/
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

---

## 🔒 Security Features

1. **Password Security**
   - bcrypt hashing (min 10 salt rounds)
   - Password strength validation
   - Password reset via email

2. **Authentication**
   - JWT-based authentication
   - Token expiration (15min access, 7d refresh)
   - Secure httpOnly cookies

3. **Authorization**
   - Role-based access control (RBAC)
   - Route protection middleware
   - Resource ownership verification

4. **Input Validation**
   - Express-validator for all inputs
   - XSS protection
   - SQL injection prevention (NoSQL)
   - Rate limiting on sensitive routes

5. **Data Protection**
   - Environment variables for secrets
   - CORS configuration
   - Helmet.js for HTTP headers
   - MongoDB connection encryption

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

## 🎨 Frontend Features

### Common Features
- Responsive design (Mobile, Tablet, Desktop)
- Loading states and spinners
- Error handling and notifications
- Form validation (client-side)
- Dark/Light theme toggle (optional)
- Print functionality for reports

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

## 🚀 Development Phases

### Phase 1: Setup & Authentication (Week 1-2)
- [ ] Project initialization
- [ ] Database setup and connection
- [ ] User model and authentication
- [ ] Login/Register pages
- [ ] JWT implementation
- [ ] Password reset functionality

### Phase 2: User Management (Week 3-4)
- [ ] Student CRUD operations
- [ ] Teacher CRUD operations
- [ ] Admin panel setup
- [ ] Profile management
- [ ] Address management
- [ ] File upload for profiles

### Phase 3: Core Features (Week 5-7)
- [ ] Subject management
- [ ] Class management
- [ ] Marks entry and viewing
- [ ] Attendance marking system
- [ ] Timetable management
- [ ] Dashboard implementations

### Phase 4: Advanced Features (Week 8-9)
- [ ] Report generation
- [ ] Email notifications
- [ ] Announcement system
- [ ] Search and filter functionality
- [ ] Analytics and charts
- [ ] Export to PDF/Excel

### Phase 5: Testing & Deployment (Week 10-12)
- [ ] Unit testing
- [ ] Integration testing
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Deployment setup

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
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "nodemailer": "^6.9.5",
    "dotenv": "^16.3.1",
    "express-validator": "^7.0.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0",
    "multer": "^1.4.5-lts.1",
    "pdfkit": "^0.13.0",
    "moment": "^2.29.4",
    "express-session": "^1.17.3",
    "cookie-parser": "^1.4.6"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
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
```

---

## 📝 Notes & Best Practices

1. **Code Organization**
   - Follow MVC pattern
   - Use async/await for async operations
   - Implement proper error handling
   - Write reusable middleware

2. **Database**
   - Use indexes for frequently queried fields
   - Implement data validation at schema level
   - Regular backups
   - Use aggregation for complex queries

3. **Security**
   - Never commit .env file
   - Sanitize all user inputs
   - Use prepared statements
   - Implement rate limiting
   - Regular security audits

4. **Performance**
   - Implement pagination
   - Use caching where appropriate
   - Optimize database queries
   - Compress responses
   - Lazy load images

5. **Testing**
   - Unit tests for models
   - Integration tests for APIs
   - E2E tests for critical flows
   - Load testing

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
- API response time < 500ms
- 99.9% uptime
- Mobile responsive (100% pages)
- Zero critical security vulnerabilities
- User satisfaction score > 4.5/5

---

**Project Timeline**: 10-12 weeks
**Team Size Recommended**: 2-3 developers
**Budget**: Variable based on hosting and team

---

*Last Updated: December 1, 2025*
