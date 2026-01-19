import apiClient from './client';

export interface HotelSearchParams {
  city: string;
  checkInDate: string;
  checkOutDate: string;
  guests?: number;
  hotelType?: string;
  page?: number;
  limit?: number;
}

export interface HotelSearchResult {
  hotelId: string;
  name: string;
  city: string;
  hotelType: string;
  minBasePrice: number;
  availabilityStatus: 'AVAILABLE';
}

export interface PaginatedHotelSearchResult {
  data: HotelSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RoomAvailabilityDto {
  id: string;
  name: string; // Changed from roomNumber to name
  roomType: string;
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

export interface HotelDetailDto {
  id: string;
  name: string;
  description: string;
  hotelType: string;
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

export const searchApi = {
  searchHotels: (params: HotelSearchParams) => 
    apiClient.get<PaginatedHotelSearchResult>('/hotels/search', { params }),
  
  getHotelDetails: (id: string, params?: { checkInDate?: string; checkOutDate?: string; guests?: number }) =>
    apiClient.get<HotelDetailDto>(`/search/hotels/${id}/availability`, { params }),
};