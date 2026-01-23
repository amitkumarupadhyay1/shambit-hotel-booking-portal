import { create } from 'zustand';
import { AuthState, User } from '@/types/auth';

export const useAuthStore = create<AuthState>()((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,

    setUser: (user: User | null) =>
        set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
        }),

    setLoading: (loading: boolean) =>
        set({ isLoading: loading }),

    logout: () =>
        set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        }),
}));
