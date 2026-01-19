'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  AlertCircle, 
  Wifi, 
  WifiOff,
  Save,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Types for mobile wizard
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<StepComponentProps>;
  validation: ValidationSchema;
  isOptional: boolean;
  estimatedTime?: number; // in minutes
}

export interface StepData {
  [key: string]: any;
}

export interface OnboardingDraft {
  [stepId: string]: StepData;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationSchema {
  validate: (data: StepData) => ValidationResult;
  validateField?: (fieldName: string, value: any) => string | null;
}

export interface StepComponentProps {
  data: StepData;
  onDataChange: (data: StepData) => void;
  onValidationChange: (result: ValidationResult) => void;
  isActive: boolean;
  isOffline: boolean;
}

export interface MobileWizardProps {
  steps: OnboardingStep[];
  initialData?: OnboardingDraft;
  onStepComplete: (stepId: string, stepData: StepData) => Promise<void>;
  onComplete: (allData: OnboardingDraft) => Promise<void>;
  onDraftSave: (draftData: OnboardingDraft) => Promise<void>;
  onDraftLoad: () => Promise<OnboardingDraft>;
  className?: string;
}

// Hook for offline detection
const useOfflineDetection = () => {
  const [isOffline, setIsOffline] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    setIsOffline(!navigator.onLine);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOffline;
};

// Hook for auto-save functionality
const useAutoSave = (
  draftData: OnboardingDraft,
  onDraftSave: (data: OnboardingDraft) => Promise<void>,
  isOffline: boolean
) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const saveDraft = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      if (isOffline) {
        // Save to localStorage when offline
        localStorage.setItem('onboarding-draft', JSON.stringify({
          data: draftData,
          timestamp: new Date().toISOString()
        }));
        setLastSaved(new Date());
      } else {
        await onDraftSave(draftData);
        setLastSaved(new Date());
        // Also save to localStorage as backup
        localStorage.setItem('onboarding-draft', JSON.stringify({
          data: draftData,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      // Fallback to localStorage
      localStorage.setItem('onboarding-draft', JSON.stringify({
        data: draftData,
        timestamp: new Date().toISOString()
      }));
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, [draftData, onDraftSave, isOffline, isSaving]);
  
  // Auto-save with debouncing
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, 2000); // Save after 2 seconds of inactivity
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [saveDraft]);
  
  return { isSaving, lastSaved, saveDraft };
};

export const MobileWizard: React.FC<MobileWizardProps> = ({
  steps,
  initialData = {},
  onStepComplete,
  onComplete,
  onDraftSave,
  onDraftLoad,
  className
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [draftData, setDraftData] = useState<OnboardingDraft>(initialData);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const isOffline = useOfflineDetection();
  const { isSaving, lastSaved, saveDraft } = useAutoSave(draftData, onDraftSave, isOffline);
  
  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;
  
  // Load draft data on mount
  useEffect(() => {
    const loadDraftData = async () => {
      try {
        // Try to load from server first
        if (!isOffline) {
          const serverDraft = await onDraftLoad();
          if (Object.keys(serverDraft).length > 0) {
            setDraftData(serverDraft);
            return;
          }
        }
        
        // Fallback to localStorage
        const localDraft = localStorage.getItem('onboarding-draft');
        if (localDraft) {
          const parsed = JSON.parse(localDraft);
          setDraftData(parsed.data || {});
        }
      } catch (error) {
        console.error('Failed to load draft data:', error);
      }
    };
    
    loadDraftData();
  }, [onDraftLoad, isOffline]);
  
  // Sync offline data when coming back online
  useEffect(() => {
    if (!isOffline && lastSaved) {
      const syncOfflineData = async () => {
        try {
          await onDraftSave(draftData);
          toast.success('Draft synced successfully');
        } catch (error) {
          console.error('Failed to sync offline data:', error);
          toast.error('Failed to sync offline changes');
        }
      };
      
      syncOfflineData();
    }
  }, [isOffline, draftData, onDraftSave, lastSaved]);
  
  const handleStepDataChange = useCallback((stepData: StepData) => {
    setDraftData(prev => ({
      ...prev,
      [currentStep.id]: stepData
    }));
  }, [currentStep.id]);
  
  const handleValidationChange = useCallback((result: ValidationResult) => {
    setValidationResults(prev => ({
      ...prev,
      [currentStep.id]: result
    }));
  }, [currentStep.id]);
  
  const canProceedToNext = () => {
    const currentValidation = validationResults[currentStep.id];
    return currentValidation?.isValid !== false || currentStep.isOptional;
  };
  
  const handleNext = async () => {
    const currentValidation = validationResults[currentStep.id];
    const stepData = draftData[currentStep.id] || {};
    
    // Validate current step
    if (!currentStep.isOptional && (!currentValidation || !currentValidation.isValid)) {
      toast.error('Please complete all required fields before proceeding');
      return;
    }
    
    try {
      // Mark step as completed and save progress
      await onStepComplete(currentStep.id, stepData);
      setCompletedSteps(prev => new Set([...prev, currentStep.id]));
      
      if (currentStepIndex < totalSteps - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        // All steps completed
        await handleComplete();
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
      toast.error('Failed to save step progress');
    }
  };
  
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };
  
  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(draftData);
      toast.success('Onboarding completed successfully!');
      // Clear draft data
      localStorage.removeItem('onboarding-draft');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error('Failed to complete onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleManualSave = async () => {
    await saveDraft();
    toast.success('Progress saved');
  };
  
  const StepComponent = currentStep.component;
  const currentValidation = validationResults[currentStep.id];
  
  return (
    <div className={cn("min-h-screen bg-slate-50 flex flex-col", className)}>
      {/* Header with progress and offline indicator */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 py-3">
          {/* Offline indicator */}
          {isOffline && (
            <div className="mb-2 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              <WifiOff className="h-4 w-4" />
              <span>Working offline - changes will sync when connected</span>
            </div>
          )}
          
          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
              <div className="flex items-center gap-2">
                {isSaving && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </div>
                )}
                {lastSaved && !isSaving && (
                  <span className="text-xs text-slate-500">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                {!isOffline && (
                  <Wifi className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Step indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors",
                  index < currentStepIndex || completedSteps.has(step.id)
                    ? "bg-green-500 text-white"
                    : index === currentStepIndex
                    ? "bg-blue-500 text-white"
                    : "bg-slate-200 text-slate-500"
                )}
              >
                {index < currentStepIndex || completedSteps.has(step.id) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 px-4 py-6">
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">
                  {currentStep.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  {currentStep.description}
                </CardDescription>
              </div>
              {currentStep.estimatedTime && (
                <Badge variant="secondary" className="text-xs">
                  ~{currentStep.estimatedTime} min
                </Badge>
              )}
            </div>
            
            {/* Validation feedback */}
            {currentValidation && (
              <div className="mt-3">
                {currentValidation.errors.length > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-700">
                        Please fix the following issues:
                      </p>
                      <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                        {currentValidation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {currentValidation.warnings.length > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-700">
                        Recommendations:
                      </p>
                      <ul className="mt-1 text-sm text-amber-600 list-disc list-inside">
                        {currentValidation.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <StepComponent
              data={draftData[currentStep.id] || {}}
              onDataChange={handleStepDataChange}
              onValidationChange={handleValidationChange}
              isActive={true}
              isOffline={isOffline}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Footer with navigation */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualSave}
              disabled={isSaving}
              className="flex items-center gap-1"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {currentStepIndex === totalSteps - 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? 'Hide' : 'Preview'}
              </Button>
            )}
            
            <Button
              onClick={currentStepIndex === totalSteps - 1 ? handleComplete : handleNext}
              disabled={!canProceedToNext() || isSubmitting}
              className="flex items-center gap-1 min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : currentStepIndex === totalSteps - 1 ? (
                <>
                  <Check className="h-4 w-4" />
                  Complete
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
        
        {/* Optional step indicator */}
        {currentStep.isOptional && (
          <div className="mt-2 text-center">
            <Badge variant="secondary" className="text-xs">
              This step is optional
            </Badge>
          </div>
        )}
      </div>
      
      {/* Preview overlay */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Onboarding Preview</CardTitle>
              <CardDescription>
                Review your information before completing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step) => {
                  const stepData = draftData[step.id];
                  if (!stepData || Object.keys(stepData).length === 0) return null;
                  
                  return (
                    <div key={step.id} className="border-b border-slate-200 pb-4">
                      <h4 className="font-medium text-slate-800 mb-2">{step.title}</h4>
                      <div className="text-sm text-slate-600">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(stepData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <div className="p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
                className="w-full"
              >
                Close Preview
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MobileWizard;