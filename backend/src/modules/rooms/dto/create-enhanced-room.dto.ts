import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  IsOptional, 
  IsObject, 
  IsArray, 
  IsNumber, 
  IsUUID,
  Length, 
  Min, 
  Max,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { 
  RoomType,
  BedType,
  RoomCapacity,
  RoomSize,
  BedConfiguration,
  BedInfo,
  RoomBasicInfo,
  RoomAmenities,
  AmenityOverride,
  RoomLayout,
  RoomPricing,
  RoomAvailability,
  RoomServices,
} from '../interfaces/enhanced-room.interface';
import { RichTextContent, ProcessedImage } from '../../hotels/interfaces/enhanced-hotel.interface';

export class CreateRoomCapacityDto implements RoomCapacity {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(20)
  adults: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  children: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(5)
  infants: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(20)
  maxOccupancy: number;
}

export class CreateRoomSizeDto implements RoomSize {
  @IsNumber()
  @IsNotEmpty()
  @Min(10)
  @Max(1000)
  area: number;

  @IsEnum(['sqm', 'sqft'])
  unit: 'sqm' | 'sqft';
}

export class CreateBedInfoDto implements BedInfo {
  @IsEnum(BedType)
  type: BedType;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(10)
  count: number;

  @IsString()
  @IsNotEmpty()
  size: string;
}

export class CreateBedConfigurationDto implements BedConfiguration {
  @ValidateNested({ each: true })
  @Type(() => CreateBedInfoDto)
  @IsArray()
  beds: CreateBedInfoDto[];

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  totalBeds: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sofaBeds: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  cribs: number;
}

export class CreateRoomBasicInfoDto implements RoomBasicInfo {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @IsEnum(RoomType)
  type: RoomType;

  @ValidateNested()
  @Type(() => CreateRoomCapacityDto)
  capacity: CreateRoomCapacityDto;

  @ValidateNested()
  @Type(() => CreateRoomSizeDto)
  size: CreateRoomSizeDto;

  @ValidateNested()
  @Type(() => CreateBedConfigurationDto)
  bedConfiguration: CreateBedConfigurationDto;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  floor?: number;

  @IsString()
  @IsOptional()
  @Length(1, 20)
  roomNumber?: string;
}

export class CreateAmenityOverrideDto implements AmenityOverride {
  @IsString()
  @IsNotEmpty()
  amenityId: string;

  @IsEnum(['add', 'remove', 'modify'])
  action: 'add' | 'remove' | 'modify';

  @IsOptional()
  value?: any;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateRoomAmenitiesDto implements RoomAmenities {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  inherited: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specific: string[];

  @ValidateNested({ each: true })
  @Type(() => CreateAmenityOverrideDto)
  @IsArray()
  @IsOptional()
  overrides: CreateAmenityOverrideDto[];
}

export class CreateSeasonalPricingDto {
  @IsString()
  @IsNotEmpty()
  season: string;

  @IsString()
  @IsNotEmpty()
  startDate: string; // MM-DD format

  @IsString()
  @IsNotEmpty()
  endDate: string; // MM-DD format

  @IsNumber()
  @IsNotEmpty()
  @Min(0.1)
  @Max(10)
  multiplier: number;
}

export class CreateRoomPricingDto implements RoomPricing {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  basePrice: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weekendPrice?: number;

  @ValidateNested({ each: true })
  @Type(() => CreateSeasonalPricingDto)
  @IsArray()
  @IsOptional()
  seasonalPricing: CreateSeasonalPricingDto[];

  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  currency: string;

  @IsBoolean()
  taxesIncluded: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  extraPersonCharge?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  childDiscount?: number;
}

export class CreateEnhancedRoomDto {
  @ValidateNested()
  @Type(() => CreateRoomBasicInfoDto)
  @IsNotEmpty()
  basicInfo: CreateRoomBasicInfoDto;

  @IsObject()
  @IsOptional()
  description?: RichTextContent;

  @ValidateNested()
  @Type(() => CreateRoomAmenitiesDto)
  @IsOptional()
  amenities?: CreateRoomAmenitiesDto;

  @IsArray()
  @IsOptional()
  images?: ProcessedImage[];

  @IsObject()
  @IsOptional()
  layout?: RoomLayout;

  @ValidateNested()
  @Type(() => CreateRoomPricingDto)
  @IsOptional()
  pricing?: CreateRoomPricingDto;

  @IsObject()
  @IsOptional()
  availability?: RoomAvailability;

  @IsObject()
  @IsOptional()
  services?: RoomServices;

  @IsUUID()
  @IsOptional()
  originalRoomId?: string;

  @IsUUID()
  @IsNotEmpty()
  enhancedHotelId: string;
}