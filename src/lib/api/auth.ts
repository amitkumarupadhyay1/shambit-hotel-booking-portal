import apiClient, { setAccessToken } from './client';
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
        
        // Store access token in memory
        if (data.accessToken) {
            setAccessToken(data.accessToken);
        }
        
        return data;
    },

    // Register new user
    register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
        const { data } = await apiClient.post<AuthResponse>(
            '/auth/register',
            credentials
        );
        
        // Store access token in memory
        if (data.accessToken) {
            setAccessToken(data.accessToken);
        }
        
        return data;
    },

    // Google OAuth (placeholder - not implemented in backend yet)
    googleAuth: async (googleToken: string): Promise<AuthResponse> => {
        const { data } = await apiClient.post<AuthResponse>('/auth/google', {
            token: googleToken,
        });
        
        if (data.accessToken) {
            setAccessToken(data.accessToken);
        }
        
        return data;
    },

    // Get current user profile
    getProfile: async (): Promise<User> => {
        const { data } = await apiClient.get<User>('/auth/me');
        return data;
    },

    // Refresh token (handled automatically by interceptor)
    refresh: async (): Promise<{ accessToken: string; message: string }> => {
        const { data } = await apiClient.post<{ accessToken: string; message: string }>('/auth/refresh');
        
        if (data.accessToken) {
            setAccessToken(data.accessToken);
        }
        
        return data;
    },

    // Logout
    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
        // Clear access token from memory
        setAccessToken(null);
    },
};
