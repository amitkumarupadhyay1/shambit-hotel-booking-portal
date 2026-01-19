import { z } from 'zod';

// Industry-level validation patterns
const PATTERNS = {
    // Indian phone number validation (with/without country code)
    PHONE: /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/,
    // Indian pincode validation
    PINCODE: /^[1-9][0-9]{5}$/,
    // GST number validation (optional)
    GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    // PAN number validation (optional)
    PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    // Website URL validation
    WEBSITE: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    // Room name validation (alphanumeric with spaces, hyphens, and common symbols)
    ROOM_NAME: /^[a-zA-Z0-9\s\-_&()]+$/,
    // Bed type validation
    BED_TYPE: /^[a-zA-Z\s]+$/,
};

// Custom validation functions
const validateIndianPhone = (phone: string): boolean => {
    // Remove all spaces, hyphens, and brackets
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return PATTERNS.PHONE.test(cleanPhone);
};

const validatePincode = (pincode: string): boolean => {
    return PATTERNS.PINCODE.test(pincode) && pincode.length === 6;
};

// Step 1: Basic Property Details Schema
export const step1Schema = z.object({
    name: z
        .string()
        .min(2, 'Property name must be at least 2 characters')
        .max(100, 'Property name cannot exceed 100 characters')
        .regex(/^[a-zA-Z0-9\s\-_&()'.]+$/, 'Property name contains invalid characters')
        .refine(
            (name) => name.trim().length >= 2,
            'Property name cannot be just spaces'
        )
        .transform((name) => name.trim()),
    
    hotelType: z.enum(['HOTEL', 'RESORT', 'GUEST_HOUSE', 'HOMESTAY', 'APARTMENT']),
    
    description: z
        .string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional()
        .transform((desc) => desc?.trim() || ''),
});

// Step 2: Location Details Schema
export const step2Schema = z.object({
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
        .regex(/^[a-zA-Z\s\-']+$/, 'City name can only contain letters, spaces, hyphens, and apostrophes')
        .transform((city) => city.trim()),
    
    state: z
        .string()
        .min(2, 'State name must be at least 2 characters')
        .max(50, 'State name cannot exceed 50 characters')
        .regex(/^[a-zA-Z\s\-']+$/, 'State name can only contain letters, spaces, hyphens, and apostrophes')
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
        .optional()
        .refine(
            (email) => !email || email.trim() === '' || z.string().email().safeParse(email).success,
            'Invalid email format'
        )
        .transform((email) => email?.trim().toLowerCase() || ''),
    
    website: z
        .string()
        .optional()
        .refine(
            (website) => !website || website.trim() === '' || PATTERNS.WEBSITE.test(website),
            'Invalid website URL (must start with http:// or https://)'
        )
        .transform((website) => website?.trim() || ''),
});

// Step 3: Room Details Schema
export const roomSchema = z.object({
    name: z
        .string()
        .min(1, 'Room name is required')
        .max(100, 'Room name cannot exceed 100 characters')
        .regex(PATTERNS.ROOM_NAME, 'Room name contains invalid characters')
        .refine(
            (name) => name.trim().length >= 1,
            'Room name cannot be just spaces'
        )
        .transform((name) => name.trim()),
    
    roomType: z.enum(['SINGLE', 'DOUBLE', 'DELUXE', 'SUITE', 'FAMILY']),
    
    basePrice: z
        .number()
        .min(100, 'Base price must be at least ₹100')
        .max(100000, 'Base price cannot exceed ₹1,00,000')
        .int('Base price must be a whole number'),
    
    maxOccupancy: z
        .number()
        .min(1, 'Maximum occupancy must be at least 1 person')
        .max(20, 'Maximum occupancy cannot exceed 20 people')
        .int('Maximum occupancy must be a whole number'),
    
    bedCount: z
        .number()
        .min(1, 'Bed count must be at least 1')
        .max(10, 'Bed count cannot exceed 10')
        .int('Bed count must be a whole number'),
    
    bedType: z
        .string()
        .min(2, 'Bed type is required')
        .max(50, 'Bed type cannot exceed 50 characters')
        .regex(PATTERNS.BED_TYPE, 'Bed type can only contain letters and spaces')
        .refine(
            (bedType) => bedType.trim().length >= 2,
            'Bed type cannot be just spaces'
        )
        .transform((bedType) => bedType.trim()),
    
    // Optional fields for future enhancement
    description: z
        .string()
        .max(500, 'Room description cannot exceed 500 characters')
        .optional()
        .transform((desc) => desc?.trim() || ''),
    
    weekendPrice: z
        .number()
        .min(100, 'Weekend price must be at least ₹100')
        .max(100000, 'Weekend price cannot exceed ₹1,00,000')
        .int('Weekend price must be a whole number')
        .optional(),
    
    roomSize: z
        .number()
        .min(50, 'Room size must be at least 50 sq ft')
        .max(5000, 'Room size cannot exceed 5000 sq ft')
        .int('Room size must be a whole number')
        .optional(),
    
    amenities: z
        .array(z.string().min(1, 'Amenity name cannot be empty'))
        .max(20, 'Cannot have more than 20 amenities')
        .optional(),
    
    images: z
        .array(z.string().url('Invalid image URL'))
        .max(10, 'Cannot have more than 10 images')
        .optional(),
});

export const step3Schema = z.object({
    rooms: z
        .array(roomSchema)
        .min(1, 'At least one room type is required')
        .max(20, 'Cannot have more than 20 room types')
        .refine(
            (rooms) => {
                const names = rooms.map(room => room.name.toLowerCase());
                return new Set(names).size === names.length;
            },
            'Room names must be unique'
        )
        .refine(
            (rooms) => {
                // Ensure at least one room has reasonable pricing
                return rooms.some(room => room.basePrice >= 500);
            },
            'At least one room should have a base price of ₹500 or more'
        ),
});

// Complete onboarding schema
export const onboardingSchema = z.object({
    hotel: step1Schema.merge(step2Schema),
    rooms: step3Schema.shape.rooms,
});

// Type exports
export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type RoomData = z.infer<typeof roomSchema>;
export type OnboardingData = z.infer<typeof onboardingSchema>;

// Validation helper functions
export const validateStep1 = (data: any): { success: boolean; errors: Record<string, string>; data?: Step1Data } => {
    const result = step1Schema.safeParse(data);
    if (result.success) {
        return { success: true, errors: {}, data: result.data };
    }
    
    const errors: Record<string, string> = {};
    result.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
    });
    
    return { success: false, errors };
};

export const validateStep2 = (data: any): { success: boolean; errors: Record<string, string>; data?: Step2Data } => {
    const result = step2Schema.safeParse(data);
    if (result.success) {
        return { success: true, errors: {}, data: result.data };
    }
    
    const errors: Record<string, string> = {};
    result.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
    });
    
    return { success: false, errors };
};

export const validateStep3 = (data: any): { success: boolean; errors: Record<string, string>; data?: Step3Data } => {
    const result = step3Schema.safeParse(data);
    if (result.success) {
        return { success: true, errors: {}, data: result.data };
    }
    
    const errors: Record<string, string> = {};
    result.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
    });
    
    return { success: false, errors };
};

// Real-time field validation helpers
export const validateField = (fieldName: string, value: any, step: 1 | 2 | 3): string | null => {
    try {
        let schema: any;
        switch (step) {
            case 1:
                schema = step1Schema;
                break;
            case 2:
                schema = step2Schema;
                break;
            case 3:
                // For step 3, we need to handle room field validation differently
                return null; // Handle room validation separately
            default:
                return null;
        }
        
        const fieldSchema = (schema as any).shape[fieldName];
        if (fieldSchema) {
            fieldSchema.parse(value);
            return null; // No error
        }
        return null;
    } catch (error: any) {
        if (error.issues && error.issues[0]) {
            return error.issues[0].message;
        }
        return 'Invalid value';
    }
};

// Room field validation helper
export const validateRoomField = (fieldName: string, value: any, roomIndex: number): string | null => {
    try {
        const fieldSchema = (roomSchema as any).shape[fieldName];
        if (fieldSchema) {
            fieldSchema.parse(value);
            return null; // No error
        }
        return null;
    } catch (error: any) {
        if (error.issues && error.issues[0]) {
            return error.issues[0].message;
        }
        return 'Invalid value';
    }
};