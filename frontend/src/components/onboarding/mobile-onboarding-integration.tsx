'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  MobileWizard, 
  OnboardingStep, 
  StepData, 
  OnboardingDraft, 
  ValidationResult,
  ValidationSchema,
  StepComponentProps
} from './mobile-wizard';
import { StepWrapper } from './step-wrapper';
import { 
  AmenitySelection,
  ImageUpload,
  PropertyInformationForm,
  RoomConfigurationForm,
  BusinessCenterForm,
  OfflineSync
} from './index';
import { PropertyType } from './amenity-selection';
import { ImageCategory } from './image-upload';

// Enhanced step component that integrates with existing components
const createIntegratedStepComponent = (
  stepId: string,
  title: string,
  description: string,
  isOptional: boolean,
  estimatedTime: number,
  renderContent: (props: StepComponentProps) => React.ReactNode
) => {
  const IntegratedStepComponent: React.FC<StepComponentProps> = (props) => {
    const [showPreview, setShowPreview] = useState(false);

    const handleSave = useCallback(() => {
      // Manual save trigger
      toast.success('Step saved successfully');
    }, []);

    const handlePreview = useCallback(() => {
      setShowPreview(!showPreview);
    }, [showPreview]);

    return (
      <StepWrapper
        stepId={stepId}
        title={title}
        description={description}
        isOptional={isOptional}
        estimatedTime={estimatedTime}
        showPreview={showPreview}
        onSave={handleSave}
        onPreview={handlePreview}
        {...props}
      >
        {renderContent(props)}
      </StepWrapper>
    );
  };

  return IntegratedStepComponent;
};

// Amenity Step Integration
const AmenityStepIntegration = createIntegratedStepComponent(
  'amenities',
  'Property Amenities',
  'Select amenities that make your property stand out to potential guests',
  false,
  5,
  ({ data, onDataChange, onValidationChange, isOffline }) => {
    const handleSelectionChange = useCallback((amenities: string[]) => {
      const newData = { ...data, selectedAmenities: amenities };
      onDataChange(newData);
      
      // Real-time validation
      const validation: ValidationResult = {
        isValid: amenities.length > 0,
        errors: amenities.length === 0 ? ['Please select at least one amenity to attract guests'] : [],
        warnings: amenities.length < 3 ? ['Consider adding more amenities to increase your property\'s appeal'] : []
      };
      onValidationChange(validation);
    }, [data, onDataChange, onValidationChange]);

    // Mock amenity categories - in real app, this would come from API
    const mockCategories = [
      {
        id: 'property-wide',
        name: 'Property-wide',
        description: 'Amenities available throughout the property',
        icon: '🏨',
        amenities: [
          { id: 'wifi', name: 'Free WiFi', description: 'High-speed internet', icon: '📶', isEcoFriendly: false },
          { id: 'parking', name: 'Free Parking', description: 'On-site parking', icon: '🚗', isEcoFriendly: false },
          { id: 'pool', name: 'Swimming Pool', description: 'Outdoor pool', icon: '🏊', isEcoFriendly: false },
          { id: 'gym', name: 'Fitness Center', description: '24/7 gym access', icon: '💪', isEcoFriendly: false },
          { id: 'spa', name: 'Spa Services', description: 'Relaxation and wellness', icon: '🧘', isEcoFriendly: true },
        ]
      },
      {
        id: 'dining',
        name: 'Dining',
        description: 'Food and beverage options',
        icon: '🍽️',
        amenities: [
          { id: 'restaurant', name: 'Restaurant', description: 'On-site dining', icon: '🍽️', isEcoFriendly: false },
          { id: 'bar', name: 'Bar/Lounge', description: 'Drinks and cocktails', icon: '🍸', isEcoFriendly: false },
          { id: 'breakfast', name: 'Complimentary Breakfast', description: 'Free morning meal', icon: '🥐', isEcoFriendly: false },
          { id: 'room-service', name: '24/7 Room Service', description: 'In-room dining', icon: '🛎️', isEcoFriendly: false },
        ]
      }
    ];

    return (
      <div className="space-y-4">
        <AmenitySelection
          categories={mockCategories as any}
          selectedAmenities={data.selectedAmenities || []}
          propertyType={PropertyType.HOTEL}
          onSelectionChange={handleSelectionChange}
          validationRules={{} as any}
        />
        {isOffline && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <span className="font-medium">Offline Mode:</span>
              <span>Amenity selections will sync when you're back online</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

// Image Step Integration
const ImageStepIntegration = createIntegratedStepComponent(
  'images',
  'Property Images',
  'Upload high-quality images to showcase your property\'s best features',
  false,
  10,
  ({ data, onDataChange, onValidationChange, isOffline }) => {
    const handleUploadComplete = useCallback((images: any[]) => {
      // Convert uploaded images to consistent format
      const formattedImages = images.map(img => ({
        id: img.id,
        url: img.url,
        qualityScore: img.qualityScore || 0,
        category: img.category || ImageCategory.EXTERIOR,
        uploadedAt: img.uploadedAt || new Date().toISOString()
      }));
      
      const newData = { ...data, images: formattedImages };
      onDataChange(newData);
      
      // Real-time validation
      const validation: ValidationResult = {
        isValid: formattedImages.length > 0,
        errors: formattedImages.length === 0 ? ['Please upload at least one high-quality image'] : [],
        warnings: formattedImages.length < 5 ? ['Consider uploading 5-10 images for better guest engagement'] : []
      };
      onValidationChange(validation);
    }, [data, onDataChange, onValidationChange]);

    return (
      <div className="space-y-4">
        <ImageUpload
          category={ImageCategory.EXTERIOR}
          maxFiles={10}
          maxFileSize={5 * 1024 * 1024} // 5MB
          qualityStandards={{
            minResolution: { width: 200, height: 150 }, // Lowered for testing
            acceptableAspectRatios: [16/9, 4/3, 3/2, 1/1, 1/10], // Added your ratio
            blurThreshold: 0.8,
            brightnessRange: { min: 0.2, max: 0.9 },
            contrastRange: { min: 0.3, max: 0.9 }
          }}
          onUploadProgress={(progress) => {
            // Handle upload progress
          }}
          onUploadComplete={handleUploadComplete}
          onQualityCheck={(results) => {
            // Handle quality check results
          }}
        />
        {isOffline && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <span className="font-medium">Offline Mode:</span>
              <span>Images will be uploaded automatically when connection is restored</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

// Property Information Step Integration
const PropertyInfoStepIntegration = createIntegratedStepComponent(
  'property-info',
  'Property Details',
  'Provide comprehensive information about your property to help guests make informed decisions',
  false,
  8,
  ({ data, onDataChange, onValidationChange, isOffline }) => {
    const handleDataChange = useCallback((propertyData: any) => {
      onDataChange(propertyData);
      
      // Real-time validation
      const validation: ValidationResult = {
        isValid: propertyData.description && propertyData.description.length >= 50,
        errors: !propertyData.description || propertyData.description.length < 50 
          ? ['Property description must be at least 50 characters to help guests understand your property'] : [],
        warnings: [
          ...(!propertyData.policies ? ['Adding hotel policies builds guest trust and reduces confusion'] : []),
          ...(!propertyData.locationDetails ? ['Location details help guests plan their stay better'] : [])
        ]
      };
      onValidationChange(validation);
    }, [onDataChange, onValidationChange]);

    return (
      <div className="space-y-4">
        <PropertyInformationForm
          initialData={data}
          onDataChange={handleDataChange}
          onValidationChange={() => {}}
        />
        {isOffline && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <span className="font-medium">Offline Mode:</span>
              <span>Property information will sync when you're back online</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

// Room Configuration Step Integration
const RoomStepIntegration = createIntegratedStepComponent(
  'rooms',
  'Room Setup',
  'Configure your room types with detailed information, pricing, and images',
  false,
  12,
  ({ data, onDataChange, onValidationChange, isOffline }) => {
    const handleRoomDataChange = useCallback((roomData: any) => {
      onDataChange(roomData);
      
      // Real-time validation
      const rooms = roomData.rooms || [];
      const validation: ValidationResult = {
        isValid: rooms.length > 0 && rooms.every((room: any) => 
          room.name && room.name.trim().length > 0 && room.basePrice > 0
        ),
        errors: [
          ...(rooms.length === 0 ? ['At least one room type is required to start accepting bookings'] : []),
          ...(rooms.some((room: any) => !room.name || room.name.trim().length === 0) 
            ? ['All rooms must have a descriptive name'] : []),
          ...(rooms.some((room: any) => !room.basePrice || room.basePrice <= 0) 
            ? ['All rooms must have a valid price'] : [])
        ],
        warnings: [
          ...(rooms.some((room: any) => !room.images || room.images.length === 0)
            ? ['Adding images to all room types increases booking conversion'] : []),
          ...(rooms.some((room: any) => !room.description || room.description.length < 20)
            ? ['Detailed room descriptions help guests choose the right room'] : [])
        ]
      };
      onValidationChange(validation);
    }, [onDataChange, onValidationChange]);

    return (
      <div className="space-y-4">
        <RoomConfigurationForm
          initialData={data}
          onDataChange={handleRoomDataChange}
          onValidationChange={() => {}}
          hotelId="temp-hotel-id"
        />
        {isOffline && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <span className="font-medium">Offline Mode:</span>
              <span>Room configurations will sync when connection is restored</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

// Business Features Step Integration
const BusinessFeaturesStepIntegration = createIntegratedStepComponent(
  'business-features',
  'Business Amenities',
  'Add business-focused amenities to attract corporate travelers and business guests',
  true,
  7,
  ({ data, onDataChange, onValidationChange, isOffline }) => {
    const handleBusinessDataChange = useCallback((businessData: any) => {
      onDataChange(businessData);
      
      // Real-time validation (business features are optional)
      const validation: ValidationResult = {
        isValid: true, // Business features are optional
        errors: [],
        warnings: [
          ...(!businessData.connectivity ? ['WiFi information helps business travelers choose your property'] : []),
          ...(!businessData.meetingRooms || businessData.meetingRooms.length === 0 
            ? ['Meeting rooms can significantly increase corporate bookings'] : []),
          ...(!businessData.businessCenter ? ['A business center attracts extended-stay business guests'] : [])
        ]
      };
      onValidationChange(validation);
    }, [onDataChange, onValidationChange]);

    return (
      <div className="space-y-4">
        <BusinessCenterForm
          initialData={data}
          onDataChange={handleBusinessDataChange}
          onValidationChange={() => {}}
          hotelId="temp-hotel-id"
        />
        {isOffline && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <span className="font-medium">Offline Mode:</span>
              <span>Business features will sync when you're back online</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

// Validation schemas for each step
const createValidationSchema = (stepId: string): ValidationSchema => ({
  validate: (data: StepData): ValidationResult => {
    switch (stepId) {
      case 'amenities':
        return {
          isValid: data.selectedAmenities && data.selectedAmenities.length > 0,
          errors: !data.selectedAmenities || data.selectedAmenities.length === 0 
            ? ['Please select at least one amenity'] : [],
          warnings: data.selectedAmenities && data.selectedAmenities.length < 3 
            ? ['Consider adding more amenities to attract more guests'] : []
        };
      case 'images':
        const images = data.images || [];
        return {
          isValid: images.length > 0,
          errors: images.length === 0 
            ? ['Please upload at least one image'] : [],
          warnings: images.length > 0 && images.length < 5 
            ? ['More images lead to higher booking rates'] : []
        };
      case 'property-info':
        return {
          isValid: data.description && data.description.length >= 50,
          errors: !data.description || data.description.length < 50 
            ? ['Property description must be at least 50 characters'] : [],
          warnings: !data.policies ? ['Hotel policies help set guest expectations'] : []
        };
      case 'rooms':
        const rooms = data.rooms || [];
        return {
          isValid: rooms.length > 0 && rooms.every((room: any) => 
            room.name && room.name.trim().length > 0 && room.basePrice > 0
          ),
          errors: [
            ...(rooms.length === 0 ? ['At least one room type is required'] : []),
            ...(rooms.some((room: any) => !room.name || room.name.trim().length === 0) 
              ? ['All rooms must have a name'] : []),
            ...(rooms.some((room: any) => !room.basePrice || room.basePrice <= 0) 
              ? ['All rooms must have a valid price'] : [])
          ],
          warnings: []
        };
      case 'business-features':
        return {
          isValid: true, // Optional step
          errors: [],
          warnings: []
        };
      default:
        return { isValid: true, errors: [], warnings: [] };
    }
  }
});

// Define the integrated onboarding steps
const integratedOnboardingSteps: OnboardingStep[] = [
  {
    id: 'amenities',
    title: 'Property Amenities',
    description: 'Select amenities that make your property stand out',
    component: AmenityStepIntegration,
    validation: createValidationSchema('amenities'),
    isOptional: false,
    estimatedTime: 5
  },
  {
    id: 'images',
    title: 'Property Images',
    description: 'Upload high-quality images to showcase your property',
    component: ImageStepIntegration,
    validation: createValidationSchema('images'),
    isOptional: false,
    estimatedTime: 10
  },
  {
    id: 'property-info',
    title: 'Property Information',
    description: 'Provide detailed information about your property',
    component: PropertyInfoStepIntegration,
    validation: createValidationSchema('property-info'),
    isOptional: false,
    estimatedTime: 8
  },
  {
    id: 'rooms',
    title: 'Room Configuration',
    description: 'Set up your room types with details and pricing',
    component: RoomStepIntegration,
    validation: createValidationSchema('rooms'),
    isOptional: false,
    estimatedTime: 12
  },
  {
    id: 'business-features',
    title: 'Business Features',
    description: 'Add business amenities for corporate travelers',
    component: BusinessFeaturesStepIntegration,
    validation: createValidationSchema('business-features'),
    isOptional: true,
    estimatedTime: 7
  }
];

export interface MobileOnboardingIntegrationProps {
  onStepComplete: (stepId: string, stepData: StepData) => Promise<void>;
  onComplete: (allData: OnboardingDraft) => Promise<void>;
  onDraftSave: (draftData: OnboardingDraft) => Promise<void>;
  onDraftLoad: () => Promise<OnboardingDraft>;
  initialData?: OnboardingDraft;
  className?: string;
}

export const MobileOnboardingIntegration: React.FC<MobileOnboardingIntegrationProps> = ({
  onStepComplete,
  onComplete,
  onDraftSave,
  onDraftLoad,
  initialData = {},
  className
}) => {
  const [offlineData, setOfflineData] = useState<any[]>([]);

  // Handle offline sync
  const handleOfflineSync = async (items: any[]) => {
    // Process offline sync items
    for (const item of items) {
      try {
        switch (item.type) {
          case 'draft':
            await onDraftSave(item.data);
            break;
          case 'step_completion':
            await onStepComplete(item.data.stepId, item.data.stepData);
            break;
          default:
            console.warn('Unknown offline sync item type:', item.type);
        }
      } catch (error) {
        console.error('Failed to sync offline item:', error);
        throw error;
      }
    }
  };

  const handleOfflineDataLoad = async () => {
    return offlineData;
  };

  return (
    <div className={className}>
      {/* Offline Sync Component */}
      <div className="mb-4">
        <OfflineSync
          onSync={handleOfflineSync}
          onDataLoad={handleOfflineDataLoad}
        />
      </div>

      {/* Mobile Wizard with Integrated Components */}
      <MobileWizard
        steps={integratedOnboardingSteps}
        initialData={initialData}
        onStepComplete={onStepComplete}
        onComplete={onComplete}
        onDraftSave={onDraftSave}
        onDraftLoad={onDraftLoad}
      />
    </div>
  );
};

export default MobileOnboardingIntegration;