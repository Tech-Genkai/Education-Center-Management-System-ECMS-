/**
 * Teacher Dashboard Handler
 */

function teacherDashboard() {
    return {
        user: {
            name: 'Loading...',
            email: '',
            avatar: '/static/images/profile/default/avatar.png'
        },
        stats: {
            students: 156,
            classes: 5,
            toGrade: 23,
            todayClasses: 4
        },
        todaySchedule: [
            {
                id: 1,
                class: 'Mathematics 101',
                time: '09:00 AM - 10:30 AM',
                room: 'A-205',
                students: 35,
                status: 'ongoing'
            },
            {
                id: 2,
                class: 'Calculus II',
                time: '11:00 AM - 12:30 PM',
                room: 'B-102',
                students: 28,
                status: 'upcoming'
            },
            {
                id: 3,
                class: 'Statistics',
                time: '02:00 PM - 03:30 PM',
                room: 'A-301',
                students: 32,
                status: 'upcoming'
            }
        ],
        pendingSubmissions: [
            {
                id: 1,
                assignment: 'Problem Set 5',
                class: 'Mathematics 101',
                count: 15
            },
            {
                id: 2,
                assignment: 'Quiz 3',
                class: 'Calculus II',
                count: 8
            },
            {
                id: 3,
                assignment: 'Final Project',
                class: 'Statistics',
                count: 12
            }
        ],
        recentActivity: [
            {
                id: 1,
                type: 'submission',
                message: '15 new submissions for Problem Set 5',
                time: '10 min ago'
            },
            {
                id: 2,
                type: 'grade',
                message: 'Graded Quiz 2 for Calculus II',
                time: '2 hours ago'
            },
            {
                id: 3,
                type: 'attendance',
                message: 'Attendance recorded for Mathematics 101',
                time: '4 hours ago'
            }
        ],
        myClasses: [
            { id: 1, name: 'Mathematics 101', section: 'Section A', students: '35' },
            { id: 2, name: 'Calculus II', section: 'Section B', students: '28' },
            { id: 3, name: 'Statistics', section: 'Section A', students: '32' },
            { id: 4, name: 'Algebra', section: 'Section C', students: '30' },
            { id: 5, name: 'Trigonometry', section: 'Section A', students: '31' }
        ],
        classPerformance: [
            { id: 1, class: 'Mathematics 101', avg: 85 },
            { id: 2, class: 'Calculus II', avg: 78 },
            { id: 3, class: 'Statistics', avg: 92 },
            { id: 4, class: 'Algebra', avg: 88 }
        ],
        showNotifications: false,

        async init() {
            // Check authentication first
            if (!this.checkAuth()) {
                return;
            }
            await this.loadUserData();
            await this.loadDashboardData();
        },

        checkAuth() {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/pages/public/login.html';
                return false;
            }
            return true;
        },

        async loadUserData() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    window.location.href = '/pages/public/login.html';
                    return;
                }

                const response = await fetch('/api/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    this.user = {
                        name: data.firstName + ' ' + data.lastName || 'Teacher',
                        email: data.email,
                        avatar: data.profilePicture || '/static/images/profile/default/avatar.png'
                    };
                } else {
                    console.error('Failed to load user data');
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        },

        async loadDashboardData() {
            // TODO: Load actual dashboard data from API
            console.log('Loading teacher dashboard data...');
        },

        logout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userEmail');
                window.location.href = '/pages/public/login.html';
            }
        }
    }
}
