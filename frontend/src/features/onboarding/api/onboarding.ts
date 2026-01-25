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
    const response = await apiClient.post('/hotels/integrated-onboarding/sessions', data);
    const sessionData = response.data.data;
    return {
      id: sessionData.sessionId,
      hotelId: sessionData.hotelId,
      currentStep: sessionData.currentStep,
      completedSteps: sessionData.completedSteps || [],
      expiresAt: sessionData.expiresAt,
    };
  },

  /**
   * Get session status
   */
  async getSession(sessionId: string): Promise<OnboardingSession> {
    const response = await apiClient.get(`/hotels/integrated-onboarding/sessions/${sessionId}/status`);
    const sessionData = response.data.data.session;
    return {
      id: sessionId,
      hotelId: sessionData.hotelId || 'unknown',
      currentStep: sessionData.currentStep,
      completedSteps: sessionData.completedSteps || [],
      expiresAt: sessionData.expiresAt || new Date().toISOString(),
    };
  },

  /**
   * Save step data
   */
  async saveStep(sessionId: string, stepId: string, data: any): Promise<void> {
    await apiClient.put(`/hotels/integrated-onboarding/sessions/${sessionId}/steps/${stepId}`, data);
  },

  /**
   * Update step data
   */
  async updateStep(sessionId: string, stepId: string, data: any): Promise<void> {
    await apiClient.put(`/hotels/integrated-onboarding/sessions/${sessionId}/steps/${stepId}`, data);
  },

  /**
   * Get step data
   */
  async getStep(sessionId: string, stepId: string): Promise<any> {
    const response = await apiClient.get(`/hotels/integrated-onboarding/sessions/${sessionId}/draft`);
    return response.data.data[stepId] || {};
  },

  /**
   * Complete onboarding
   */
  async complete(sessionId: string): Promise<{ hotelId: string }> {
    const response = await apiClient.post(`/hotels/integrated-onboarding/sessions/${sessionId}/complete`);
    return {
      hotelId: response.data.data.hotelId,
    };
  },
};
