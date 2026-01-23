'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/auth';
import { 
  MobileOnboardingIntegration,
  StepData, 
  OnboardingDraft
} from '@/components/onboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function MobileOnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionInitializedRef = useRef(false);
  const offlineWarningShownRef = useRef(false);

  // Authentication check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasRole(UserRole.SELLER)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              {!isAuthenticated 
                ? "Please log in to access the mobile onboarding" 
                : "You need to be a registered hotel partner to access this page"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <Button onClick={() => router.push('/onboarding')} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Desktop Version
            </Button>
            {!isAuthenticated ? (
              <Button onClick={() => router.push('/login?redirect=/onboarding/mobile')} className="w-full">
                Log In
              </Button>
            ) : (
              <Button onClick={() => router.push('/register?type=owner')}>
                Become a Partner
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mobile wizard event handlers with offline handling
  const handleStepComplete = useCallback(async (stepId: string, stepData: StepData): Promise<void> => {
    if (!sessionId) {
      if (!offlineWarningShownRef.current) {
        toast.warning('Working offline. Your progress will sync when connected.');
        offlineWarningShownRef.current = true;
      }
      return;
    }

    try {
      // Update step data using integrated onboarding API
      await fetch(`/api/hotels/integrated-onboarding/sessions/${sessionId}/steps/${stepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepData)
      });
    } catch (error) {
      console.error('Failed to complete step:', error);
      // Don't throw - let offline sync handle it
    }
  }, [sessionId]);

  const handleComplete = useCallback(async (allData: OnboardingDraft): Promise<void> => {
    if (!sessionId) {
      toast.error('Cannot complete onboarding offline. Please check your connection.');
      throw new Error('No session available');
    }

    try {
      const response = await fetch(`/api/hotels/integrated-onboarding/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalReview: true,
          publishImmediately: true
        })
      });

      if (response.ok) {
        toast.success('Onboarding completed successfully!');
        router.push('/seller/dashboard');
      } else {
        throw new Error('Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error('Failed to complete onboarding. Please try again.');
      throw error;
    }
  }, [sessionId, router]);

  const handleDraftSave = useCallback(async (draftData: OnboardingDraft): Promise<void> => {
    if (!sessionId) {
      return; // Silent fail for drafts - offline sync will handle
    }

    try {
      // Fixed: Use consistent API namespace
      await fetch(`/api/hotels/integrated-onboarding/sessions/${sessionId}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftData })
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
      // Don't throw - offline sync will handle it
    }
  }, [sessionId]);

  const handleDraftLoad = useCallback(async (): Promise<OnboardingDraft> => {
    if (!sessionId) {
      return {};
    }

    try {
      const response = await fetch(`/api/hotels/integrated-onboarding/sessions/${sessionId}/status`);
      if (response.ok) {
        const result = await response.json();
        return result.data?.draftData || {};
      }
      return {};
    } catch (error) {
      console.error('Failed to load draft:', error);
      return {};
    }
  }, [sessionId]);

  // Initialize session on mount - protected against double initialization
  React.useEffect(() => {
    if (!isAuthenticated || !hasRole(UserRole.SELLER)) return;
    if (sessionInitializedRef.current) return;

    sessionInitializedRef.current = true;

    const initializeSession = async () => {
      try {
        // Create session using the enhanced integrated onboarding system
        const response = await fetch('/api/hotels/integrated-onboarding/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            deviceInfo: {
              type: 'mobile',
              userAgent: navigator.userAgent,
              screenSize: {
                width: window.screen.width,
                height: window.screen.height
              }
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          setSessionId(result.data.sessionId);
        } else {
          console.warn('Session creation failed, continuing in offline mode');
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
        // Continue with offline mode
      }
    };

    initializeSession();
  }, [isAuthenticated, hasRole]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/onboarding')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Desktop Version
          </Button>
          <h1 className="text-lg font-semibold text-slate-800">
            Mobile Onboarding
          </h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Mobile Onboarding Integration */}
      <MobileOnboardingIntegration
        onStepComplete={handleStepComplete}
        onComplete={handleComplete}
        onDraftSave={handleDraftSave}
        onDraftLoad={handleDraftLoad}
        className="pb-safe"
      />
    </div>
  );
}