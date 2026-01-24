import { useCallback, useEffect } from 'react';
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
  isInitialized: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  register: (userData: RegisterInput) => Promise<void>;
  loginWithGoogle: (credential?: string) => Promise<void>;
  logout: () => void;
  logoutGlobal: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  checkAuth: () => Promise<void>;
}

/**
 * Simplified useAuth hook - Facade over Zustand store + AuthManager
 * 
 * This hook provides a clean interface while delegating:
 * - State management to Zustand store
 * - API operations to AuthManager
 * - Auth operations to authApi
 */
export function useAuth(): AuthState {
  // Get state from Zustand store (single source of truth)
  const {
    user,
    isLoading,
    isAuthenticated,
    isInitialized,
    setUser,
    setLoading,
    logout: storeLogout,
    hasRole,
  } = useAuthStore();

  const router = useRouter();

  const login = useCallback(async (credentials: LoginInput) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login with:', credentials.email);

      const response = await authApi.login(credentials as LoginCredentials);

      // Clear AuthManager cache after successful login
      authManager.clearCache();
      await authManager.forceRefresh();
      
      // Update store
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

      // Clear AuthManager cache after successful registration
      authManager.clearCache();
      await authManager.forceRefresh();
      
      // Update store
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

      // Clear AuthManager cache after successful login
      authManager.clearCache();
      await authManager.forceRefresh();
      
      // Update store
      setUser(response.user);

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

      // Clear auth state via AuthManager (also updates store)
      authManager.logout();

      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      // Even if logout fails on server, clear local state
      authManager.logout();
      router.push('/login');
    }
  }, [router]);

  const logoutGlobal = useCallback(async () => {
    try {
      console.log('🌍 Performing global logout');
      await authApi.logoutGlobal();

      // Clear auth state via AuthManager (also updates store)
      authManager.logout();

      toast.success('Logged out from all devices successfully');
      router.push('/login');
    } catch (error: any) {
      console.error('❌ Global logout error:', error);
      // Even if logout fails on server, clear local state
      authManager.logout();
      router.push('/login');
    }
  }, [router]);

  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking authentication status via AuthManager');
      
      // AuthManager will update the store directly
      await authManager.checkAuth();
      
      console.log('✅ Authentication check completed');
    } catch (error: any) {
      console.log('❌ Authentication check error:', error.message);

      // Don't show error toast for expected auth failures
      if (error.response?.status !== 401) {
        toast.error('Authentication check failed. Please try logging in again.');
      }
    }
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [checkAuth, isInitialized]);

  return {
    user,
    isLoading,
    isAuthenticated,
    isInitialized,
    login,
    register,
    loginWithGoogle,
    logout,
    logoutGlobal,
    hasRole,
    checkAuth,
  };
}
