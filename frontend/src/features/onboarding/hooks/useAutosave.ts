/**
 * Autosave Hook
 * Handles automatic saving of draft data
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { onboardingApi } from '../api/onboarding';
import { OnboardingDraft } from '../types/onboarding';

interface UseAutosaveOptions {
    sessionId: string | null;
    draftData: OnboardingDraft;
    debounceMs?: number;
    enabled?: boolean;
}

export function useAutosave({
    sessionId,
    draftData,
    debounceMs = 2000,
    enabled = true,
}: UseAutosaveOptions) {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const previousDataRef = useRef<OnboardingDraft>(draftData);

    /**
     * Save draft to backend
     */
    const saveDraft = useCallback(async () => {
        if (!sessionId || !enabled) return;

        try {
            setIsSaving(true);
            setSaveError(null);

            await onboardingApi.saveDraft(sessionId, draftData);

            setLastSaved(new Date());
            previousDataRef.current = draftData;
        } catch (err: any) {
            console.error('Failed to save draft:', err);
            setSaveError(err.response?.data?.message || 'Failed to save draft');
        } finally {
            setIsSaving(false);
        }
    }, [sessionId, draftData, enabled]);

    /**
     * Trigger autosave with debounce
     */
    useEffect(() => {
        if (!enabled || !sessionId) return;

        // Check if data actually changed
        const dataChanged = JSON.stringify(draftData) !== JSON.stringify(previousDataRef.current);

        if (!dataChanged) return;

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
            saveDraft();
        }, debounceMs);

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [draftData, sessionId, enabled, debounceMs, saveDraft]);

    /**
     * Manual save (bypasses debounce)
     */
    const saveNow = useCallback(async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        await saveDraft();
    }, [saveDraft]);

    return {
        isSaving,
        lastSaved,
        saveError,
        saveNow,
    };
}
