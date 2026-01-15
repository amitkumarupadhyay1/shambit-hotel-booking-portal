import apiClient from './client';
import {
    LoginCredentials,
    RegisterCredentials,
    AuthResponse,
    User
} from '@/types/auth';

export const authApi = {
    // Login with email/password
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const { data } = await apiClient.post<AuthResponse>(
            '/auth/login',
            credentials
        );
        return data;
    },

    // Register new user
    register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
        const { data } = await apiClient.post<AuthResponse>(
            '/auth/register',
            credentials
        );
        return data;
    },

    // Google OAuth
    googleAuth: async (googleToken: string): Promise<AuthResponse> => {
        const { data } = await apiClient.post<AuthResponse>('/auth/google', {
            token: googleToken,
        });
        return data;
    },

    // Get current user profile
    getProfile: async (): Promise<User> => {
        const { data } = await apiClient.get<User>('/auth/me');
        return data;
    },

    // Refresh token
    refresh: async (): Promise<AuthResponse> => {
        const { data } = await apiClient.post<AuthResponse>('/auth/refresh');
        return data;
    },

    // Logout
    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
    },
};
