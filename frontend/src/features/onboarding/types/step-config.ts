/**
 * Step Configuration Types
 * Defines the structure for configuration-driven step components
 */

import { ZodSchema } from 'zod';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface FieldConfig {
  name: string;
  type: 'text' | 'select' | 'textarea' | 'checkbox' | 'number' | 'time' | 'multiselect' | 'array';
  label: string;
  placeholder?: string;
  description?: string;
  options?: SelectOption[];
  required?: boolean;
  min?: number;
  max?: number;
  rows?: number; // for textarea
  step?: number; // for number inputs
  prefix?: string; // for display (e.g., "₹" for price)
  suffix?: string; // for display (e.g., "sq ft" for area)
  validation?: {
    pattern?: RegExp;
    message?: string;
  };
  // For array fields (like rooms)
  arrayConfig?: {
    itemFields: FieldConfig[];
    addButtonText: string;
    removeButtonText?: string;
    minItems?: number;
    maxItems?: number;
  };
  // Conditional display
  showWhen?: {
    field: string;
    value: any;
  };
}

export interface StepConfig {
  id: string;
  title: string;
  description: string;
  fields: FieldConfig[];
  validation: ZodSchema;
  estimatedTime?: number; // in minutes
  isOptional?: boolean;
  completionHint?: string;
  sections?: {
    title: string;
    description?: string;
    fields: string[]; // field names in this section
  }[];
}

export interface StepConfigMap {
  [stepId: string]: StepConfig;
}