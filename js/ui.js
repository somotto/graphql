import { createXPChart, createAuditChart } from './charts.js';

// Update profile UI with user data
export function updateProfileUI(profileData) {
    const { userInfo, stats, projects } = profileData;

    // Basic user info
    document.getElementById('profile-name').textContent = userInfo.login;
    document.getElementById('profile-email').textContent = userInfo.email || `${userInfo.login}@student.zone01kisumu.ke`;

    // Set avatar initial
    const initial = userInfo.login?.charAt(0).toUpperCase() || 'U';
    document.getElementById('profile-initial').textContent = initial;

    // Stats
    document.getElementById('level').textContent = userInfo.level;

    // Format total XP in KB/MB
    const formattedXP = formatXP(stats.totalXP);
    document.getElementById('total-xp').textContent = formattedXP;

    document.getElementById('projects-count').textContent = stats.completedProjects;
    document.getElementById('completed-projects').textContent = stats.completedProjects;

    // Format audit ratio with 1 decimal place
    document.getElementById('audit-ratio').textContent = stats.auditRatio.toFixed(1);

    // Update rank
    updateRankInfo(userInfo.level);

    // Create charts
    createXPChart(profileData.xpTransactions);
    createAuditChart(stats.upTotal, stats.downTotal);

    // Show projects
    displayProjects(projects.completed);
    displayPendingProjects(projects.pending);

    // Set current project
    updateCurrentProject(projects.pending.length > 0 ? projects.pending[0] :
        projects.completed.length > 0 ? projects.completed[0] : null);
}

// Helper function to format XP in KB/MB
function formatXP(xp) {
    if (xp >= 1000000) {
        return `${(xp / 1000000).toFixed(2)}MB`;
    } else if (xp >= 1000) {
        return `${Math.floor(xp / 1000)}kB`;
    }
    return `${xp}B`;
}

// Update rank information
function updateRankInfo(level) {
    const ranks = [
        { name: "Aspiring Developer", minLevel: 0, maxLevel: 9 },
        { name: "Beginner Developer", minLevel: 10, maxLevel: 20 },
        { name: "Apprentice Developer", minLevel: 20, maxLevel: 29 },
        { name: "Assistant Developer", minLevel: 30, maxLevel: 39 },
        { name: "Basic Developer", minLevel: 40, maxLevel: 49 },
        { name: "Junior Developer", minLevel: 50, maxLevel: 54 },
        { name: "Confirmed Developer", minLevel: 55, maxLevel: 59 },
        { name: "Full-Stack Developer", minLevel: 60, maxLevel: null }
    ];

    // Find current rank based on level
    const currentRank = ranks.find(r =>
        level >= r.minLevel &&
        (r.maxLevel === null || level <= r.maxLevel)
    ) || ranks[0];

    // Get next rank if exists
    const nextRankIndex = ranks.indexOf(currentRank) + 1;
    const nextRank = nextRankIndex < ranks.length ? ranks[nextRankIndex] : null;

    // Update current rank display
    document.getElementById('current-rank').textContent = currentRank.name;

    if (nextRank) {
        // Calculate progress to next rank
        const levelRange = nextRank.minLevel - currentRank.minLevel;
        const levelProgress = level - currentRank.minLevel;
        const progress = (levelProgress / levelRange) * 100;

        // Update UI elements
        document.getElementById('next-rank-name').textContent = nextRank.name;
        document.getElementById('xp-progress-bar').style.width = `${Math.min(progress, 100)}%`;
        document.getElementById('current-level').textContent = levelProgress;
        document.getElementById('next-level').textContent = levelRange;
    } else {
        // Handle max rank case
        document.getElementById('next-rank-name').textContent = "Max Rank";
        document.getElementById('xp-progress-bar').style.width = '100%';
        document.getElementById('current-level').textContent = level;
        document.getElementById('next-level').textContent = level;
    }
}

// Display completed projects
function displayProjects(projects) {
    const container = document.getElementById('projects-container');

    if (!projects || projects.length === 0) {
        container.innerHTML = '<p>No completed projects yet</p>';
        return;
    }

    container.innerHTML = projects.map(project => `
        <div class="project-card">
            <h3>${project.object?.name || 'Unknown Project'}</h3>
            <p>Completed: ${new Date(project.createdAt).toLocaleDateString()}</p>
        </div>
    `).join('');
}

// Display pending projects
function displayPendingProjects(projects) {
    const container = document.getElementById('pending-projects');

    if (!projects || projects.length === 0) {
        container.innerHTML = '<p>No pending projects</p>';
        return;
    }

    container.innerHTML = projects.map(project => `
        <div class="pending-project">
            <h4>${project.object?.name || 'Unknown Project'}</h4>
            <span class="time-elapsed">Started ${timeSince(project.createdAt)} ago</span>
        </div>
    `).join('');
}

// Update current project display
function updateCurrentProject(project) {
    const container = document.getElementById('current-project');

    if (!project) {
        container.innerHTML = '<h3>Current Project</h3><p>No active project</p>';
        return;
    }

    const isPending = !project.isDone;
    const startDate = new Date(project.createdAt);
    const timeElapsed = timeSince(project.createdAt);

    container.innerHTML = `
        <h3>${isPending ? 'Current Project' : 'Latest Project'}</h3>
        <h4>${project.object?.name || 'Unknown Project'}</h4>
        ${isPending ? `
            <div class="progress-container">
                <div class="progress-header">
                    <span>IN PROGRESS</span>
                    <span>${timeElapsed}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 50%"></div>
                </div>
                <p>Started: ${startDate.toLocaleDateString()}</p>
            </div>
        ` : `
            <div class="progress-container">
                <div class="progress-header">
                    <span>COMPLETED</span>
                    <span>100%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 100%"></div>
                </div>
                <p>Completed: ${startDate.toLocaleDateString()}</p>
            </div>
        `}
    `;
}

// Helper function to format time since
function timeSince(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks`;
    return `${Math.floor(seconds / 2592000)} months`;
}