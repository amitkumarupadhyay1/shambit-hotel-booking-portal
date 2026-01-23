'use client';

import React, { useState, useCallback } from 'react';
import MobileWizard, {
  OnboardingStep,
  StepData,
  OnboardingDraft,
  ValidationResult,
  StepComponentProps
} from '@/components/onboarding/mobile-wizard';
import { ImageUpload, ImageCategory } from '@/components/onboarding/image-upload';
import { toast } from 'sonner';

// Simplified ImageStepComponent for testing
const TestImageStepComponent: React.FC<StepComponentProps> = ({
  data,
  onDataChange,
  onValidationChange,
  isActive,
  isOffline
}) => {
  console.log('TestImageStepComponent rendered with:', { data, isActive, isOffline });

  // Set initial validation when step loads or data changes
  React.useEffect(() => {
    console.log('TestImageStepComponent - Initial validation effect triggered');
    const images = data.images || [];
    const initialValidation: ValidationResult = {
      isValid: images.length > 0,
      errors: images.length === 0 ? ['Please upload at least one image'] : [],
      warnings: images.length > 0 && images.length < 5
        ? ['Consider uploading more images for better presentation'] : []
    };
    console.log('Setting initial validation for images step:', initialValidation, 'images:', images);
    onValidationChange(initialValidation);
  }, [data.images, onValidationChange]);

  const handleUploadProgress = useCallback((progress: any[]) => {
    console.log('Upload progress received:', progress);
    
    // Extract completed images and convert them to the expected format
    const completedImages = progress
      .filter(p => p.status === 'completed')
      .map(p => ({
        id: p.id,
        url: p.url,
        qualityScore: p.qualityCheck?.score || 0,
        category: ImageCategory.EXTERIOR,
        uploadedAt: new Date().toISOString()
      }));
    
    console.log('Completed images:', completedImages.length, completedImages);
    
    // Always update the data with the properly formatted images
    const stepData = { images: completedImages };
    console.log('TestImageStepComponent - Calling onDataChange with:', stepData);
    onDataChange(stepData);

    // Update validation based on completed uploads
    const validation: ValidationResult = {
      isValid: completedImages.length > 0,
      errors: completedImages.length === 0 ? ['Please upload at least one image'] : [],
      warnings: completedImages.length < 5 ? ['Consider uploading more images for better presentation'] : []
    };
    console.log('TestImageStepComponent - Calling onValidationChange with:', validation);
    onValidationChange(validation);
  }, [onDataChange, onValidationChange]);

  const handleUploadComplete = useCallback((images: any[]) => {
    console.log('Upload complete received:', images);
    
    // Convert uploaded images to the expected format
    const formattedImages = images.map(img => ({
      id: img.id,
      url: img.url,
      qualityScore: img.qualityScore || 0,
      category: img.category || ImageCategory.EXTERIOR,
      uploadedAt: img.uploadedAt || new Date().toISOString()
    }));
    
    const stepData = { images: formattedImages };
    onDataChange(stepData);

    // Validate image uploads
    const validation: ValidationResult = {
      isValid: formattedImages.length > 0,
      errors: formattedImages.length === 0 ? ['Please upload at least one image'] : [],
      warnings: formattedImages.length < 5 ? ['Consider uploading more images for better presentation'] : []
    };
    console.log('Setting final validation:', validation);
    onValidationChange(validation);
  }, [onDataChange, onValidationChange]);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Upload high-quality images of your property. At least one image is required to proceed.
      </div>
      <ImageUpload
        category={ImageCategory.EXTERIOR}
        maxFiles={20}
        maxFileSize={5 * 1024 * 1024} // 5MB
        qualityStandards={{
          minResolution: { width: 1920, height: 1080 },
          acceptableAspectRatios: [16 / 9, 4 / 3, 3 / 2],
          maxFileSize: 5 * 1024 * 1024
        }}
        onUploadProgress={handleUploadProgress}
        onUploadComplete={handleUploadComplete}
        onQualityCheck={() => { }}
      />
    </div>
  );
};

// Simple test steps
const testSteps: OnboardingStep[] = [
  {
    id: 'amenities',
    title: 'Property Amenities',
    description: 'Select amenities that make your property special',
    component: ({ data, onDataChange, onValidationChange }) => {
      React.useEffect(() => {
        onValidationChange({ isValid: true, errors: [], warnings: [] });
      }, [onValidationChange]);
      
      return (
        <div className="p-4 bg-green-50 rounded">
          <p>✅ Amenities step (auto-completed for testing)</p>
        </div>
      );
    },
    validation: {
      validate: () => ({ isValid: true, errors: [], warnings: [] })
    },
    isOptional: false,
    estimatedTime: 5
  },
  {
    id: 'images',
    title: 'Property Images',
    description: 'Upload high-quality photos of your property',
    component: TestImageStepComponent,
    validation: {
      validate: () => ({ isValid: true, errors: [], warnings: [] })
    },
    isOptional: false,
    estimatedTime: 10
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'Review and complete your onboarding',
    component: ({ data, onDataChange, onValidationChange }) => {
      React.useEffect(() => {
        onValidationChange({ isValid: true, errors: [], warnings: [] });
      }, [onValidationChange]);
      
      return (
        <div className="p-4 bg-blue-50 rounded">
          <p>🎉 Onboarding completed!</p>
          <pre className="mt-2 text-xs bg-white p-2 rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
    },
    validation: {
      validate: () => ({ isValid: true, errors: [], warnings: [] })
    },
    isOptional: false,
    estimatedTime: 2
  }
];

export default function OnboardingNoAuthTest() {
  console.log('OnboardingNoAuthTest - Component rendered');
  
  const handleStepComplete = useCallback(async (stepId: string, stepData: StepData) => {
    console.log('Step completed:', stepId, stepData);
    toast.success(`Step ${stepId} completed!`);
  }, []);

  const handleComplete = useCallback(async (allData: OnboardingDraft) => {
    console.log('Onboarding completed:', allData);
    toast.success('Onboarding completed successfully!');
  }, []);

  const handleDraftSave = useCallback(async (draftData: OnboardingDraft) => {
    console.log('Draft saved:', draftData);
    localStorage.setItem('test-onboarding-draft', JSON.stringify(draftData));
  }, []);

  const handleDraftLoad = useCallback(async (): Promise<OnboardingDraft> => {
    const saved = localStorage.getItem('test-onboarding-draft');
    return saved ? JSON.parse(saved) : {};
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Onboarding Test (No Auth Required)</h1>
        <div className="bg-green-100 border border-green-400 rounded p-4 mb-4">
          <p><strong>This is the onboarding wizard without authentication checks.</strong></p>
          <p>Test the image upload functionality here to see if the validation works correctly.</p>
        </div>
      </div>
      
      <MobileWizard
        steps={testSteps}
        onStepComplete={handleStepComplete}
        onComplete={handleComplete}
        onDraftSave={handleDraftSave}
        onDraftLoad={handleDraftLoad}
      />
    </div>
  );
}