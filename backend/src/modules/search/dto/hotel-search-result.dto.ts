import { HotelType } from '../../hotels/entities/hotel.entity';

export class HotelSearchResult {
  id: string;
  name: string;
  slug: string;
  hotelType: HotelType;
  city: string;
  address: string;
  startingPrice: number;
  averageRating: number;
  totalReviews: number;
  images: string[];
  availableRooms: number;
}

export class PaginatedHotelSearchResult {
  data: HotelSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}