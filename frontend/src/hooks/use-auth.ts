'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { authApi } from '@/lib/api/auth';
import { setAccessToken, getAccessToken } from '@/lib/api/client';
import { toast } from 'sonner';
import { LoginInput, RegisterInput } from '@/lib/validations/auth';
import { UserRole } from '@/types/auth';

// Global singleton auth state management
let globalAuthInitialized = false;
let globalAuthCheckInProgress = false;
let globalAuthPromise: Promise<void> | null = null;

export function useAuth() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, setUser, setLoading, logout: clearAuth } = useAuthStore();
    const [hasInitialized, setHasInitialized] = useState(globalAuthInitialized);

    // Enhanced auth check with proper singleton behavior
    const initializeAuth = useCallback(async (): Promise<void> => {
        // If already initialized globally, just update local state
        if (globalAuthInitialized) {
            setHasInitialized(true);
            return;
        }

        // If initialization is in progress, wait for it
        if (globalAuthCheckInProgress && globalAuthPromise) {
            console.log('🔄 Auth initialization already in progress, waiting...');
            await globalAuthPromise;
            setHasInitialized(true);
            return;
        }

        // Start initialization
        globalAuthCheckInProgress = true;
        globalAuthPromise = performAuthInitialization();

        try {
            await globalAuthPromise;
        } finally {
            globalAuthInitialized = true;
            globalAuthCheckInProgress = false;
            globalAuthPromise = null;
            setHasInitialized(true);
        }
    }, [setUser, setLoading]);

    const performAuthInitialization = async (): Promise<void> => {
        // Check if we have a stored token
        const storedToken = getAccessToken();
        
        // If we have persisted user but no token, try to validate session
        if (user && isAuthenticated && storedToken) {
            try {
                setLoading(true);
                console.log('🔍 Validating persisted session with stored token...');
                const userData = await authApi.getProfile();
                setUser(userData);
                console.log('✅ Session validation successful');
            } catch (error) {
                console.log('❌ Session validation failed, clearing auth state');
                setAccessToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        } else if (user && isAuthenticated && !storedToken) {
            // User state exists but no token - clear invalid state
            console.log('⚠️ User state exists but no token found, clearing auth state');
            setUser(null);
        } else {
            // No persisted user or clean state
            console.log('ℹ️ No persisted session found or clean state');
            setLoading(false);
        }
    };

    // Initialize auth on mount
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    const login = async (credentials: LoginInput) => {
        try {
            setLoading(true);
            console.log('🔐 Starting login process...');
            const response = await authApi.login(credentials);
            
            console.log('✅ Login API call successful, setting user state...');
            if (response.accessToken) {
                setAccessToken(response.accessToken);
            }
            setUser(response.user);
            toast.success(response.message || 'Login successful!');

            // Redirect based on role
            if (response.user.roles.includes(UserRole.ADMIN)) {
                router.push('/admin');
            } else if (response.user.roles.includes(UserRole.SELLER)) {
                router.push('/seller/dashboard');
            } else {
                router.push('/my-bookings');
            }
        } catch (error: unknown) {
            console.error('❌ Login failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (credentials: RegisterInput) => {
        try {
            setLoading(true);
            console.log('🔐 Starting registration process...');
            const response = await authApi.register(credentials);
            
            console.log('✅ Registration API call successful, setting user state...');
            if (response.accessToken) {
                setAccessToken(response.accessToken);
            }
            setUser(response.user);
            toast.success(response.message || 'Registration successful!');
            
            // Route based on user role after registration
            if (response.user.roles.includes(UserRole.SELLER)) {
                router.push('/onboarding');
            } else if (response.user.roles.includes(UserRole.ADMIN)) {
                router.push('/admin');
            } else {
                router.push('/');
            }
        } catch (error: unknown) {
            console.error('❌ Registration failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const loginWithGoogle = async (googleToken: string) => {
        try {
            setLoading(true);
            const response = await authApi.googleAuth(googleToken);
            if (response.accessToken) {
                setAccessToken(response.accessToken);
            }
            setUser(response.user);
            toast.success(response.message || 'Google login successful!');

            if (response.user.roles.includes(UserRole.ADMIN)) {
                router.push('/admin');
            } else if (response.user.roles.includes(UserRole.SELLER)) {
                router.push('/seller/dashboard');
            } else {
                router.push('/my-bookings');
            }
        } catch (error: unknown) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
            clearAuth();
            // Reset global state
            globalAuthInitialized = false;
            globalAuthCheckInProgress = false;
            globalAuthPromise = null;
            toast.success('Logged out successfully');
            router.push('/login');
        } catch (_error) {
            clearAuth();
            // Reset global state
            globalAuthInitialized = false;
            globalAuthCheckInProgress = false;
            globalAuthPromise = null;
            router.push('/login');
        }
    };

    const hasRole = (role: UserRole): boolean => {
        return user?.roles.includes(role) || false;
    };

    return {
        user,
        isAuthenticated,
        isLoading: isLoading || !hasInitialized, // Include initialization state
        login,
        register,
        loginWithGoogle,
        logout,
        hasRole,
    };
}
