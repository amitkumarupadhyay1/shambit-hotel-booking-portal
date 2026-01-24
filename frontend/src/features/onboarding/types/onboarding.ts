/**
 * Onboarding Type Definitions
 * Clean, simple types for the onboarding flow
 */

export interface OnboardingSession {
  id: string;
  hotelId: string;
  currentStep: number;
  completedSteps: string[];
  qualityScore: number;
  expiresAt: string;
}

export interface StepValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isOptional: boolean;
  estimatedTime: number; // in minutes
}

// Step data interfaces
export interface BasicDetailsData {
  name: string;
  hotelType: 'HOTEL' | 'RESORT' | 'GUEST_HOUSE' | 'HOMESTAY' | 'APARTMENT';
  description?: string;
}

export interface LocationData {
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
  website?: string;
}

export interface AmenitiesData {
  selectedAmenities: string[];
}

export interface UploadedImage {
  id: string;
  url: string;
  qualityScore?: number;
  category?: string;
  uploadedAt?: string;
}

export interface ImagesData {
  images: UploadedImage[];
}

export interface RoomData {
  name: string;
  roomType: 'SINGLE' | 'DOUBLE' | 'DELUXE' | 'SUITE' | 'FAMILY';
  basePrice: number;
  maxOccupancy: number;
  bedCount: number;
  bedType: string;
  description?: string;
  weekendPrice?: number;
  roomSize?: number;
  amenities?: string[];
  images?: UploadedImage[];
}

export interface RoomsData {
  rooms: RoomData[];
}

export interface PoliciesData {
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  petPolicy: string;
  smokingPolicy: string;
  houseRules?: string;
}

export interface MeetingRoom {
  name: string;
  capacity: number;
  equipment: string[];
}

export interface BusinessFeaturesData {
  meetingRooms?: MeetingRoom[];
  connectivity?: {
    wifiSpeed?: string;
    coverage?: string;
  };
  businessServices?: string[];
}

export interface ReviewData {
  // This step just displays summary, no data to collect
}

// Combined step data type
export type StepData = 
  | BasicDetailsData 
  | LocationData 
  | AmenitiesData 
  | ImagesData 
  | RoomsData 
  | PoliciesData 
  | BusinessFeaturesData 
  | ReviewData;

export interface OnboardingDraft {
  [stepId: string]: StepData;
}
