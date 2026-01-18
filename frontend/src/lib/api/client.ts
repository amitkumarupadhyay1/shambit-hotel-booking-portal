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

// Secure token storage with encryption-like obfuscation
const TOKEN_STORAGE_KEY = 'kiro_session_token';
let accessToken: string | null = null;
let refreshPromise: Promise<any> | null = null;

// Add a flag to prevent multiple auth/me calls
let isCheckingAuth = false;
let authCheckPromise: Promise<any> | null = null;

// Simple token obfuscation (not true encryption, but better than plain text)
const obfuscateToken = (token: string): string => {
    return btoa(token.split('').reverse().join(''));
};

const deobfuscateToken = (obfuscated: string): string => {
    try {
        return atob(obfuscated).split('').reverse().join('');
    } catch {
        return '';
    }
};

// Persistent token storage
const storeTokenSecurely = (token: string | null) => {
    if (typeof window === 'undefined') return;
    
    if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, obfuscateToken(token));
    } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
};

const retrieveStoredToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) return null;
    
    const token = deobfuscateToken(stored);
    return token || null;
};

// Initialize token from storage on app start
const initializeToken = () => {
    if (!accessToken) {
        accessToken = retrieveStoredToken();
        console.log('🔑 Token initialized from storage:', accessToken ? 'Token found' : 'No token');
    }
};

// Call initialization immediately
initializeToken();

export const setAccessToken = (token: string | null) => {
    accessToken = token;
    storeTokenSecurely(token);
    console.log('🔑 Access token updated:', token ? 'Token set and stored' : 'Token cleared');
};

export const getAccessToken = () => {
    if (!accessToken) {
        accessToken = retrieveStoredToken();
    }
    return accessToken;
};

// Enhanced auth check with better error handling
export const checkAuthStatus = async () => {
    if (isCheckingAuth && authCheckPromise) {
        console.log('🔄 Auth check already in progress, waiting...');
        return authCheckPromise;
    }

    const currentToken = getAccessToken();
    if (!currentToken) {
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
        
        // Get access token (checks storage if not in memory)
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔑 Added authorization header');
        }
        return config;
    },
    (error: AxiosError) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor with enhanced error handling
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
                
                // Enhanced error handling - don't immediately redirect
                return handleRefreshFailure(refreshError, originalRequest);
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

// Enhanced refresh failure handling
const handleRefreshFailure = async (refreshError: any, originalRequest: any) => {
    // Clear token and auth state
    setAccessToken(null);
    
    // Check if we're in onboarding flow
    const isOnboarding = typeof window !== 'undefined' && 
                        window.location.pathname === '/onboarding';
    
    if (isOnboarding) {
        // For onboarding, show a warning but don't immediately redirect
        toast.error('Session expired. Please save your progress and log in again.', {
            duration: 10000,
            action: {
                label: 'Login',
                onClick: () => {
                    // Clear auth state and redirect
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('auth-storage');
                        window.location.href = '/login?redirect=/onboarding';
                    }
                }
            }
        });
        
        // Return the refresh error instead of redirecting immediately
        return Promise.reject(refreshError);
    } else {
        // For other pages, clear auth state and redirect
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
};

export default apiClient;
