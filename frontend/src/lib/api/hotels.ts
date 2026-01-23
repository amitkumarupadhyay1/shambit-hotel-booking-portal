import apiClient from './client';

export const hotelsApi = {
    // Enhanced integrated onboarding API
    createOnboardingSession: async (data: any) => {
        const response = await apiClient.post('/hotels/integrated-onboarding/sessions', data);
        return response.data;
    },

    updateOnboardingStep: async (sessionId: string, stepId: string, data: any) => {
        const response = await apiClient.put(`/hotels/integrated-onboarding/sessions/${sessionId}/steps/${stepId}`, data);
        return response.data;
    },

    validateOnboardingStep: async (sessionId: string, data: any) => {
        const response = await apiClient.post(`/hotels/integrated-onboarding/sessions/${sessionId}/validate`, data);
        return response.data;
    },

    completeOnboarding: async (sessionId: string, data?: any) => {
        const response = await apiClient.post(`/hotels/integrated-onboarding/sessions/${sessionId}/complete`, data);
        return response.data;
    },

    getOnboardingStatus: async (sessionId: string) => {
        const response = await apiClient.get(`/hotels/integrated-onboarding/sessions/${sessionId}/status`);
        return response.data;
    },

    getMobileConfig: async () => {
        const response = await apiClient.get('/hotels/integrated-onboarding/mobile-config');
        return response.data;
    },

    // Legacy hotel management (kept for backward compatibility)
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

    // Enhanced hotel management
    getEnhancedHotels: async (params?: any) => {
        const response = await apiClient.get('/hotels/enhanced', { params });
        return response.data;
    },

    getEnhancedHotelById: async (id: string) => {
        const response = await apiClient.get(`/hotels/enhanced/${id}`);
        return response.data;
    },
};
