/**
 * Onboarding Feature Index
 * Main exports for the onboarding feature
 */

// Core unified step system
export {
  UnifiedStepComponent,
  StepRenderer,
  BasicDetailsStep,
  LocationStep,
  AmenitiesStep,
  ImagesStep,
  RoomsStep,
  PoliciesStep,
  BusinessFeaturesStep,
  ReviewStep,
} from './components';

// Configuration system
export { stepConfigs } from './config';
export type { StepConfig, FieldConfig, SelectOption, StepConfigMap } from './types/step-config';

// Hooks
export { useStepForm } from './hooks/useStepForm';
export { useOptimisticUpdates } from './hooks/useOptimisticUpdates';
export { useValidation } from './hooks/useValidation';

// Store
export { useOnboardingStore } from './store/onboarding';

// Types
export type {
  OnboardingSession,
  StepValidation,
  OnboardingStep,
  BasicDetailsData,
  LocationData,
  AmenitiesData,
  ImagesData,
  RoomData,
  RoomsData,
  PoliciesData,
  BusinessFeaturesData,
  ReviewData,
  StepData,
  OnboardingDraft,
} from './types/onboarding';

// Validation
export {
  stepSchemas,
  validateStep,
  validateField,
} from './validation/schemas';

// Examples (for development/documentation)
export { UnifiedStepExample, ExtendedFieldExample } from './components';