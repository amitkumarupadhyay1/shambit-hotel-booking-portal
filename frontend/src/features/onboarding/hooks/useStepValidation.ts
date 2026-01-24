/**
 * Step Validation Hook
 * Handles validation for onboarding steps using Zod schemas
 */

import { useState, useCallback } from 'react';
import { StepValidation } from '../types/onboarding';
import { onboardingApi } from '../api/onboarding';
import { 
    validateStep1, 
    validateStep2, 
    validateStep3,
    validateField,
    validateRoomField
} from '@/lib/validations/onboarding';

export function useStepValidation(sessionId: string | null) {
    const [validation, setValidation] = useState<StepValidation>({
        isValid: false,
        errors: [],
        warnings: [],
    });
    const [isValidating, setIsValidating] = useState(false);

    /**
     * Validate step data locally using Zod schemas
     */
    const validateLocally = useCallback((stepId: string, data: any): StepValidation => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Step-specific validation using Zod schemas
        switch (stepId) {
            case 'basic-details': {
                const result = validateStep1(data);
                if (!result.success) {
                    Object.values(result.errors).forEach(error => errors.push(error));
                }
                break;
            }

            case 'location': {
                const result = validateStep2(data);
                if (!result.success) {
                    Object.values(result.errors).forEach(error => errors.push(error));
                }
                break;
            }

            case 'amenities':
                if (!data.selectedAmenities || data.selectedAmenities.length === 0) {
                    errors.push('Please select at least one amenity');
                } else if (data.selectedAmenities.length < 3) {
                    warnings.push('Consider adding more amenities to attract guests');
                }
                break;

            case 'images':
                if (!data.images || data.images.length === 0) {
                    errors.push('Please upload at least one property image');
                } else if (data.images.length < 5) {
                    warnings.push('Consider uploading more images to showcase your property');
                }
                break;

            case 'rooms': {
                const result = validateStep3(data);
                if (!result.success) {
                    Object.values(result.errors).forEach(error => errors.push(error));
                }
                break;
            }

            case 'policies':
                if (!data.checkInTime) errors.push('Check-in time is required');
                if (!data.checkOutTime) errors.push('Check-out time is required');
                if (!data.cancellationPolicy) errors.push('Cancellation policy is required');
                if (!data.petPolicy) errors.push('Pet policy is required');
                if (!data.smokingPolicy) errors.push('Smoking policy is required');
                break;

            case 'business-features':
                // Optional step - no required fields
                if (data.meetingRooms && data.meetingRooms.length > 0) {
                    data.meetingRooms.forEach((room: any, index: number) => {
                        if (!room.name) errors.push(`Meeting room ${index + 1} name is required`);
                        if (!room.capacity || room.capacity < 1) errors.push(`Meeting room ${index + 1} capacity must be at least 1`);
                    });
                }
                break;

            case 'review':
                // Review step - no validation needed
                break;

            default:
                warnings.push('Unknown step - validation skipped');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }, []);

    /**
     * Validate field in real-time
     */
    const validateFieldLocally = useCallback((stepId: string, fieldName: string, value: any): string | null => {
        switch (stepId) {
            case 'basic-details':
                return validateField(fieldName, value, 1);
            case 'location':
                return validateField(fieldName, value, 2);
            case 'rooms':
                // For rooms, we need to handle array validation differently
                return null; // Handle in component
            default:
                return null;
        }
    }, []);

    /**
     * Validate room field in real-time
     */
    const validateRoomFieldLocally = useCallback((fieldName: string, value: any, roomIndex: number): string | null => {
        return validateRoomField(fieldName, value, roomIndex);
    }, []);

    /**
     * Validate step data with backend
     */
    const validateWithBackend = useCallback(async (stepId: string, data: any): Promise<StepValidation> => {
        if (!sessionId) {
            return { isValid: false, errors: ['No session available'], warnings: [] };
        }

        try {
            setIsValidating(true);
            
            const response = await onboardingApi.validateStep(sessionId, stepId, data);
            
            return {
                isValid: response.isValid,
                errors: response.errors || [],
                warnings: response.warnings || [],
            };
        } catch (error: any) {
            console.error('Backend validation failed:', error);
            
            // Fallback to local validation if backend fails
            return validateLocally(stepId, data);
        } finally {
            setIsValidating(false);
        }
    }, [sessionId, validateLocally]);

    /**
     * Comprehensive validation (local + backend)
     */
    const validateStep = useCallback(async (stepId: string, data: any): Promise<StepValidation> => {
        // First, validate locally for immediate feedback
        const localValidation = validateLocally(stepId, data);
        
        // If local validation fails, return immediately
        if (!localValidation.isValid) {
            setValidation(localValidation);
            return localValidation;
        }

        // If local validation passes, validate with backend
        const backendValidation = await validateWithBackend(stepId, data);
        
        // Combine local warnings with backend validation
        const combinedValidation = {
            isValid: backendValidation.isValid,
            errors: backendValidation.errors,
            warnings: [...localValidation.warnings, ...backendValidation.warnings],
        };

        setValidation(combinedValidation);
        return combinedValidation;
    }, [validateLocally, validateWithBackend]);

    return {
        validation,
        isValidating,
        validateStep,
        validateLocally,
        validateFieldLocally,
        validateRoomFieldLocally,
        setValidation,
    };
}