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
  hotelType: 'HOTEL' | 'RESORT' | 'GUESTHOUSE' | 'HOMESTAY' | 'APARTMENT';
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
  amenities: string[];
  services?: string[];
}

export interface UploadedImage {
  id: string;
  url: string;
  qualityScore?: number;
  category?: string;
  uploadedAt?: string;
}

export interface ImagesData {
  images: Array<{
    url: string;
    type: 'EXTERIOR' | 'LOBBY' | 'ROOM' | 'AMENITY' | 'OTHER';
    caption?: string;
  }>;
}

export interface RoomData {
  name: string;
  type: 'SINGLE' | 'DOUBLE' | 'SUITE' | 'FAMILY' | 'DORMITORY';
  capacity: number;
  basePrice: number;
  amenities?: string[];
  images?: string[];
  // New fields from consolidated schema
  maxOccupancy?: number;
  bedCount?: number;
  bedType?: string;
  roomSize?: number;
  weekendPrice?: number;
}

export interface RoomsData {
  rooms: RoomData[];
}

export interface PoliciesData {
  checkIn: string;
  checkOut: string;
  cancellationPolicy: 'FLEXIBLE' | 'MODERATE' | 'STRICT';
  childPolicy: string;
  petPolicy: 'ALLOWED' | 'NOT_ALLOWED' | 'ON_REQUEST';
  smokingPolicy: 'ALLOWED' | 'NOT_ALLOWED' | 'DESIGNATED_AREAS';
}

export interface MeetingRoom {
  name: string;
  capacity: number;
  equipment: string[];
}

export interface BusinessFeaturesData {
  instantBooking: boolean;
  paymentMethods: string[];
  languages: string[];
  meetingRooms?: MeetingRoom[];
  connectivity?: {
    wifiSpeed?: string;
    coverage?: string;
  };
  businessServices?: string[];
}

export interface ReviewData {
  agreedToTerms: boolean;
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
