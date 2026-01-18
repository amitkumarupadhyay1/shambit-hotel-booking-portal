'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { authApi } from '@/lib/api/auth';
import { setAccessToken } from '@/lib/api/client';
import { toast } from 'sonner';
import { LoginInput, RegisterInput } from '@/lib/validations/auth';
import { UserRole } from '@/types/auth';

// Global flag to prevent multiple auth checks
let globalAuthCheckInProgress = false;

export function useAuth() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, setUser, setLoading, logout: clearAuth } = useAuthStore();
    const [hasInitialized, setHasInitialized] = useState(false);

    // Memoized auth check function
    const checkAuthOnce = useCallback(async () => {
        // Prevent multiple simultaneous auth checks globally
        if (globalAuthCheckInProgress) {
            console.log('🔄 Auth check already in progress globally, skipping...');
            return;
        }

        // Only check if we have a persisted user and haven't initialized yet
        if (!hasInitialized && user && isAuthenticated) {
            globalAuthCheckInProgress = true;
            
            try {
                setLoading(true);
                console.log('🔍 Validating persisted session...');
                const userData = await authApi.getProfile();
                setUser(userData);
                console.log('✅ Session validation successful');
            } catch (error) {
                console.log('❌ Session validation failed, clearing auth state');
                setUser(null);
            } finally {
                setLoading(false);
                setHasInitialized(true);
                globalAuthCheckInProgress = false;
            }
        } else if (!hasInitialized) {
            // No persisted user, mark as initialized
            setHasInitialized(true);
            console.log('ℹ️ No persisted session found');
        }
    }, [hasInitialized, user, isAuthenticated, setUser, setLoading]);

    // Check authentication status on mount - only once per app lifecycle
    useEffect(() => {
        checkAuthOnce();
    }, [checkAuthOnce]);

    const login = async (credentials: LoginInput) => {
        try {
            setLoading(true);
            console.log('🔐 Starting login process...');
            const response = await authApi.login(credentials);
            
            console.log('✅ Login API call successful, setting user state...');
            if (response.accessToken) {
                setAccessToken(response.accessToken); // ✅ REQUIRED
            }
            setUser(response.user);
            toast.success(response.message || 'Login successful!');

            // Redirect based on role
            if (response.user.roles.includes(UserRole.ADMIN)) {
                router.push('/admin');
            } else if (response.user.roles.includes(UserRole.SELLER)) {
                router.push('/seller/dashboard');
            } else {
                // Customers go to their bookings or main site
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
                setAccessToken(response.accessToken); // ✅ REQUIRED
            }
            setUser(response.user);
            toast.success(response.message || 'Registration successful!');
            
            // Route based on user role after registration
            if (response.user.roles.includes(UserRole.SELLER)) {
                router.push('/onboarding'); // Hotel owners go to property setup
            } else if (response.user.roles.includes(UserRole.ADMIN)) {
                router.push('/admin');
            } else {
                // Customers go to main site or their bookings
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
                setAccessToken(response.accessToken); // ✅ REQUIRED
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
            setHasInitialized(false); // Reset initialization flag
            globalAuthCheckInProgress = false; // Reset global flag
            toast.success('Logged out successfully');
            router.push('/login');
        } catch (_error) {
            clearAuth();
            setHasInitialized(false); // Reset initialization flag
            globalAuthCheckInProgress = false; // Reset global flag
            router.push('/login');
        }
    };

    const hasRole = (role: UserRole): boolean => {
        return user?.roles.includes(role) || false;
    };

    return {
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        hasRole,
    };
}
