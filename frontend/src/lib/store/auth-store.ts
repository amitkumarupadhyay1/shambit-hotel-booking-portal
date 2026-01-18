import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthState, User } from '@/types/auth';

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
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
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
