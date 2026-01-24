/**
 * Step Container Component
 * Wrapper for each onboarding step with navigation and validation display
 */

'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { StepValidation } from '../types/onboarding';

interface StepContainerProps {
    title: string;
    description: string;
    children: React.ReactNode;
    validation: StepValidation;
    isFirstStep: boolean;
    isLastStep: boolean;
    isOptional?: boolean;
    onNext: () => void;
    onBack: () => void;
    onSaveDraft?: () => void;
    isLoading?: boolean;
    isSaving?: boolean;
    lastSaved?: Date | null;
    className?: string;
}

export function StepContainer({
    title,
    description,
    children,
    validation,
    isFirstStep,
    isLastStep,
    isOptional = false,
    onNext,
    onBack,
    onSaveDraft,
    isLoading = false,
    isSaving = false,
    lastSaved,
    className,
}: StepContainerProps) {
    const canProceed = validation.isValid || isOptional;

    return (
        <div className={cn('w-full max-w-4xl mx-auto', className)}>
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-2xl">
                                {title}
                                {isOptional && (
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                        (Optional)
                                    </span>
                                )}
                            </CardTitle>
                            <CardDescription className="mt-2">{description}</CardDescription>
                        </div>

                        {/* Autosave indicator */}
                        {lastSaved && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                {isSaving ? (
                                    <>
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        <span>
                                            Saved {new Date(lastSaved).toLocaleTimeString()}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Validation errors */}
                    {validation.errors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <ul className="list-disc list-inside space-y-1">
                                    {validation.errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Validation warnings */}
                    {validation.warnings.length > 0 && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <ul className="list-disc list-inside space-y-1">
                                    {validation.warnings.map((warning, index) => (
                                        <li key={index}>{warning}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Step content */}
                    <div>{children}</div>

                    {/* Navigation buttons */}
                    <div className="flex items-center justify-between pt-6 border-t">
                        <div>
                            {!isFirstStep && (
                                <Button
                                    variant="outline"
                                    onClick={onBack}
                                    disabled={isLoading}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Save draft button */}
                            {onSaveDraft && (
                                <Button
                                    variant="ghost"
                                    onClick={onSaveDraft}
                                    disabled={isLoading || isSaving}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? 'Saving...' : 'Save Draft'}
                                </Button>
                            )}

                            {/* Next/Complete button */}
                            <Button
                                onClick={onNext}
                                disabled={!canProceed || isLoading}
                            >
                                {isLastStep ? 'Review & Publish' : 'Next'}
                                {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
                            </Button>
                        </div>
                    </div>

                    {/* Optional skip button */}
                    {isOptional && !validation.isValid && (
                        <div className="text-center">
                            <Button
                                variant="link"
                                onClick={onNext}
                                disabled={isLoading}
                                className="text-sm text-gray-600"
                            >
                                Skip this step
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
