/**
 * Admin Dashboard Handler
 */

function adminDashboard() {
    return {
        user: {
            name: 'Loading...',
            email: '',
            avatar: '/static/images/profile/default/avatar.png'
        },
        stats: {
            students: 1247,
            teachers: 87,
            classes: 156,
            revenue: 245680
        },
        recentUsers: [
            {
                id: 1,
                name: 'John Smith',
                role: 'Student',
                date: 'Today',
                avatar: '/static/images/profile/default/avatar.png'
            },
            {
                id: 2,
                name: 'Sarah Johnson',
                role: 'Teacher',
                date: 'Yesterday',
                avatar: '/static/images/profile/default/avatar.png'
            },
            {
                id: 3,
                name: 'Mike Davis',
                role: 'Student',
                date: '2 days ago',
                avatar: '/static/images/profile/default/avatar.png'
            },
            {
                id: 4,
                name: 'Emma Wilson',
                role: 'Student',
                date: '3 days ago',
                avatar: '/static/images/profile/default/avatar.png'
            }
        ],
        recentActivity: [
            {
                id: 1,
                user: 'John Smith',
                action: 'Login',
                target: 'Student Portal',
                time: '2 min ago',
                status: 'success'
            },
            {
                id: 2,
                user: 'Sarah Johnson',
                action: 'Created Assignment',
                target: 'Mathematics 101',
                time: '15 min ago',
                status: 'success'
            },
            {
                id: 3,
                user: 'Admin',
                action: 'Updated Settings',
                target: 'System Configuration',
                time: '1 hour ago',
                status: 'warning'
            },
            {
                id: 4,
                user: 'Mike Davis',
                action: 'Submitted Assignment',
                target: 'Physics Lab Report',
                time: '2 hours ago',
                status: 'success'
            },
            {
                id: 5,
                user: 'Emma Wilson',
                action: 'Payment Received',
                target: 'Tuition Fee',
                time: '3 hours ago',
                status: 'success'
            }
        ],
        showNotifications: false,
        charts: {
            enrollment: null,
            attendance: null
        },

        async init() {
            await this.loadUserData();
            await this.loadDashboardData();
            this.initCharts();
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
                        name: data.firstName + ' ' + data.lastName || 'Admin',
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
            console.log('Loading admin dashboard data...');
        },

        initCharts() {
            // Enrollment Chart
            const enrollmentCtx = document.getElementById('enrollmentChart');
            if (enrollmentCtx) {
                this.charts.enrollment = new Chart(enrollmentCtx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                        datasets: [{
                            label: 'Students',
                            data: [980, 1020, 1050, 1080, 1100, 1120, 1145, 1170, 1190, 1210, 1230, 1247],
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                min: 900
                            }
                        }
                    }
                });
            }

            // Attendance Chart
            const attendanceCtx = document.getElementById('attendanceChart');
            if (attendanceCtx) {
                this.charts.attendance = new Chart(attendanceCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Present', 'Absent', 'Late', 'Excused'],
                        datasets: [{
                            data: [87, 5, 4, 4],
                            backgroundColor: [
                                'rgb(34, 197, 94)',
                                'rgb(239, 68, 68)',
                                'rgb(251, 191, 36)',
                                'rgb(168, 85, 247)'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }
        },

        logout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                window.location.href = '/pages/public/login.html';
            }
        }
    }
}
