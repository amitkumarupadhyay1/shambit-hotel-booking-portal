import { IsDateString, IsInt, Min } from 'class-validator';

export class SetAvailabilityDto {
  @IsDateString()
  date: string; // YYYY-MM-DD

  @IsInt()
  @Min(0)
  availableCount: number;
}