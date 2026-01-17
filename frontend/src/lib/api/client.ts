import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1',
    withCredentials: true, // Important: Send cookies for refresh tokens
    headers: {
        'Content-Type': 'application/json',
    },
});

// Store access token in memory (not localStorage for security)
let accessToken: string | null = null;
let refreshPromise: Promise<any> | null = null; // Prevent multiple simultaneous refresh attempts

export const setAccessToken = (token: string | null) => {
    accessToken = token;
};

export const getAccessToken = () => accessToken;

// Request interceptor
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Add access token to Authorization header if available
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
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

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // If refresh is already in progress, wait for it
                if (!refreshPromise) {
                    refreshPromise = apiClient.post('/auth/refresh');
                }
                
                const refreshResponse = await refreshPromise;
                refreshPromise = null; // Clear the promise
                
                const newAccessToken = refreshResponse.data.accessToken;
                
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
                // Refresh failed, clear token and redirect to login
                setAccessToken(null);
                if (typeof window !== 'undefined') {
                    // Avoid infinite redirect loop
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(refreshError);
            }
        }

        // Handle other errors
        const message =
            (error.response?.data as { message?: string })?.message ||
            error.message ||
            'An error occurred';

        // Don't show toast for 401s as we handle them with redirect
        if (error.response?.status !== 401) {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

export default apiClient;
