class ProfileApp {
    constructor() {
        this.authManager = new AuthManager();
        this.graphqlClient = new GraphQLClient(this.authManager);
        this.initializeEventListeners();
        this.checkAuthState();
    }

    initializeEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });
    }

    checkAuthState() {
        if (this.authManager.isAuthenticated()) {
            this.showDashboard();
            this.loadDashboardData();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('dashboard').classList.remove('active');
    }

    showDashboard() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboard').classList.add('active');
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('errorMessage');
        const loginBtn = document.getElementById('loginBtn');
        const loginText = document.getElementById('loginText');
        const loginSpinner = document.getElementById('loginSpinner');

        // Show loading state
        loginBtn.disabled = true;
        loginText.classList.add('hidden');
        loginSpinner.classList.remove('hidden');
        errorDiv.classList.add('hidden');

        try {
            await this.authManager.login(username, password);
            this.showDashboard();
            await this.loadDashboardData();
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        } finally {
            // Reset loading state
            loginBtn.disabled = false;
            loginText.classList.remove('hidden');
            loginSpinner.classList.add('hidden');
        }
    }

    handleLogout() {
        this.authManager.logout();
        this.showLogin();
        // Clear form
        document.getElementById('loginForm').reset();
        document.getElementById('errorMessage').classList.add('hidden');
    }

    async loadDashboardData() {
        try {
            // Load user profile
            const userProfile = await this.graphqlClient.getUserProfile();
            this.updateUserInfo(userProfile.user[0]);

            // Load XP transactions
            const xpData = await this.graphqlClient.getXPTransactions();
            this.updateXPStats(xpData.transaction);

            // Load project results
            const resultsData = await this.graphqlClient.getProjectResults();
            this.updateProjectStats(resultsData.result);

            // Generate charts
            ChartGenerator.createXPChart(xpData.transaction, 'xpChart');
            ChartGenerator.createSuccessChart(resultsData.result, 'successChart');

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // You might want to show an error message to the user
        }
    }

    updateUserInfo(user) {
        document.getElementById('userName').textContent = `Welcome back, ${user.login}!`;
        document.getElementById('userDetails').textContent = `User ID: ${user.id}`;
    }

    updateXPStats(transactions) {
        const totalXP = transactions.reduce((sum, t) => sum + t.amount, 0);
        document.getElementById('totalXP').textContent = totalXP.toLocaleString();
    }

    updateProjectStats(results) {
        const totalProjects = results.length;
        const passedProjects = results.filter(r => r.grade > 0).length;
        const passRate = totalProjects > 0 ? Math.round((passedProjects / totalProjects) * 100) : 0;

        document.getElementById('projectsCount').textContent = totalProjects;
        document.getElementById('passRate').textContent = passRate + '%';

        // Mock audit ratio for now
        document.getElementById('auditRatio').textContent = '85%';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfileApp();
});