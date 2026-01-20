import { useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'staff';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  register: (userData: RegisterInput) => Promise<void>;
  loginWithGoogle: (credential?: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    login: async () => {},
    register: async () => {},
    loginWithGoogle: async () => {},
    logout: () => {},
    hasRole: () => false,
  });

  const login = async (credentials: LoginInput) => {
    try {
      // Mock login - in real app, this would call your API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        name: 'Test User',
        role: 'owner',
      };

      setAuthState(prev => ({
        ...prev,
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const register = async (userData: RegisterInput) => {
    try {
      // Mock registration - in real app, this would call your API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '1',
        email: userData.email,
        name: userData.name,
        role: (userData.role as 'owner' | 'manager' | 'staff') || 'owner',
      };

      setAuthState(prev => ({
        ...prev,
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error) {
      throw new Error('Registration failed');
    }
  };

  const loginWithGoogle = async (credential?: string) => {
    try {
      // Mock Google login - in real app, this would use Google OAuth
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '1',
        email: 'google.user@example.com',
        name: 'Google User',
        role: 'owner',
      };

      setAuthState(prev => ({
        ...prev,
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error) {
      throw new Error('Google login failed');
    }
  };

  const logout = () => {
    setAuthState(prev => ({
      ...prev,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }));
  };

  const hasRole = (role: string) => {
    return authState.user?.role === role;
  };

  useEffect(() => {
    // Mock authentication check
    // In a real app, this would check for tokens, validate with server, etc.
    const checkAuth = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Mock user data
        const mockUser: User = {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'owner',
        };

        setAuthState(prev => ({
          ...prev,
          user: mockUser,
          isLoading: false,
          isAuthenticated: true,
        }));
      } catch (error) {
        setAuthState(prev => ({
          ...prev,
          user: null,
          isLoading: false,
          isAuthenticated: false,
        }));
      }
    };

    checkAuth();
  }, []);

  return {
    ...authState,
    login,
    register,
    loginWithGoogle,
    logout,
    hasRole,
  };
}