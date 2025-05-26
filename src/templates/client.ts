// This file contains the template for generating client-side API calls based on the OpenAPI specification.

export const clientTemplate = (apiUrl: string, apiKey: string) => {
    return `
        import axios from 'axios';

        const apiClient = axios.create({
            baseURL: '${apiUrl}',
            headers: {
                'Authorization': \`Bearer \${apiKey}\`,
                'Content-Type': 'application/json',
            },
        });

        // Example of generating API calls based on OpenAPI paths
        export const getExample = async (params: any) => {
            const response = await apiClient.get('/example', { params });
            return response.data;
        };

        export const postExample = async (data: any) => {
            const response = await apiClient.post('/example', data);
            return response.data;
        };

        // Add more API methods based on the OpenAPI specification
    `;
};