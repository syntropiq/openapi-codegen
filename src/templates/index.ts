export const clientTemplate = `
import axios from 'axios';
import { API_KEY, API_URL } from '../config';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json',
  },
});

export default apiClient;
`;

export const typesTemplate = `
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface ApiError {
  message: string;
  code: number;
}
`;