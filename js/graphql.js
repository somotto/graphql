const ENDPOINT = 'https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql';

export const createGraphQLClient = (authManager) => {
    const query = async (query, variables = {}) => {
        try {
            const token = authManager.getToken();
            if (!token) {
                throw new Error('No authentication token available');
            }

            if (authManager.isTokenExpired()) {
                throw new Error('Authentication token has expired');
            }

            const response = await fetch(ENDPOINT, {
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

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.errors?.length > 0) {
                throw new Error(data.errors[0].message);
            }

            return data.data;
        } catch (error) {
            console.error('GraphQL query error:', error);
            throw error;
        }
    };

    const getUserProfile = async () => {
        const queryStr = `
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
        return query(queryStr);
    };

    const getXPTransactions = async () => {
        const queryStr = `
        query GetXPTransactions {
            xpCount: transaction(
                where: {
                    type: {_eq: "xp"}, 
                    eventId: {_eq: 75}
                }
                order_by: {createdAt: asc}
            ) {
                type
                amount
                createdAt
                path
                objectId
            }
        }
    `;
        return query(queryStr);
    };

    const getAuditData = async () => {
        const queryStr = `
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
        return query(queryStr);
    };

    const getCompletedProjects = async () => {
        const queryStr = `
            query {
                progress(
                    where: {
                        _and: [
                            { grade: { _gt: 0 } },
                            { object: { type: { _eq: "project" } } },
                            { eventId: { _eq: 75 } }
                        ]
                    }
                    order_by: { updatedAt: desc }
                ) {
                    id
                    objectId
                    grade
                    createdAt
                    updatedAt
                    path
                    object {
                        id
                        name
                        type
                    }
                }
            }
        `;
        return query(queryStr);
    };

    const getPendingProjects = async () => {
        const queryStr = `
            query GetPendingProjects {
                progress(
                    where: { 
                        grade: { _is_null: true },
                        object: { type: { _eq: "project" } }
                    }
                    order_by: { createdAt: desc }
                    limit: 5
                ) {
                    id
                    objectId
                    createdAt
                    path
                    object {
                        id
                        name
                        type
                    }
                }
            }
        `;
        return query(queryStr);
    };

    const testQuery = async () => {
        const queryStr = `
            query TestConnection {
                user {
                    id
                }
            }
        `;
        return query(queryStr);
    };

    const getSkills = async () => {
        const queryStr = `
            query GetSkills {
                transaction(
                    where: { 
                        type: { _eq: "skill" }
                    }
                    order_by: { amount: desc }
                ) {
                    id
                    type
                    amount
                    path
                }
            }
        `;
        return query(queryStr);
    };

    return {
        query,
        getUserProfile,
        getXPTransactions,
        getAuditData,
        getCompletedProjects,
        getPendingProjects,
        testQuery,
        getSkills
    };
};