/**
 * Progress Indicator Component
 * Professional step progress indicator (OTA standard)
 */

'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OnboardingStep } from '../types/onboarding';

interface ProgressIndicatorProps {
    steps: OnboardingStep[];
    currentStepIndex: number;
    completedSteps: string[];
    className?: string;
}

export function ProgressIndicator({
    steps,
    currentStepIndex,
    completedSteps,
    className,
}: ProgressIndicatorProps) {
    return (
        <div className={cn('w-full', className)}>
            {/* Mobile: Compact progress */}
            <div className="md:hidden">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                        Step {currentStepIndex + 1} of {steps.length}
                    </span>
                    <span className="text-sm text-gray-500">
                        {Math.round(((currentStepIndex + 1) / steps.length) * 100)}% complete
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                    />
                </div>
                <p className="text-sm font-medium text-gray-900 mt-2">
                    {steps[currentStepIndex]?.title}
                </p>
            </div>

            {/* Desktop: Full step indicator */}
            <div className="hidden md:block">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const isCompleted = completedSteps.includes(step.id);
                        const isCurrent = index === currentStepIndex;
                        const isPast = index < currentStepIndex;

                        return (
                            <React.Fragment key={step.id}>
                                {/* Step */}
                                <div className="flex flex-col items-center flex-1">
                                    {/* Circle */}
                                    <div
                                        className={cn(
                                            'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all',
                                            isCompleted || isPast
                                                ? 'bg-green-600 text-white'
                                                : isCurrent
                                                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                                                    : 'bg-gray-200 text-gray-600'
                                        )}
                                    >
                                        {isCompleted || isPast ? (
                                            <Check className="w-5 h-5" />
                                        ) : (
                                            index + 1
                                        )}
                                    </div>

                                    {/* Label */}
                                    <div className="mt-2 text-center">
                                        <p
                                            className={cn(
                                                'text-sm font-medium',
                                                isCurrent
                                                    ? 'text-blue-600'
                                                    : isCompleted || isPast
                                                        ? 'text-gray-900'
                                                        : 'text-gray-500'
                                            )}
                                        >
                                            {step.title}
                                        </p>
                                        {step.isOptional && (
                                            <p className="text-xs text-gray-400 mt-0.5">Optional</p>
                                        )}
                                    </div>
                                </div>

                                {/* Connector line */}
                                {index < steps.length - 1 && (
                                    <div className="flex-1 h-0.5 bg-gray-200 mx-2 mb-8">
                                        <div
                                            className={cn(
                                                'h-full transition-all duration-300',
                                                isPast || isCompleted ? 'bg-green-600' : 'bg-gray-200'
                                            )}
                                            style={{
                                                width: isPast || isCompleted ? '100%' : '0%',
                                            }}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Estimated time */}
                <div className="mt-4 text-center text-sm text-gray-500">
                    Estimated time: {steps[currentStepIndex]?.estimatedTime || 5} minutes
                </div>
            </div>
        </div>
    );
}
