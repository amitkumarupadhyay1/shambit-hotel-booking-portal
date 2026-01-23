import apiClient, { setAccessToken } from './client';
import { authManager } from '../auth/auth-manager';
import {
    LoginCredentials,
    RegisterCredentials,
    AuthResponse,
    User
} from '@/types/auth';

export const authApi = {
    // Login with email/password
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        console.log('🔐 Attempting login for:', credentials.email);

        try {
            const { data } = await apiClient.post(
                '/auth/login',
                credentials
            ) as { data: AuthResponse };

            console.log('✅ Login successful for:', credentials.email);

            // Store access token in memory
            if (data.accessToken) {
                setAccessToken(data.accessToken);
            }

            return data;
        } catch (error) {
            console.error('❌ Login failed for:', credentials.email, error);
            throw error;
        }
    },

    // Register new user
    register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
        const { data } = await apiClient.post(
            '/auth/register',
            credentials
        ) as { data: AuthResponse };

        // Store access token in memory
        if (data.accessToken) {
            setAccessToken(data.accessToken);
        }

        return data;
    },

    // Google OAuth (placeholder - not implemented in backend yet)
    googleAuth: async (googleToken: string): Promise<AuthResponse> => {
        const { data } = await apiClient.post('/auth/google', {
            token: googleToken,
        }) as { data: AuthResponse };

        if (data.accessToken) {
            setAccessToken(data.accessToken);
        }

        return data;
    },

    // Get current user profile - use AuthManager singleton to prevent multiple calls
    getProfile: async (): Promise<User> => {
        const result = await authManager.checkAuth();
        if (!result.isAuthenticated || !result.user) {
            throw new Error('Not authenticated');
        }
        return result.user;
    },

    // Refresh token (handled automatically by interceptor)
    refresh: async (): Promise<{ accessToken: string; message: string }> => {
        const { data } = await apiClient.post('/auth/refresh') as { data: { accessToken: string; message: string } };

        if (data.accessToken) {
            setAccessToken(data.accessToken);
        }

        return data;
    },

    // Logout
    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
        // Clear tokens via AuthManager
        authManager.logout();
    },

    // Global Logout
    logoutGlobal: async (): Promise<void> => {
        await apiClient.post('/auth/global-logout');
        // Clear tokens via AuthManager
        authManager.logout();
    },
};
