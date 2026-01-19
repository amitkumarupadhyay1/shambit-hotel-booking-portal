import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsObject,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// Equipment DTO
export class EquipmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  specifications?: string;
}

// Operating Hours DTO
export class OperatingHoursDto {
  @IsOptional()
  @IsObject()
  monday?: { open: string; close: string } | null;

  @IsOptional()
  @IsObject()
  tuesday?: { open: string; close: string } | null;

  @IsOptional()
  @IsObject()
  wednesday?: { open: string; close: string } | null;

  @IsOptional()
  @IsObject()
  thursday?: { open: string; close: string } | null;

  @IsOptional()
  @IsObject()
  friday?: { open: string; close: string } | null;

  @IsOptional()
  @IsObject()
  saturday?: { open: string; close: string } | null;

  @IsOptional()
  @IsObject()
  sunday?: { open: string; close: string } | null;

  @IsBoolean()
  is24x7: boolean;
}

// WiFi Speed DTO
export class WifiSpeedDto {
  @IsNumber()
  @Min(0)
  download: number;

  @IsNumber()
  @Min(0)
  upload: number;

  @IsNumber()
  @Min(0)
  latency: number;
}

// Coverage Area DTO
export class CoverageAreaDto {
  @IsString()
  @IsNotEmpty()
  area: string;

  @IsEnum(['excellent', 'good', 'fair', 'poor'])
  signalStrength: 'excellent' | 'good' | 'fair' | 'poor';
}

// Reliability Metrics DTO
export class ReliabilityMetricsDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  uptime: number;

  @ValidateNested()
  @Type(() => WifiSpeedDto)
  averageSpeed: WifiSpeedDto;

  @ValidateNested()
  @Type(() => WifiSpeedDto)
  peakHourPerformance: WifiSpeedDto;
}

// Meeting Room DTO
export class MeetingRoomDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  capacity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentDto)
  equipment: EquipmentDto[];

  @IsString()
  @IsNotEmpty()
  bookingProcedure: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsArray()
  images: any[]; // ProcessedImage[] - keeping as any for now

  @IsOptional()
  @IsNumber()
  @Min(0)
  size?: number;

  @IsEnum(['theater', 'classroom', 'boardroom', 'u_shape', 'banquet'])
  layout: 'theater' | 'classroom' | 'boardroom' | 'u_shape' | 'banquet';
}

// Business Center DTO
export class BusinessCenterDto {
  @IsBoolean()
  available: boolean;

  @ValidateNested()
  @Type(() => OperatingHoursDto)
  hours: OperatingHoursDto;

  @IsArray()
  @IsString({ each: true })
  services: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentDto)
  equipment: EquipmentDto[];

  @IsBoolean()
  staffed: boolean;
}

// Connectivity Details DTO
export class ConnectivityDetailsDto {
  @ValidateNested()
  @Type(() => WifiSpeedDto)
  wifiSpeed: WifiSpeedDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoverageAreaDto)
  coverage: CoverageAreaDto[];

  @ValidateNested()
  @Type(() => ReliabilityMetricsDto)
  reliability: ReliabilityMetricsDto;

  @IsBoolean()
  businessGrade: boolean;

  @IsBoolean()
  wiredInternet: boolean;

  @IsNumber()
  @Min(0)
  publicComputers: number;
}

// Work Space DTO
export class WorkSpaceDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['quiet_zone', 'co_working', 'business_lounge'])
  type: 'quiet_zone' | 'co_working' | 'business_lounge';

  @IsNumber()
  @Min(1)
  capacity: number;

  @ValidateNested()
  @Type(() => OperatingHoursDto)
  hours: OperatingHoursDto;

  @IsArray()
  @IsString({ each: true })
  amenities: string[];

  @IsBoolean()
  isAccessible24x7: boolean;

  @IsNumber()
  @Min(0)
  powerOutlets: number;

  @IsEnum(['natural', 'artificial', 'mixed'])
  lighting: 'natural' | 'artificial' | 'mixed';
}

// Business Service DTO
export class BusinessServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsBoolean()
  available: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  hours?: OperatingHoursDto;
}

// Main Business Features DTO
export class BusinessFeaturesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingRoomDto)
  meetingRooms: MeetingRoomDto[];

  @ValidateNested()
  @Type(() => BusinessCenterDto)
  businessCenter: BusinessCenterDto;

  @ValidateNested()
  @Type(() => ConnectivityDetailsDto)
  connectivity: ConnectivityDetailsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkSpaceDto)
  workSpaces: WorkSpaceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessServiceDto)
  services: BusinessServiceDto[];
}

// Partial update DTOs
export class UpdateBusinessFeaturesDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingRoomDto)
  meetingRooms?: MeetingRoomDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessCenterDto)
  businessCenter?: BusinessCenterDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ConnectivityDetailsDto)
  connectivity?: ConnectivityDetailsDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkSpaceDto)
  workSpaces?: WorkSpaceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessServiceDto)
  services?: BusinessServiceDto[];
}