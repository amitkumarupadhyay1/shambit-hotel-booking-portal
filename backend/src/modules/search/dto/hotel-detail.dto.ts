import { HotelType } from '../../hotels/entities/hotel.entity';
import { RoomType } from '../../rooms/entities/room.entity';

export class RoomAvailabilityDto {
  id: string;
  name: string; // Changed from roomNumber to name
  roomType: RoomType;
  basePrice: number;
  maxOccupancy: number;
  isAvailable: boolean;
  availableCount: number;
  amenities: string[];
  images: string[];
  description?: string;
  bedCount: number;
  bedType: string;
  roomSize?: number;
}

export class HotelDetailDto {
  id: string;
  name: string;
  description: string;
  hotelType: HotelType;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  amenities: string[];
  images: string[];
  averageRating: number;
  totalReviews: number;
  rooms: RoomAvailabilityDto[];
}