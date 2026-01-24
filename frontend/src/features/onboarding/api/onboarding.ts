/**
 * Onboarding API Client
 * Clean API layer for onboarding backend integration
 */

import apiClient from '@/lib/api/client';
import { OnboardingSession, OnboardingDraft, StepData } from '../types/onboarding';

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
            completedSteps: sessionData.completedSteps,
            qualityScore: sessionData.qualityScore,
            expiresAt: sessionData.expiresAt,
        };
    },

    /**
     * Get session status
     */
    async getSessionStatus(sessionId: string): Promise<OnboardingSession> {
        const response = await apiClient.get(`/hotels/integrated-onboarding/sessions/${sessionId}/status`);
        const sessionData = response.data.data;

        return {
            id: sessionData.sessionId,
            hotelId: sessionData.hotelId,
            currentStep: sessionData.currentStep,
            completedSteps: sessionData.completedSteps,
            qualityScore: sessionData.qualityScore,
            expiresAt: sessionData.expiresAt,
        };
    },

    /**
     * Update a step with data
     */
    async updateStep(sessionId: string, stepId: string, data: any): Promise<void> {
        await apiClient.put(
            `/hotels/integrated-onboarding/sessions/${sessionId}/steps/${stepId}`,
            data
        );
    },

    /**
     * Validate a step
     */
    async validateStep(sessionId: string, stepId: string, data: any): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }> {
        const response = await apiClient.post(
            `/hotels/integrated-onboarding/sessions/${sessionId}/validate`,
            { stepId, data }
        );
        return response.data.data;
    },

    /**
     * Save draft data
     */
    async saveDraft(sessionId: string, draftData: OnboardingDraft): Promise<void> {
        await apiClient.put(
            `/hotels/integrated-onboarding/sessions/${sessionId}/draft`,
            { draftData }
        );
    },

    /**
     * Load draft data
     */
    async loadDraft(sessionId: string): Promise<OnboardingDraft> {
        const response = await apiClient.get(
            `/hotels/integrated-onboarding/sessions/${sessionId}/draft`
        );
        return response.data.data || {};
    },

    /**
     * Complete onboarding
     */
    async completeOnboarding(sessionId: string): Promise<{ hotelId: string }> {
        const response = await apiClient.post(
            `/hotels/integrated-onboarding/sessions/${sessionId}/complete`
        );
        return response.data.data;
    },

    /**
     * Upload images
     */
    async uploadImages(sessionId: string, files: File[]): Promise<{
        images: Array<{
            id: string;
            url: string;
            qualityScore: number;
        }>;
    }> {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('images', file);
        });

        const response = await apiClient.post(
            `/hotels/integrated-onboarding/sessions/${sessionId}/images`,
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
