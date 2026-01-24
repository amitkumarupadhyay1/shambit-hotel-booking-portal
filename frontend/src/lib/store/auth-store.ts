import { create } from 'zustand';
import { AuthState, User, UserRole } from '@/types/auth';

// Enhanced auth state interface
interface EnhancedAuthState extends AuthState {
    // Auth status
    isInitialized: boolean;
    lastAuthCheck: number;
    
    // Actions
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setInitialized: (initialized: boolean) => void;
    logout: () => void;
    
    // Computed getters
    hasRole: (role: UserRole) => boolean;
    isTokenValid: () => boolean;
}

export const useAuthStore = create<EnhancedAuthState>()((set, get) => ({
    // State
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    lastAuthCheck: 0,

    // Actions
    setUser: (user: User | null) =>
        set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
            isInitialized: true,
            lastAuthCheck: Date.now(),
        }),

    setLoading: (loading: boolean) =>
        set({ isLoading: loading }),

    setInitialized: (initialized: boolean) =>
        set({ isInitialized: initialized }),

    logout: () =>
        set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            lastAuthCheck: 0,
        }),

    // Computed getters
    hasRole: (role: UserRole) => {
        const { user } = get();
        return user?.roles?.includes(role) || false;
    },

    isTokenValid: () => {
        const { lastAuthCheck } = get();
        const now = Date.now();
        const CACHE_DURATION = 30000; // 30 seconds
        return now - lastAuthCheck < CACHE_DURATION;
    },
}));
