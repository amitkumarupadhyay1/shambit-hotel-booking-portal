import apiClient from './client';

export const hotelsApi = {
    createOnboarding: async (data: any) => {
        const response = await apiClient.post('/hotels/onboarding', data);
        return response.data;
    },

    getHotels: async (params?: { city?: string; hotelType?: string }) => {
        const response = await apiClient.get('/hotels', { params });
        return response.data;
    },

    getMyHotels: async () => {
        const response = await apiClient.get('/hotels/my-hotels');
        return response.data;
    },

    getHotelBySlug: async (slug: string) => {
        const response = await apiClient.get(`/hotels/slug/${slug}`);
        return response.data;
    },

    getHotelById: async (id: string) => {
        const response = await apiClient.get(`/hotels/${id}`);
        return response.data;
    },

    updateHotel: async (id: string, data: any) => {
        const response = await apiClient.patch(`/hotels/${id}`, data);
        return response.data;
    },
};
