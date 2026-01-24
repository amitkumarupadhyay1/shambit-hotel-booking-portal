/**
 * Unified Validation Schemas - Single Source of Truth
 * Consolidates: schemas.ts + onboarding.ts validation systems
 * Features: Comprehensive Indian validation patterns, 8-step onboarding flow
 */

import { z } from 'zod';

// Industry-level validation patterns
const PATTERNS = {
  // Indian phone number validation (with/without country code)
  // Supports formats: +919999999999, 919999999999, 09999999999, 9999999999
  PHONE: /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/,
  // Indian pincode validation (first digit cannot be 0, exactly 6 digits)
  PINCODE: /^[1-9][0-9]{5}$/,
  // GST number validation (optional)
  GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  // PAN number validation (optional)
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  // Website URL validation
  WEBSITE: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  // Name validation (alphanumeric with spaces, hyphens, and common symbols)
  NAME: /^[a-zA-Z0-9\s\-_&()'.]+$/,
  // Location name validation
  LOCATION_NAME: /^[a-zA-Z\s\-']+$/,
  // Bed type validation
  BED_TYPE: /^[a-zA-Z\s]+$/,
};

// Custom validation functions
const validateIndianPhone = (phone: string): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return PATTERNS.PHONE.test(cleanPhone);
};

const validatePincode = (pincode: string): boolean => {
  if (!pincode) return false;
  return PATTERNS.PINCODE.test(pincode) && pincode.length === 6;
};

// Step 1: Basic Details
export const basicDetailsSchema = z.object({
  name: z
    .string()
    .min(2, 'Property name must be at least 2 characters')
    .max(100, 'Property name cannot exceed 100 characters')
    .regex(PATTERNS.NAME, 'Property name contains invalid characters')
    .refine(
      (name) => name.trim().length >= 2,
      'Property name cannot be just spaces'
    )
    .transform((name) => name.trim()),
  
  hotelType: z.enum(['HOTEL', 'RESORT', 'GUESTHOUSE', 'HOMESTAY', 'APARTMENT']),
  
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .or(z.literal(''))
    .refine(
      (desc) => !desc || desc.trim().length >= 10 || desc.trim().length === 0,
      'Description must be at least 10 characters if provided'
    )
    .transform((desc) => desc?.trim() || ''),
});

// Step 2: Location
export const locationSchema = z.object({
  address: z
    .string()
    .min(10, 'Address must be at least 10 characters')
    .max(500, 'Address cannot exceed 500 characters')
    .refine(
      (address) => address.trim().length >= 10,
      'Address cannot be just spaces'
    )
    .transform((address) => address.trim()),
  
  city: z
    .string()
    .min(2, 'City name must be at least 2 characters')
    .max(50, 'City name cannot exceed 50 characters')
    .regex(PATTERNS.LOCATION_NAME, 'City name can only contain letters, spaces, hyphens, and apostrophes')
    .transform((city) => city.trim()),
  
  state: z
    .string()
    .min(2, 'State name must be at least 2 characters')
    .max(50, 'State name cannot exceed 50 characters')
    .regex(PATTERNS.LOCATION_NAME, 'State name can only contain letters, spaces, hyphens, and apostrophes')
    .transform((state) => state.trim()),
  
  pincode: z
    .string()
    .length(6, 'Pincode must be exactly 6 digits')
    .refine(validatePincode, 'Invalid pincode format (first digit cannot be 0)')
    .transform((pincode) => pincode.trim()),
  
  phone: z
    .string()
    .min(10, 'Phone number is required')
    .max(15, 'Phone number too long')
    .refine(validateIndianPhone, 'Invalid Indian phone number format')
    .transform((phone) => phone.replace(/[\s\-\(\)]/g, '')), // Clean format
  
  email: z
    .string()
    .refine((email) => !email || z.string().email().safeParse(email).success, 'Invalid email address')
    .optional()
    .or(z.literal(''))
    .transform((email) => email?.trim().toLowerCase() || ''),
  
  website: z
    .string()
    .optional()
    .refine(
      (website) => !website || website.trim() === '' || PATTERNS.WEBSITE.test(website),
      'Invalid website URL (must start with http:// or https://)'
    )
    .transform((website) => website?.trim() || '')
    .or(z.literal('')),
});

// Step 3: Amenities
export const amenitiesSchema = z.object({
  amenities: z.array(z.string()).min(1, 'Select at least one amenity'),
  services: z.array(z.string()).optional(),
});

// Step 4: Images
export const imagesSchema = z.object({
  images: z.array(z.object({
    url: z.string().refine((url) => z.string().url().safeParse(url).success, 'Invalid URL'),
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
    .regex(PATTERNS.NAME, 'Room name contains invalid characters')
    .refine((name) => name.trim().length >= 1, 'Room name cannot be just spaces')
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
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  // New fields from legacy
  maxOccupancy: z
    .number()
    .min(1, 'Maximum occupancy must be at least 1')
    .max(20, 'Maximum occupancy too high')
    .int()
    .optional(),
  bedCount: z
    .number()
    .min(1, 'Bed count must be at least 1')
    .int()
    .optional(),
  bedType: z
    .string()
    .regex(PATTERNS.BED_TYPE, 'Bed type contains invalid characters')
    .optional(),
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
    )
    .refine(
      (rooms) => rooms.some(room => room.basePrice >= 500),
      'At least one room should have a base price of ₹500 or more'
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

// Step 8: Review (no validation needed - just display)
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

// Validation function
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
    // For arrays or nested objects, handle specifically if needed
    if (stepId === 'rooms' && field === 'rooms') {
        // Validation for the entire rooms array
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
