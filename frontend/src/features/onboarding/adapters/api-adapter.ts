/**
 * OnboardingApiAdapter - Decouples UI from Backend API Structure
 * 
 * This adapter layer transforms between UI-friendly data structures
 * and backend API formats, preventing tight coupling and making
 * the UI resilient to backend changes.
 */

import { 
  OnboardingSession, 
  OnboardingDraft, 
  StepData,
  BasicDetailsData,
  LocationData,
  AmenitiesData,
  ImagesData,
  RoomsData,
  PoliciesData,
  BusinessFeaturesData,
  UploadedImage
} from '../types/onboarding';

// Backend API response types (what we receive from API)
interface ApiSessionResponse {
  sessionId: string;
  hotelId: string;
  currentStep: number;
  completedSteps: string[];
  qualityScore: number;
  expiresAt: string;
  draftData?: Record<string, any>;
  metadata?: {
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

interface ApiImageResponse {
  id: string;
  url: string;
  qualityScore?: number;
  category?: string;
  uploadedAt?: string;
  metadata?: {
    size: number;
    format: string;
    dimensions: { width: number; height: number };
  };
}

interface ApiValidationResponse {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class OnboardingApiAdapter {
  /**
   * Transform API session response to UI-friendly format
   */
  static transformSessionResponse(apiResponse: ApiSessionResponse): OnboardingSession {
    return {
      id: apiResponse.sessionId,
      hotelId: apiResponse.hotelId,
      currentStep: apiResponse.currentStep,
      completedSteps: apiResponse.completedSteps || [],
      qualityScore: apiResponse.qualityScore || 0,
      expiresAt: apiResponse.expiresAt,
    };
  }

  /**
   * Transform API draft data to UI format
   */
  static transformDraftData(apiDraftData: Record<string, any>): OnboardingDraft {
    const uiDraftData: OnboardingDraft = {};

    // Transform each step's data
    Object.entries(apiDraftData).forEach(([stepId, stepData]) => {
      switch (stepId) {
        case 'basic-details':
          uiDraftData[stepId] = this.transformBasicDetailsData(stepData);
          break;
        case 'location':
          uiDraftData[stepId] = this.transformLocationData(stepData);
          break;
        case 'amenities':
          uiDraftData[stepId] = this.transformAmenitiesData(stepData);
          break;
        case 'images':
          uiDraftData[stepId] = this.transformImagesData(stepData);
          break;
        case 'rooms':
          uiDraftData[stepId] = this.transformRoomsData(stepData);
          break;
        case 'policies':
          uiDraftData[stepId] = this.transformPoliciesData(stepData);
          break;
        case 'business-features':
          uiDraftData[stepId] = this.transformBusinessFeaturesData(stepData);
          break;
        default:
          // Pass through unknown step data as-is
          uiDraftData[stepId] = stepData;
      }
    });

    return uiDraftData;
  }

  /**
   * Transform UI draft data to API format
   */
  static transformDraftDataToApi(uiDraftData: OnboardingDraft): Record<string, any> {
    const apiDraftData: Record<string, any> = {};

    Object.entries(uiDraftData).forEach(([stepId, stepData]) => {
      switch (stepId) {
        case 'basic-details':
          apiDraftData[stepId] = this.transformBasicDetailsDataToApi(stepData as BasicDetailsData);
          break;
        case 'location':
          apiDraftData[stepId] = this.transformLocationDataToApi(stepData as LocationData);
          break;
        case 'amenities':
          apiDraftData[stepId] = this.transformAmenitiesDataToApi(stepData as AmenitiesData);
          break;
        case 'images':
          apiDraftData[stepId] = this.transformImagesDataToApi(stepData as ImagesData);
          break;
        case 'rooms':
          apiDraftData[stepId] = this.transformRoomsDataToApi(stepData as RoomsData);
          break;
        case 'policies':
          apiDraftData[stepId] = this.transformPoliciesDataToApi(stepData as PoliciesData);
          break;
        case 'business-features':
          apiDraftData[stepId] = this.transformBusinessFeaturesDataToApi(stepData as BusinessFeaturesData);
          break;
        default:
          // Pass through unknown step data as-is
          apiDraftData[stepId] = stepData;
      }
    });

    return apiDraftData;
  }

  /**
   * Transform API validation response to UI format
   */
  static transformValidationResponse(apiResponse: ApiValidationResponse): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    return {
      isValid: apiResponse.isValid,
      errors: apiResponse.errors.map(error => error.message),
      warnings: apiResponse.warnings.map(warning => warning.message),
    };
  }

  /**
   * Transform API image response to UI format
   */
  static transformImageResponse(apiImages: ApiImageResponse[]): UploadedImage[] {
    return apiImages.map(img => ({
      id: img.id,
      url: img.url,
      qualityScore: img.qualityScore,
      category: img.category,
      uploadedAt: img.uploadedAt,
    }));
  }

  // Private transformation methods for each step

  private static transformBasicDetailsData(apiData: any): BasicDetailsData {
    return {
      name: apiData.hotelName || apiData.name || '',
      hotelType: apiData.propertyType || apiData.hotelType || 'HOTEL',
      description: apiData.description || '',
    };
  }

  private static transformBasicDetailsDataToApi(uiData: BasicDetailsData): any {
    return {
      hotelName: uiData.name,
      propertyType: uiData.hotelType,
      description: uiData.description,
    };
  }

  private static transformLocationData(apiData: any): LocationData {
    return {
      address: apiData.fullAddress || apiData.address || '',
      city: apiData.city || '',
      state: apiData.state || apiData.province || '',
      pincode: apiData.postalCode || apiData.pincode || '',
      phone: apiData.phoneNumber || apiData.phone || '',
      email: apiData.emailAddress || apiData.email || '',
      website: apiData.websiteUrl || apiData.website || '',
    };
  }

  private static transformLocationDataToApi(uiData: LocationData): any {
    return {
      fullAddress: uiData.address,
      city: uiData.city,
      province: uiData.state,
      postalCode: uiData.pincode,
      phoneNumber: uiData.phone,
      emailAddress: uiData.email,
      websiteUrl: uiData.website,
    };
  }

  private static transformAmenitiesData(apiData: any): AmenitiesData {
    return {
      selectedAmenities: apiData.amenities || apiData.selectedAmenities || [],
    };
  }

  private static transformAmenitiesDataToApi(uiData: AmenitiesData): any {
    return {
      amenities: uiData.selectedAmenities,
    };
  }

  private static transformImagesData(apiData: any): ImagesData {
    const images = apiData.propertyImages || apiData.images || [];
    return {
      images: images.map((img: any) => ({
        id: img.id || img.imageId,
        url: img.imageUrl || img.url,
        qualityScore: img.qualityScore,
        category: img.imageType || img.category,
        uploadedAt: img.createdAt || img.uploadedAt,
      })),
    };
  }

  private static transformImagesDataToApi(uiData: ImagesData): any {
    return {
      propertyImages: uiData.images.map(img => ({
        imageId: img.id,
        imageUrl: img.url,
        imageType: img.category,
        qualityScore: img.qualityScore,
      })),
    };
  }

  private static transformRoomsData(apiData: any): RoomsData {
    const rooms = apiData.roomTypes || apiData.rooms || [];
    return {
      rooms: rooms.map((room: any) => ({
        name: room.roomName || room.name,
        roomType: room.type || room.roomType,
        basePrice: room.pricePerNight || room.basePrice || 0,
        maxOccupancy: room.maxGuests || room.maxOccupancy || 1,
        bedCount: room.numberOfBeds || room.bedCount || 1,
        bedType: room.bedConfiguration || room.bedType || 'Double',
        description: room.description || '',
        weekendPrice: room.weekendRate || room.weekendPrice,
        roomSize: room.sizeInSqFt || room.roomSize,
        amenities: room.roomAmenities || room.amenities || [],
        images: room.roomImages || room.images || [],
      })),
    };
  }

  private static transformRoomsDataToApi(uiData: RoomsData): any {
    return {
      roomTypes: uiData.rooms.map(room => ({
        roomName: room.name,
        type: room.roomType,
        pricePerNight: room.basePrice,
        maxGuests: room.maxOccupancy,
        numberOfBeds: room.bedCount,
        bedConfiguration: room.bedType,
        description: room.description,
        weekendRate: room.weekendPrice,
        sizeInSqFt: room.roomSize,
        roomAmenities: room.amenities,
        roomImages: room.images,
      })),
    };
  }

  private static transformPoliciesData(apiData: any): PoliciesData {
    return {
      checkInTime: apiData.checkInTime || '14:00',
      checkOutTime: apiData.checkOutTime || '11:00',
      cancellationPolicy: apiData.cancellationPolicy || 'MODERATE',
      petPolicy: apiData.petPolicy || 'NOT_ALLOWED',
      smokingPolicy: apiData.smokingPolicy || 'NOT_ALLOWED',
      houseRules: apiData.additionalRules || apiData.houseRules,
    };
  }

  private static transformPoliciesDataToApi(uiData: PoliciesData): any {
    return {
      checkInTime: uiData.checkInTime,
      checkOutTime: uiData.checkOutTime,
      cancellationPolicy: uiData.cancellationPolicy,
      petPolicy: uiData.petPolicy,
      smokingPolicy: uiData.smokingPolicy,
      additionalRules: uiData.houseRules,
    };
  }

  private static transformBusinessFeaturesData(apiData: any): BusinessFeaturesData {
    return {
      meetingRooms: apiData.conferenceRooms || apiData.meetingRooms || [],
      connectivity: {
        wifiSpeed: apiData.internetSpeed || apiData.connectivity?.wifiSpeed,
        coverage: apiData.wifiCoverage || apiData.connectivity?.coverage,
      },
      businessServices: apiData.businessServices || [],
    };
  }

  private static transformBusinessFeaturesDataToApi(uiData: BusinessFeaturesData): any {
    return {
      conferenceRooms: uiData.meetingRooms,
      internetSpeed: uiData.connectivity?.wifiSpeed,
      wifiCoverage: uiData.connectivity?.coverage,
      businessServices: uiData.businessServices,
    };
  }

  /**
   * Create error response for failed API calls
   */
  static createErrorResponse(error: any): {
    success: false;
    error: string;
    code?: string;
    details?: any;
  } {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      code: error.code || error.response?.status?.toString(),
      details: error.response?.data || error.details,
    };
  }

  /**
   * Create success response for API calls
   */
  static createSuccessResponse<T>(data: T): {
    success: true;
    data: T;
  } {
    return {
      success: true,
      data,
    };
  }
}