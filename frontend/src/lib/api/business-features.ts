import apiClient from './client';
import {
  BusinessFeatures,
  MeetingRoom,
  BusinessCenter,
  ConnectivityDetails,
  WorkSpace,
  BusinessService,
} from '../types/business-features';

export const businessFeaturesApi = {
  // Get business features for a hotel
  getBusinessFeatures: async (hotelId: string): Promise<BusinessFeatures | null> => {
    const response = await apiClient.get(`/hotels/${hotelId}/business-features`);
    return response.data;
  },

  // Update business features
  updateBusinessFeatures: async (
    hotelId: string,
    features: Partial<BusinessFeatures>
  ): Promise<BusinessFeatures> => {
    const response = await apiClient.put(`/hotels/${hotelId}/business-features`, features);
    return response.data;
  },

  // Meeting Rooms
  addOrUpdateMeetingRoom: async (
    hotelId: string,
    meetingRoom: MeetingRoom
  ): Promise<BusinessFeatures> => {
    const response = await apiClient.post(`/hotels/${hotelId}/business-features/meeting-rooms`, meetingRoom);
    return response.data;
  },

  removeMeetingRoom: async (hotelId: string, roomId: string): Promise<BusinessFeatures> => {
    const response = await apiClient.delete(`/hotels/${hotelId}/business-features/meeting-rooms/${roomId}`);
    return response.data;
  },

  // Business Center
  updateBusinessCenter: async (
    hotelId: string,
    businessCenter: BusinessCenter
  ): Promise<BusinessFeatures> => {
    const response = await apiClient.put(`/hotels/${hotelId}/business-features/business-center`, businessCenter);
    return response.data;
  },

  // Connectivity
  updateConnectivityDetails: async (
    hotelId: string,
    connectivity: ConnectivityDetails
  ): Promise<BusinessFeatures> => {
    const response = await apiClient.put(`/hotels/${hotelId}/business-features/connectivity`, connectivity);
    return response.data;
  },

  // Work Spaces
  addOrUpdateWorkSpace: async (
    hotelId: string,
    workSpace: WorkSpace
  ): Promise<BusinessFeatures> => {
    const response = await apiClient.post(`/hotels/${hotelId}/business-features/workspaces`, workSpace);
    return response.data;
  },

  removeWorkSpace: async (hotelId: string, workspaceId: string): Promise<BusinessFeatures> => {
    const response = await apiClient.delete(`/hotels/${hotelId}/business-features/workspaces/${workspaceId}`);
    return response.data;
  },

  // Business Services
  updateBusinessServices: async (
    hotelId: string,
    services: BusinessService[]
  ): Promise<BusinessFeatures> => {
    const response = await apiClient.put(`/hotels/${hotelId}/business-features/services`, services);
    return response.data;
  },
};