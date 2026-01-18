import apiClient from './client';

export interface HotelSearchParams {
  city: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  hotelType?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface AvailabilityParams {
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
}

export interface HotelSearchResult {
  id: string;
  name: string;
  slug: string;
  hotelType: string;
  city: string;
  address: string;
  startingPrice: number;
  averageRating: number;
  totalReviews: number;
  images: string[];
  availableRooms: number;
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
    apiClient.get<PaginatedHotelSearchResult>('/search/hotels', { params }),
  
  getHotelDetails: (id: string, params?: AvailabilityParams) =>
    apiClient.get<HotelDetailDto>(`/search/hotels/${id}/availability`, { params }),
};