/**
 * Simplified Step Definitions
 * Replaces complex step-configs with simple component-based approach
 */

import React from 'react';
import { ZodSchema } from 'zod';
import { BasicDetailsStep } from '../components/steps/BasicDetailsStep';
import { LocationStep } from '../components/steps/LocationStep';
import { AmenitiesStep } from '../components/steps/AmenitiesStep';
import {
  basicDetailsSchema,
  locationSchema,
  amenitiesSchema,
  imagesSchema,
  roomsSchema,
  policiesSchema,
  businessFeaturesSchema,
  reviewSchema,
} from '../validation/schemas';

export interface StepProps {
  onNext?: () => void;
  onPrev?: () => void;
}

export interface StepDefinition {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
  validation: ZodSchema;
  estimatedTime?: number;
}

// Placeholder components for remaining steps
const PlaceholderStep: React.FC<StepProps> = ({ onNext, onPrev }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Coming Soon</h2>
      <p className="text-gray-600">This step is under development</p>
    </div>
    
    <div className="flex justify-between pt-6 border-t border-gray-200">
      <button
        onClick={onPrev}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
      >
        Previous
      </button>
      
      <button
        onClick={onNext}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
      >
        Continue
      </button>
    </div>
  </div>
);

export const STEP_DEFINITIONS: StepDefinition[] = [
  {
    id: 'basic-details',
    title: 'Basic Details',
    description: 'Tell us about your property',
    component: BasicDetailsStep,
    validation: basicDetailsSchema,
    estimatedTime: 3,
  },
  {
    id: 'location',
    title: 'Location',
    description: 'Where is your property located?',
    component: LocationStep,
    validation: locationSchema,
    estimatedTime: 5,
  },
  {
    id: 'amenities',
    title: 'Amenities',
    description: 'What amenities do you offer?',
    component: AmenitiesStep,
    validation: amenitiesSchema,
    estimatedTime: 4,
  },
  {
    id: 'images',
    title: 'Images',
    description: 'Upload photos of your property',
    component: PlaceholderStep,
    validation: imagesSchema,
    estimatedTime: 10,
  },
  {
    id: 'rooms',
    title: 'Rooms',
    description: 'Set up your room types and pricing',
    component: PlaceholderStep,
    validation: roomsSchema,
    estimatedTime: 8,
  },
  {
    id: 'policies',
    title: 'Policies',
    description: 'Set your check-in/out times and policies',
    component: PlaceholderStep,
    validation: policiesSchema,
    estimatedTime: 5,
  },
  {
    id: 'business-features',
    title: 'Business Features',
    description: 'Configure booking and payment options',
    component: PlaceholderStep,
    validation: businessFeaturesSchema,
    estimatedTime: 4,
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Review your information and complete setup',
    component: PlaceholderStep,
    validation: reviewSchema,
    estimatedTime: 3,
  },
];

export const getStepById = (stepId: string): StepDefinition | undefined => {
  return STEP_DEFINITIONS.find(step => step.id === stepId);
};

export const getStepIndex = (stepId: string): number => {
  return STEP_DEFINITIONS.findIndex(step => step.id === stepId);
};

export const getTotalSteps = (): number => {
  return STEP_DEFINITIONS.length;
};