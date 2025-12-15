/**
 * Student Dashboard Handler
 */

function studentDashboard() {
    return {
        user: {
            name: 'Loading...',
            email: '',
            avatar: '/static/images/profile/default/avatar.png'
        },
        stats: {
            classes: 6,
            attendance: 94,
            pendingAssignments: 3,
            avgGrade: 'A-'
        },
        assignments: [
            {
                id: 1,
                title: 'Physics Lab Report',
                subject: 'Physics',
                dueDate: 'Tomorrow',
                priority: 'high'
            },
            {
                id: 2,
                title: 'Math Problem Set 5',
                subject: 'Mathematics',
                dueDate: 'Dec 16',
                priority: 'normal'
            },
            {
                id: 3,
                title: 'History Essay',
                subject: 'History',
                dueDate: 'Dec 18',
                priority: 'normal'
            }
        ],
        todaySchedule: [
            {
                id: 1,
                subject: 'Mathematics',
                time: '09:00 AM - 10:30 AM',
                teacher: 'Prof. Johnson',
                status: 'ongoing'
            },
            {
                id: 2,
                subject: 'Physics',
                time: '11:00 AM - 12:30 PM',
                teacher: 'Dr. Smith',
                status: 'upcoming'
            },
            {
                id: 3,
                subject: 'English Literature',
                time: '02:00 PM - 03:30 PM',
                teacher: 'Ms. Williams',
                status: 'upcoming'
            }
        ],
        recentGrades: [
            {
                id: 1,
                subject: 'Chemistry',
                assignment: 'Quiz 3',
                score: 92,
                date: 'Dec 10'
            },
            {
                id: 2,
                subject: 'English',
                assignment: 'Essay',
                score: 88,
                date: 'Dec 9'
            },
            {
                id: 3,
                subject: 'Math',
                assignment: 'Test 2',
                score: 95,
                date: 'Dec 7'
            }
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
                        name: data.firstName + ' ' + data.lastName || 'Student',
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
            // This would include assignments, schedule, grades, etc.
            console.log('Loading dashboard data...');
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
