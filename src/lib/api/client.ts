import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1',
    withCredentials: true, // Important: Send cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Cookies are automatically sent with withCredentials: true
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
                // Call refresh endpoint (cookies sent automatically)
                await apiClient.post('/auth/refresh');

                // Retry original request
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed, redirect to login
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
            (error.response?.data as any)?.message ||
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
