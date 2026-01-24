/**
 * Simplified Onboarding Store - Single Source of Truth
 * Fixed useEffect loop by using useCallback for initSession
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { onboardingApi } from '../api/onboarding';

interface OnboardingState {
  // Core data only
  formData: Record<string, any>;
  currentStep: number;
  isLoading: boolean;
  errors: Record<string, string>;
  
  // Session info
  sessionId: string | null;
  isInitialized: boolean;
  
  // Actions
  initSession: (hotelId?: string) => Promise<void>;
  updateField: (stepId: string, field: string, value: any) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  saveStep: (stepId: string) => Promise<void>;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    formData: {},
    currentStep: 0,
    isLoading: false,
    errors: {},
    sessionId: null,
    isInitialized: false,

    // Initialize session - now stable reference
    initSession: async (hotelId?: string) => {
      const state = get();
      if (state.sessionId || state.isLoading || state.isInitialized) {
        return;
      }

      set({ isLoading: true });
      
      try {
        const session = await onboardingApi.createSession({ hotelId });
        set({ 
          sessionId: session.id,
          currentStep: session.currentStep || 0,
          isLoading: false,
          isInitialized: true
        });
      } catch (error) {
        console.error('Failed to initialize session:', error);
        set({ 
          isLoading: false,
          errors: { session: 'Failed to initialize onboarding session' }
        });
      }
    },

    // Update field value
    updateField: (stepId: string, field: string, value: any) => {
      const { formData } = get();
      const stepData = formData[stepId] || {};
      
      set({
        formData: {
          ...formData,
          [stepId]: {
            ...stepData,
            [field]: value
          }
        }
      });
      
      // Clear field error when value changes
      get().clearError(`${stepId}.${field}`);
    },

    // Error management
    setError: (field: string, error: string) => {
      const { errors } = get();
      set({
        errors: {
          ...errors,
          [field]: error
        }
      });
    },

    clearError: (field: string) => {
      const { errors } = get();
      const newErrors = { ...errors };
      delete newErrors[field];
      set({ errors: newErrors });
    },

    // Navigation
    nextStep: () => set(state => ({ 
      currentStep: Math.min(state.currentStep + 1, 7) 
    })),
    
    prevStep: () => set(state => ({ 
      currentStep: Math.max(state.currentStep - 1, 0) 
    })),
    
    goToStep: (step: number) => set({ 
      currentStep: Math.max(0, Math.min(step, 7)) 
    }),

    // Save step data
    saveStep: async (stepId: string) => {
      const { sessionId, formData } = get();
      if (!sessionId) throw new Error('No active session');

      set({ isLoading: true });
      
      try {
        await onboardingApi.updateStep(sessionId, stepId, formData[stepId] || {});
        set({ isLoading: false });
      } catch (error) {
        console.error('Failed to save step:', error);
        set({ 
          isLoading: false,
          errors: { [stepId]: 'Failed to save step data' }
        });
        throw error;
      }
    },

    // Reset state
    reset: () => set({
      formData: {},
      currentStep: 0,
      isLoading: false,
      errors: {},
      sessionId: null,
      isInitialized: false,
    }),
  }))
);