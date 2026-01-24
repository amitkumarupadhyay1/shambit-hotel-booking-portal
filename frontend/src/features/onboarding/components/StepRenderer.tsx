/**
 * Step Renderer
 * Wrapper component that renders the appropriate step using UnifiedStepComponent
 * Replaces all individual step components
 */

import React from 'react';
import { UnifiedStepComponent } from './UnifiedStepComponent';
import { stepConfigs } from '../config/step-configs';

interface StepRendererProps {
  stepId: string;
  defaultData?: any;
}

export function StepRenderer({ stepId, defaultData }: StepRendererProps) {
  const config = stepConfigs[stepId];

  if (!config) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-lg font-medium">
          Step configuration not found
        </div>
        <p className="text-gray-600 mt-2">
          The step "{stepId}" is not configured properly.
        </p>
      </div>
    );
  }

  return (
    <UnifiedStepComponent 
      config={config} 
      defaultData={defaultData} 
    />
  );
}

// Export individual step components for backward compatibility
export const BasicDetailsStep = (props: { defaultData?: any }) => (
  <StepRenderer stepId="basic-details" {...props} />
);

export const LocationStep = (props: { defaultData?: any }) => (
  <StepRenderer stepId="location" {...props} />
);

export const AmenitiesStep = (props: { defaultData?: any }) => (
  <StepRenderer stepId="amenities" {...props} />
);

export const ImagesStep = (props: { defaultData?: any }) => (
  <StepRenderer stepId="images" {...props} />
);

export const RoomsStep = (props: { defaultData?: any }) => (
  <StepRenderer stepId="rooms" {...props} />
);

export const PoliciesStep = (props: { defaultData?: any }) => (
  <StepRenderer stepId="policies" {...props} />
);

export const BusinessFeaturesStep = (props: { defaultData?: any }) => (
  <StepRenderer stepId="business-features" {...props} />
);

export const ReviewStep = (props: { defaultData?: any }) => (
  <StepRenderer stepId="review" {...props} />
);