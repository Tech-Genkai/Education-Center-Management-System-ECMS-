import { Router, type Request, type Response } from 'express';
import { requireAuth, requireRole } from '../middleware/session.ts';
import { SuperAdmin } from '../models/SuperAdmin.ts';
import { User } from '../models/User.ts';
import { Student } from '../models/Student.ts';
import { Teacher } from '../models/Teacher.ts';
import { UserProfile } from '../models/UserProfile.ts';
import { Address } from '../models/Address.ts';

const formatDateDDMMYYYY = (value?: string | Date | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = date.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatAddress = (addr?: any) => {
  if (!addr) return '';
  const parts = [
    [addr.houseNo, addr.buildingName].filter(Boolean).join(' ').trim(),
    addr.street,
    addr.city,
    addr.district,
    addr.state,
    addr.country,
    addr.pinCode || addr.zipCode,
    addr.landmark ? `Landmark: ${addr.landmark}` : null
  ].filter(Boolean);
  return parts.join(', ');
};

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
    // Fetch student profile data
    const studentProfile = await Student.findOne({ userId: req.session.userId }).lean();
    let studentDisplayName = req.session.email?.split('@')[0] || 'Student';
    let studentEmail = req.session.email || '';
    let studentProfilePicture = '';
    let studentDetails: Record<string, unknown> = {};
    
    if (studentProfile) {
      if (studentProfile.firstName || studentProfile.lastName) {
        studentDisplayName = `${studentProfile.firstName || ''} ${studentProfile.lastName || ''}`.trim();
      }
      studentEmail = (studentProfile.email as string) || studentEmail;
      studentProfilePicture = (studentProfile.profilePicture as string) || '';
      studentDetails = {
        studentId: studentProfile.studentId,
        phone: studentProfile.phone,
        dateOfBirth: studentProfile.dateOfBirth ? formatDateDDMMYYYY(studentProfile.dateOfBirth as Date) : '',
        gender: studentProfile.gender,
        section: studentProfile.section,
        admissionDate: studentProfile.admissionDate ? formatDateDDMMYYYY(studentProfile.admissionDate as Date) : '',
        status: studentProfile.status,
      };
    }

    const dashboardData = {
      user: {
        _id: req.session.userId,
        name: studentDisplayName,
        firstName: (studentProfile?.firstName as string) || '',
        lastName: (studentProfile?.lastName as string) || '',
        email: studentEmail,
        profilePicture: studentProfilePicture || '/static/images/profile/default/avatar.png',
        ...studentDetails,
        rollNumber: (studentProfile?.rollNumber as string) || '',
        bloodGroup: (studentProfile?.bloodGroup as string) || '',
        guardianName: (studentProfile?.guardianName as string) || '',
        guardianPhone: (studentProfile?.guardianPhone as string) || '',
        courseName: '',  // TODO: Populate from Course model
        semester: '',    // TODO: Populate from Semester model
        className: '',   // TODO: Populate from Class model
        address: '',     // TODO: Populate from Address model
      },
      stats: {
        totalClasses: 0,
        attendance: 0,
        pendingAssignments: 0,
        averageGrade: 0
      },
      schedule: [],
      announcements: [],
      subjects: [],
      events: [],
      timetable: [],
      fees: { total: '0', paid: '0', pending: '0' },
      feeStructure: [],
      paymentHistory: [],
      leaveBalance: { total: 0, used: 0, available: 0, pending: 0 },
      leaveHistory: [],
      mentor: null,
      messages: []
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
    // Fetch teacher profile data
    const teacherProfile = await Teacher.findOne({ userId: req.session.userId }).lean();
    let teacherDisplayName = req.session.email?.split('@')[0] || 'Teacher';
    let teacherEmail = req.session.email || '';
    let teacherProfilePicture = '';
    
    if (teacherProfile) {
      if (teacherProfile.firstName || teacherProfile.lastName) {
        teacherDisplayName = `${teacherProfile.firstName || ''} ${teacherProfile.lastName || ''}`.trim();
      }
      teacherProfilePicture = teacherProfile.profilePicture || '';
    }

    const dashboardData = {
      user: {
        _id: req.session.userId,
        name: teacherDisplayName,
        firstName: teacherProfile?.firstName || '',
        lastName: teacherProfile?.lastName || '',
        email: teacherEmail,
        phone: teacherProfile?.phone || '',
        teacherId: teacherProfile?.teacherId || '',
        dateOfBirth: teacherProfile?.dateOfBirth ? formatDateDDMMYYYY(teacherProfile.dateOfBirth) : '',
        gender: teacherProfile?.gender || '',
        qualification: teacherProfile?.qualification || '',
        experience: teacherProfile?.experience || '',
        department: '',  // TODO: Populate from Department model
        designation: '', // TODO: Populate from designation
        joiningDate: '', // TODO: Populate
        address: '',     // TODO: Populate from Address model
        profilePicture: teacherProfilePicture || '/static/images/profile/default/avatar.png'
      },
      stats: {
        totalStudents: 0,
        activeClasses: 0,
        pendingSubmissions: 0,
        avgAttendance: 0
      },
      classes: [],
      subjects: [],
      assignments: [],
      submissions: [],
      recentlyGraded: [],
      schedule: [],
      topPerformers: [],
      attendanceHistory: [],
      timetable: []
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
    const userProfile = await UserProfile.findOne({ userId: req.session.userId });
    const addressId = adminProfile?.addressId || userProfile?.addressId;
    const addressDoc = addressId ? await Address.findById(addressId) : null;
    const userAccount = await User.findById(req.session.userId);
    
    console.log('🔍 Dashboard: Loading profile for userId:', req.session.userId);
    console.log('   User.profilePicture:', userAccount?.profilePicture);
    console.log('   UserProfile.profilePicture.url:', userProfile?.profilePicture?.url);
    console.log('   SuperAdmin.profilePicture:', adminProfile?.profilePicture);
    console.log('   SuperAdmin.adminId:', adminProfile?.adminId);
    
    // Fetch real statistics from database
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'active' });
    const totalTeachers = await Teacher.countDocuments();
    const activeTeachers = await Teacher.countDocuments({ status: 'active' });
    const totalAdmins = await SuperAdmin.countDocuments();
    const activeAdmins = await SuperAdmin.countDocuments({ status: 'active' });
    const totalUsers = await User.countDocuments();
    
    // Determine profile picture: prefer User model (most up-to-date), then UserProfile, then role-specific, then default
    const profilePictureUrl = userAccount?.profilePicture ||
                              userProfile?.profilePicture?.url || 
                              adminProfile?.profilePicture || 
                              '/static/images/profile/default/default-profile.png';
    
    console.log('   Final profilePictureUrl:', profilePictureUrl);
    
    const dashboardData = {
      user: {
        _id: req.session.userId,
        name: adminProfile ? `${adminProfile.firstName} ${adminProfile.lastName}` : req.session.email?.split('@')[0] || 'Admin',
        firstName: adminProfile?.firstName || '',
        lastName: adminProfile?.lastName || '',
        designation: adminProfile?.designation || 'Administrator',
        department: adminProfile?.department || 'Administration',
        email: userAccount?.email || req.session.email,
        phone: userAccount?.phone || '',
        dateOfBirth: formatDateDDMMYYYY(adminProfile?.dateOfBirth),
        gender: adminProfile?.gender || '',
        bloodGroup: userProfile?.bloodGroup || '',
        address: addressDoc ? formatAddress(addressDoc) : '',
        addressParts: addressDoc ? {
          houseNo: addressDoc.houseNo || '',
          buildingName: addressDoc.buildingName || '',
          street: addressDoc.street || '',
          city: addressDoc.city || '',
          district: addressDoc.district || '',
          state: addressDoc.state || '',
          country: addressDoc.country || '',
          pinCode: addressDoc.pinCode || addressDoc.zipCode || '',
          landmark: addressDoc.landmark || ''
        } : {},
        emergencyContact: userProfile?.emergencyContact || '',
        profilePicture: profilePictureUrl,
        lastLogin: adminProfile?.lastLoginAt ? new Date(adminProfile.lastLoginAt).toLocaleString() : 'N/A',
        accessLevel: adminProfile?.accessLevel || 'full',
        permissions: adminProfile?.permissions || []
      },
      stats: {
        totalStudents,
        studentGrowth: 12, // TODO: Calculate from historical data
        totalTeachers,
        activeTeachers,
        totalAdmins,
        activeAdmins,
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
