import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsNumber, IsUUID, Length, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { RoomType } from '../entities/room.entity';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string; // Changed from roomNumber to name for clarity

  @IsEnum(RoomType)
  @IsOptional()
  roomType?: RoomType;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  maxOccupancy?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  bedCount?: number;

  @IsString()
  @IsOptional()
  @Length(2, 50)
  bedType?: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  basePrice: number;

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

  @IsUUID()
  @IsNotEmpty()
  hotelId: string;
}