/**
 * Simplified Onboarding Flow
 * Uses new step definitions and simplified state management
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useOnboardingStore } from '../store/onboarding';
import { STEP_DEFINITIONS, getStepById } from '../config/step-definitions';

interface OnboardingFlowProps {
  hotelId?: string;
}

export function OnboardingFlow({ hotelId }: OnboardingFlowProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const {
    sessionId,
    currentStep,
    isLoading,
    errors,
    isInitialized,
    initSession,
    nextStep,
    prevStep,
    reset,
  } = useOnboardingStore();

  // Initialize session
  useEffect(() => {
    if (!sessionId && !isLoading && !isInitialized) {
      initSession(hotelId);
    }
  }, [sessionId, isLoading, isInitialized, hotelId, initSession]);

  // Handle navigation
  const handleNext = () => {
    if (currentStep < STEP_DEFINITIONS.length - 1) {
      nextStep();
    } else {
      // Final submission
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      prevStep();
    }
  };

  const handleComplete = async () => {
    try {
      if (sessionId) {
        await useOnboardingStore.getState().saveStep('review');
        toast.success('Onboarding completed successfully!');
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('Failed to complete onboarding');
    }
  };

  // Loading state
  if (isLoading && !isInitialized) {
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
  if (errors.session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
              <p className="text-gray-600 mb-4">{errors.session}</p>
              <Button onClick={() => reset()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStepDefinition = STEP_DEFINITIONS[currentStep];
  const progress = ((currentStep + 1) / STEP_DEFINITIONS.length) * 100;

  if (!currentStepDefinition) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p>Invalid step</p>
        </div>
      </div>
    );
  }

  const StepComponent = currentStepDefinition.component;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Hotel Setup
          </h1>
          <p className="text-gray-600">
            Step {currentStep + 1} of {STEP_DEFINITIONS.length}: {currentStepDefinition.title}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>Progress: {Math.round(progress)}%</span>
            {currentStepDefinition.estimatedTime && (
              <span>~{currentStepDefinition.estimatedTime} min</span>
            )}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <StepComponent 
                onNext={handleNext}
                onPrev={currentStep > 0 ? handlePrev : undefined}
              />
            </CardContent>
          </Card>
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

          <Button onClick={handleNext}>
            {currentStep === STEP_DEFINITIONS.length - 1 ? 'Complete Setup' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}