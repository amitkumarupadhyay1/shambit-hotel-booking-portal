/**
 * Simplified Onboarding API Client
 * Direct API calls without over-abstraction
 */

import apiClient from '@/lib/api/client';

export interface OnboardingSession {
  id: string;
  hotelId: string;
  currentStep: number;
  completedSteps: string[];
  expiresAt: string;
}

export const onboardingApi = {
  /**
   * Create a new onboarding session
   */
  async createSession(data?: { hotelId?: string }): Promise<OnboardingSession> {
    const response = await apiClient.post('/onboarding/sessions', data);
    return response.data.data;
  },

  /**
   * Get session status
   */
  async getSession(sessionId: string): Promise<OnboardingSession> {
    const response = await apiClient.get(`/onboarding/sessions/${sessionId}`);
    return response.data.data;
  },

  /**
   * Save step data
   */
  async saveStep(sessionId: string, stepId: string, data: any): Promise<void> {
    await apiClient.post(`/onboarding/sessions/${sessionId}/steps/${stepId}`, data);
  },

  /**
   * Update step data
   */
  async updateStep(sessionId: string, stepId: string, data: any): Promise<void> {
    await apiClient.put(`/onboarding/sessions/${sessionId}/steps/${stepId}`, data);
  },

  /**
   * Get step data
   */
  async getStep(sessionId: string, stepId: string): Promise<any> {
    const response = await apiClient.get(`/onboarding/sessions/${sessionId}/steps/${stepId}`);
    return response.data.data;
  },

  /**
   * Complete onboarding
   */
  async complete(sessionId: string): Promise<{ hotelId: string }> {
    const response = await apiClient.post(`/onboarding/sessions/${sessionId}/complete`);
    return response.data.data;
  },

  /**
   * Upload images
   */
  async uploadImages(sessionId: string, files: File[]): Promise<{
    images: Array<{
      id: string;
      url: string;
      qualityScore?: number;
    }>;
  }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await apiClient.post(
      `/onboarding/sessions/${sessionId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  },
};
