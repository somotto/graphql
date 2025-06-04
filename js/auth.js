class AuthManager {
    constructor() {
        this.token = localStorage.getItem('jwt_token');
        this.apiBase = 'https://learn.zone01kisumu.ke/api';
    }

    async login(username, password) {
        try {
            const credentials = btoa(`${username}:${password}`);
            const response = await fetch(`${this.apiBase}/auth/signin`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Invalid credentials');
            }

            const data = await response.json();
            this.token = data.token || data.access_token;
            localStorage.setItem('jwt_token', this.token);
            return this.token;
        } catch (error) {
            throw new Error('Login failed: ' + error.message);
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('jwt_token');
    }

    isAuthenticated() {
        return !!this.token;
    }

    getToken() {
        return this.token;
    }

    // Decode JWT to get user info
    getUserInfo() {
        if (!this.token) return null;
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            return payload;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }
}

// js/graphql.js - GraphQL client
class GraphQLClient {
    constructor(authManager) {
        this.authManager = authManager;
        this.endpoint = 'https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql';
    }

    async query(query, variables = {}) {
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authManager.getToken()}`
                },
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.errors) {
                throw new Error(result.errors[0].message);
            }

            return result.data;
        } catch (error) {
            console.error('GraphQL query error:', error);
            throw error;
        }
    }

    // Get user profile data
    async getUserProfile() {
        const query = `
                    query GetUserProfile {
                        user {
                            id
                            login
                        }
                    }
                `;
        return this.query(query);
    }

    // Get XP transactions
    async getXPTransactions() {
        const query = `
                    query GetXPTransactions {
                        transaction(where: {type: {_eq: "xp"}}, order_by: {createdAt: asc}) {
                            id
                            amount
                            createdAt
                            path
                            object {
                                name
                                type
                            }
                        }
                    }
                `;
        return this.query(query);
    }

    // Get project results
    async getProjectResults() {
        const query = `
                    query GetProjectResults {
                        result {
                            id
                            grade
                            type
                            createdAt
                            path
                            object {
                                name
                                type
                            }
                        }
                    }
                `;
        return this.query(query);
    }

    // Get progress data
    async getProgressData() {
        const query = `
                    query GetProgressData {
                        progress {
                            id
                            grade
                            createdAt
                            path
                            object {
                                name
                                type
                            }
                        }
                    }
                `;
        return this.query(query);
    }
}