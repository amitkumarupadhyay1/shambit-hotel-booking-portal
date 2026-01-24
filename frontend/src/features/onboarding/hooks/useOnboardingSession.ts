/**
 * Onboarding Session Hook
 * Manages onboarding session state - replaces the singleton session manager
 */

import { useState, useEffect, useCallback } from 'react';
import { onboardingApi } from '../api/onboarding';
import { OnboardingSession, OnboardingDraft } from '../types/onboarding';

export function useOnboardingSession(hotelId?: string) {
    const [session, setSession] = useState<OnboardingSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [draftData, setDraftData] = useState<OnboardingDraft>({});

    // Initialize session
    const initializeSession = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const newSession = await onboardingApi.createSession(
                hotelId ? { hotelId } : undefined
            );

            setSession(newSession);

            // Load draft data if available
            try {
                const draft = await onboardingApi.loadDraft(newSession.id);
                setDraftData(draft);
            } catch (err) {
                // Draft loading is optional, don't fail if it errors
                console.warn('Failed to load draft:', err);
            }
        } catch (err: any) {
            console.error('Failed to initialize session:', err);
            setError(err.response?.data?.message || 'Failed to start onboarding');
        } finally {
            setIsLoading(false);
        }
    }, [hotelId]);

    // Initialize on mount
    useEffect(() => {
        initializeSession();
    }, [initializeSession]);

    // Update step data
    const updateStepData = useCallback((stepId: string, data: any) => {
        setDraftData((prev) => ({
            ...prev,
            [stepId]: data,
        }));
    }, []);

    // Get step data
    const getStepData = useCallback((stepId: string) => {
        return draftData[stepId];
    }, [draftData]);

    // Refresh session status
    const refreshSession = useCallback(async () => {
        if (!session) return;

        try {
            const updatedSession = await onboardingApi.getSessionStatus(session.id);
            setSession(updatedSession);
        } catch (err) {
            console.error('Failed to refresh session:', err);
        }
    }, [session]);

    return {
        session,
        isLoading,
        error,
        draftData,
        updateStepData,
        getStepData,
        refreshSession,
        retry: initializeSession,
    };
}
