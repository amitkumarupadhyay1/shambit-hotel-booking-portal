import { HotelType } from '../../hotels/entities/hotel.entity';

export class HotelSearchResult {
  hotelId: string;
  name: string;
  city: string;
  hotelType: HotelType;
  minBasePrice: number;
  availabilityStatus: 'AVAILABLE';
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