/**
 * Simplified Step Form Hook
 * Works with the simplified onboarding store
 */

import { useCallback, useMemo } from 'react';
import { useOnboardingStore } from '../store/onboarding';
import { validateStep, validateField, stepSchemas } from '../validation/schemas';

interface UseStepFormOptions<T> {
  stepId: keyof typeof stepSchemas;
  defaultData: T;
}

export function useStepForm<T extends Record<string, any>>({ 
  stepId, 
  defaultData 
}: UseStepFormOptions<T>) {
  const { 
    formData, 
    errors,
    updateField, 
    setError,
    clearError,
    saveStep
  } = useOnboardingStore();
  
  // Get current step data from store
  const currentStepData = useMemo(() => {
    const storeData = formData[stepId];
    return (storeData ? { ...defaultData, ...storeData } : defaultData) as T;
  }, [formData, stepId, defaultData]);

  // Update individual field
  const updateFieldValue = useCallback((field: keyof T, value: any) => {
    updateField(stepId, field as string, value);
  }, [stepId, updateField]);

  // Validate individual field
  const validateFieldValue = useCallback((field: keyof T) => {
    const value = currentStepData[field];
    const validation = validateField(stepId, field as string, value);
    
    if (!validation.success && validation.error) {
      setError(`${stepId}.${field as string}`, validation.error);
    } else {
      clearError(`${stepId}.${field as string}`);
    }
    
    return validation;
  }, [stepId, currentStepData, setError, clearError]);

  // Validate entire step
  const validateStepData = useCallback(() => {
    const validation = validateStep(stepId, currentStepData);
    
    if (!validation.success) {
      // Set general step error
      setError(stepId, validation.errors.join(', '));
    } else {
      clearError(stepId);
    }
    
    return validation;
  }, [stepId, currentStepData, setError, clearError]);

  // Get specific field error
  const getFieldError = useCallback((field: keyof T) => {
    return errors[`${stepId}.${field as string}`] || null;
  }, [errors, stepId]);

  // Check if specific field is valid
  const isFieldValid = useCallback((field: keyof T) => {
    const error = getFieldError(field);
    return !error;
  }, [getFieldError]);

  // Save step
  const save = useCallback(async () => {
    const validation = validateStepData();
    if (validation.success) {
      await saveStep(stepId);
    }
    return validation;
  }, [validateStepData, saveStep, stepId]);

  // Rollback (simplified - just clear errors)
  const rollback = useCallback(() => {
    clearError(stepId);
    Object.keys(currentStepData).forEach(field => {
      clearError(`${stepId}.${field}`);
    });
  }, [stepId, currentStepData, clearError]);

  return {
    // Data
    formData: currentStepData,
    
    // Validation state
    errors: errors,
    
    // Field operations
    updateField: updateFieldValue,
    
    // Validation operations
    validateField: validateFieldValue,
    validateStep: validateStepData,
    getFieldError,
    isFieldValid,
    
    // Actions
    save,
    rollback,
  };
}