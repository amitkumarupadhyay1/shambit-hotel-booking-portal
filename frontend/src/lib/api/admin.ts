import apiClient from './client';

export const adminApi = {
    getPendingHotels: async (status: string = 'PENDING') => {
        const response = await apiClient.get(`/admin/hotels`, { params: { status } });
        return response.data;
    },

    approveHotel: async (id: string) => {
        const response = await apiClient.put(`/admin/hotels/${id}/approve`);
        return response.data;
    },

    rejectHotel: async (id: string, reason: string) => {
        const response = await apiClient.put(`/admin/hotels/${id}/reject`, { reason });
        return response.data;
    }
};
