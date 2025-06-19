export const API_URL = 'https://learn.zone01kisumu.ke';
export const AUTH_URL = `${API_URL}/api/auth/signin`;
export const GRAPHQL_URL = `${API_URL}/api/graphql-engine/v1/graphql`;

// DOM Elements
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const loginPage = document.getElementById('login-page');
const profilePage = document.getElementById('profile-page');

// Login function
export async function login(usernameOrEmail, password) {
    try {
        const response = await fetch(AUTH_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(`${usernameOrEmail}:${password}`)}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Invalid credentials. Please try again.');
        }

        const jwt = await response.text();
        // Clean the JWT string before storing
        const cleanJWT = jwt.trim().replace(/['"]+/g, '');
        localStorage.setItem('jwt', cleanJWT);
        return cleanJWT;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Logout function
export function logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('userData');
    showLoginPage();
}

// Show/hide pages
function showLoginPage() {
    loginPage.style.display = 'flex';
    profilePage.style.display = 'none';
}

function showProfilePage() {
    loginPage.style.display = 'none';
    profilePage.style.display = 'block';
}

// Event listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const credentials = document.getElementById('credentials').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');

    try {
        errorElement.textContent = '';
        await login(credentials, password);
        showProfilePage();
        // Initialize the profile data
        if (window.initializeProfile) {
            window.initializeProfile();
        }
    } catch (error) {
        errorElement.textContent = error.message;
    }
});

logoutBtn.addEventListener('click', logout);

// Check auth state on page load
export function checkAuthState() {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
        showProfilePage();
    } else {
        showLoginPage();
    }
}