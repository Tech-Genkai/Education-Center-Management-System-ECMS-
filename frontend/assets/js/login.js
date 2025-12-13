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

        async handleLogin() {
            this.error = '';
            this.success = '';
            this.loading = true;

            try {
                // TODO: Replace with actual API endpoint
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.formData)
                });

                const data = await response.json();

                if (response.ok) {
                    this.success = 'Login successful! Redirecting...';
                    // Store token and redirect based on role
                    localStorage.setItem('token', data.token);
                    
                    setTimeout(() => {
                        // Redirect based on user role
                        const role = data.user?.role || 'student';
                        window.location.href = `/${role}/dashboard.html`;
                    }, 1500);
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
