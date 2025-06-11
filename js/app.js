class ProfileApp {
    constructor() {
        this.authManager = new AuthManager();
        this.graphqlClient = new GraphQLClient(this.authManager);
        this.initializeEventListeners();
        this.checkAuthState();
        this.xpData = [];
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

        // Reload button
        document.getElementById('reload-btn')?.addEventListener('click', () => {
            location.reload();
        });

        // Time range selector
        document.getElementById("xp-time-range")?.addEventListener("change", (e) => {
            const months = Number.parseInt(e.target.value);
            this.updateXPChartTimeRange(months);
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

        loginBtn.disabled = true;
        loginText.classList.add('hidden');
        loginSpinner.classList.remove('hidden');
        errorDiv.classList.add('hidden');

        try {
            console.log('Starting login process...');

            const token = await this.authManager.login(username, password);
            console.log('Login successful, token received');

            console.log('Testing GraphQL connection...');
            await this.graphqlClient.testQuery();
            console.log('GraphQL connection test successful');

            this.showDashboard();
            await this.loadDashboardData();

        } catch (error) {
            console.error('Login failed:', error);
            errorDiv.textContent = error.message || 'Login failed. Please check your credentials.';
            errorDiv.classList.remove('hidden');
        } finally {
            loginBtn.disabled = false;
            loginText.classList.remove('hidden');
            loginSpinner.classList.add('hidden');
        }
    }

    handleLogout() {
        console.log('Logging out...');
        this.authManager.logout();
        this.showLogin();
        document.getElementById('loginForm').reset();
        document.getElementById('errorMessage').classList.add('hidden');
        this.resetDashboard();
    }

    resetDashboard() {
        document.getElementById('userName').textContent = 'Welcome back!';
        document.getElementById('userDetails').textContent = 'Loading your profile...';
        document.getElementById('totalXP').textContent = '0';
        document.getElementById('projectsCount').textContent = '0';
        document.getElementById('auditRatio').textContent = '0%';

        document.getElementById('xp-chart-container').innerHTML = '';
        document.getElementById('skills-chart-container').innerHTML = '';
        document.getElementById('audit-chart-container').innerHTML = '';
    }

    async loadDashboardData() {
        try {
            console.log('Loading dashboard data...');
            document.getElementById('loading-indicator').textContent = 'Loading your data...';
            document.getElementById('profile-content').classList.add('hidden');

            // First load essential data
            const userProfile = await this.graphqlClient.getUserProfile();
            if (userProfile?.user?.length > 0) {
                this.updateUserInfo(userProfile.user[0]);
            }

            // Then load other data in parallel
            const [xpData, projectsData, auditData] = await Promise.all([
                this.graphqlClient.getXPTransactions(),
                this.graphqlClient.getProjectResults(),  // This now returns pending projects
                this.graphqlClient.getAuditData()
            ]);

            this.xpData = xpData?.transaction || [];
            if (this.xpData.length > 0) {
                this.updateXPStats(this.xpData);
                this.updateXPChartTimeRange(6);
            }

            if (projectsData?.result) {
                this.updateProjectStats(projectsData.result);
            }

            if (projectsData?.progress) {
                this.updatePendingProjects(projectsData.progress);
            }

            if (auditData?.transaction) {
                this.updateAuditStats(auditData.transaction);
            }

            // Try to load skills if available
            try {
                const skillsData = await this.graphqlClient.getSkills();
                if (skillsData?.skill) {
                    this.updateSkills(skillsData.skill);
                }
            } catch (skillsError) {
                console.log('Skills data not available:', skillsError);
            }

            document.getElementById('loading-indicator').classList.add('hidden');
            document.getElementById('profile-content').classList.remove('hidden');

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            document.getElementById('loading-indicator').textContent = 'Error loading data. Please try again.';
            document.getElementById('errorMessage').textContent = error.message;
            document.getElementById('errorMessage').classList.remove('hidden');
        }
    }

    // Update getUserProfile query
    async getUserProfile() {
        const query = `
        query GetUserProfile {
            user {
                id
                login
                email
                totalUp
                totalDown
                createdAt
                updatedAt
                attrs
            }
        }
    `;
        return this.query(query);
    }

    updateUserInfo(user) {
        console.log('Updating user info:', user);
        document.getElementById('userName').textContent = `Welcome back, ${user.login}!`;
        document.getElementById('profile-initial').textContent = user.login.charAt(0).toUpperCase();
        document.getElementById('profile-name').textContent = user.login;

        document.getElementById('profile-email').textContent = user.email || 'Not provided';

        document.getElementById('profile-phone').textContent = 'Not available';
        document.getElementById('profile-country').textContent = 'Not available';
    }

    updateSkills(skills) {
        const skillsContainer = document.getElementById('skills-chart-container');
        if (!skills || skills.length === 0) {
            skillsContainer.innerHTML = '<p>No skills data available</p>';
            return;
        }

        // Implement your skills visualization here
        // This could be a radar chart or simple list
    }

    updateRankInfo(user) {
        if (user.attrs && user.attrs.rank) {
            document.getElementById('current-rank').textContent = user.attrs.rank;
        }

        // Implement rank progress calculation based on your platform's logic
        // This might require additional queries or calculations
    }

    // Update the updateXPStats method in ProfileApp class

    updateXPStats(transactions) {
        if (!transactions || !Array.isArray(transactions)) return;

        // Calculate total XP excluding duplicates
        const uniqueTransactions = new Map();

        transactions.forEach(t => {
            const key = `${t.path}-${t.amount}`;
            if (!uniqueTransactions.has(key)) {
                uniqueTransactions.set(key, t);
            }
        });

        const totalXP = Array.from(uniqueTransactions.values())
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        // Format XP display
        const xpElement = document.getElementById('totalXP');
        if (xpElement) {
            if (totalXP >= 1000000) {
                xpElement.textContent = (totalXP / 1000000).toFixed(2) + 'M';
            } else if (totalXP >= 1000) {
                xpElement.textContent = (totalXP / 1000).toFixed(1) + 'K';
            } else {
                xpElement.textContent = totalXP.toString();
            }
        }

        // Store XP data for charts
        this.xpData = Array.from(uniqueTransactions.values())
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    updateAuditStats(auditTransactions) {
        if (!auditTransactions || !Array.isArray(auditTransactions)) return;

        const upVotes = auditTransactions.filter(t => t.type === 'up').reduce((sum, t) => sum + (t.amount || 0), 0);
        const downVotes = auditTransactions.filter(t => t.type === 'down').reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalVotes = upVotes + downVotes;
        const ratioElement = document.getElementById('auditRatio');
        if (ratioElement) {
            // Format as decimal with 2 decimal places
            ratioElement.textContent = totalVotes > 0
                ? (upVotes / totalVotes).toFixed(2)
                : '0.00';
        }

        if (upVotes > 0 || downVotes > 0) {
            ChartGenerator.createAuditDoughnutChart(upVotes, downVotes, 'audit-chart-container');
        }
    }

    updateProjectStats(results) {
        console.log('Updating project stats with', results.length, 'results');
        const totalProjects = results.length;
        const passedProjects = results.filter(r => r.grade && r.grade > 0).length;

        document.getElementById('projectsCount').textContent = totalProjects;
        document.getElementById('completed-projects').textContent = passedProjects;
    }

    updateAuditStats(auditTransactions) {
        if (!auditTransactions || !Array.isArray(auditTransactions)) return;

        console.log('Updating audit stats with', auditTransactions.length, 'audit transactions');

        const upVotes = auditTransactions.filter(t => t.type === 'up').reduce((sum, t) => sum + (t.amount || 0), 0);
        const downVotes = auditTransactions.filter(t => t.type === 'down').reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalVotes = upVotes + downVotes;
        const auditRatio = totalVotes > 0 ? Math.round((upVotes / totalVotes) * 100) : 0;

        const ratioElement = document.getElementById('auditRatio');
        if (ratioElement) {
            ratioElement.textContent = auditRatio + '%';
        }

        if (upVotes > 0 || downVotes > 0) {
            ChartGenerator.createAuditDoughnutChart(upVotes, downVotes, 'audit-chart-container');
        }
    }

    updateXPChartTimeRange(months) {
        if (!this.xpData || this.xpData.length === 0) return;

        if (months === 0) {
            ChartGenerator.createXPChart(this.xpData, 'xp-chart-container');
            return;
        }

        const currentDate = new Date();
        const cutoffDate = new Date();
        cutoffDate.setMonth(currentDate.getMonth() - months);

        const filteredData = this.xpData.filter(item => new Date(item.createdAt) >= cutoffDate);

        if (filteredData.length === 0) {
            document.getElementById("xp-chart-container").innerHTML =
                '<p class="error-message">No XP data available for the selected time period.</p>';
            return;
        }

        ChartGenerator.createXPChart(filteredData, 'xp-chart-container');
    }

    updatePendingProjects(projects) {
        const container = document.getElementById('pending-projects');
        if (!projects || !projects.length) {
            container.innerHTML = '<p class="text-muted">No pending projects</p>';
            return;
        }

        container.innerHTML = projects
            .map(project => `
                <div class="project-card">
                    <div class="flex justify-between items-center">
                        <h4 class="project-name">${project.object.name}</h4>
                        <span class="project-grade">${project.grade || 0}%</span>
                    </div>
                    <p class="project-path">${project.path}</p>
                    <p class="project-date">Last updated: ${new Date(project.updatedAt).toLocaleDateString()}</p>
                </div>
            `)
            .join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ProfileApp...');
    new ProfileApp();
});