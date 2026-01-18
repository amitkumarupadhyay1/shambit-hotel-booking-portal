import { IsString, IsDateString, IsInt, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { HotelType } from '../../hotels/entities/hotel.entity';

export class HotelSearchDto {
  @IsString()
  city: string;

  @IsDateString()
  checkInDate: string; // YYYY-MM-DD

  @IsDateString()
  checkOutDate: string; // YYYY-MM-DD

  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  guests: number;

  @IsOptional()
  @IsEnum(HotelType)
  hotelType?: HotelType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  minPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  maxPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => value ? parseInt(value) : 1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => value ? parseInt(value) : 20)
  limit?: number = 20;
}