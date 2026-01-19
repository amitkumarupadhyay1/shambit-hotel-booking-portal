// Business Features Types for Frontend
// Based on backend interfaces but adapted for frontend use

export interface Equipment {
  name: string;
  quantity: number;
  specifications?: string;
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

export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  equipment: Equipment[];
  bookingProcedure: string;
  hourlyRate?: number;
  images: any[]; // ProcessedImage[] - keeping as any for now
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

// Form data interfaces for UI components
export interface MeetingRoomFormData {
  id?: string;
  name: string;
  capacity: number;
  equipment: Equipment[];
  bookingProcedure: string;
  hourlyRate?: number;
  size?: number;
  layout: 'theater' | 'classroom' | 'boardroom' | 'u_shape' | 'banquet';
}

export interface BusinessCenterFormData {
  available: boolean;
  hours: OperatingHours;
  services: string[];
  equipment: Equipment[];
  staffed: boolean;
}

export interface ConnectivityFormData {
  wifiSpeed: WifiSpeed;
  coverage: CoverageArea[];
  reliability: ReliabilityMetrics;
  businessGrade: boolean;
  wiredInternet: boolean;
  publicComputers: number;
}

export interface WorkSpaceFormData {
  id?: string;
  name: string;
  type: 'quiet_zone' | 'co_working' | 'business_lounge';
  capacity: number;
  hours: OperatingHours;
  amenities: string[];
  isAccessible24x7: boolean;
  powerOutlets: number;
  lighting: 'natural' | 'artificial' | 'mixed';
}

export interface BusinessServiceFormData {
  name: string;
  description: string;
  available: boolean;
  fee?: number;
  hours?: OperatingHours;
}

// UI-specific types
export interface BusinessFeaturesFormProps {
  hotelId: string;
  initialData?: BusinessFeatures;
  onSave: (features: BusinessFeatures) => void;
  onCancel?: () => void;
}

export interface BusinessFeaturesDisplayProps {
  features: BusinessFeatures;
  isEditable?: boolean;
  onEdit?: () => void;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface BusinessFeaturesValidation {
  isValid: boolean;
  errors: ValidationError[];
}

// Constants for UI
export const MEETING_ROOM_LAYOUTS = [
  { value: 'theater', label: 'Theater Style', description: 'Rows of chairs facing forward' },
  { value: 'classroom', label: 'Classroom Style', description: 'Tables and chairs in rows' },
  { value: 'boardroom', label: 'Boardroom Style', description: 'Large table with chairs around' },
  { value: 'u_shape', label: 'U-Shape', description: 'Tables arranged in U formation' },
  { value: 'banquet', label: 'Banquet Style', description: 'Round tables for dining' },
] as const;

export const WORKSPACE_TYPES = [
  { value: 'quiet_zone', label: 'Quiet Zone', description: 'Silent work area for focused tasks' },
  { value: 'co_working', label: 'Co-working Space', description: 'Collaborative work environment' },
  { value: 'business_lounge', label: 'Business Lounge', description: 'Premium workspace with amenities' },
] as const;

export const LIGHTING_TYPES = [
  { value: 'natural', label: 'Natural Light', description: 'Primarily natural lighting' },
  { value: 'artificial', label: 'Artificial Light', description: 'LED/fluorescent lighting' },
  { value: 'mixed', label: 'Mixed Lighting', description: 'Combination of natural and artificial' },
] as const;

export const SIGNAL_STRENGTH_OPTIONS = [
  { value: 'excellent', label: 'Excellent', description: 'Strong signal throughout' },
  { value: 'good', label: 'Good', description: 'Reliable signal in most areas' },
  { value: 'fair', label: 'Fair', description: 'Adequate signal with some weak spots' },
  { value: 'poor', label: 'Poor', description: 'Weak signal, may have dead zones' },
] as const;

// Default values for forms
export const DEFAULT_OPERATING_HOURS: OperatingHours = {
  monday: { open: '09:00', close: '18:00' },
  tuesday: { open: '09:00', close: '18:00' },
  wednesday: { open: '09:00', close: '18:00' },
  thursday: { open: '09:00', close: '18:00' },
  friday: { open: '09:00', close: '18:00' },
  saturday: { open: '09:00', close: '18:00' },
  sunday: null,
  is24x7: false,
};

export const DEFAULT_24X7_HOURS: OperatingHours = {
  monday: { open: '00:00', close: '23:59' },
  tuesday: { open: '00:00', close: '23:59' },
  wednesday: { open: '00:00', close: '23:59' },
  thursday: { open: '00:00', close: '23:59' },
  friday: { open: '00:00', close: '23:59' },
  saturday: { open: '00:00', close: '23:59' },
  sunday: { open: '00:00', close: '23:59' },
  is24x7: true,
};