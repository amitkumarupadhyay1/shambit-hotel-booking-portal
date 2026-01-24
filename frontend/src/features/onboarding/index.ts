/**
 * Onboarding Feature Index
 * Main exports for the simplified onboarding feature
 */

// Core components
export { OnboardingFlow } from './components/OnboardingFlow';

// Step components
export { BasicDetailsStep } from './components/steps/BasicDetailsStep';
export { LocationStep } from './components/steps/LocationStep';
export { AmenitiesStep } from './components/steps/AmenitiesStep';

// Configuration system
export { STEP_DEFINITIONS, getStepById, getStepIndex, getTotalSteps } from './config/step-definitions';
export type { StepDefinition, StepProps } from './config/step-definitions';

// Hooks
export { useStepForm } from './hooks/useStepForm';

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
  validateOnboardingData,
} from './validation/schemas';
export type { ValidationResult } from './validation/schemas';

// API
export { onboardingApi } from './api/onboarding';