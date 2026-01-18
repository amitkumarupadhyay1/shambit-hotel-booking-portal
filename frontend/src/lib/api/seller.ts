import apiClient from './client';

export interface SellerHotelSummaryDto {
  id: string;
  name: string;
  slug: string;
  hotelType: string;
  status: string;
  city: string;
  totalRooms: number;
  availableRooms: number;
  blockedRooms: number;
  occupancyRate: number;
  averageRating: number;
  totalReviews: number;
  images: string[];
}

export interface SellerDashboardDto {
  hotels: SellerHotelSummaryDto[];
  totalHotels: number;
  totalRooms: number;
  occupancyRate: number;
  summary: {
    approvedHotels: number;
    pendingHotels: number;
    rejectedHotels: number;
    totalBookings: number;
  };
}

export interface AvailabilityCalendarDto {
  date: string;
  availableCount: number;
  totalCount: number;
  isBlocked: boolean;
  blockReason?: string;
}

export interface BlockDatesDto {
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface UnblockDatesDto {
  startDate: string;
  endDate: string;
}

export interface SetAvailabilityDto {
  date: string;
  availableCount: number;
}

export const sellerApi = {
  getDashboard: () => 
    apiClient.get<SellerDashboardDto>('/seller/dashboard'),
  
  getHotelOverview: (hotelId: string) =>
    apiClient.get(`/seller/hotels/${hotelId}/overview`),
  
  getHotelAvailability: (hotelId: string, startDate: string, endDate: string) =>
    apiClient.get(`/seller/hotels/${hotelId}/availability`, {
      params: { startDate, endDate }
    }),
  
  getRoomAvailability: (roomId: string, startDate: string, endDate: string) =>
    apiClient.get<AvailabilityCalendarDto[]>(`/availability/rooms/${roomId}/calendar`, {
      params: { startDate, endDate }
    }),
  
  blockDates: (roomId: string, data: BlockDatesDto) =>
    apiClient.put(`/availability/rooms/${roomId}/block`, data),
  
  unblockDates: (roomId: string, data: UnblockDatesDto) =>
    apiClient.put(`/availability/rooms/${roomId}/unblock`, data),
  
  setAvailability: (roomId: string, data: SetAvailabilityDto) =>
    apiClient.put(`/availability/rooms/${roomId}/set`, data),
};