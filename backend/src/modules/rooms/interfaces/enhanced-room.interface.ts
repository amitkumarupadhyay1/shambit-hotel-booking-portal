// Enhanced Room System - Core Data Interfaces
// Requirements: 4.6, 8.1

import { ProcessedImage, ImageCategory, RichTextContent, OperatingHours, VirtualTourData } from '../../hotels/interfaces/enhanced-hotel.interface';

export enum RoomType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  DELUXE = 'DELUXE',
  SUITE = 'SUITE',
  FAMILY = 'FAMILY',
  PRESIDENTIAL = 'PRESIDENTIAL',
  STUDIO = 'STUDIO',
  APARTMENT = 'APARTMENT',
}

export enum BedType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  QUEEN = 'QUEEN',
  KING = 'KING',
  TWIN = 'TWIN',
  SOFA_BED = 'SOFA_BED',
  BUNK_BED = 'BUNK_BED',
}

// Room Capacity
export interface RoomCapacity {
  adults: number;
  children: number;
  infants: number;
  maxOccupancy: number;
}

// Room Size
export interface RoomSize {
  area: number; // in square meters
  unit: 'sqm' | 'sqft';
}

// Bed Configuration
export interface BedConfiguration {
  beds: BedInfo[];
  totalBeds: number;
  sofaBeds: number;
  cribs: number;
}

export interface BedInfo {
  type: BedType;
  count: number;
  size: string; // e.g., "Queen Size", "King Size"
}

// Room Basic Info
export interface RoomBasicInfo {
  name: string;
  type: RoomType;
  capacity: RoomCapacity;
  size: RoomSize;
  bedConfiguration: BedConfiguration;
  floor?: number;
  roomNumber?: string;
}

// Room Amenities with Inheritance
export interface AmenityOverride {
  amenityId: string;
  action: 'add' | 'remove' | 'modify';
  value?: any;
  reason?: string;
}

export interface RoomAmenities {
  inherited: string[]; // From property-wide amenities
  specific: string[]; // Room-specific amenities
  overrides: AmenityOverride[]; // Room-level overrides of property amenities
}

// Room Layout
export interface RoomDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'meters' | 'feet';
}

export interface LayoutFeature {
  name: string;
  type: 'window' | 'balcony' | 'terrace' | 'kitchenette' | 'seating_area' | 'work_desk' | 'closet';
  description?: string;
  size?: number;
  facing?: 'north' | 'south' | 'east' | 'west' | 'garden' | 'pool' | 'city' | 'mountain' | 'sea';
}

export interface RoomLayout {
  floorPlan?: string; // URL to floor plan image
  dimensions: RoomDimensions;
  features: LayoutFeature[];
  virtualTour?: VirtualTourData;
  view: string; // description of room view
  naturalLight: 'excellent' | 'good' | 'moderate' | 'limited';
}

// Room Pricing
export interface SeasonalPricing {
  season: string;
  startDate: string; // MM-DD format
  endDate: string; // MM-DD format
  multiplier: number; // price multiplier
}

export interface RoomPricing {
  basePrice: number;
  weekendPrice?: number;
  seasonalPricing: SeasonalPricing[];
  currency: string;
  taxesIncluded: boolean;
  extraPersonCharge?: number;
  childDiscount?: number;
}

// Room Availability
export interface AvailabilityRule {
  type: 'minimum_stay' | 'maximum_stay' | 'advance_booking' | 'blackout_dates';
  value: number | string | Date[];
  description: string;
}

export interface RoomAvailability {
  isActive: boolean;
  availabilityRules: AvailabilityRule[];
  blackoutDates: Date[];
  minimumStay: number;
  maximumStay?: number;
  advanceBookingDays: number;
}

// Room Services
export interface RoomService {
  name: string;
  description: string;
  available: boolean;
  fee?: number;
  hours?: OperatingHours;
  onDemand: boolean;
}

export interface RoomServices {
  housekeeping: RoomService;
  roomService: RoomService;
  laundry: RoomService;
  turndownService: RoomService;
  concierge: RoomService;
  customServices: RoomService[];
}

// Room Quality Metrics
export interface RoomQualityMetrics {
  overallScore: number;
  imageQuality: number;
  descriptionQuality: number;
  amenityCompleteness: number;
  lastUpdated: Date;
  guestRating?: number;
  maintenanceScore: number;
}

// Main Enhanced Room Interface
export interface EnhancedRoom {
  id: string;
  hotelId: string;
  basicInfo: RoomBasicInfo;
  description: RichTextContent;
  amenities: RoomAmenities;
  images: ProcessedImage[];
  layout: RoomLayout;
  pricing: RoomPricing;
  availability: RoomAvailability;
  services: RoomServices;
  qualityMetrics: RoomQualityMetrics;
  createdAt: Date;
  updatedAt: Date;
}

// Room Category for grouping similar rooms
export interface RoomCategory {
  id: string;
  name: string;
  description: string;
  baseRoom: EnhancedRoom;
  variations: RoomVariation[];
  totalRooms: number;
  availableRooms: number;
}

export interface RoomVariation {
  id: string;
  name: string;
  differences: string[];
  priceAdjustment: number;
  roomIds: string[];
}