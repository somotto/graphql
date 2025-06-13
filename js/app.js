import { createAuthManager } from './auth.js';
import { createGraphQLClient } from './graphql.js';
import { createChart } from './charts.js';

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

export const createApp = () => {
    const authManager = createAuthManager();
    const graphqlClient = createGraphQLClient(authManager);
    const charts = createChart();

    const state = {
        xpData: []
    };

    const initializeEventListeners = () => {
        document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
        document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
        document.getElementById('reload-btn')?.addEventListener('click', () => location.reload());
        document.getElementById('xp-time-range')?.addEventListener('change', handleTimeRangeChange);
    };

    const checkAuthState = () => {
        console.log('Checking authentication state...');
        if (authManager.isAuthenticated() && !authManager.isTokenExpired()) {
            console.log('User is authenticated, showing dashboard');
            showDashboard();
            loadDashboardData();
        } else {
            console.log('User not authenticated, showing login');
            showLogin();
        }
    };

    const showLogin = () => {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('dashboard').classList.remove('active');
    };

    const showDashboard = () => {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboard').classList.add('active');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
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
            const token = await authManager.login(username, password);
            console.log('Login successful, token received');

            console.log('Testing GraphQL connection...');
            await graphqlClient.testQuery();
            console.log('GraphQL connection test successful');

            showDashboard();
            await loadDashboardData();

        } catch (error) {
            console.error('Login failed:', error);
            errorDiv.textContent = error.message || 'Login failed. Please check your credentials.';
            errorDiv.classList.remove('hidden');
        } finally {
            loginBtn.disabled = false;
            loginText.classList.remove('hidden');
            loginSpinner.classList.add('hidden');
        }
    };

    const handleLogout = () => {
        console.log('Logging out...');
        authManager.logout();
        showLogin();
        document.getElementById('loginForm').reset();
        document.getElementById('errorMessage').classList.add('hidden');
        resetDashboard();
    };

    const resetDashboard = () => {
        document.getElementById('userName').textContent = 'Welcome back!';
        document.getElementById('userDetails').textContent = 'Loading your profile...';
        document.getElementById('totalXP').textContent = '0';
        document.getElementById('projectsCount').textContent = '0';
        document.getElementById('auditRatio').textContent = '0%';

        document.getElementById('xp-chart-container').innerHTML = '';
        document.getElementById('skills-chart-container').innerHTML = '';
        document.getElementById('audit-chart-container').innerHTML = '';
    };

    const loadDashboardData = async () => {
        try {
            console.log('Loading dashboard data...');
            document.getElementById('loading-indicator').textContent = 'Loading your data...';
            document.getElementById('profile-content').classList.add('hidden');

            // First load essential data
            const userProfile = await graphqlClient.getUserProfile();
            if (userProfile?.user?.length > 0) {
                updateUserInfo(userProfile.user[0]);
            }

            // Load data in parallel with error handling
            const results = await Promise.allSettled([
                graphqlClient.getXPTransactions(),
                graphqlClient.getProjectResults(),
                graphqlClient.getAuditData(),
                graphqlClient.getSkills()
            ]);

            // Process results with error handling
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`Failed to load data set ${index}:`, result.reason);
                }
            });

            // Handle each result individually with try-catch
            try {
                if (results[0].status === 'fulfilled' && results[0].value?.transaction) {
                    state.xpData = results[0].value.transaction;
                    updateXPStats(state.xpData);
                    updateXPChartTimeRange(6);
                }
            } catch (error) {
                console.error('Error updating XP stats:', error);
            }

            try {
                if (results[2].status === 'fulfilled' && results[2].value?.transaction) {
                    updateAuditStats(results[2].value.transaction);
                }
            } catch (error) {
                console.error('Error updating audit stats:', error);
                document.getElementById('audit-chart-container').innerHTML = 
                    '<p class="error-message">Failed to load audit data</p>';
            }

            // Show content and hide loading indicator
            document.getElementById('loading-indicator').classList.add('hidden');
            document.getElementById('profile-content').classList.remove('hidden');

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            document.getElementById('loading-indicator').textContent = 
                'Error loading data. Please try again.';
        }
    };

    const updateUserInfo = (user) => {
        console.log('Updating user info:', user);
        document.getElementById('userName').textContent = `Welcome back, ${user.login}!`;
        document.getElementById('profile-initial').textContent = user.login.charAt(0).toUpperCase();
        document.getElementById('profile-name').textContent = user.login;
        document.getElementById('profile-email').textContent = user.email || 'Not provided';
        document.getElementById('profile-phone').textContent = 'Not available';
        document.getElementById('profile-country').textContent = 'Not available';
    };

    const calculateLevel = (totalXP) => {
        return Math.floor(Math.log2(totalXP / 1000 + 1));
    };

    const getRank = (level) => {
        return RANK_CONFIG.find(rank =>
            level >= rank.minLevel &&
            (rank.maxLevel === null || level <= rank.maxLevel)
        ) || RANK_CONFIG[RANK_CONFIG.length - 1];
    };

    const getNextRank = (currentRank) => {
        const currentIndex = RANK_CONFIG.findIndex(rank => rank.name === currentRank.name);
        return currentIndex < RANK_CONFIG.length - 1 ? RANK_CONFIG[currentIndex + 1] : null;
    };

    const updateXPStats = (transactions) => {
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
        const level = calculateLevel(totalXP);
        const currentRank = getRank(level);
        const nextRank = getNextRank(currentRank);

        // Update UI
        document.getElementById('totalXP').textContent = formatXPValue(totalXP);
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
    };

    const formatXPValue = (value) => {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        }
        return value.toString();
    };

    const updateProjectStats = (results) => {
        console.log('Updating project stats with', results.length, 'results');
        const totalProjects = results.length;
        const passedProjects = results.filter(r => r.grade && r.grade > 0).length;

        document.getElementById('projectsCount').textContent = totalProjects;
        document.getElementById('completed-projects').textContent = passedProjects;
    };

    const updateAuditStats = (auditTransactions) => {
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
    
        // Change this line from createAuditDoughnutChart to createAuditChart
        if (upVotes > 0 || downVotes > 0) {
            charts.createAuditChart(upVotes, downVotes, 'audit-chart-container');
        } else {
            document.getElementById('audit-chart-container').innerHTML = 
                '<p class="text-muted">No audit data available</p>';
        }
    };

    const handleTimeRangeChange = (e) => {
        const months = Number.parseInt(e.target.value);
        updateXPChartTimeRange(months);
    };

    const updateXPChartTimeRange = (months) => {
        if (!state.xpData || state.xpData.length === 0) return;

        if (months === 0) {
            charts.createXPChart(state.xpData, 'xp-chart-container');
            return;
        }

        const currentDate = new Date();
        const cutoffDate = new Date();
        cutoffDate.setMonth(currentDate.getMonth() - months);

        const filteredData = state.xpData.filter(item => new Date(item.createdAt) >= cutoffDate);

        if (filteredData.length === 0) {
            document.getElementById("xp-chart-container").innerHTML =
                '<p class="error-message">No XP data available for the selected time period.</p>';
            return;
        }

        charts.createXPChart(filteredData, 'xp-chart-container');
    };

    const updatePendingProjects = (projects) => {
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
    };

    return {
        initialize: () => {
            initializeEventListeners();
            checkAuthState();
        }
    };
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ProfileApp...');
    const app = createApp();
    app.initialize();
});