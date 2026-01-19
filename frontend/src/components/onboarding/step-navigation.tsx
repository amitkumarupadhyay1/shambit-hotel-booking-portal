'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  Clock,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavigationStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
  isOptional: boolean;
  hasErrors: boolean;
  estimatedTime?: number;
}

export interface StepNavigationProps {
  steps: NavigationStep[];
  currentStepIndex: number;
  onStepClick: (stepIndex: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  canProceed: boolean;
  isSubmitting?: boolean;
  className?: string;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  steps,
  currentStepIndex,
  onStepClick,
  onNext,
  onPrevious,
  canProceed,
  isSubmitting = false,
  className
}) => {
  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => step.isCompleted).length;
  const progress = (completedSteps / totalSteps) * 100;
  const currentStep = steps[currentStepIndex];
  
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Overview */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-800">
              Step {currentStepIndex + 1} of {totalSteps}
            </h3>
            <p className="text-sm text-slate-600">
              {completedSteps} completed • {totalSteps - completedSteps} remaining
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(progress)}%
            </div>
            <p className="text-xs text-slate-500">Complete</p>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Step Indicators - Mobile Optimized */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => onStepClick(index)}
              disabled={index > currentStepIndex && !step.isCompleted}
              className={cn(
                "relative p-3 rounded-lg border-2 transition-all duration-200 text-left",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                step.isActive
                  ? "border-blue-500 bg-blue-50"
                  : step.isCompleted
                  ? "border-green-500 bg-green-50 hover:bg-green-100"
                  : step.hasErrors
                  ? "border-red-500 bg-red-50"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100",
                (index > currentStepIndex && !step.isCompleted) && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Step Number/Status Icon */}
              <div className="flex items-center justify-between mb-2">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    step.isCompleted
                      ? "bg-green-500 text-white"
                      : step.isActive
                      ? "bg-blue-500 text-white"
                      : step.hasErrors
                      ? "bg-red-500 text-white"
                      : "bg-slate-300 text-slate-600"
                  )}
                >
                  {step.isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : step.hasErrors ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    index + 1
                  )}
                </div>
                
                {/* Optional badge */}
                {step.isOptional && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Optional
                  </Badge>
                )}
              </div>
              
              {/* Step Title */}
              <div className="text-xs font-medium text-slate-800 mb-1 line-clamp-2">
                {step.title}
              </div>
              
              {/* Estimated Time */}
              {step.estimatedTime && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>{step.estimatedTime}m</span>
                </div>
              )}
              
              {/* Status Indicator */}
              <div className="absolute top-1 right-1">
                {step.isCompleted && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {step.hasErrors && !step.isCompleted && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Current Step Info */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
              currentStep.isCompleted
                ? "bg-green-500 text-white"
                : currentStep.hasErrors
                ? "bg-red-500 text-white"
                : "bg-blue-500 text-white"
            )}
          >
            {currentStep.isCompleted ? (
              <Check className="h-5 w-5" />
            ) : currentStep.hasErrors ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              currentStepIndex + 1
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-slate-800">
                {currentStep.title}
              </h4>
              {currentStep.isOptional && (
                <Badge variant="outline" className="text-xs">
                  Optional
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-600 mb-2">
              {currentStep.description}
            </p>
            
            {/* Time estimate */}
            {currentStep.estimatedTime && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                <span>Estimated time: {currentStep.estimatedTime} minutes</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 bg-white rounded-lg border border-slate-200 p-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstStep || isSubmitting}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <div className="flex items-center gap-2 text-sm text-slate-600">
          {!canProceed && !currentStep.isOptional && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Complete required fields</span>
            </div>
          )}
          {currentStep.isOptional && (
            <span className="text-slate-500">This step is optional</span>
          )}
        </div>
        
        <Button
          onClick={onNext}
          disabled={(!canProceed && !currentStep.isOptional) || isSubmitting}
          className="flex items-center gap-2 min-w-[100px]"
        >
          {isLastStep ? (
            <>
              Complete
              <Check className="h-4 w-4" />
            </>
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepNavigation;