/**
 * Onboarding Components Index
 * Exports all onboarding components with clean imports
 */

// Core unified system
export { UnifiedStepComponent } from './UnifiedStepComponent';
export { StepRenderer } from './StepRenderer';

// Backward compatible step components (now powered by unified system)
export {
  BasicDetailsStep,
  LocationStep,
  AmenitiesStep,
  ImagesStep,
  RoomsStep,
  PoliciesStep,
  BusinessFeaturesStep,
  ReviewStep,
} from './StepRenderer';

// Examples and documentation
export { UnifiedStepExample, ExtendedFieldExample } from './steps/UnifiedStepExample';

// Legacy example (for comparison with old approach)
export { BasicDetailsStep as LegacyBasicDetailsStep } from './steps/BasicDetailsStep.example';