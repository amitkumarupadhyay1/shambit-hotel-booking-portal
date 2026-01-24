export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  roles: UserRole[];
  isEmailVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
}

export interface AuthResponse {
  user: User;
  accessToken?: string; // Optional for refresh responses
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean; // Added for better initialization tracking
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void; // Added
  logout: () => void;
}
