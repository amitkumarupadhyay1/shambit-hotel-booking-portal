import { IsDateString, IsOptional, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class HotelAvailabilityDto {
  @IsOptional()
  @IsDateString()
  checkInDate?: string; // YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  checkOutDate?: string; // YYYY-MM-DD

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  guests?: number;
}