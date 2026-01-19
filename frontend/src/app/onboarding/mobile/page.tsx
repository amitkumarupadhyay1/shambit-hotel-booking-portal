'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/auth';
import { hotelsApi } from '@/lib/api/hotels';
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
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);

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

  // Mobile wizard event handlers
  const handleStepComplete = async (stepId: string, stepData: StepData): Promise<void> => {
    try {
      if (sessionId) {
        // Update step data on server
        await fetch(`/api/hotels/onboarding/sessions/${sessionId}/steps`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stepId, stepData })
        });

        // Mark step as completed
        await fetch(`/api/hotels/onboarding/sessions/${sessionId}/steps/${stepId}/complete`, {
          method: 'POST'
        });
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
      // Don't throw - let offline sync handle it
    }
  };

  const handleComplete = async (allData: OnboardingDraft): Promise<void> => {
    try {
      if (sessionId) {
        const response = await fetch(`/api/hotels/onboarding/sessions/${sessionId}/complete`, {
          method: 'POST'
        });

        if (response.ok) {
          toast.success('Onboarding completed successfully!');
          router.push('/seller/dashboard');
        } else {
          throw new Error('Failed to complete onboarding');
        }
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      toast.error('Failed to complete onboarding. Please try again.');
      throw error;
    }
  };

  const handleDraftSave = async (draftData: OnboardingDraft): Promise<void> => {
    try {
      if (sessionId) {
        await fetch(`/api/hotels/onboarding/sessions/${sessionId}/draft`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftData })
        });
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      // Don't throw - offline sync will handle it
    }
  };

  const handleDraftLoad = async (): Promise<OnboardingDraft> => {
    try {
      if (sessionId) {
        const response = await fetch(`/api/hotels/onboarding/sessions/${sessionId}/draft`);
        if (response.ok) {
          const result = await response.json();
          return result.data || {};
        }
      }
      return {};
    } catch (error) {
      console.error('Failed to load draft:', error);
      return {};
    }
  };

  // Initialize session on mount
  React.useEffect(() => {
    const initializeSession = async () => {
      try {
        // For demo purposes, create a session with a temporary hotel ID
        // In real implementation, this would come from the user's hotel selection
        const response = await fetch('/api/hotels/onboarding/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hotelId: 'temp-hotel-id' })
        });

        if (response.ok) {
          const result = await response.json();
          setSessionId(result.data.sessionId);
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
        // Continue with offline mode
      }
    };

    if (isAuthenticated && hasRole(UserRole.SELLER)) {
      initializeSession();
    }
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