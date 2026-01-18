import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsEmail, Length, IsObject, ValidateNested, IsPhoneNumber, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { HotelType } from '../entities/hotel.entity';
import { RoomType } from '../../rooms/entities/room.entity';

export class HotelBaseDto {
    @IsString()
    @IsNotEmpty()
    @Length(2, 255)
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(HotelType)
    hotelType: HotelType;

    @IsString()
    @IsNotEmpty()
    @Length(5, 500)
    address: string;

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
    @Length(6, 10)
    pincode: string;

    @IsString()
    @IsNotEmpty()
    @IsPhoneNumber('IN')
    phone: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    website?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    amenities?: string[];
}

// Dedicated OnboardingRoomDto with strict validation matching frontend requirements
export class OnboardingRoomDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    name: string;

    @IsEnum(RoomType)
    @IsNotEmpty() // Required for onboarding
    roomType: RoomType;

    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty() // Required for onboarding
    @Min(0)
    basePrice: number;

    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty() // Required for onboarding
    @Min(1)
    @Max(20)
    maxOccupancy: number;

    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty() // Required for onboarding
    @Min(1)
    @Max(10)
    bedCount: number;

    @IsString()
    @IsNotEmpty() // Required for onboarding
    @Length(2, 50)
    bedType: string;

    // Optional fields for onboarding (can be added later)
    @IsString()
    @IsOptional()
    description?: string;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @Min(0)
    weekendPrice?: number;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(1000)
    roomSize?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    amenities?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];
}

export class CreateHotelOnboardingDto {
    @IsObject()
    @ValidateNested()
    @Type(() => HotelBaseDto)
    hotel: HotelBaseDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OnboardingRoomDto)
    rooms: OnboardingRoomDto[];
}
