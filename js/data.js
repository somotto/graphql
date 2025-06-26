import { GRAPHQL_URL } from './auth.js';

// Add JWT validation helper
function isValidJWT(token) {
  if (!token) return false;

  // JWT should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  // Each part should be base64url encoded
  try {
    parts.forEach(part => {
      // Add padding if necessary
      const padding = '='.repeat((4 - (part.length % 4)) % 4);
      const padded = part + padding;
      // Test if it's valid base64
      atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    });
    return true;
  } catch (e) {
    return false;
  }
}

// Fetch comprehensive user data
export async function fetchAllUserData() {
  const jwt = localStorage.getItem('jwt');
  if (!jwt) throw new Error('Not authenticated');

  // Verify JWT format
  if (!isValidJWT(jwt)) {
    localStorage.removeItem('jwt');
    throw new Error('Invalid JWT format');
  }

  const query = `
    query GetAllUserData {
      user {
        id
        login
        attrs
        auditRatio
        createdAt
        events(where: {eventId: {_eq: 75}}) {
          level
        }
      }
      
      transaction(where: {type: {_eq: "xp"}}) {
        amount
        createdAt
        type
        objectId
      }

      # Get total XP using aggregate
      totalXP: transaction_aggregate(where: {type: {_eq: "xp"}, eventId: {_eq: 75}}) {
        aggregate {
          sum {
            amount
          }
        }
      }

      # Get individual XP transactions for the chart
      xpTransactions: transaction(
        where: {
          type: {_eq: "xp"},
          eventId: {_eq: 75}
        }
        order_by: {createdAt: asc}
      ) {
        amount
        createdAt
        path
      }
      
      transaction_aggregate(where: {type: {_eq: "up"}}) {
        aggregate {
          sum {
            amount
          }
        }
      }
      
      downTransactions: transaction_aggregate(where: {type: {_eq: "down"}}) {
        aggregate {
          sum {
            amount
          }
        }
      }
      
      progress(where: {eventId: {_eq: 75}}) {
        createdAt
        isDone
        object {
          id
          name
          type
        }
      }
    }
    `;

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      // Handle expired or invalid token
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('jwt');
        throw new Error('Authentication expired. Please login again.');
      }
      throw new Error('Failed to fetch user data');
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}

// Process raw data into usable format
export async function getUserProfileData() {
  try {
    const data = await fetchAllUserData();
    const user = data.user[0];

    // Parse user attributes
    const attrs = typeof user.attrs === 'string' ? JSON.parse(user.attrs) : user.attrs || {};

    // Get total XP correctly from the aggregate query
    const totalXP = data.totalXP.aggregate.sum.amount || 0;

    // Calculate values
    const upTotal = data.transaction_aggregate.aggregate.sum.amount || 0;
    const downTotal = data.downTransactions.aggregate.sum.amount || 0;
    const auditRatio = downTotal > 0 ? (upTotal / downTotal) : upTotal;

    // Process projects
    const projects = data.progress.filter(p => p.object?.type === 'project');
    const completedProjects = projects.filter(p => p.isDone);
    const pendingProjects = projects.filter(p => !p.isDone);

    // Get XP transactions for chart
    const xpTransactions = data.xpTransactions || [];

    return {
      userInfo: {
        id: user.id,
        login: user.login,
        ...attrs,
        level: user.events[0]?.level || 1,
        createdAt: user.createdAt,
        totalXP: totalXP
      },
      stats: {
        totalXP,
        auditRatio,
        upTotal,
        downTotal,
        completedProjects: completedProjects.length,
        pendingProjects: pendingProjects.length
      },
      projects: {
        completed: completedProjects,
        pending: pendingProjects
      },
      xpTransactions: xpTransactions
    };

  } catch (error) {
    console.error('Error getting profile data:', error);
    throw error;
  }
}