import { IsString, IsOptional, IsArray, IsBoolean, IsNumber, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// Rich Text Content DTOs
export class PropertyDescriptionUpdateDto {
  @IsString()
  content: string;

  @IsEnum(['markdown', 'html'])
  format: 'markdown' | 'html';
}

// Location Details DTOs
export class AttractionDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsNumber()
  @Min(0)
  distance: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class NearestAirportDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  distance: number;

  @IsString()
  code: string;
}

export class NearestRailwayDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  distance: number;
}

export class TransportationOptionsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => NearestAirportDto)
  nearestAirport?: NearestAirportDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NearestRailwayDto)
  nearestRailway?: NearestRailwayDto;

  @IsArray()
  @IsString({ each: true })
  publicTransport: string[];

  @IsBoolean()
  parkingAvailable: boolean;

  @IsOptional()
  @IsEnum(['free', 'paid', 'valet'])
  parkingType?: 'free' | 'paid' | 'valet';
}

export class AccessibilityFeaturesDto {
  @IsBoolean()
  wheelchairAccessible: boolean;

  @IsBoolean()
  elevatorAccess: boolean;

  @IsBoolean()
  brailleSignage: boolean;

  @IsBoolean()
  hearingAssistance: boolean;

  @IsBoolean()
  visualAssistance: boolean;

  @IsNumber()
  @Min(0)
  accessibleRooms: number;

  @IsBoolean()
  accessibleBathrooms: boolean;
}

export class NeighborhoodInfoDto {
  @IsString()
  type: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  safetyRating: number;

  @IsEnum(['quiet', 'moderate', 'busy'])
  noiseLevel: 'quiet' | 'moderate' | 'busy';

  @IsNumber()
  @Min(1)
  @Max(5)
  walkability: number;
}

export class LocationDetailsUpdateDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttractionDto)
  nearbyAttractions?: AttractionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TransportationOptionsDto)
  transportation?: TransportationOptionsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AccessibilityFeaturesDto)
  accessibility?: AccessibilityFeaturesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NeighborhoodInfoDto)
  neighborhood?: NeighborhoodInfoDto;
}

// Hotel Policies DTOs
export class CheckInPolicyDto {
  @IsString()
  standardTime: string;

  @IsOptional()
  @IsString()
  earliestTime?: string;

  @IsOptional()
  @IsString()
  latestTime?: string;

  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @IsString()
  process: string;
}

export class CheckOutPolicyDto {
  @IsString()
  standardTime: string;

  @IsBoolean()
  lateCheckoutAvailable: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lateCheckoutFee?: number;

  @IsString()
  process: string;
}

export class CancellationPolicyDto {
  @IsEnum(['flexible', 'moderate', 'strict', 'super_strict'])
  type: 'flexible' | 'moderate' | 'strict' | 'super_strict';

  @IsNumber()
  @Min(0)
  freeUntilHours: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  penaltyPercentage: number;

  @IsString()
  noShowPolicy: string;

  @IsString()
  details: string;
}

export class BookingPolicyDto {
  @IsNumber()
  @Min(0)
  advanceBookingDays: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  minimumStay?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maximumStay?: number;

  @IsBoolean()
  instantBooking: boolean;

  @IsBoolean()
  requiresApproval: boolean;

  @IsString()
  paymentTerms: string;
}

export class PetPolicyDto {
  @IsBoolean()
  allowed: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restrictions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areas?: string[];
}

export class SmokingPolicyDto {
  @IsBoolean()
  allowed: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  designatedAreas?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  penalty?: number;
}

export class HotelPoliciesUpdateDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CheckInPolicyDto)
  checkIn?: CheckInPolicyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CheckOutPolicyDto)
  checkOut?: CheckOutPolicyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CancellationPolicyDto)
  cancellation?: CancellationPolicyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BookingPolicyDto)
  booking?: BookingPolicyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PetPolicyDto)
  pet?: PetPolicyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SmokingPolicyDto)
  smoking?: SmokingPolicyDto;
}

// Response DTOs
export class PropertyInformationValidationResultDto {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completenessScore: number;
}

export class CustomerDisplayLocationDto {
  attractions: string[];
  transportation: string[];
  accessibility: string[];
}

export class CustomerDisplayPoliciesDto {
  checkIn: string;
  checkOut: string;
  cancellation: string;
  important: string[];
}

export class CustomerDisplayDto {
  description: string;
  location: CustomerDisplayLocationDto;
  policies: CustomerDisplayPoliciesDto;
}