import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { getApiUrl } from './config';

const apiClient = axios.create({
    baseURL: getApiUrl(),
    withCredentials: true, // Important: Send cookies for refresh tokens
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Store access token in memory (not localStorage for security)
let accessToken: string | null = null;
let refreshPromise: Promise<any> | null = null; // Prevent multiple simultaneous refresh attempts

// Add a flag to prevent multiple auth/me calls
let isCheckingAuth = false;
let authCheckPromise: Promise<any> | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
    console.log('🔑 Access token updated:', token ? 'Token set' : 'Token cleared');
};

export const getAccessToken = () => accessToken;

// Singleton auth check to prevent multiple simultaneous calls
export const checkAuthStatus = async () => {
    if (isCheckingAuth && authCheckPromise) {
        console.log('🔄 Auth check already in progress, waiting...');
        return authCheckPromise;
    }

    if (!accessToken) {
        console.log('❌ No access token available for auth check');
        throw new Error('No access token');
    }

    isCheckingAuth = true;
    authCheckPromise = apiClient.get('/auth/me');

    try {
        const response = await authCheckPromise;
        console.log('✅ Auth check successful');
        return response.data;
    } catch (error) {
        console.log('❌ Auth check failed');
        throw error;
    } finally {
        isCheckingAuth = false;
        authCheckPromise = null;
    }
};

// Request interceptor
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        console.log(`🚀 Making request to: ${config.baseURL}${config.url}`);
        
        // Add access token to Authorization header if available
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            console.log('🔑 Added authorization header');
        }
        return config;
    },
    (error: AxiosError) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        console.log(`✅ Response received: ${response.status} from ${response.config.url}`);
        return response;
    },
    async (error: AxiosError) => {
        console.error(`❌ Response error: ${error.response?.status} from ${error.config?.url}`, error.response?.data);
        
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        // If 401 and not already retried, try to refresh token
        // But only if it's not a refresh or login request
        if (
            error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url?.includes('/auth/')
        ) {
            originalRequest._retry = true;
            console.log('🔄 Attempting token refresh...');

            try {
                // If refresh is already in progress, wait for it
                if (!refreshPromise) {
                    refreshPromise = apiClient.post('/auth/refresh');
                }
                
                const refreshResponse = await refreshPromise;
                refreshPromise = null; // Clear the promise
                
                const newAccessToken = refreshResponse.data.accessToken;
                console.log('✅ Token refresh successful');
                
                // Update stored access token
                setAccessToken(newAccessToken);
                
                // Update the original request with new token
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }

                // Retry original request
                return apiClient(originalRequest);
            } catch (refreshError) {
                refreshPromise = null; // Clear the promise on error
                console.error('❌ Token refresh failed:', refreshError);
                
                // Refresh failed, clear token and redirect to login
                setAccessToken(null);
                
                // Clear localStorage auth state
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth-storage');
                    // Avoid infinite redirect loop
                    if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/register')) {
                        console.log('🔄 Redirecting to login...');
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(refreshError);
            }
        }

        // Handle specific error types
        if (error.code === 'ERR_BLOCKED_BY_CLIENT') {
            console.error('🚫 Request blocked by client (ad blocker or browser security)');
            toast.error('Request blocked by browser security or ad blocker. Please disable ad blockers and try again.');
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
            console.error('🌐 Network error - backend may be down');
            toast.error('Cannot connect to server. Please check if the backend is running.');
        } else {
            // Handle other errors
            const message =
                (error.response?.data as { message?: string })?.message ||
                error.message ||
                'An error occurred';

            // Don't show toast for 401s as we handle them with redirect
            if (error.response?.status !== 401) {
                toast.error(message);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
