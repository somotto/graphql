const RANK_CONFIG = [
    { name: "Aspiring Developer", minLevel: 0, maxLevel: 9 },
    { name: "Beginner Developer", minLevel: 10, maxLevel: 20 },
    { name: "Apprentice Developer", minLevel: 20, maxLevel: 29 },
    { name: "Assistant Developer", minLevel: 30, maxLevel: 39 },
    { name: "Basic Developer", minLevel: 40, maxLevel: 49 },
    { name: "Junior Developer", minLevel: 50, maxLevel: 54 },
    { name: "Confirmed Developer", minLevel: 55, maxLevel: 59 },
    { name: "Full-Stack Developer", minLevel: 60, maxLevel: null }
];

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
                this.graphqlClient.getProjectResults(), 
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

    }

    updateRankInfo(user) {
        if (user.attrs && user.attrs.rank) {
            document.getElementById('current-rank').textContent = user.attrs.rank;
        }

    }
    calculateLevel(totalXP) {
        return Math.floor(Math.log2(totalXP / 1000 + 1));
    }

    getRank(level) {
        return RANK_CONFIG.find(rank => 
            level >= rank.minLevel && 
            (rank.maxLevel === null || level <= rank.maxLevel)
        ) || RANK_CONFIG[RANK_CONFIG.length - 1];
    }

    getNextRank(currentRank) {
        const currentIndex = RANK_CONFIG.findIndex(rank => rank.name === currentRank.name);
        return currentIndex < RANK_CONFIG.length - 1 ? RANK_CONFIG[currentIndex + 1] : null;
    }

    updateXPStats(transactions) {
        if (!transactions || !Array.isArray(transactions)) return;

        // Calculate total XP
        const uniqueTransactions = new Map();
        transactions.forEach(t => {
            const key = `${t.path}-${t.objectId}`;
            if (!uniqueTransactions.has(key) || t.amount > uniqueTransactions.get(key).amount) {
                uniqueTransactions.set(key, t);
            }
        });

        const totalXP = Array.from(uniqueTransactions.values())
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        // Calculate level and ranks
        const level = this.calculateLevel(totalXP);
        const currentRank = this.getRank(level);
        const nextRank = this.getNextRank(currentRank);

        // Update UI
        document.getElementById('totalXP').textContent = this.formatXPValue(totalXP);
        document.getElementById('current-level').textContent = level;
        document.getElementById('current-rank').textContent = currentRank.name;
        document.getElementById('level').textContent = level;

        // Update progress bar and next rank info
        if (nextRank) {
            document.getElementById('next-rank-name').textContent = nextRank.name;
            const progress = ((level - currentRank.minLevel) / 
                (nextRank.minLevel - currentRank.minLevel)) * 100;
            document.getElementById('xp-progress-bar').style.width = `${Math.min(100, progress)}%`;
        } else {
            document.getElementById('next-rank-name').textContent = 'Maximum Rank Achieved';
            document.getElementById('xp-progress-bar').style.width = '100%';
        }

        // Update profile title
        document.getElementById('profile-title').textContent = currentRank.name;
    }

    formatXPValue(value) {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        }
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
            .map(project => {
                const startDate = new Date(project.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                return `
                    <div class="project-card">
                        <h4 class="project-name">${project.object.name}</h4>
                        <p class="project-path">${project.path}</p>
                        <p class="project-date">Started: ${startDate}</p>
                    </div>
                `;
            })
            .join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ProfileApp...');
    new ProfileApp();
});