import apiClient, { setAccessToken, checkAuthStatus } from './client';
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
            const { data } = await apiClient.post<AuthResponse>(
                '/auth/login',
                credentials
            );
            
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

    // Get current user profile - use singleton to prevent multiple calls
    getProfile: async (): Promise<User> => {
        return checkAuthStatus();
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
