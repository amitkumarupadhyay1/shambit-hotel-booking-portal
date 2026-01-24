/**
 * Simplified Onboarding Flow
 * Single store, no complex orchestration, clean step rendering
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingStore } from '../store/onboarding';

// Step components
import { BasicDetailsStep } from './steps/BasicDetailsStep';
import { LocationStep } from './steps/LocationStep';
import { AmenitiesStep } from './steps/AmenitiesStep';
import { ImagesStep } from './steps/ImagesStep';
import { RoomsStep } from './steps/RoomsStep';
import { PoliciesStep } from './steps/PoliciesStep';
import { BusinessFeaturesStep } from './steps/BusinessFeaturesStep';
import { ReviewStep } from './steps/ReviewStep';

const STEPS = [
  { id: 'basic-details', title: 'Basic Details', component: BasicDetailsStep },
  { id: 'location', title: 'Location', component: LocationStep },
  { id: 'amenities', title: 'Amenities', component: AmenitiesStep },
  { id: 'images', title: 'Images', component: ImagesStep },
  { id: 'rooms', title: 'Rooms', component: RoomsStep },
  { id: 'policies', title: 'Policies', component: PoliciesStep },
  { id: 'business-features', title: 'Business Features', component: BusinessFeaturesStep },
  { id: 'review', title: 'Review', component: ReviewStep },
];

interface OnboardingFlowProps {
  hotelId?: string;
}

export function OnboardingFlow({ hotelId }: OnboardingFlowProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const {
    session,
    isLoading,
    error,
    currentStep,
    isDirty,
    isSaving,
    lastSaved,
    initSession,
    saveNow,
    nextStep,
    prevStep,
    reset,
  } = useOnboardingStore();

  // Initialize session
  useEffect(() => {
    if (!session && !isLoading && !error) {
      initSession(hotelId);
    }
  }, [session, isLoading, error, hotelId, initSession]);

  // Handle save
  const handleSave = async () => {
    try {
      await saveNow();
      toast.success('Progress saved successfully');
    } catch (error) {
      toast.error('Failed to save progress');
    }
  };

  // Handle navigation
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      nextStep();
    } else {
      // Final submission
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      prevStep();
    }
  };

  const handleSubmit = async () => {
    try {
      await saveNow();
      toast.success('Onboarding completed successfully!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to complete onboarding');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Initializing onboarding...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => reset()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStepData = STEPS[currentStep];
  const StepComponent = currentStepData.component;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Hotel Setup
          </h1>
          <p className="text-gray-600">
            Step {currentStep + 1} of {STEPS.length}: {currentStepData.title}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>Progress: {Math.round(progress)}%</span>
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="text-orange-500">Unsaved changes</span>
              )}
              {isSaving && (
                <>
                  <Save className="h-4 w-4 animate-pulse" />
                  <span>Saving...</span>
                </>
              )}
              {lastSaved && !isDirty && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          <StepComponent />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving || !isDirty}
            >
              {isSaving ? (
                <>
                  <Save className="h-4 w-4 animate-pulse mr-2" />
                  Saving...
                </>
              ) : (
                'Save Progress'
              )}
            </Button>

            <Button onClick={handleNext}>
              {currentStep === STEPS.length - 1 ? 'Complete Setup' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}