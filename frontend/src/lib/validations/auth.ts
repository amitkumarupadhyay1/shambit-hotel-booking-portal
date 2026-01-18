import { z } from 'zod';
import { UserRole } from '@/types/auth';

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email address')
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(128, 'Password too long'),
});

export const registerSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name too long')
        .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
        .trim(),
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email address')
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password too long')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
            'Password must contain uppercase, lowercase, number, and special character'
        ),
    phone: z
        .string()
        .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number')
        .optional()
        .or(z.literal('')),
    role: z.nativeEnum(UserRole).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
