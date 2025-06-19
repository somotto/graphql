import { checkAuthState } from './auth.js';
import { getUserProfileData } from './data.js';
import { updateProfileUI } from './ui.js';

// Initialize the application
// Update initializeProfile function
async function initializeProfile() {
    try {
        // Check if JWT exists
        if (!localStorage.getItem('jwt')) {
            throw new Error('No authentication token found');
        }

        // Load user data
        const profileData = await getUserProfileData();

        // Update UI with the data
        updateProfileUI(profileData);

    } catch (error) {
        console.error('Error initializing profile:', error);

        // Handle specific errors
        if (error.message.includes('authentication') || error.message.includes('JWT')) {
            // Redirect to login
            localStorage.removeItem('jwt');
            window.location.reload();
            return;
        }

        // Show error to user
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = 'Failed to load profile data. Please try again later.';
        document.querySelector('.profile-main').prepend(errorElement);
    }
}

// Check auth state and initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();

    // If authenticated, initialize the profile
    if (localStorage.getItem('jwt')) {
        initializeProfile();
    }
});

// Make initializeProfile available globally for auth.js to call after login
window.initializeProfile = initializeProfile;