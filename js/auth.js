class AuthManager {
    constructor() {
        this.token = localStorage.getItem('jwt_token');
        this.apiBase = 'https://learn.zone01kisumu.ke/api';
    }

    async login(username, password) {
        try {
            const credentials = btoa(`${username}:${password}`);
            
            const response = await fetch(`${this.apiBase}/auth/signin`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (!response.ok) {
                throw new Error(`Invalid credentials: ${response.status} ${response.statusText}`);
            }

            // Get raw token and clean it
            let token = await response.text();
            // Remove any quotes and whitespace
            token = token.replace(/['"]+/g, '').trim();
            
            if (!token) {
                throw new Error('No authentication token received');
            }

            // Validate token format
            if (!this.isValidJWT(token)) {
                throw new Error('Invalid token format received');
            }

            this.token = token;
            localStorage.setItem('jwt_token', token);
            return token;

        } catch (error) {
            console.error('Login error:', error);
            throw new Error('Login failed: ' + error.message);
        }
    }

    isValidJWT(token) {
        if (!token) return false;
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        
        try {
            // Check if each part is valid base64url
            parts.forEach(part => {
                // Add padding if necessary
                const padding = '='.repeat((4 - part.length % 4) % 4);
                const base64 = (part + padding)
                    .replace(/-/g, '+')
                    .replace(/_/g, '/');
                atob(base64);
            });
            return true;
        } catch (e) {
            return false;
        }
    }

    getToken() {
        const token = localStorage.getItem('jwt_token');
        if (!token || !this.isValidJWT(token)) {
            this.logout();
            return null;
        }
        return token;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('jwt_token');
    }

    isAuthenticated() {
        return !!this.getToken() && !this.isTokenExpired();
    }

    getUserInfo() {
        const token = this.getToken();
        if (!token) return null;

        try {
            const parts = token.split('.');
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            return payload;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    isTokenExpired() {
        const userInfo = this.getUserInfo();
        if (!userInfo || !userInfo.exp) return true;
        return userInfo.exp < Math.floor(Date.now() / 1000);
    }
}