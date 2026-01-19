import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  IsOptional, 
  IsObject, 
  IsArray, 
  IsNumber, 
  IsEmail, 
  IsUrl, 
  Length, 
  Min, 
  Max,
  ValidateNested,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { 
  PropertyType, 
  OnboardingStatus,
  RichTextContent,
  HotelBasicInfo,
  LocationDetails,
  HotelPolicies,
  CategorizedAmenities,
  CategorizedImages,
  BusinessFeatures,
  ContactInfo,
  Address,
} from '../interfaces/enhanced-hotel.interface';

export class CreateContactInfoDto implements ContactInfo {
  @IsString()
  @IsNotEmpty()
  @Length(10, 20)
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  emergencyContact?: string;
}

export class CreateAddressDto implements Address {
  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  street: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  state: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 10)
  pincode: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  country: string;

  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

export class CreateRichTextContentDto implements RichTextContent {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(['markdown', 'html'])
  format: 'markdown' | 'html';

  @IsNumber()
  @IsOptional()
  wordCount: number;

  @IsNumber()
  @IsOptional()
  readingTime: number;
}

export class CreateHotelBasicInfoDto implements HotelBasicInfo {
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  name: string;

  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  starRating?: number;

  @ValidateNested()
  @Type(() => CreateContactInfoDto)
  contactInfo: CreateContactInfoDto;

  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;

  @IsNumber()
  @IsOptional()
  @Min(1800)
  @Max(new Date().getFullYear())
  establishedYear?: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  totalRooms: number;
}

export class CreateCategorizedAmenitiesDto implements CategorizedAmenities {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  propertyWide: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roomSpecific: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  business: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  wellness: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dining: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sustainability: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recreational: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  connectivity: string[];
}

export class CreateEnhancedHotelDto {
  @ValidateNested()
  @Type(() => CreateHotelBasicInfoDto)
  @IsNotEmpty()
  basicInfo: CreateHotelBasicInfoDto;

  @ValidateNested()
  @Type(() => CreateRichTextContentDto)
  @IsOptional()
  propertyDescription?: CreateRichTextContentDto;

  @IsObject()
  @IsOptional()
  locationDetails?: LocationDetails;

  @IsObject()
  @IsOptional()
  policies?: HotelPolicies;

  @ValidateNested()
  @Type(() => CreateCategorizedAmenitiesDto)
  @IsOptional()
  amenities?: CreateCategorizedAmenitiesDto;

  @IsObject()
  @IsOptional()
  images?: CategorizedImages;

  @IsObject()
  @IsOptional()
  businessFeatures?: BusinessFeatures;

  @IsEnum(OnboardingStatus)
  @IsOptional()
  onboardingStatus?: OnboardingStatus;

  @IsUUID()
  @IsOptional()
  originalHotelId?: string;

  @IsUUID()
  @IsNotEmpty()
  ownerId: string;
}