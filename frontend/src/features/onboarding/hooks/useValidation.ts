/**
 * Validation Utilities Hook
 * Phase 2: Centralized validation logic with real-time feedback
 * Features: Field validation, step validation, error management
 */

import { useCallback, useMemo } from 'react';
import { useOnboardingStore } from '../store/onboarding';
import { stepSchemas } from '../validation/schemas';

export function useValidation() {
  const { 
    formData, 
    fieldErrors, 
    stepValidations,
    validateField,
    validateStep 
  } = useOnboardingStore();

  // Get all validation errors across all steps
  const allErrors = useMemo(() => {
    const errors: Record<string, Record<string, string>> = {};
    Object.entries(fieldErrors).forEach(([stepId, stepErrors]) => {
      const nonEmptyErrors = Object.entries(stepErrors).filter(([_, error]) => 
        error && error.trim() !== ''
      );
      if (nonEmptyErrors.length > 0) {
        errors[stepId] = Object.fromEntries(nonEmptyErrors);
      }
    });
    return errors;
  }, [fieldErrors]);

  // Check if any step has errors
  const hasAnyErrors = useMemo(() => {
    return Object.keys(allErrors).length > 0;
  }, [allErrors]);

  // Get total error count
  const totalErrorCount = useMemo(() => {
    return Object.values(allErrors).reduce((total, stepErrors) => 
      total + Object.keys(stepErrors).length, 0
    );
  }, [allErrors]);

  // Validate all steps
  const validateAllSteps = useCallback(() => {
    const results: Record<string, { success: boolean; errors: string[] }> = {};
    
    Object.keys(stepSchemas).forEach(stepId => {
      if (formData[stepId]) {
        results[stepId] = validateStep(stepId);
      }
    });
    
    return results;
  }, [formData, validateStep]);

  // Get validation summary
  const getValidationSummary = useCallback(() => {
    const summary = {
      totalSteps: Object.keys(stepSchemas).length,
      completedSteps: 0,
      validSteps: 0,
      stepsWithErrors: 0,
      totalErrors: totalErrorCount,
    };

    Object.keys(stepSchemas).forEach(stepId => {
      if (formData[stepId]) {
        summary.completedSteps++;
        
        const validation = stepValidations[stepId];
        if (validation?.success) {
          summary.validSteps++;
        } else if (allErrors[stepId]) {
          summary.stepsWithErrors++;
        }
      }
    });

    return summary;
  }, [formData, stepValidations, allErrors, totalErrorCount]);

  // Check if specific step is valid
  const isStepValid = useCallback((stepId: string) => {
    const validation = stepValidations[stepId];
    const hasFieldErrors = allErrors[stepId] && Object.keys(allErrors[stepId]).length > 0;
    return validation?.success && !hasFieldErrors;
  }, [stepValidations, allErrors]);

  // Get step completion percentage
  const getStepCompletionPercentage = useCallback((stepId: string) => {
    const stepData = formData[stepId];
    if (!stepData) return 0;

    const schema = stepSchemas[stepId as keyof typeof stepSchemas];
    if (!schema) return 0;

    // Count filled fields vs required fields
    const schemaShape = (schema as any).shape || {};
    const requiredFields = Object.keys(schemaShape);
    const filledFields = Object.entries(stepData as Record<string, any>).filter(([_, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'boolean') return true;
      if (typeof value === 'number') return !isNaN(value);
      return value != null;
    });

    return Math.round((filledFields.length / requiredFields.length) * 100);
  }, [formData]);

  // Get field validation status
  const getFieldValidationStatus = useCallback((stepId: string, field: string) => {
    const fieldError = fieldErrors[stepId]?.[field];
    const hasError = fieldError && fieldError.trim() !== '';
    const stepData = formData[stepId] as Record<string, any>;
    const hasValue = stepData && stepData[field] != null && stepData[field] !== '';

    return {
      hasError,
      hasValue,
      isValid: hasValue && !hasError,
      error: fieldError || null,
    };
  }, [fieldErrors, formData]);

  return {
    // Error state
    allErrors,
    hasAnyErrors,
    totalErrorCount,
    
    // Validation functions
    validateField,
    validateStep,
    validateAllSteps,
    isStepValid,
    
    // Utility functions
    getValidationSummary,
    getStepCompletionPercentage,
    getFieldValidationStatus,
  };
}