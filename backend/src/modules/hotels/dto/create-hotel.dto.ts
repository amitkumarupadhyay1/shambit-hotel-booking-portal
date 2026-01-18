import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsNumber, IsEmail, IsUrl, Length, Min, Max } from 'class-validator';
import { HotelType } from '../entities/hotel.entity';

export class CreateHotelDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(HotelType)
  @IsOptional()
  hotelType?: HotelType;

  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
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
  @Length(5, 10)
  pincode: string;

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  startingPrice?: number;
}