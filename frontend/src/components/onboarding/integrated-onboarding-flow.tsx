'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api/client';
import OnboardingSessionManager, { OnboardingSession } from '@/lib/onboarding-session-manager';

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

// Types for integrated flow
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
  console.log('ImageStepComponent rendered with:', { data, isActive, isOffline });

  // Set initial validation when step loads or data changes
  useEffect(() => {
    console.log('ImageStepComponent - Initial validation effect triggered');
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

  // Also trigger validation when the component becomes active
  useEffect(() => {
    console.log('ImageStepComponent - Active state effect triggered, isActive:', isActive);
    if (isActive) {
      const images = data.images || [];
      const validation: ValidationResult = {
        isValid: images.length > 0,
        errors: images.length === 0 ? ['Please upload at least one image'] : [],
        warnings: images.length > 0 && images.length < 5
          ? ['Consider uploading more images for better presentation'] : []
      };
      console.log('Step became active, setting validation:', validation);
      onValidationChange(validation);
    }
  }, [isActive, data.images, onValidationChange]);

  // Force validation on mount
  useEffect(() => {
    console.log('ImageStepComponent - Mount effect triggered');
    const images = data.images || [];
    const validation: ValidationResult = {
      isValid: images.length > 0,
      errors: images.length === 0 ? ['Please upload at least one image'] : [],
      warnings: images.length > 0 && images.length < 5
        ? ['Consider uploading more images for better presentation'] : []
    };
    console.log('Component mounted, forcing validation:', validation);
    // Use setTimeout to ensure this runs after other effects
    setTimeout(() => onValidationChange(validation), 0);
  }, []); // Empty dependency array - runs only on mount

  const handleUploadProgress = useCallback((progress: any[]) => {
    console.log('Upload progress received:', progress);
    console.log('ImageStepComponent - handleUploadProgress called with progress length:', progress.length);
    
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
    console.log('ImageStepComponent - Calling onDataChange with:', stepData);
    onDataChange(stepData);

    // Update validation based on completed uploads
    const validation: ValidationResult = {
      isValid: completedImages.length > 0,
      errors: completedImages.length === 0 ? ['Please upload at least one image'] : [],
      warnings: completedImages.length < 5 ? ['Consider uploading more images for better presentation'] : []
    };
    console.log('ImageStepComponent - Calling onValidationChange with:', validation);
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
  if (!data.hotelId) {
    return <Loader2 className="animate-spin" />;
  }

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
      hotelId={data.hotelId}
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
  if (!data.hotelId) {
    return <Loader2 className="animate-spin" />;
  }

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
      hotelId={data.hotelId}
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
  if (!data.hotelId) {
    return <Loader2 className="animate-spin" />;
  }

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
      hotelId={data.hotelId}
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
      validate: () => ({ isValid: true, errors: [], warnings: [] })
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
      validate: () => ({ isValid: true, errors: [], warnings: [] })
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
      validate: () => ({ isValid: true, errors: [], warnings: [] })
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
      validate: () => ({ isValid: true, errors: [], warnings: [] })
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
  console.log('IntegratedOnboardingFlow - Component rendered with props:', { hotelId, className });
  
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const router = useRouter();
  const { user, isAuthenticated, hasRole, isLoading: authLoading } = useAuth();

  const steps = createOnboardingSteps();
  console.log('IntegratedOnboardingFlow - Created steps:', steps.map(s => ({ id: s.id, title: s.title })));
  
  const sessionManager = OnboardingSessionManager.getInstance();

  // Subscribe to session manager updates
  useEffect(() => {
    const unsubscribe = sessionManager.subscribe((newSession) => {
      setSession(newSession);
    });

    // Initialize with current session if available
    const currentSession = sessionManager.getSession();
    if (currentSession) {
      setSession(currentSession);
      setIsLoading(false);
    }

    return unsubscribe;
  }, [sessionManager]);

  // Initialize onboarding session with singleton pattern
  const initializeSession = useCallback(async () => {
    // Check if session already exists
    const existingSession = sessionManager.getSession();
    if (existingSession) {
      setSession(existingSession);
      setIsLoading(false);
      return;
    }

    // Check if initialization is already in progress
    const existingPromise = sessionManager.getInitPromise();
    if (existingPromise) {
      try {
        const session = await existingPromise;
        setSession(session);
        setIsLoading(false);
        return;
      } catch (err) {
        // Handle error from existing promise
        console.error('Existing session initialization failed:', err);
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      const initPromise = apiClient.post(
        '/hotels/integrated-onboarding/sessions',
        hotelId ? { hotelId } : undefined
      ).then(response => {
        const s = response.data.data;
        const newSession: OnboardingSession = {
          id: s.sessionId,
          hotelId: s.hotelId,
          currentStep: s.currentStep,
          completedSteps: s.completedSteps,
          qualityScore: s.qualityScore,
          expiresAt: s.expiresAt
        };
        
        sessionManager.setSession(newSession);
        return newSession;
      });

      sessionManager.setInitPromise(initPromise);
      
      const newSession = await initPromise;
      setSession(newSession);
      setRetryCount(0); // Reset retry count on success
      
    } catch (err: any) {
      console.error('Failed to initialize onboarding session:', err);
      
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError('Failed to start onboarding. Please try again.');
      }
    } finally {
      sessionManager.setInitPromise(null);
      setIsLoading(false);
    }
  }, [hotelId, sessionManager]);

  // Initialize onboarding session
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user?.roles?.includes(UserRole.SELLER)) {
      if (!authLoading) {
        setIsLoading(false);
      }
      return;
    }

    // Only initialize if we don't have a session and aren't already loading
    if (!session && !sessionManager.getSession() && !sessionManager.getInitPromise()) {
      initializeSession();
    } else if (sessionManager.getSession()) {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, user?.roles, initializeSession, session, sessionManager]);

  // Retry handler
  const handleRetry = useCallback(() => {
    if (retryCount < 3) { // Max 3 retries
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        sessionManager.clear(); // Clear any cached state
        initializeSession();
      }, 2000 * (retryCount + 1)); // Exponential backoff
    } else {
      setError('Maximum retry attempts reached. Please refresh the page.');
    }
  }, [retryCount, initializeSession, sessionManager]);

  // Handle step completion with better error handling
  const handleStepComplete = useCallback(async (stepId: string, stepData: StepData) => {
    if (!session) return;

    try {
      // Transform and validate step data before sending
      const transformedData = transformStepData(stepId, stepData);
      
      await apiClient.put(`/hotels/integrated-onboarding/sessions/${session.id}/steps/${stepId}`, transformedData);
      toast.success(`Step completed successfully`);
    } catch (error: any) {
      console.error('Failed to complete step:', error);
      
      // Handle validation errors (thrown by transformStepData)
      if (error.message && !error.response) {
        toast.error(`Validation Error: ${error.message}`);
        throw error;
      }
      
      // Handle API errors
      if (error.response?.status === 429) {
        toast.error('Please wait a moment before proceeding to the next step');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Invalid data format. Please check your inputs.';
        toast.error(`Data Error: ${errorMessage}`);
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to save step progress. Please try again.');
      }
      throw error;
    }
  }, [session]);

  // Transform step data to match backend API expectations
  const transformStepData = (stepId: string, stepData: StepData) => {
    switch (stepId) {
      case 'amenities':
        // Ensure amenities data is in the correct format
        const amenityIds = stepData.selectedAmenities || [];
        if (!Array.isArray(amenityIds)) {
          throw new Error('Selected amenities must be an array');
        }
        return {
          amenityIds: amenityIds.filter(id => typeof id === 'string' && id.trim().length > 0),
        };
      
      case 'images':
        // Transform image data
        const images = stepData.images || [];
        if (!Array.isArray(images)) {
          throw new Error('Images must be an array');
        }
        return {
          images: images.filter(img => img && typeof img === 'object'),
        };
      
      case 'property-info':
        // Transform property info data with validation
        const description = stepData.description || '';
        const policies = stepData.policies || '';
        
        if (typeof description !== 'string' || description.trim().length < 10) {
          throw new Error('Property description must be at least 10 characters long');
        }
        
        if (typeof policies !== 'string' || policies.trim().length < 10) {
          throw new Error('Hotel policies must be at least 10 characters long');
        }
        
        return {
          description: description.trim(),
          policies: policies.trim(),
          locationDetails: stepData.locationDetails || '',
        };
      
      case 'rooms':
        // Transform room data with validation
        const rooms = stepData.rooms || [];
        if (!Array.isArray(rooms) || rooms.length === 0) {
          throw new Error('At least one room type is required');
        }
        
        // Validate each room
        rooms.forEach((room, index) => {
          if (!room.name || typeof room.name !== 'string' || room.name.trim().length === 0) {
            throw new Error(`Room ${index + 1} must have a valid name`);
          }
          if (typeof room.capacity !== 'number' || room.capacity < 1) {
            throw new Error(`Room ${index + 1} must have a valid capacity`);
          }
        });
        
        return {
          rooms: rooms.map(room => ({
            ...room,
            name: room.name.trim(),
          })),
        };
      
      case 'business-features':
        // Transform business features data (optional step)
        return {
          meetingRooms: stepData.meetingRooms || [],
          connectivity: stepData.connectivity || {},
          businessServices: stepData.businessServices || [],
        };
      
      default:
        // For unknown steps, return data as-is but ensure it's an object
        if (typeof stepData !== 'object' || stepData === null) {
          return {};
        }
        return stepData;
    }
  };

  // Handle onboarding completion
  const handleComplete = useCallback(async (allData: OnboardingDraft) => {
    if (!session) return;

    try {
      const response = await apiClient.post(`/hotels/integrated-onboarding/sessions/${session.id}/complete`);
      const result = response.data;

      toast.success('Onboarding completed successfully!');

      // Redirect to dashboard or hotel management page
      router.push(`/seller/hotels/${result.data.hotelId}`);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error('Failed to complete onboarding');
      throw error;
    }
  }, [session, router]);

  // Handle draft saving with improved error handling and request queuing
  const handleDraftSave = useCallback(async (draftData: OnboardingDraft) => {
    if (!session) return;

    try {
      await apiClient.put(
        `/hotels/integrated-onboarding/sessions/${session.id}/draft`,
        { draftData }
      );
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      
      // Only show toast for critical errors, not rate limiting
      if (error.response?.status !== 429) {
        // Don't show toast for every save failure - it's too noisy
        // The mobile wizard will handle error display
      }
      
      // Re-throw to let the mobile wizard handle it
      throw error;
    }
  }, [session]);

  // Handle draft loading
  const handleDraftLoad = useCallback(async (): Promise<OnboardingDraft> => {
    if (!session) return {};

    try {
      const response = await apiClient.get(
        `/hotels/integrated-onboarding/sessions/${session.id}/draft`
      );
      return response.data.data || {};
    } catch (error) {
      console.error('Failed to load draft:', error);
      return {};
    }
  }, [session]);

  // Loading state
  if (isLoading || authLoading) {
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
          <CardContent className="text-center space-y-3">
            <Button onClick={handleRetry} disabled={retryCount >= 3}>
              {retryCount >= 3 ? 'Max Retries Reached' : `Try Again ${retryCount > 0 ? `(${retryCount}/3)` : ''}`}
            </Button>
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

  
  // Main onboarding flow
  console.log('IntegratedOnboardingFlow - Rendering MobileWizard with steps:', steps.length);
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
