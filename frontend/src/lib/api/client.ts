import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { getApiUrl } from './config';
import { secureTokenManager } from '../auth/secure-token-manager';
import { authManager } from '../auth/auth-manager';
import requestDeduplicator, { createRequestKey } from './request-deduplicator';

// CSRF token management
let csrfToken: string | null = null;
let csrfTokenExpiry: number | null = null;

const apiClient = axios.create({
    baseURL: getApiUrl(),
    withCredentials: true, // Important: Send cookies for refresh tokens
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Enhanced API client with request deduplication
const enhancedApiClient = {
    // GET requests with deduplication
    get: async (url: string, config?: any) => {
        const requestKey = createRequestKey('GET', url, config?.params);
        return requestDeduplicator.deduplicate(requestKey, () => apiClient.get(url, config));
    },

    // POST requests with deduplication for idempotent operations
    post: async (url: string, data?: any, config?: any) => {
        // Only deduplicate specific endpoints that are safe to deduplicate
        const safeEndpoints = [
            '/hotels/integrated-onboarding/sessions',
            '/auth/refresh',
            '/csrf-token'
        ];
        
        const shouldDeduplicate = safeEndpoints.some(endpoint => url.includes(endpoint));
        
        if (shouldDeduplicate) {
            const requestKey = createRequestKey('POST', url, data);
            return requestDeduplicator.deduplicate(requestKey, () => apiClient.post(url, data, config));
        }
        
        return apiClient.post(url, data, config);
    },

    // PUT requests - generally not deduplicated as they should be idempotent by nature
    put: async (url: string, data?: any, config?: any) => {
        // Only deduplicate draft saves to prevent rate limiting
        if (url.includes('/draft')) {
            const requestKey = createRequestKey('PUT', url, { timestamp: Math.floor(Date.now() / 5000) }); // 5-second window
            return requestDeduplicator.deduplicate(requestKey, () => apiClient.put(url, data, config), { ttl: 5000 });
        }
        
        return apiClient.put(url, data, config);
    },

    // PATCH requests
    patch: async (url: string, data?: any, config?: any) => {
        return apiClient.patch(url, data, config);
    },

    // DELETE requests
    delete: async (url: string, config?: any) => {
        return apiClient.delete(url, config);
    },

    // Direct access to axios instance for special cases
    request: (config: any) => apiClient.request(config),
    
    // Utility methods
    clearDeduplicationCache: () => requestDeduplicator.clearAll(),
    getPendingRequestCount: () => requestDeduplicator.getPendingCount(),
};

// Secure token storage - removed localStorage usage completely
let refreshPromise: Promise<any> | null = null;

// Add a flag to prevent multiple auth/me calls
let isCheckingAuth = false;
let authCheckPromise: Promise<any> | null = null;

export const setAccessToken = (token: string | null) => {
    if (token) {
        // Extract expiry from JWT token
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiresIn = payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : 3600; // Default 1 hour
            secureTokenManager.setToken(token, expiresIn);
            console.log('🔑 Access token set in SecureTokenManager');
        } catch (error) {
            console.error('❌ Failed to parse token expiry, using default:', error);
            secureTokenManager.setToken(token, 3600); // Default 1 hour
        }
    } else {
        secureTokenManager.clearToken();
        console.log('🔑 Access token cleared from SecureTokenManager');
    }
};

export const getAccessToken = () => {
    return secureTokenManager.getToken();
};

/**
 * Get CSRF token from server
 */
export const getCSRFToken = async (): Promise<string | null> => {
    // Return cached token if still valid
    if (csrfToken && csrfTokenExpiry && Date.now() < csrfTokenExpiry) {
        return csrfToken;
    }

    try {
        console.log('🛡️ Fetching CSRF token from server');
        const response = await axios.get(`${getApiUrl()}/csrf-token`, {
            withCredentials: true,
        });

        csrfToken = response.data.csrfToken;
        csrfTokenExpiry = Date.now() + (response.data.expiresIn || 3600000); // Default 1 hour

        console.log('🛡️ CSRF token obtained successfully');
        return csrfToken;
    } catch (error) {
        console.error('❌ Failed to get CSRF token:', error);
        return null;
    }
};

/**
 * Clear CSRF token
 */
export const clearCSRFToken = () => {
    csrfToken = null;
    csrfTokenExpiry = null;
    console.log('🛡️ CSRF token cleared');
};

// Enhanced auth check with better error handling - moved to AuthManager
// This function is deprecated, use authManager.checkAuth() instead

// Request interceptor
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        console.log(`🚀 Making request to: ${config.baseURL}${config.url}`);
        
        // Get access token (checks storage if not in memory)
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔑 Added authorization header');
        }

        // Add CSRF token for state-changing requests
        if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
            const csrfTokenValue = await getCSRFToken();
            if (csrfTokenValue) {
                config.headers['X-CSRF-Token'] = csrfTokenValue;
                console.log('🛡️ Added CSRF token header');
            }
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

        // Handle CSRF token errors (403 with CSRF error codes)
        if (error.response?.status === 403) {
            const errorData = error.response.data as any;
            const csrfErrorCodes = ['CSRF_TOKEN_MISSING', 'CSRF_TOKEN_EXPIRED', 'CSRF_TOKEN_INVALID'];
            
            if (errorData?.code && csrfErrorCodes.includes(errorData.code)) {
                console.log('🛡️ CSRF token error, clearing and retrying...');
                clearCSRFToken();
                
                // Retry the request once with a new CSRF token
                if (!originalRequest._retry) {
                    originalRequest._retry = true;
                    return apiClient.request(originalRequest);
                }
            }
        }

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
                await authManager.forceRefresh();
                
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
    // Clear token from SecureTokenManager
    secureTokenManager.clearToken();
    
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
            // Avoid infinite redirect loop
            if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/register')) {
                console.log('🔄 Redirecting to login...');
                window.location.href = '/login';
            }
        }
        return Promise.reject(refreshError);
    }
};

export default enhancedApiClient;
