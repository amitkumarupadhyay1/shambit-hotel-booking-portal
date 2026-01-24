/**
 * Optimistic Updates Hook
 * Phase 2: Manages optimistic updates with rollback capability
 * Features: Automatic rollback on API failure, pending state tracking
 */

import { useCallback } from 'react';
import { useOnboardingStore } from '../store/onboarding';

export function useOptimisticUpdates() {
  const { 
    pendingUpdates, 
    rollbackData, 
    isSaving, 
    error,
    saveNow, 
    rollback 
  } = useOnboardingStore();

  // Check if there are pending updates
  const hasPendingUpdates = Object.keys(pendingUpdates).length > 0;

  // Check if rollback is available
  const canRollback = rollbackData !== null;

  // Save with automatic rollback on failure
  const saveWithRollback = useCallback(async () => {
    try {
      await saveNow();
      return { success: true, error: null };
    } catch (saveError) {
      // Automatic rollback on save failure
      if (canRollback) {
        rollback();
        return { 
          success: false, 
          error: saveError instanceof Error ? saveError.message : 'Save failed',
          rolledBack: true 
        };
      }
      return { 
        success: false, 
        error: saveError instanceof Error ? saveError.message : 'Save failed',
        rolledBack: false 
      };
    }
  }, [saveNow, canRollback, rollback]);

  // Manual rollback with confirmation
  const rollbackChanges = useCallback(() => {
    if (canRollback) {
      rollback();
      return true;
    }
    return false;
  }, [canRollback, rollback]);

  // Get pending update count
  const pendingUpdateCount = Object.keys(pendingUpdates).length;

  // Get list of fields with pending updates
  const pendingFields = Object.keys(pendingUpdates).map(key => {
    const [stepId, field] = key.split('.');
    return { stepId, field };
  });

  return {
    // State
    hasPendingUpdates,
    canRollback,
    isSaving,
    error,
    pendingUpdateCount,
    pendingFields,
    
    // Actions
    saveWithRollback,
    rollbackChanges,
    saveNow,
  };
}