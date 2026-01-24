/**
 * Onboarding Flow - Main Orchestrator
 * Professional, OTA-standard onboarding experience
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/auth';

// Import hooks
import { useOnboardingSession } from '../hooks/useOnboardingSession';
import { useStepValidation } from '../hooks/useStepValidation';
import { useAutosave } from '../hooks/useAutosave';

// Import components
import { ProgressIndicator } from './ProgressIndicator';
import { StepContainer } from './StepContainer';

// Import step components
import { BasicDetailsStep } from './steps/BasicDetailsStep';
import { LocationStep } from './steps/LocationStep';
import { AmenitiesStep } from './steps/AmenitiesStep';
import { ImagesStep } from './steps/ImagesStep';
import { RoomsStep } from './steps/RoomsStep';
import { PoliciesStep } from './steps/PoliciesStep';
import { BusinessFeaturesStep } from './steps/BusinessFeaturesStep';
import { ReviewStep } from './steps/ReviewStep';

// Import types
import { 
    OnboardingStep, 
    BasicDetailsData, 
    LocationData, 
    AmenitiesData, 
    ImagesData, 
    RoomsData, 
    PoliciesData, 
    BusinessFeaturesData, 
    ReviewData 
} from '../types/onboarding';

// Import API
import { onboardingApi } from '../api/onboarding';

// Define onboarding steps
const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'basic-details',
        title: 'Basic Details',
        description: 'Property name and type',
        isOptional: false,
        estimatedTime: 3,
    },
    {
        id: 'location',
        title: 'Location',
        description: 'Address and contact information',
        isOptional: false,
        estimatedTime: 5,
    },
    {
        id: 'amenities',
        title: 'Amenities',
        description: 'Select property amenities',
        isOptional: false,
        estimatedTime: 5,
    },
    {
        id: 'images',
        title: 'Images',
        description: 'Upload property photos',
        isOptional: false,
        estimatedTime: 10,
    },
    {
        id: 'rooms',
        title: 'Rooms',
        description: 'Configure room types and pricing',
        isOptional: false,
        estimatedTime: 12,
    },
    {
        id: 'policies',
        title: 'Policies',
        description: 'Hotel policies and rules',
        isOptional: false,
        estimatedTime: 7,
    },
    {
        id: 'business-features',
        title: 'Business Features',
        description: 'Business amenities (optional)',
        isOptional: true,
        estimatedTime: 5,
    },
    {
        id: 'review',
        title: 'Review & Publish',
        description: 'Review and publish your property',
        isOptional: false,
        estimatedTime: 3,
    },
];

interface OnboardingFlowProps {
    hotelId?: string;
    className?: string;
}

export function OnboardingFlow({ hotelId, className }: OnboardingFlowProps) {
    const router = useRouter();
    const { user, isAuthenticated, hasRole, isLoading: authLoading } = useAuth();

    // Session management
    const {
        session,
        isLoading: sessionLoading,
        error: sessionError,
        draftData,
        updateStepData,
        getStepData,
        refreshSession,
        retry,
    } = useOnboardingSession(hotelId);

    // Current step state
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validation
    const { validation, validateStep, setValidation } = useStepValidation(session?.id || null);

    // Autosave
    const { isSaving, lastSaved, saveNow } = useAutosave({
        sessionId: session?.id || null,
        draftData,
        debounceMs: 2000,
        enabled: true,
    });

    const currentStep = ONBOARDING_STEPS[currentStepIndex];
    const currentStepData = getStepData(currentStep?.id);

    // Validate current step whenever data changes
    useEffect(() => {
        if (currentStep && currentStepData) {
            validateStep(currentStep.id, currentStepData);
        }
    }, [currentStep, currentStepData, validateStep]);

    /**
     * Handle step data change
     */
    const handleStepDataChange = useCallback((data: any) => {
        if (currentStep) {
            updateStepData(currentStep.id, data);
        }
    }, [currentStep, updateStepData]);

    /**
     * Handle next button click
     */
    const handleNext = useCallback(async () => {
        if (!session || !currentStep) return;

        try {
            setIsSubmitting(true);

            // Validate step
            const stepValidation = await validateStep(currentStep.id, currentStepData);

            if (!stepValidation.isValid && !currentStep.isOptional) {
                toast.error('Please fix the errors before proceeding');
                return;
            }

            // Save step to backend
            await onboardingApi.updateStep(session.id, currentStep.id, currentStepData);

            // Move to next step
            if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
                setCurrentStepIndex(prev => prev + 1);
                setValidation({ isValid: false, errors: [], warnings: [] });
                toast.success('Progress saved');
            } else {
                // Last step - complete onboarding
                await handleComplete();
            }
        } catch (error: any) {
            console.error('Failed to proceed:', error);
            toast.error(error.response?.data?.message || 'Failed to save progress');
        } finally {
            setIsSubmitting(false);
        }
    }, [session, currentStep, currentStepData, currentStepIndex, validateStep, setValidation]);

    /**
     * Handle back button click
     */
    const handleBack = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
            setValidation({ isValid: false, errors: [], warnings: [] });
        }
    }, [currentStepIndex, setValidation]);

    /**
     * Handle save draft
     */
    const handleSaveDraft = useCallback(async () => {
        await saveNow();
        toast.success('Draft saved');
    }, [saveNow]);

    /**
     * Handle onboarding completion
     */
    const handleComplete = useCallback(async () => {
        if (!session) return;

        try {
            setIsSubmitting(true);

            const result = await onboardingApi.completeOnboarding(session.id);

            toast.success('Onboarding completed successfully!');

            // Redirect to hotel dashboard
            router.push(`/seller/dashboard`);
        } catch (error: any) {
            console.error('Failed to complete onboarding:', error);
            toast.error(error.response?.data?.message || 'Failed to complete onboarding');
        } finally {
            setIsSubmitting(false);
        }
    }, [session, router]);

    /**
     * Handle edit step from review
     */
    const handleEditStep = useCallback((stepIndex: number) => {
        setCurrentStepIndex(stepIndex);
        setValidation({ isValid: false, errors: [], warnings: [] });
    }, [setValidation]);

    /**
     * Render current step component
     */
    const renderStepComponent = () => {
        if (!session) return null;

        const stepData = currentStepData || {};

        switch (currentStep.id) {
            case 'basic-details':
                return (
                    <BasicDetailsStep
                        data={stepData as BasicDetailsData}
                        onChange={handleStepDataChange}
                    />
                );

            case 'location':
                return (
                    <LocationStep
                        data={stepData as LocationData}
                        onChange={handleStepDataChange}
                    />
                );

            case 'amenities':
                return (
                    <AmenitiesStep
                        data={stepData as AmenitiesData}
                        onChange={handleStepDataChange}
                    />
                );

            case 'images':
                return (
                    <ImagesStep
                        data={stepData as ImagesData}
                        onChange={handleStepDataChange}
                        sessionId={session.id}
                    />
                );

            case 'rooms':
                return (
                    <RoomsStep
                        data={stepData as RoomsData}
                        onChange={handleStepDataChange}
                    />
                );

            case 'policies':
                return (
                    <PoliciesStep
                        data={stepData as PoliciesData}
                        onChange={handleStepDataChange}
                    />
                );

            case 'business-features':
                return (
                    <BusinessFeaturesStep
                        data={stepData as BusinessFeaturesData}
                        onChange={handleStepDataChange}
                    />
                );

            case 'review':
                return (
                    <ReviewStep
                        draftData={draftData}
                        onEditStep={handleEditStep}
                    />
                );

            default:
                return <div>Unknown step</div>;
        }
    };

    // Loading state
    if (authLoading || sessionLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Card className="w-full max-w-md">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                        <p className="text-slate-600">Initializing onboarding...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Error state
    if (sessionError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center gap-2 justify-center text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            Error
                        </CardTitle>
                        <CardDescription>{sessionError}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-3">
                        <Button onClick={retry}>Try Again</Button>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Refresh Page
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Authentication check
    if (!isAuthenticated || !hasRole(UserRole.SELLER)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle>Access Required</CardTitle>
                        <CardDescription>
                            Please log in as a hotel partner to access the onboarding process
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-3">
                        <Button onClick={() => router.push('/login?redirect=/onboarding')} className="w-full">
                            Log In
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/register?type=seller')}
                            className="w-full"
                        >
                            Register as Partner
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Main onboarding UI
    return (
        <div className={`min-h-screen bg-slate-50 py-8 px-4 ${className || ''}`}>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Property Onboarding</h1>
                    <p className="text-gray-600 mt-2">
                        Complete these steps to list your property
                    </p>
                </div>

                {/* Progress Indicator */}
                <ProgressIndicator
                    steps={ONBOARDING_STEPS}
                    currentStepIndex={currentStepIndex}
                    completedSteps={session?.completedSteps || []}
                />

                {/* Step Content */}
                <StepContainer
                    title={currentStep.title}
                    description={currentStep.description}
                    validation={validation}
                    isFirstStep={currentStepIndex === 0}
                    isLastStep={currentStepIndex === ONBOARDING_STEPS.length - 1}
                    isOptional={currentStep.isOptional}
                    onNext={handleNext}
                    onBack={handleBack}
                    onSaveDraft={handleSaveDraft}
                    isLoading={isSubmitting}
                    isSaving={isSaving}
                    lastSaved={lastSaved}
                >
                    {renderStepComponent()}
                </StepContainer>
            </div>
        </div>
    );
}
