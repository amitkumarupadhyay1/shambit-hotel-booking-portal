'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { authApi } from '@/lib/api/auth';
import { toast } from 'sonner';
import { LoginInput, RegisterInput } from '@/lib/validations/auth';
import { UserRole } from '@/types/auth';

export function useAuth() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading, setUser, setLoading, logout: clearAuth } = useAuthStore();

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await authApi.getProfile();
                setUser(userData);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        if (isLoading) {
            checkAuth();
        }
    }, [isLoading, setUser, setLoading]);

    const login = async (credentials: LoginInput) => {
        try {
            setLoading(true);
            const response = await authApi.login(credentials);
            setUser(response.user);
            toast.success(response.message || 'Login successful!');

            // Redirect based on role
            if (response.user.roles.includes(UserRole.ADMIN)) {
                router.push('/admin/dashboard');
            } else if (response.user.roles.includes(UserRole.SELLER)) {
                router.push('/dashboard');
            } else {
                // Buyer or default
                router.push('/');
            }
        } catch (error: any) {
            // Toast handled in axios interceptor for generic errors, 
            // but we can re-throw if needed for UI state
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (credentials: RegisterInput) => {
        try {
            setLoading(true);
            const response = await authApi.register(credentials);
            setUser(response.user);
            toast.success(response.message || 'Registration successful!');
            router.push('/onboarding');
        } catch (error: any) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const loginWithGoogle = async (googleToken: string) => {
        try {
            setLoading(true);
            const response = await authApi.googleAuth(googleToken);
            setUser(response.user);
            toast.success(response.message || 'Google login successful!');

            if (response.user.roles.includes(UserRole.ADMIN)) {
                router.push('/admin/dashboard');
            } else if (response.user.roles.includes(UserRole.SELLER)) {
                router.push('/dashboard');
            } else {
                router.push('/');
            }
        } catch (error: any) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
            clearAuth();
            toast.success('Logged out successfully');
            router.push('/login');
        } catch (error) {
            clearAuth();
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
