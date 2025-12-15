/**
 * Authentication Utilities
 * Shared authentication functions for the application
 */

const AuthUtils = {
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    /**
     * Get current user's token
     */
    getToken() {
        return localStorage.getItem('token');
    },

    /**
     * Get current user's role
     */
    getUserRole() {
        return localStorage.getItem('userRole');
    },

    /**
     * Get current user's email
     */
    getUserEmail() {
        return localStorage.getItem('userEmail');
    },

    /**
     * Store authentication data
     */
    setAuth(token, role, email) {
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', role);
        localStorage.setItem('userEmail', email);
    },

    /**
     * Clear all authentication data
     */
    clearAuth() {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
    },

    /**
     * Get dashboard URL for a role
     */
    getDashboardUrl(role) {
        const dashboardRole = role === 'superadmin' ? 'admin' : role;
        return `/pages/${dashboardRole}/dashboard.html`;
    },

    /**
     * Redirect to login page
     */
    redirectToLogin() {
        window.location.href = '/pages/public/login.html';
    },

    /**
     * Redirect to user's dashboard based on their role
     */
    redirectToDashboard(role = null) {
        const userRole = role || this.getUserRole();
        if (userRole) {
            window.location.href = this.getDashboardUrl(userRole);
        } else {
            this.redirectToLogin();
        }
    },

    /**
     * Verify token with server
     */
    async verifyToken() {
        const token = this.getToken();
        if (!token) {
            return false;
        }

        try {
            const response = await fetch('/api/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                return true;
            } else {
                this.clearAuth();
                return false;
            }
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    },

    /**
     * Logout user
     */
    logout() {
        this.clearAuth();
        this.redirectToLogin();
    }
};

// Make it available globally
window.AuthUtils = AuthUtils;
