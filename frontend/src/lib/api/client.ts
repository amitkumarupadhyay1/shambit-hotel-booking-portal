import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { getApiUrl } from './config';
import { secureTokenManager } from '../auth/secure-token-manager';
import { authManager } from '../auth/auth-manager';

// CSRF token management
let csrfToken: string | null = null;
let csrfTokenExpiry: number | null = null;

const apiClient = axios.create({
    baseURL: getApiUrl(),
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Simple API client without complex deduplication
const enhancedApiClient = {
    get: (url: string, config?: any) => apiClient.get(url, config),
    post: (url: string, data?: any, config?: any) => apiClient.post(url, data, config),
    put: (url: string, data?: any, config?: any) => apiClient.put(url, data, config),
    patch: (url: string, data?: any, config?: any) => apiClient.patch(url, data, config),
    delete: (url: string, config?: any) => apiClient.delete(url, config),
    request: (config: any) => apiClient.request(config),
};

let refreshPromise: Promise<any> | null = null;

export const setAccessToken = (token: string | null) => {
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiresIn = payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : 3600;
            secureTokenManager.setToken(token, expiresIn);
        } catch (error) {
            console.error('Failed to parse token expiry:', error);
            secureTokenManager.setToken(token, 3600);
        }
    } else {
        secureTokenManager.clearToken();
    }
};

export const getAccessToken = () => {
    return secureTokenManager.getToken();
};

export const getCSRFToken = async (): Promise<string | null> => {
    if (csrfToken && csrfTokenExpiry && Date.now() < csrfTokenExpiry) {
        return csrfToken;
    }

    try {
        const response = await axios.get(`${getApiUrl()}/csrf-token`, {
            withCredentials: true,
        });

        csrfToken = response.data.csrfToken;
        csrfTokenExpiry = Date.now() + (response.data.expiresIn || 3600000);
        return csrfToken;
    } catch (error) {
        console.error('Failed to get CSRF token:', error);
        return null;
    }
};

export const clearCSRFToken = () => {
    csrfToken = null;
    csrfTokenExpiry = null;
};

// Request interceptor
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
            const csrfTokenValue = await getCSRFToken();
            if (csrfTokenValue) {
                config.headers['X-CSRF-Token'] = csrfTokenValue;
            }
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        // Handle CSRF token errors
        if (error.response?.status === 403) {
            const errorData = error.response.data as any;
            const csrfErrorCodes = ['CSRF_TOKEN_MISSING', 'CSRF_TOKEN_EXPIRED', 'CSRF_TOKEN_INVALID'];
            
            if (errorData?.code && csrfErrorCodes.includes(errorData.code)) {
                clearCSRFToken();
                
                if (!originalRequest._retry) {
                    originalRequest._retry = true;
                    return apiClient.request(originalRequest);
                }
            }
        }

        // Handle 401 errors with token refresh
        if (
            error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url?.includes('/auth/')
        ) {
            originalRequest._retry = true;

            try {
                if (!refreshPromise) {
                    refreshPromise = apiClient.post('/auth/refresh');
                }
                
                const refreshResponse = await refreshPromise;
                refreshPromise = null;
                
                const newAccessToken = refreshResponse.data.accessToken;
                setAccessToken(newAccessToken);
                await authManager.forceRefresh();
                
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }

                return apiClient(originalRequest);
            } catch (refreshError) {
                refreshPromise = null;
                return handleRefreshFailure(refreshError, originalRequest);
            }
        }

        // Handle other errors
        if (error.code === 'ERR_BLOCKED_BY_CLIENT') {
            toast.error('Request blocked by browser security or ad blocker.');
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
            toast.error('Cannot connect to server. Please check if the backend is running.');
        } else {
            const message =
                (error.response?.data as { message?: string })?.message ||
                error.message ||
                'An error occurred';

            if (error.response?.status !== 401) {
                toast.error(message);
            }
        }

        return Promise.reject(error);
    }
);

const handleRefreshFailure = async (refreshError: any, originalRequest: any) => {
    secureTokenManager.clearToken();
    
    const isOnboarding = typeof window !== 'undefined' && 
                        window.location.pathname === '/onboarding';
    
    if (isOnboarding) {
        toast.error('Session expired. Please save your progress and log in again.', {
            duration: 10000,
            action: {
                label: 'Login',
                onClick: () => {
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login?redirect=/onboarding';
                    }
                }
            }
        });
        
        return Promise.reject(refreshError);
    } else {
        if (typeof window !== 'undefined') {
            if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/register')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(refreshError);
    }
};

export default enhancedApiClient;
