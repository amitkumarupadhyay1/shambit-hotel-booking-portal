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

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => value ? parseInt(value) : 1)
  guests?: number = 1;

  @IsOptional()
  @IsEnum(HotelType)
  hotelType?: HotelType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => value ? parseInt(value) : 1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => value ? parseInt(value) : 10)
  limit?: number = 10;
}