import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';
import { authManager } from '@/lib/auth/auth-manager';
import { useAuthStore } from '@/lib/store/auth-store';
import { User, LoginCredentials, RegisterCredentials, UserRole } from '@/types/auth';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  register: (userData: RegisterInput) => Promise<void>;
  loginWithGoogle: (credential?: string) => Promise<void>;
  logout: () => void;
  logoutGlobal: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  checkAuth: () => Promise<void>;
}

export function useAuth(): AuthState {
  // Use Zustand store for state management (memory-only now)
  const { user, isLoading, isAuthenticated, setUser, setLoading, logout: storeLogout } = useAuthStore();
  const router = useRouter();

  const login = useCallback(async (credentials: LoginInput) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login with:', credentials.email);

      const response = await authApi.login(credentials as LoginCredentials);

      // FIX: Clear AuthManager cache after successful login to prevent cached failures
      authManager.clearCache();
      await authManager.forceRefresh();
      setUser(response.user);

      toast.success(response.message || 'Login successful');

      // Redirect based on user role
      if (response.user.roles.includes(UserRole.SELLER)) {

        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router, setUser, setLoading]);

  const register = useCallback(async (userData: RegisterInput) => {
    try {
      setLoading(true);
      console.log('📝 Attempting registration for:', userData.email);

      const response = await authApi.register(userData as RegisterCredentials);

      // FIX: Clear AuthManager cache after successful registration to prevent cached failures
      authManager.clearCache();
      await authManager.forceRefresh();
      setUser(response.user);

      toast.success(response.message || 'Registration successful');

      // Redirect based on user role
      if (response.user.roles.includes(UserRole.SELLER)) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router, setUser, setLoading]);

  const loginWithGoogle = async (credential?: string) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting Google login');

      if (!credential) {
        throw new Error('Google credential is required');
      }

      const response = await authApi.googleAuth(credential);

      setUser(response.user);

      // FIX: Clear AuthManager cache after successful login to prevent cached failures
      authManager.clearCache();
      await authManager.forceRefresh();

      toast.success(response.message || 'Google login successful');

      // Redirect based on user role
      if (response.user.roles.includes(UserRole.SELLER)) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('❌ Google login error:', error);
      const message = error.response?.data?.message || error.message || 'Google login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Logging out');
      await authApi.logout();

      // Clear auth state via AuthManager
      authManager.logout();

      // Clear store state
      storeLogout();

      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      // Even if logout fails on server, clear local state
      authManager.logout();
      storeLogout();
      router.push('/login');
    }
  }, [router, storeLogout]);

  const logoutGlobal = useCallback(async () => {
    try {
      console.log('🌍 Performing global logout');
      await authApi.logoutGlobal();

      // Clear auth state via AuthManager
      authManager.logout();

      // Clear store state
      storeLogout();

      toast.success('Logged out from all devices successfully');
      router.push('/login');
    } catch (error: any) {
      console.error('❌ Global logout error:', error);
      // Even if logout fails on server, clear local state
      authManager.logout();
      storeLogout();
      router.push('/login');
    }
  }, [router, storeLogout]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.roles?.includes(role) || false;
  }, [user?.roles]);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Checking authentication status via AuthManager');

      const result = await authManager.checkAuth();

      // FIX: Set both user and isAuthenticated state properly
      if (result.isAuthenticated && result.user) {
        setUser(result.user);
        console.log('✅ Authentication check successful:', result.user.email);
      } else if (result.isAuthenticated && !result.user) {
        // Token exists but user data not yet available - set authenticated state
        useAuthStore.setState({
          user: null,
          isAuthenticated: true,
          isLoading: false
        });
        console.log('✅ Authentication check successful (token exists, user data pending)');
      } else {
        setUser(null);
        console.log('❌ Authentication check failed: No valid session');
      }
    } catch (error: any) {
      console.log('❌ Authentication check error:', error.message);
      setUser(null);

      // Don't show error toast for expected auth failures
      if (error.response?.status !== 401) {
        toast.error('Authentication check failed. Please try logging in again.');
      }
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    loginWithGoogle,
    logout,
    logoutGlobal,
    hasRole,
    checkAuth,
  };
}
