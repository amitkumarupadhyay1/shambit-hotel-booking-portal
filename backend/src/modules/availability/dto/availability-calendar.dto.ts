export class AvailabilityCalendarDto {
  date: string; // YYYY-MM-DD
  availableCount: number;
  totalCount: number;
  isBlocked: boolean;
  blockReason?: string;
}