import { Router, type Request, type Response } from 'express';
import { requireAuth, requireRole } from '../middleware/session.ts';
import { SuperAdmin } from '../models/SuperAdmin.ts';
import { User } from '../models/User.ts';
import { Student } from '../models/Student.ts';
import { Teacher } from '../models/Teacher.ts';

const router = Router();

// Home page - redirect based on auth status
router.get('/', (req: Request, res: Response) => {
  if (req.session.userId) {
    const role = req.session.role === 'superadmin' ? 'admin' : req.session.role;
    return res.redirect(`/${role}/dashboard`);
  }
  res.redirect('/login');
});

// Test error pages (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/test-404', (req: Request, res: Response) => {
    res.status(404).render('errors/404', { title: 'Test 404 Page', url: req.url });
  });

  router.get('/test-401', (req: Request, res: Response) => {
    res.status(401).render('errors/401', {
      title: 'Test 401 Page',
      message: 'Authentication required for this test page'
    });
  });

  router.get('/test-403', (req: Request, res: Response) => {
    res.status(403).render('errors/403', {
      title: 'Test 403 Page',
      message: 'You do not have permission to access this test resource'
    });
  });

  router.get('/test-500', (req: Request, res: Response) => {
    res.status(500).render('errors/500', {
      title: 'Test 500 Page',
      message: 'This is a test server error',
      error: { stack: 'Test error stack trace...' }
    });
  });

  router.get('/test-error-throw', (req: Request, res: Response, next: any) => {
    // Trigger actual error handler
    const error: any = new Error('Test error thrown!');
    error.status = 500;
    next(error);
  });
}

// Student Dashboard
router.get('/student/dashboard', requireAuth, requireRole('student'), async (req: Request, res: Response) => {
  try {
    // Mock data - replace with actual database queries
    const dashboardData = {
      user: {
        name: req.session.email?.split('@')[0] || 'Student',
      },
      stats: {
        totalClasses: 6,
        attendance: 92,
        pendingAssignments: 4,
        averageGrade: 85
      },
      assignments: [
        { title: 'Mathematics Quiz', subject: 'Mathematics', dueDate: 'Dec 25, 2024', priority: 'High', priorityColor: 'red' },
        { title: 'Science Lab Report', subject: 'Science', dueDate: 'Dec 28, 2024', priority: 'Medium', priorityColor: 'yellow' },
        { title: 'English Essay', subject: 'English', dueDate: 'Jan 2, 2025', priority: 'Low', priorityColor: 'green' }
      ],
      grades: [
        { subject: 'Mathematics', assessment: 'Mid-term Exam', grade: 88, status: 'Graded', gradeColor: 'green', statusColor: 'green' },
        { subject: 'Science', assessment: 'Lab Report', grade: 92, status: 'Graded', gradeColor: 'green', statusColor: 'green' },
        { subject: 'English', assessment: 'Essay', grade: 78, status: 'Graded', gradeColor: 'yellow', statusColor: 'green' }
      ],
      schedule: [
        { subject: 'Mathematics', time: '9:00 AM - 10:00 AM', room: 'Room 101', color: 'blue' },
        { subject: 'Science', time: '10:15 AM - 11:15 AM', room: 'Lab 2', color: 'green' },
        { subject: 'English', time: '11:30 AM - 12:30 PM', room: 'Room 205', color: 'purple' },
        { subject: 'History', time: '1:30 PM - 2:30 PM', room: 'Room 303', color: 'yellow' }
      ],
      announcements: [
        { title: 'Exam Schedule Released', date: 'Dec 20, 2024', color: 'blue' },
        { title: 'Holiday Notice', date: 'Dec 22, 2024', color: 'green' }
      ]
    };

    res.render('student/dashboard', { title: 'Student Dashboard', ...dashboardData });
  } catch (error) {
    console.error('Error loading student dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
});

// Teacher Dashboard
router.get('/teacher/dashboard', requireAuth, requireRole('teacher'), async (req: Request, res: Response) => {
  try {
    // Mock data - replace with actual database queries
    const dashboardData = {
      user: {
        name: req.session.email?.split('@')[0] || 'Teacher',
      },
      stats: {
        totalStudents: 156,
        activeClasses: 4,
        pendingSubmissions: 23,
        avgAttendance: 87
      },
      classes: [
        { name: 'Grade 10 - A', section: 'Section A', subject: 'Mathematics', students: 42, color: 'blue' },
        { name: 'Grade 10 - B', section: 'Section B', subject: 'Mathematics', students: 38, color: 'green' },
        { name: 'Grade 9 - A', section: 'Section A', subject: 'Algebra', students: 40, color: 'purple' },
        { name: 'Grade 11 - C', section: 'Section C', subject: 'Calculus', students: 36, color: 'yellow' }
      ],
      submissions: [
        { title: 'Chapter 5 Assignment', class: 'Grade 10-A', submitted: 38, total: 42, dueDate: 'Dec 24, 2024' },
        { title: 'Mid-term Project', class: 'Grade 10-B', submitted: 30, total: 38, dueDate: 'Dec 26, 2024' },
        { title: 'Practice Problems', class: 'Grade 9-A', submitted: 35, total: 40, dueDate: 'Dec 28, 2024' }
      ],
      schedule: [
        { subject: 'Mathematics', time: '9:00 AM - 10:00 AM', class: 'Grade 10-A', room: 'Room 101', color: 'blue' },
        { subject: 'Mathematics', time: '10:15 AM - 11:15 AM', class: 'Grade 10-B', room: 'Room 101', color: 'green' },
        { subject: 'Algebra', time: '11:30 AM - 12:30 PM', class: 'Grade 9-A', room: 'Room 105', color: 'purple' }
      ],
      topPerformers: [
        { name: 'John Smith', class: 'Grade 10-A', grade: 95, color: 'yellow' },
        { name: 'Sarah Johnson', class: 'Grade 10-B', grade: 93, color: 'gray' },
        { name: 'Mike Brown', class: 'Grade 9-A', grade: 91, color: 'orange' }
      ]
    };

    res.render('teacher/dashboard', { title: 'Teacher Dashboard', ...dashboardData });
  } catch (error) {
    console.error('Error loading teacher dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
});

// Admin Dashboard
router.get('/admin/dashboard', requireAuth, requireRole('superadmin'), async (req: Request, res: Response) => {
  try {
    // Fetch real SuperAdmin profile
    const adminProfile = await SuperAdmin.findOne({ userId: req.session.userId });
    
    // Fetch real statistics from database
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'active' });
    const totalTeachers = await Teacher.countDocuments();
    const activeTeachers = await Teacher.countDocuments({ status: 'active' });
    const totalUsers = await User.countDocuments();
    
    const dashboardData = {
      user: {
        name: adminProfile ? `${adminProfile.firstName} ${adminProfile.lastName}` : req.session.email?.split('@')[0] || 'Admin',
        designation: adminProfile?.designation || 'Administrator',
        department: adminProfile?.department || 'Administration',
        email: adminProfile?.email || req.session.email,
        lastLogin: adminProfile?.lastLoginAt ? new Date(adminProfile.lastLoginAt).toLocaleString() : 'N/A',
        accessLevel: adminProfile?.accessLevel || 'full',
        permissions: adminProfile?.permissions || []
      },
      stats: {
        totalStudents,
        studentGrowth: 12, // TODO: Calculate from historical data
        totalTeachers,
        activeTeachers,
        activeClasses: 32, // TODO: Calculate from Class model
        totalSections: 96, // TODO: Calculate from ClassSection model
        revenue: '125,430', // TODO: Calculate from Payment model
        revenueGrowth: 8 // TODO: Calculate from historical payment data
      },
      chartData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [950, 1020, 1080, 1150, 1210, 1250]
      },
      activities: [
        { icon: '👤', title: 'New Student Registered', description: 'John Doe enrolled in Grade 10', time: '5 minutes ago', color: 'blue' },
        { icon: '📚', title: 'Class Created', description: 'New section added for Grade 9', time: '1 hour ago', color: 'green' },
        { icon: '💰', title: 'Payment Received', description: 'Fee payment of $500 received', time: '2 hours ago', color: 'purple' },
        { icon: '👨‍🏫', title: 'Teacher Assigned', description: 'Sarah Wilson assigned to Grade 8-B', time: '3 hours ago', color: 'yellow' }
      ],
      users: [
        { name: 'John Doe', role: 'Student', status: 'Active', roleColor: 'blue', statusColor: 'green' },
        { name: 'Jane Smith', role: 'Teacher', status: 'Active', roleColor: 'green', statusColor: 'green' },
        { name: 'Mike Johnson', role: 'Student', status: 'Inactive', roleColor: 'blue', statusColor: 'gray' }
      ],
      quickStats: {
        avgAttendance: 88,
        passRate: 94,
        pendingFees: '12,500',
        newEnrollments: 24
      },
      systemHealth: [
        { name: 'Server Status', value: 98, color: 'green' },
        { name: 'Database', value: 95, color: 'green' },
        { name: 'Storage', value: 75, color: 'yellow' }
      ],
      notifications: [
        { title: 'System backup completed', time: '10 min ago', color: 'green' },
        { title: 'New update available', time: '1 hour ago', color: 'blue' },
        { title: 'Low storage warning', time: '2 hours ago', color: 'yellow' }
      ]
    };

    res.render('admin/dashboard', { title: 'Admin Dashboard', ...dashboardData });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
});

export default router;
