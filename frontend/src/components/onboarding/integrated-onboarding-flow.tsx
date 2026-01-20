'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';

// Import all onboarding components
import MobileWizard, { 
  OnboardingStep, 
  StepData, 
  OnboardingDraft, 
  ValidationResult,
  StepComponentProps 
} from './mobile-wizard';
import { AmenitySelection, PropertyType } from './amenity-selection';
import { ImageUpload, ImageCategory } from './image-upload';
import { PropertyInformationForm } from './property-information-form';
import { RoomConfigurationForm } from './room-configuration-form';
import { BusinessFeaturesForm } from './business-features-form';
import { QualityAssuranceDashboard } from './quality-assurance-dashboard';

// API imports
import { hotelsApi } from '@/lib/api/hotels';

// Types for integrated flow
interface OnboardingSession {
  id: string;
  hotelId: string;
  currentStep: number;
  completedSteps: string[];
  qualityScore: number;
  expiresAt: string;
}

interface IntegratedOnboardingFlowProps {
  hotelId?: string;
  className?: string;
}

// Step component wrappers that integrate with the mobile wizard
const AmenityStepComponent: React.FC<StepComponentProps> = ({ 
  data, 
  onDataChange, 
  onValidationChange, 
  isActive, 
  isOffline 
}) => {
  const handleSelectionChange = useCallback((amenities: string[]) => {
    const stepData = { selectedAmenities: amenities };
    onDataChange(stepData);
    
    // Validate amenity selection
    const validation: ValidationResult = {
      isValid: amenities.length > 0,
      errors: amenities.length === 0 ? ['Please select at least one amenity'] : [],
      warnings: amenities.length < 3 ? ['Consider adding more amenities to attract guests'] : []
    };
    onValidationChange(validation);
  }, [onDataChange, onValidationChange]);

  return (
    <AmenitySelection
      categories={[]} // Will be loaded from API
      selectedAmenities={data.selectedAmenities || []}
      propertyType={PropertyType.HOTEL} // Will be dynamic based on hotel data
      onSelectionChange={handleSelectionChange}
      validationRules={{}} // Will be loaded from API
    />
  );
};

const ImageStepComponent: React.FC<StepComponentProps> = ({ 
  data, 
  onDataChange, 
  onValidationChange, 
  isActive, 
  isOffline 
}) => {
  const handleUploadComplete = useCallback((images: any[]) => {
    const stepData = { images };
    onDataChange(stepData);
    
    // Validate image uploads
    const validation: ValidationResult = {
      isValid: images.length > 0,
      errors: images.length === 0 ? ['Please upload at least one image'] : [],
      warnings: images.length < 5 ? ['Consider uploading more images for better presentation'] : []
    };
    onValidationChange(validation);
  }, [onDataChange, onValidationChange]);

  return (
    <ImageUpload
      category="EXTERIOR"
      maxFiles={20}
      maxFileSize={5 * 1024 * 1024} // 5MB
      qualityStandards={{
        minResolution: { width: 1920, height: 1080 },
        acceptableAspectRatios: [16/9, 4/3, 3/2],
        blurThreshold: 0.8,
        brightnessRange: { min: 0.2, max: 0.9 },
        contrastRange: { min: 0.3, max: 0.9 }
      }}
      onUploadProgress={() => {}}
      onUploadComplete={handleUploadComplete}
      onQualityCheck={() => {}}
    />
  );
};

const PropertyInfoStepComponent: React.FC<StepComponentProps> = ({ 
  data, 
  onDataChange, 
  onValidationChange, 
  isActive, 
  isOffline 
}) => {
  const handleDataChange = useCallback((propertyData: any) => {
    onDataChange(propertyData);
    
    // Validate property information
    const validation: ValidationResult = {
      isValid: !!(propertyData.description && propertyData.policies),
      errors: [],
      warnings: []
    };
    
    if (!propertyData.description || propertyData.description.length < 50) {
      validation.errors.push('Property description must be at least 50 characters');
    }
    
    if (!propertyData.policies) {
      validation.errors.push('Hotel policies are required');
    }
    
    if (!propertyData.locationDetails) {
      validation.warnings.push('Adding location details helps guests find your property');
    }
    
    validation.isValid = validation.errors.length === 0;
    onValidationChange(validation);
  }, [onDataChange, onValidationChange]);

  return (
    <PropertyInformationForm
      initialData={data}
      onDataChange={handleDataChange}
    />
  );
};

const RoomStepComponent: React.FC<StepComponentProps> = ({ 
  data, 
  onDataChange, 
  onValidationChange, 
  isActive, 
  isOffline 
}) => {
  const handleRoomDataChange = useCallback((roomData: any) => {
    onDataChange(roomData);
    
    // Validate room configuration
    const validation: ValidationResult = {
      isValid: !!(roomData.rooms && roomData.rooms.length > 0),
      errors: [],
      warnings: []
    };
    
    if (!roomData.rooms || roomData.rooms.length === 0) {
      validation.errors.push('At least one room type is required');
    } else {
      // Validate each room
      roomData.rooms.forEach((room: any, index: number) => {
        if (!room.name || room.name.trim().length === 0) {
          validation.errors.push(`Room ${index + 1} must have a name`);
        }
        if (!room.images || room.images.length === 0) {
          validation.warnings.push(`Consider adding images for ${room.name || `room ${index + 1}`}`);
        }
      });
    }
    
    validation.isValid = validation.errors.length === 0;
    onValidationChange(validation);
  }, [onDataChange, onValidationChange]);

  return (
    <RoomConfigurationForm
      hotelId={data.hotelId || 'temp-hotel-id'}
      initialData={data}
      onDataChange={handleRoomDataChange}
    />
  );
};

const BusinessFeaturesStepComponent: React.FC<StepComponentProps> = ({ 
  data, 
  onDataChange, 
  onValidationChange, 
  isActive, 
  isOffline 
}) => {
  const handleBusinessDataChange = useCallback((businessData: any) => {
    onDataChange(businessData);
    
    // Business features are optional, so validation is lenient
    const validation: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    if (businessData.meetingRooms && Array.isArray(businessData.meetingRooms)) {
      businessData.meetingRooms.forEach((room: any) => {
        if (!room.name || !room.capacity) {
          validation.errors.push('Meeting rooms must have name and capacity');
        }
      });
    }
    
    if (businessData.connectivity && !businessData.connectivity.wifiSpeed) {
      validation.warnings.push('Consider providing WiFi speed information for business travelers');
    }
    
    validation.isValid = validation.errors.length === 0;
    onValidationChange(validation);
  }, [onDataChange, onValidationChange]);

  const handleBusinessSave = useCallback(async (businessData: any) => {
    handleBusinessDataChange(businessData);
  }, [handleBusinessDataChange]);

  return (
    <BusinessFeaturesForm
      hotelId={data.hotelId || 'temp-hotel-id'}
      initialData={data as any} // Cast for mobile integration compatibility
      onSave={handleBusinessSave} // Use save handler that calls data change
    />
  );
};

const QualityReviewStepComponent: React.FC<StepComponentProps> = ({ 
  data, 
  onDataChange, 
  onValidationChange, 
  isActive, 
  isOffline 
}) => {
  useEffect(() => {
    // Quality review step is always valid - it's just for review
    onValidationChange({
      isValid: true,
      errors: [],
      warnings: []
    });
  }, [onValidationChange]);

  return (
    <QualityAssuranceDashboard
      hotelId={data.hotelId || 'temp-hotel-id'}
    />
  );
};

// Define the onboarding steps
const createOnboardingSteps = (): OnboardingStep[] => [
  {
    id: 'amenities',
    title: 'Property Amenities',
    description: 'Select amenities that make your property special',
    component: AmenityStepComponent,
    validation: {
      validate: (data: StepData) => ({
        isValid: !!(data.selectedAmenities && data.selectedAmenities.length > 0),
        errors: !data.selectedAmenities || data.selectedAmenities.length === 0 
          ? ['Please select at least one amenity'] 
          : [],
        warnings: []
      })
    },
    isOptional: false,
    estimatedTime: 5
  },
  {
    id: 'images',
    title: 'Property Images',
    description: 'Upload high-quality photos of your property',
    component: ImageStepComponent,
    validation: {
      validate: (data: StepData) => ({
        isValid: !!(data.images && data.images.length > 0),
        errors: !data.images || data.images.length === 0 
          ? ['Please upload at least one image'] 
          : [],
        warnings: []
      })
    },
    isOptional: false,
    estimatedTime: 10
  },
  {
    id: 'property-info',
    title: 'Property Information',
    description: 'Provide detailed information about your property',
    component: PropertyInfoStepComponent,
    validation: {
      validate: (data: StepData) => ({
        isValid: !!(data.description && data.policies),
        errors: [],
        warnings: []
      })
    },
    isOptional: false,
    estimatedTime: 8
  },
  {
    id: 'rooms',
    title: 'Room Configuration',
    description: 'Set up your room types and details',
    component: RoomStepComponent,
    validation: {
      validate: (data: StepData) => ({
        isValid: !!(data.rooms && data.rooms.length > 0),
        errors: !data.rooms || data.rooms.length === 0 
          ? ['At least one room type is required'] 
          : [],
        warnings: []
      })
    },
    isOptional: false,
    estimatedTime: 12
  },
  {
    id: 'business-features',
    title: 'Business Features',
    description: 'Configure business amenities and services (optional)',
    component: BusinessFeaturesStepComponent,
    validation: {
      validate: () => ({ isValid: true, errors: [], warnings: [] })
    },
    isOptional: true,
    estimatedTime: 7
  },
  {
    id: 'quality-review',
    title: 'Quality Review',
    description: 'Review your property profile and quality score',
    component: QualityReviewStepComponent,
    validation: {
      validate: () => ({ isValid: true, errors: [], warnings: [] })
    },
    isOptional: false,
    estimatedTime: 3
  }
];

export const IntegratedOnboardingFlow: React.FC<IntegratedOnboardingFlowProps> = ({
  hotelId,
  className
}) => {
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { user, isAuthenticated, hasRole } = useAuth();
  
  const steps = createOnboardingSteps();

  // Initialize onboarding session
  useEffect(() => {
    const initializeSession = async () => {
      if (!isAuthenticated || !hasRole(UserRole.SELLER)) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      try {
        // Create or resume onboarding session
        const response = await fetch('/api/hotels/onboarding/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ hotelId: hotelId || 'new' })
        });

        if (!response.ok) {
          throw new Error('Failed to create onboarding session');
        }

        const sessionData = await response.json();
        setSession(sessionData.data);
      } catch (err) {
        console.error('Failed to initialize onboarding session:', err);
        setError('Failed to start onboarding process');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [isAuthenticated, hasRole, hotelId]);

  // Handle step completion
  const handleStepComplete = useCallback(async (stepId: string, stepData: StepData) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/hotels/onboarding/sessions/${session.id}/steps`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          stepId,
          stepData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save step data');
      }

      // Mark step as completed
      await fetch(`/api/hotels/onboarding/sessions/${session.id}/steps/${stepId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      toast.success(`${stepId} step completed successfully`);
    } catch (error) {
      console.error('Failed to complete step:', error);
      toast.error('Failed to save step progress');
      throw error;
    }
  }, [session]);

  // Handle onboarding completion
  const handleComplete = useCallback(async (allData: OnboardingDraft) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/hotels/onboarding/sessions/${session.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      const result = await response.json();
      
      toast.success('Onboarding completed successfully!');
      
      // Redirect to dashboard or hotel management page
      router.push(`/seller/hotels/${result.data.hotelId}`);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error('Failed to complete onboarding');
      throw error;
    }
  }, [session, router]);

  // Handle draft saving
  const handleDraftSave = useCallback(async (draftData: OnboardingDraft) => {
    if (!session) return;

    try {
      await fetch(`/api/hotels/onboarding/sessions/${session.id}/draft`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ draftData })
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
      // Don't throw - draft saving should be silent
    }
  }, [session]);

  // Handle draft loading
  const handleDraftLoad = useCallback(async (): Promise<OnboardingDraft> => {
    if (!session) return {};

    try {
      const response = await fetch(`/api/hotels/onboarding/sessions/${session.id}/draft`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        return {};
      }

      const result = await response.json();
      return result.data || {};
    } catch (error) {
      console.error('Failed to load draft:', error);
      return {};
    }
  }, [session]);

  // Loading state
  if (isLoading) {
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
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center gap-2 justify-center text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.reload()}>
              Try Again
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

  // Main onboarding flow
  return (
    <MobileWizard
      steps={steps}
      onStepComplete={handleStepComplete}
      onComplete={handleComplete}
      onDraftSave={handleDraftSave}
      onDraftLoad={handleDraftLoad}
      className={className}
    />
  );
};

export default IntegratedOnboardingFlow;