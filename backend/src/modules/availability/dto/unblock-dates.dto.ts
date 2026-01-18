import { IsDateString } from 'class-validator';

export class UnblockDatesDto {
  @IsDateString()
  startDate: string; // YYYY-MM-DD

  @IsDateString()
  endDate: string; // YYYY-MM-DD
}