/**
 * Enhanced Onboarding Store - Single Source of Truth
 * Phase 2: Implements field-level validation, optimistic updates, and rollback
 * Replaces: onboarding-store.ts, session-manager.ts, useOnboardingSession.ts
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { onboardingApi } from '../api/onboarding';
import { OnboardingSession, OnboardingDraft, StepData } from '../types/onboarding';
import { validateStep, validateField, stepSchemas } from '../validation/schemas';

interface ValidationResult {
  success: boolean;
  errors: string[];
}

interface FieldValidation {
  error: string | null;
  isValid: boolean;
}

interface OnboardingState {
  // Session
  session: OnboardingSession | null;
  isLoading: boolean;
  error: string | null;

  // Single source of truth - form data
  formData: OnboardingDraft;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;

  // Validation state
  stepValidations: Record<string, ValidationResult>;
  fieldErrors: Record<string, Record<string, string>>;

  // Navigation
  currentStep: number;
  completedSteps: Set<string>;

  // Optimistic updates
  pendingUpdates: Record<string, any>;
  rollbackData: OnboardingDraft | null;

  // Enhanced Actions - Single source of truth
  initSession: (hotelId?: string) => Promise<void>;
  updateField: (stepId: string, field: string, value: any) => void;
  validateField: (stepId: string, field: string) => FieldValidation;
  validateStep: (stepId: string) => ValidationResult;
  saveNow: () => Promise<void>;
  
  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  markStepComplete: (stepId: string) => void;
  
  // Utility
  reset: () => void;
  rollback: () => void;
}

// Auto-save timeout
let autoSaveTimeout: NodeJS.Timeout | null = null;

export const useOnboardingStore = create<OnboardingState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    session: null,
    isLoading: false,
    error: null,
    formData: {},
    isDirty: false,
    isSaving: false,
    lastSaved: null,
    currentStep: 0,
    completedSteps: new Set(),
    stepValidations: {},
    fieldErrors: {},
    pendingUpdates: {},
    rollbackData: null,

    // Initialize session
    initSession: async (hotelId?: string) => {
      const { session, isLoading } = get();
      if (session || isLoading) return;

      set({ isLoading: true, error: null });
      
      try {
        const sessionData = await onboardingApi.createSession({ hotelId });
        set({ 
          session: sessionData, 
          formData: {}, // Initialize with empty form data
          isLoading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to initialize session',
          isLoading: false 
        });
      }
    },

    // Enhanced field update with validation and optimistic updates
    updateField: (stepId: string, field: string, value: any) => {
      const { formData, fieldErrors } = get();
      
      // Create optimistic update
      const currentStepData = formData[stepId] || {};
      const newStepData = { ...currentStepData, [field]: value };
      const newFormData = { ...formData, [stepId]: newStepData };

      // Store rollback data before first change
      if (!get().rollbackData) {
        set({ rollbackData: formData });
      }

      // Validate field in real-time
      const fieldValidation = get().validateField(stepId, field);
      const newFieldErrors = {
        ...fieldErrors,
        [stepId]: {
          ...fieldErrors[stepId],
          [field]: fieldValidation.error || ''
        }
      };

      // Update state optimistically
      set({
        formData: newFormData,
        fieldErrors: newFieldErrors,
        isDirty: true,
        pendingUpdates: { ...get().pendingUpdates, [`${stepId}.${field}`]: value }
      });

      // Schedule auto-save
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(() => {
        get().saveNow().catch(error => {
          console.error('Auto-save failed:', error);
          // Could trigger rollback here if needed
        });
      }, 2000);
    },

    // Field validation
    validateField: (stepId: string, field: string): FieldValidation => {
      const { formData } = get();
      const stepData = formData[stepId];
      
      if (!stepData || !(field in stepData)) {
        return { error: null, isValid: true };
      }

      const validation = validateField(stepId as keyof typeof stepSchemas, field, (stepData as any)[field]);
      return {
        error: validation.error,
        isValid: validation.success
      };
    },

    // Step validation
    validateStep: (stepId: string): ValidationResult => {
      const { formData, stepValidations } = get();
      const stepData = formData[stepId];
      
      if (!stepData) {
        return { success: false, errors: ['No data for this step'] };
      }

      const validation = validateStep(stepId as keyof typeof stepSchemas, stepData);
      
      // Update step validation cache
      set({
        stepValidations: {
          ...stepValidations,
          [stepId]: validation
        }
      });

      return validation;
    },

    // Save with optimistic updates and rollback capability
    saveNow: async () => {
      const { session, formData, isSaving, rollbackData } = get();
      if (!session || isSaving) return;

      set({ isSaving: true, error: null });
      
      try {
        await onboardingApi.saveDraft(session.id, formData);
        set({ 
          isDirty: false, 
          isSaving: false, 
          lastSaved: new Date(),
          pendingUpdates: {},
          rollbackData: null // Clear rollback data on successful save
        });
      } catch (error) {
        set({ 
          isSaving: false,
          error: error instanceof Error ? error.message : 'Save failed'
        });
        
        // Optionally rollback on save failure
        if (rollbackData) {
          console.warn('Save failed, rollback available');
        }
        
        throw error;
      }
    },

    // Rollback to last saved state
    rollback: () => {
      const { rollbackData } = get();
      if (rollbackData) {
        set({
          formData: rollbackData,
          rollbackData: null,
          pendingUpdates: {},
          isDirty: false,
          fieldErrors: {}
        });
      }
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

    markStepComplete: (stepId: string) => set(state => ({
      completedSteps: new Set([...state.completedSteps, stepId])
    })),

    // Reset
    reset: () => {
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
      set({
        session: null,
        isLoading: false,
        error: null,
        formData: {},
        isDirty: false,
        isSaving: false,
        lastSaved: null,
        currentStep: 0,
        completedSteps: new Set(),
        stepValidations: {},
        fieldErrors: {},
        pendingUpdates: {},
        rollbackData: null,
      });
    },
  }))
);