import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsEmail, Length, IsObject, ValidateNested, IsPhoneNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { HotelType } from '../entities/hotel.entity';
import { CreateRoomDto } from '../../rooms/dto/create-room.dto';
import { OmitType } from '@nestjs/mapped-types';

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

// Room DTO for onboarding shouldn't require hotelId
export class OnboardingRoomDto extends OmitType(CreateRoomDto, ['hotelId'] as const) { }

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
