import { HotelType, HotelStatus } from '../../hotels/entities/hotel.entity';

export class SellerHotelSummaryDto {
  id: string;
  name: string;
  slug: string;
  hotelType: HotelType;
  status: HotelStatus;
  city: string;
  totalRooms: number;
  availableRooms: number;
  blockedRooms: number;
  occupancyRate: number; // Percentage
  averageRating: number;
  totalReviews: number;
  images: string[];
}

export class SellerDashboardDto {
  hotels: SellerHotelSummaryDto[];
  totalHotels: number;
  totalRooms: number;
  occupancyRate: number; // Overall percentage of blocked/unavailable rooms
  summary: {
    approvedHotels: number;
    pendingHotels: number;
    rejectedHotels: number;
    totalBookings: number; // Will be 0 in Spiral 2
  };
}