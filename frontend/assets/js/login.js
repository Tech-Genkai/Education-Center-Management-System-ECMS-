/**
 * Login Form Handler
 * Manages authentication and form interactions for the login page
 */

function loginForm() {
    return {
        formData: {
            email: '',
            password: '',
            rememberMe: false
        },
        showPassword: false,
        loading: false,
        error: '',
        success: '',

        init() {
            // Check if user is already logged in
            this.checkExistingAuth();
            
            // Load saved email if "remember me" was used
            const savedEmail = localStorage.getItem('savedEmail');
            if (savedEmail) {
                this.formData.email = savedEmail;
                this.formData.rememberMe = true;
            }
        },

        async checkExistingAuth() {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('userRole');
            
            if (token && role) {
                // Verify token is still valid
                try {
                    const response = await fetch('/api/profile', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        // Token is valid, redirect to dashboard
                        let dashboardRole = role === 'superadmin' ? 'admin' : role;
                        window.location.href = `/pages/${dashboardRole}/dashboard.html`;
                    } else {
                        // Token invalid, clear storage
                        this.clearAuth();
                    }
                } catch (error) {
                    console.error('Auth check error:', error);
                    this.clearAuth();
                }
            }
        },

        clearAuth() {
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userEmail');
        },

        async handleLogin() {
            this.error = '';
            this.success = '';
            this.loading = true;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: this.formData.email,
                        password: this.formData.password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    this.success = 'Login successful! Redirecting...';
                    
                    // Store token and user info
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userRole', data.user?.role || 'student');
                    localStorage.setItem('userEmail', data.user?.email || this.formData.email);
                    
                    // Handle "Remember Me"
                    if (this.formData.rememberMe) {
                        localStorage.setItem('savedEmail', this.formData.email);
                    } else {
                        localStorage.removeItem('savedEmail');
                    }
                    
                    setTimeout(() => {
                        // Redirect based on user role
                        let role = data.user?.role || 'student';
                        
                        // Map role names to dashboard paths
                        if (role === 'superadmin') {
                            role = 'admin';
                        }
                        
                        window.location.href = `/pages/${role}/dashboard.html`;
                    }, 1000);
                } else {
                    this.error = data.message || 'Login failed. Please try again.';
                }
            } catch (err) {
                this.error = 'Network error. Please check your connection.';
                console.error('Login error:', err);
            } finally {
                this.loading = false;
            }
        }
    }
}
