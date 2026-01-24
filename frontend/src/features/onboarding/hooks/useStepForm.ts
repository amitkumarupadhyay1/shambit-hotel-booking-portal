/**
 * Enhanced Step Form Hook - Store as Single Source of Truth
 * Phase 2: Removes local state, uses store for all form operations
 * Features: Real-time validation, optimistic updates, rollback capability
 */

import { useCallback, useMemo } from 'react';
import { useOnboardingStore } from '../store/onboarding';
import { stepSchemas } from '../validation/schemas';

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
    fieldErrors, 
    stepValidations,
    updateField, 
    validateField,
    validateStep: validateStepInStore,
    rollback
  } = useOnboardingStore();
  
  // Get current step data from store (single source of truth)
  const currentStepData = useMemo(() => {
    const storeData = formData[stepId];
    return (storeData ? { ...defaultData, ...storeData } : defaultData) as T;
  }, [formData, stepId, defaultData]);

  // Get current step errors
  const currentStepErrors = useMemo(() => {
    return fieldErrors[stepId] || {};
  }, [fieldErrors, stepId]);

  // Get step validation status
  const stepValidation = useMemo(() => {
    return stepValidations[stepId] || { success: false, errors: [] };
  }, [stepValidations, stepId]);

  // Update individual field (delegates to store)
  const updateFieldValue = useCallback((field: keyof T, value: any) => {
    updateField(stepId, field as string, value);
  }, [stepId, updateField]);

  // Bulk update multiple fields
  const updateData = useCallback((newData: Partial<T>) => {
    Object.entries(newData).forEach(([field, value]) => {
      updateField(stepId, field, value);
    });
  }, [stepId, updateField]);

  // Validate individual field
  const validateFieldValue = useCallback((field: keyof T) => {
    return validateField(stepId, field as string);
  }, [stepId, validateField]);

  // Validate entire step
  const validateStep = useCallback(() => {
    return validateStepInStore(stepId);
  }, [stepId, validateStepInStore]);

  // Check if step has any errors
  const hasErrors = useMemo(() => {
    return Object.values(currentStepErrors).some(error => error && error.trim() !== '');
  }, [currentStepErrors]);

  // Check if step is valid (no errors and passes schema validation)
  const isValid = useMemo(() => {
    return !hasErrors && stepValidation.success;
  }, [hasErrors, stepValidation.success]);

  // Get specific field error
  const getFieldError = useCallback((field: keyof T) => {
    return currentStepErrors[field as string] || null;
  }, [currentStepErrors]);

  // Check if specific field is valid
  const isFieldValid = useCallback((field: keyof T) => {
    const error = getFieldError(field);
    return !error || error.trim() === '';
  }, [getFieldError]);

  return {
    // Data (single source of truth from store)
    formData: currentStepData,
    
    // Validation state
    errors: currentStepErrors,
    isValid,
    hasErrors,
    stepValidation,
    
    // Field operations
    updateField: updateFieldValue,
    updateData,
    
    // Validation operations
    validateField: validateFieldValue,
    validateStep,
    getFieldError,
    isFieldValid,
    
    // Utility
    rollback, // Rollback to last saved state
  };
}