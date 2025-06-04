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
        console.log('Checking authentication state...');
        if (this.authManager.isAuthenticated() && !this.authManager.isTokenExpired()) {
            console.log('User is authenticated, showing dashboard');
            this.showDashboard();
            this.loadDashboardData();
        } else {
            console.log('User not authenticated, showing login');
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
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('errorMessage');
        const loginBtn = document.getElementById('loginBtn');
        const loginText = document.getElementById('loginText');
        const loginSpinner = document.getElementById('loginSpinner');

        if (!username || !password) {
            errorDiv.textContent = 'Please enter both username and password';
            errorDiv.classList.remove('hidden');
            return;
        }

        // Show loading state
        loginBtn.disabled = true;
        loginText.classList.add('hidden');
        loginSpinner.classList.remove('hidden');
        errorDiv.classList.add('hidden');

        try {
            console.log('Starting login process...');
            
            // Step 1: Authenticate and get token
            const token = await this.authManager.login(username, password);
            console.log('Login successful, token received');

            // Step 2: Test the GraphQL connection
            console.log('Testing GraphQL connection...');
            await this.graphqlClient.testQuery();
            console.log('GraphQL connection test successful');

            // Step 3: Show dashboard and load data
            this.showDashboard();
            await this.loadDashboardData();

        } catch (error) {
            console.error('Login failed:', error);
            errorDiv.textContent = error.message || 'Login failed. Please check your credentials.';
            errorDiv.classList.remove('hidden');
        } finally {
            // Reset loading state
            loginBtn.disabled = false;
            loginText.classList.remove('hidden');
            loginSpinner.classList.add('hidden');
        }
    }

    handleLogout() {
        console.log('Logging out...');
        this.authManager.logout();
        this.showLogin();
        // Clear form
        document.getElementById('loginForm').reset();
        document.getElementById('errorMessage').classList.add('hidden');
        // Reset dashboard data
        this.resetDashboard();
    }

    resetDashboard() {
        document.getElementById('userName').textContent = 'Welcome back!';
        document.getElementById('userDetails').textContent = 'Loading your profile...';
        document.getElementById('totalXP').textContent = '0';
        document.getElementById('projectsCount').textContent = '0';
        document.getElementById('auditRatio').textContent = '0%';
        document.getElementById('passRate').textContent = '0%';
        
        // Clear charts
        document.getElementById('xpChart').innerHTML = '';
        document.getElementById('successChart').innerHTML = '';
    }

    async loadDashboardData() {
        try {
            console.log('Loading dashboard data...');

            // Load user profile first
            console.log('Fetching user profile...');
            const userProfile = await this.graphqlClient.getUserProfile();
            console.log('User profile loaded:', userProfile);
            
            if (userProfile.user && userProfile.user.length > 0) {
                this.updateUserInfo(userProfile.user[0]);
            }

            // Load XP transactions
            console.log('Fetching XP transactions...');
            const xpData = await this.graphqlClient.getXPTransactions();
            console.log('XP data loaded:', xpData);
            
            if (xpData.transaction) {
                this.updateXPStats(xpData.transaction);
                // Generate XP chart
                ChartGenerator.createXPChart(xpData.transaction, 'xpChart');
            }

            // Load project results
            console.log('Fetching project results...');
            const resultsData = await this.graphqlClient.getProjectResults();
            console.log('Results data loaded:', resultsData);
            
            if (resultsData.result) {
                this.updateProjectStats(resultsData.result);
                // Generate success chart
                ChartGenerator.createSuccessChart(resultsData.result, 'successChart');
            }

            // Try to load audit data for audit ratio
            try {
                console.log('Fetching audit data...');
                const auditData = await this.graphqlClient.getAuditData();
                console.log('Audit data loaded:', auditData);
                if (auditData.transaction) {
                    this.updateAuditStats(auditData.transaction);
                }
            } catch (auditError) {
                console.warn('Could not load audit data:', auditError.message);
            }

            console.log('Dashboard data loading completed');

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            
            // Show user-friendly error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Failed to load some dashboard data. Please try refreshing the page.';
            
            const dashboard = document.getElementById('dashboard');
            dashboard.insertBefore(errorMessage, dashboard.firstChild);
            
            // Remove error message after 5 seconds
            setTimeout(() => {
                if (errorMessage.parentNode) {
                    errorMessage.parentNode.removeChild(errorMessage);
                }
            }, 5000);
        }
    }

    updateUserInfo(user) {
        console.log('Updating user info:', user);
        document.getElementById('userName').textContent = `Welcome back, ${user.login}!`;
        document.getElementById('userDetails').textContent = `User ID: ${user.id} | Joined: ${new Date(user.createdAt).toLocaleDateString()}`;
    }

    updateXPStats(transactions) {
        console.log('Updating XP stats with', transactions.length, 'transactions');
        const totalXP = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        document.getElementById('totalXP').textContent = totalXP.toLocaleString();
    }

    updateProjectStats(results) {
        console.log('Updating project stats with', results.length, 'results');
        const totalProjects = results.length;
        const passedProjects = results.filter(r => r.grade && r.grade > 0).length;
        const passRate = totalProjects > 0 ? Math.round((passedProjects / totalProjects) * 100) : 0;

        document.getElementById('projectsCount').textContent = totalProjects;
        document.getElementById('passRate').textContent = passRate + '%';
    }

    updateAuditStats(auditTransactions) {
        console.log('Updating audit stats with', auditTransactions.length, 'audit transactions');
        
        const upVotes = auditTransactions.filter(t => t.type === 'up').reduce((sum, t) => sum + t.amount, 0);
        const downVotes = auditTransactions.filter(t => t.type === 'down').reduce((sum, t) => sum + t.amount, 0);
        
        const totalVotes = upVotes + downVotes;
        const auditRatio = totalVotes > 0 ? Math.round((upVotes / totalVotes) * 100) : 0;
        
        document.getElementById('auditRatio').textContent = auditRatio + '%';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ProfileApp...');
    new ProfileApp();
});