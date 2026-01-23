// Enhanced Hotel Onboarding System - Core Data Interfaces
// Requirements: 1.5, 4.6, 8.1, 8.5

export enum PropertyType {
  HOTEL = 'HOTEL',
  RESORT = 'RESORT',
  GUEST_HOUSE = 'GUEST_HOUSE',
  HOMESTAY = 'HOMESTAY',
  APARTMENT = 'APARTMENT',
  BOUTIQUE_HOTEL = 'BOUTIQUE_HOTEL',
  BUSINESS_HOTEL = 'BUSINESS_HOTEL',
  LUXURY_HOTEL = 'LUXURY_HOTEL',
}

export enum OnboardingStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  REJECTED = 'REJECTED',
}

// Rich Text Content Interface
export interface RichTextContent {
  content: string;
  format: 'markdown' | 'html';
  wordCount: number;
  readingTime: number;
}

// Contact Information
export interface ContactInfo {
  phone: string;
  email?: string;
  website?: string;
  emergencyContact?: string;
}

// Address Information
export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

// Location Details
export interface Attraction {
  name: string;
  type: string;
  distance: number; // in kilometers
  description?: string;
}

export interface TransportationOptions {
  nearestAirport?: {
    name: string;
    distance: number;
    code: string;
  };
  nearestRailway?: {
    name: string;
    distance: number;
  };
  publicTransport: string[];
  parkingAvailable: boolean;
  parkingType?: 'free' | 'paid' | 'valet';
}

export interface AccessibilityFeatures {
  wheelchairAccessible: boolean;
  elevatorAccess: boolean;
  brailleSignage: boolean;
  hearingAssistance: boolean;
  visualAssistance: boolean;
  accessibleRooms: number;
  accessibleBathrooms: boolean;
}

export interface NeighborhoodInfo {
  type: string; // business, residential, tourist, etc.
  safetyRating: number; // 1-5
  noiseLevel: 'quiet' | 'moderate' | 'busy';
  walkability: number; // 1-5
}

export interface LocationDetails {
  nearbyAttractions: Attraction[];
  transportation: TransportationOptions;
  accessibility: AccessibilityFeatures;
  neighborhood: NeighborhoodInfo;
}

// Policy Interfaces
export interface CheckInPolicy {
  standardTime: string; // HH:MM format
  earliestTime?: string;
  latestTime?: string;
  requirements: string[];
  process: string;
}

export interface CheckOutPolicy {
  standardTime: string; // HH:MM format
  lateCheckoutAvailable: boolean;
  lateCheckoutFee?: number;
  process: string;
}

export interface CancellationPolicy {
  type: 'flexible' | 'moderate' | 'strict' | 'super_strict';
  freeUntilHours: number; // hours before check-in
  penaltyPercentage: number;
  noShowPolicy: string;
  details: string;
}

export interface BookingPolicy {
  advanceBookingDays: number;
  minimumStay?: number;
  maximumStay?: number;
  instantBooking: boolean;
  requiresApproval: boolean;
  paymentTerms: string;
}

export interface PetPolicy {
  allowed: boolean;
  fee?: number;
  restrictions?: string[];
  areas?: string[];
}

export interface SmokingPolicy {
  allowed: boolean;
  designatedAreas?: string[];
  penalty?: number;
}

export interface HotelPolicies {
  checkIn: CheckInPolicy;
  checkOut: CheckOutPolicy;
  cancellation: CancellationPolicy;
  booking: BookingPolicy;
  pet: PetPolicy;
  smoking: SmokingPolicy;
}

// Amenity Interfaces
export interface Amenity {
  id: string;
  name: string;
  description: string;
  icon: string;
  isEcoFriendly: boolean;
  category: AmenityCategory;
  applicablePropertyTypes: PropertyType[];
  businessRules: AmenityRule[];
}

export enum AmenityCategory {
  PROPERTY_WIDE = 'PROPERTY_WIDE',
  ROOM_SPECIFIC = 'ROOM_SPECIFIC',
  BUSINESS = 'BUSINESS',
  WELLNESS = 'WELLNESS',
  DINING = 'DINING',
  SUSTAINABILITY = 'SUSTAINABILITY',
  RECREATIONAL = 'RECREATIONAL',
  CONNECTIVITY = 'CONNECTIVITY',
}

export interface AmenityRule {
  type: 'requires' | 'excludes' | 'implies';
  amenityId: string;
  condition?: string;
}

export interface CategorizedAmenities {
  propertyWide: string[];
  roomSpecific: string[];
  business: string[];
  wellness: string[];
  dining: string[];
  sustainability: string[];
  recreational: string[];
  connectivity: string[];
}

// Image Management Interfaces
export interface ImageMetadata {
  filename: string;
  size: number;
  dimensions: { width: number; height: number };
  format: string;
  uploadedAt: Date;
  uploadedBy: string;
  qualityChecks: QualityCheckResult;
  tags: string[];
}

export interface QualityCheckResult {
  passed: boolean;
  score: number;
  issues: QualityIssue[];
  recommendations: string[];
}

export interface QualityIssue {
  type: 'resolution' | 'blur' | 'brightness' | 'contrast' | 'aspect_ratio';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedFix: string;
}

export interface ProcessedImage {
  id: string;
  originalUrl: string;
  optimizedUrls: { [size: string]: string };
  thumbnails: ThumbnailSet;
  metadata: ImageMetadata;
  qualityScore: number;
  category: ImageCategory;
}

export interface ThumbnailSet {
  small: string; // 150x150
  medium: string; // 300x300
  large: string; // 600x600
}

export enum ImageCategory {
  EXTERIOR = 'EXTERIOR',
  LOBBY = 'LOBBY',
  ROOMS = 'ROOMS',
  AMENITIES = 'AMENITIES',
  DINING = 'DINING',
  RECREATIONAL = 'RECREATIONAL',
  BUSINESS = 'BUSINESS',
  VIRTUAL_TOURS = 'VIRTUAL_TOURS',
}

export interface CategorizedImages {
  exterior: ProcessedImage[];
  lobby: ProcessedImage[];
  rooms: ProcessedImage[];
  amenities: ProcessedImage[];
  dining: ProcessedImage[];
  recreational: ProcessedImage[];
  business: ProcessedImage[];
  virtualTours: VirtualTourData[];
}

export interface VirtualTourData {
  id: string;
  name: string;
  url: string;
  type: '360_image' | '360_video' | 'virtual_walkthrough';
  category: ImageCategory;
  metadata: {
    duration?: number;
    resolution: string;
    fileSize: number;
  };
}

// Business Features Interfaces
export interface Equipment {
  name: string;
  quantity: number;
  specifications?: string;
}

export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  equipment: Equipment[];
  bookingProcedure: string;
  hourlyRate?: number;
  images: ProcessedImage[];
  size?: number; // in sq meters
  layout: 'theater' | 'classroom' | 'boardroom' | 'u_shape' | 'banquet';
}

export interface BusinessCenter {
  available: boolean;
  hours: OperatingHours;
  services: string[];
  equipment: Equipment[];
  staffed: boolean;
}

export interface OperatingHours {
  monday: { open: string; close: string } | null;
  tuesday: { open: string; close: string } | null;
  wednesday: { open: string; close: string } | null;
  thursday: { open: string; close: string } | null;
  friday: { open: string; close: string } | null;
  saturday: { open: string; close: string } | null;
  sunday: { open: string; close: string } | null;
  is24x7: boolean;
}

export interface WifiSpeed {
  download: number; // Mbps
  upload: number; // Mbps
  latency: number; // ms
}

export interface CoverageArea {
  area: string;
  signalStrength: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface ReliabilityMetrics {
  uptime: number; // percentage
  averageSpeed: WifiSpeed;
  peakHourPerformance: WifiSpeed;
}

export interface ConnectivityDetails {
  wifiSpeed: WifiSpeed;
  coverage: CoverageArea[];
  reliability: ReliabilityMetrics;
  businessGrade: boolean;
  wiredInternet: boolean;
  publicComputers: number;
}

export interface WorkSpace {
  id: string;
  name: string;
  type: 'quiet_zone' | 'co_working' | 'business_lounge';
  capacity: number;
  hours: OperatingHours;
  amenities: string[];
  isAccessible24x7: boolean;
  powerOutlets: number;
  lighting: 'natural' | 'artificial' | 'mixed';
}

export interface BusinessService {
  name: string;
  description: string;
  available: boolean;
  fee?: number;
  hours?: OperatingHours;
}

export interface BusinessFeatures {
  meetingRooms: MeetingRoom[];
  businessCenter: BusinessCenter;
  connectivity: ConnectivityDetails;
  workSpaces: WorkSpace[];
  services: BusinessService[];
}

// Quality Metrics
export interface QualityMetrics {
  overallScore: number;
  imageQuality: number;
  contentCompleteness: number;
  policyClarity: number;
  lastCalculated: Date;
  breakdown: QualityScoreBreakdown;
}

export interface QualityScoreBreakdown {
  imageQuality: {
    score: number;
    weight: 0.4;
    factors: ImageQualityFactors;
  };
  contentCompleteness: {
    score: number;
    weight: 0.4;
    factors: ContentCompletenessFactors;
  };
  policyClarity: {
    score: number;
    weight: 0.2;
    factors: PolicyClarityFactors;
  };
}

export interface ImageQualityFactors {
  totalImages: number;
  highQualityImages: number;
  categoryCoverage: number;
  professionalPhotos: number;
}

export interface ContentCompletenessFactors {
  descriptionQuality: number;
  amenityCompleteness: number;
  locationDetails: number;
  roomInformation: number;
}

export interface PolicyClarityFactors {
  cancellationPolicy: number;
  checkInOut: number;
  bookingTerms: number;
  additionalPolicies: number;
}

// Hotel Basic Info
export interface HotelBasicInfo {
  name: string;
  propertyType: PropertyType;
  starRating?: number;
  contactInfo: ContactInfo;
  address: Address;
  establishedYear?: number;
  totalRooms: number;
}

// Main Enhanced Hotel Interface
export interface EnhancedHotel {
  id: string;
  basicInfo: HotelBasicInfo;
  propertyDescription: RichTextContent;
  locationDetails: LocationDetails;
  policies: HotelPolicies;
  amenities: CategorizedAmenities;
  images: CategorizedImages;
  businessFeatures: BusinessFeatures;
  qualityMetrics: QualityMetrics;
  onboardingStatus: OnboardingStatus;
  createdAt: Date;
  updatedAt: Date;
}