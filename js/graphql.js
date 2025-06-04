class GraphQLClient {
    constructor(authManager) {
        this.authManager = authManager;
        this.endpoint = 'https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql';
    }

    async query(query, variables = {}) {
        try {
            // Check if we have a token
            const token = this.authManager.getToken();
            if (!token) {
                throw new Error('No authentication token available');
            }

            // Check if token is expired
            if (this.authManager.isTokenExpired && this.authManager.isTokenExpired()) {
                throw new Error('Authentication token has expired');
            }

            console.log('Making GraphQL query:', { query: query.substring(0, 100) + '...', variables });

            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: query.trim(),
                    variables
                })
            });

            console.log('GraphQL response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('GraphQL HTTP error:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('GraphQL response data:', data);

            if (data.errors && data.errors.length > 0) {
                console.error('GraphQL errors:', data.errors);
                throw new Error(data.errors[0].message);
            }

            return data.data;
        } catch (error) {
            console.error('GraphQL query error:', error);
            throw error;
        }
    }

    async getUserProfile() {
        const query = `
            query GetUserProfile {
                user {
                    id
                    login
                    totalUp
                    totalDown
                    createdAt
                    updatedAt
                }
            }
        `;
        return this.query(query);
    }

    async getXPTransactions() {
        const query = `
            query GetXPTransactions {
                transaction(
                    where: { type: { _eq: "xp" } }
                    order_by: { createdAt: asc }
                ) {
                    id
                    amount
                    createdAt
                    path
                    objectId
                }
            }
        `;
        return this.query(query);
    }

    async getProjectResults() {
        const query = `
            query GetProjectResults {
                result {
                    id
                    grade
                    createdAt
                    updatedAt
                    path
                    objectId
                    object {
                        name
                        type
                    }
                }
            }
        `;
        return this.query(query);
    }

    // Alternative method to get progress data
    async getProgressData() {
        const query = `
            query GetProgressData {
                progress {
                    id
                    grade
                    createdAt
                    updatedAt
                    path
                    objectId
                    object {
                        name
                        type
                    }
                }
            }
        `;
        return this.query(query);
    }

    // Get audit data
    async getAuditData() {
        const query = `
            query GetAuditData {
                transaction(
                    where: { type: { _in: ["up", "down"] } }
                    order_by: { createdAt: desc }
                ) {
                    id
                    type
                    amount
                    createdAt
                    path
                }
            }
        `;
        return this.query(query);
    }

    // Test query to check if authentication is working
    async testQuery() {
        const query = `
            query TestQuery {
                user {
                    id
                    login
                }
            }
        `;
        return this.query(query);
    }

    // Introspection query to see available fields
    async introspectSchema() {
        const query = `
            query IntrospectionQuery {
                __schema {
                    queryType {
                        fields {
                            name
                            description
                        }
                    }
                }
            }
        `;
        return this.query(query);
    }
}