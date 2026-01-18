import { IsDateString, IsOptional, IsString } from 'class-validator';

export class BlockDatesDto {
  @IsDateString()
  startDate: string; // YYYY-MM-DD

  @IsDateString()
  endDate: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  reason?: string;
}