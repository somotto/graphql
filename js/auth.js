const API_BASE = 'https://learn.zone01kisumu.ke/api';

export const createAuthManager = () => {
    let token = localStorage.getItem('jwt_token');

    const isValidJWT = (token) => {
        if (!token) return false;
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        
        try {
            parts.forEach(part => {
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
    };

    const login = async (username, password) => {
        try {
            const credentials = btoa(`${username}:${password}`);
            
            const response = await fetch(`${API_BASE}/auth/signin`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (!response.ok) {
                throw new Error(`Invalid credentials: ${response.status} ${response.statusText}`);
            }

            let newToken = await response.text();
            newToken = newToken.replace(/['"]+/g, '').trim();
            
            if (!newToken || !isValidJWT(newToken)) {
                throw new Error('Invalid token received');
            }

            token = newToken;
            localStorage.setItem('jwt_token', token);
            return token;
        } catch (error) {
            console.error('Login error:', error);
            throw new Error('Login failed: ' + error.message);
        }
    };

    const getToken = () => {
        const storedToken = localStorage.getItem('jwt_token');
        if (!storedToken || !isValidJWT(storedToken)) {
            logout();
            return null;
        }
        return storedToken;
    };

    const logout = () => {
        token = null;
        localStorage.removeItem('jwt_token');
    };

    const getUserInfo = () => {
        const currentToken = getToken();
        if (!currentToken) return null;

        try {
            const parts = currentToken.split('.');
            return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    };

    const isTokenExpired = () => {
        const userInfo = getUserInfo();
        if (!userInfo || !userInfo.exp) return true;
        return userInfo.exp < Math.floor(Date.now() / 1000);
    };

    const isAuthenticated = () => {
        return !!getToken() && !isTokenExpired();
    };

    return {
        login,
        logout,
        getToken,
        isAuthenticated,
        getUserInfo,
        isTokenExpired
    };
};