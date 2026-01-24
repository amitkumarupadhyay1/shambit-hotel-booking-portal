/**
 * Simplified Validation System
 * Single validation layer with essential patterns only
 */

import { z } from 'zod';

// Essential validation patterns for Indian context
const PHONE_PATTERN = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validation helper functions
const validateIndianPhone = (phone: string): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return PHONE_PATTERN.test(cleanPhone);
};

const validatePincode = (pincode: string): boolean => {
  if (!pincode) return false;
  return PINCODE_PATTERN.test(pincode) && pincode.length === 6;
};

// Step 1: Basic Details
export const basicDetailsSchema = z.object({
  name: z
    .string()
    .min(2, 'Property name must be at least 2 characters')
    .max(100, 'Property name cannot exceed 100 characters')
    .transform((name) => name.trim()),
  
  hotelType: z.enum(['HOTEL', 'RESORT', 'GUESTHOUSE', 'HOMESTAY', 'APARTMENT']),
  
  description: z
    .string()
    .optional()
    .transform((desc) => desc?.trim() || ''),
});

// Step 2: Location
export const locationSchema = z.object({
  address: z
    .string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address cannot exceed 500 characters')
    .transform((address) => address.trim()),
  
  city: z
    .string()
    .min(2, 'City name must be at least 2 characters')
    .max(50, 'City name cannot exceed 50 characters')
    .transform((city) => city.trim()),
  
  state: z
    .string()
    .min(2, 'State name must be at least 2 characters')
    .max(50, 'State name cannot exceed 50 characters')
    .transform((state) => state.trim()),
  
  pincode: z
    .string()
    .length(6, 'Pincode must be exactly 6 digits')
    .refine(validatePincode, 'Invalid pincode format')
    .transform((pincode) => pincode.trim()),
  
  phone: z
    .string()
    .min(10, 'Phone number is required')
    .refine(validateIndianPhone, 'Invalid Indian phone number format')
    .transform((phone) => phone.replace(/[\s\-\(\)]/g, '')),
  
  email: z
    .string()
    .optional()
    .refine((email) => !email || EMAIL_PATTERN.test(email), 'Invalid email address')
    .transform((email) => email?.trim().toLowerCase() || ''),
  
  website: z
    .string()
    .optional()
    .refine((website) => !website || website.startsWith('http'), 'Website must start with http:// or https://')
    .transform((website) => website?.trim() || ''),
});

// Step 3: Amenities
export const amenitiesSchema = z.object({
  amenities: z.array(z.string()).min(1, 'Select at least one amenity'),
  services: z.array(z.string()).optional(),
});

// Step 4: Images
export const imagesSchema = z.object({
  images: z.array(z.object({
    url: z.string().url('Invalid image URL'),
    type: z.enum(['EXTERIOR', 'LOBBY', 'ROOM', 'AMENITY', 'OTHER']),
    caption: z.string().optional(),
  })).min(3, 'Upload at least 3 images'),
});

// Step 5: Rooms
export const roomSchema = z.object({
  name: z
    .string()
    .min(1, 'Room name is required')
    .max(100, 'Room name cannot exceed 100 characters')
    .transform((name) => name.trim()),
  type: z.enum(['SINGLE', 'DOUBLE', 'SUITE', 'FAMILY', 'DORMITORY']),
  capacity: z
    .number()
    .min(1, 'Capacity must be at least 1')
    .max(20, 'Capacity too high')
    .int('Capacity must be a whole number'),
  basePrice: z
    .number()
    .min(100, 'Base price must be at least ₹100')
    .max(100000, 'Base price cannot exceed ₹1,00,000')
    .int('Base price must be a whole number'),
  maxOccupancy: z.number().min(1).max(20).int().optional(),
  bedCount: z.number().min(1).int().optional(),
  bedType: z.string().optional(),
  roomSize: z.number().min(50).optional(),
  weekendPrice: z.number().min(100).optional(),
});

export const roomsSchema = z.object({
  rooms: z
    .array(roomSchema)
    .min(1, 'Add at least one room')
    .refine(
      (rooms) => {
        const names = rooms.map(room => room.name.toLowerCase().trim());
        return new Set(names).size === names.length;
      },
      'Room names must be unique'
    ),
});

// Step 6: Policies
export const policiesSchema = z.object({
  checkIn: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  checkOut: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  cancellationPolicy: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT']),
  childPolicy: z.string().min(1, 'Child policy is required'),
  petPolicy: z.enum(['ALLOWED', 'NOT_ALLOWED', 'ON_REQUEST']),
  smokingPolicy: z.enum(['ALLOWED', 'NOT_ALLOWED', 'DESIGNATED_AREAS']),
});

// Step 7: Business Features
export const businessFeaturesSchema = z.object({
  instantBooking: z.boolean(),
  paymentMethods: z.array(z.string()).min(1, 'Select at least one payment method'),
  languages: z.array(z.string()).min(1, 'Select at least one language'),
});

// Step 8: Review
export const reviewSchema = z.object({
  agreedToTerms: z.boolean().refine(val => val === true, 'You must agree to terms'),
});

// Step validation map
export const stepSchemas = {
  'basic-details': basicDetailsSchema,
  'location': locationSchema,
  'amenities': amenitiesSchema,
  'images': imagesSchema,
  'rooms': roomsSchema,
  'policies': policiesSchema,
  'business-features': businessFeaturesSchema,
  'review': reviewSchema,
} as const;

// Unified validation function
export function validateStep(stepId: keyof typeof stepSchemas, data: any) {
  const schema = stepSchemas[stepId];
  if (!schema) {
    return { success: false, errors: ['Invalid step'] };
  }

  try {
    schema.parse(data);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((err: z.ZodIssue) => err.message),
      };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

// Field validation for real-time feedback
export function validateField(stepId: keyof typeof stepSchemas, field: string, value: any) {
  const schema = stepSchemas[stepId];
  if (!schema) return { success: true, error: null };

  try {
    // Handle special cases
    if (stepId === 'rooms' && field === 'rooms') {
      roomsSchema.parse({ rooms: value });
      return { success: true, error: null };
    }

    // Create partial schema for single field
    const fieldSchema = (schema as any).shape[field];
    if (!fieldSchema) return { success: true, error: null };

    fieldSchema.parse(value);
    return { success: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || 'Invalid value',
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}

// Unified validation for complete onboarding data
export interface ValidationResult {
  success: boolean;
  errors: string[];
  stepErrors?: Record<string, string[]>;
}

export function validateOnboardingData(data: Record<string, any>): ValidationResult {
  const errors: string[] = [];
  const stepErrors: Record<string, string[]> = {};

  // Validate each step
  Object.entries(stepSchemas).forEach(([stepId, schema]) => {
    const stepData = data[stepId];
    if (stepData) {
      const result = validateStep(stepId as keyof typeof stepSchemas, stepData);
      if (!result.success) {
        stepErrors[stepId] = result.errors;
        errors.push(...result.errors.map(err => `${stepId}: ${err}`));
      }
    }
  });

  return {
    success: errors.length === 0,
    errors,
    stepErrors: Object.keys(stepErrors).length > 0 ? stepErrors : undefined,
  };
}
