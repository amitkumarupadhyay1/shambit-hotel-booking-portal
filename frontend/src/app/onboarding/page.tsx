'use client';

import React from 'react';
import { IntegratedOnboardingFlow } from '@/components/onboarding/integrated-onboarding-flow';
import { OnboardingErrorBoundary } from '@/components/onboarding/error-boundary';
import { ProgressiveEnhancement, MobileOptimizedLayout, TabletOptimizedLayout, DesktopOptimizedLayout } from '@/components/onboarding/progressive-enhancement';

export default function OnboardingPage() {
    return (
        <OnboardingErrorBoundary>
            <ProgressiveEnhancement
                mobileComponent={({ viewport }) => (
                    <MobileOptimizedLayout viewport={viewport}>
                        <IntegratedOnboardingFlow />
                    </MobileOptimizedLayout>
                )}
                tabletComponent={({ viewport }) => (
                    <TabletOptimizedLayout viewport={viewport}>
                        <IntegratedOnboardingFlow />
                    </TabletOptimizedLayout>
                )}
                desktopComponent={({ viewport }) => (
                    <DesktopOptimizedLayout viewport={viewport}>
                        <IntegratedOnboardingFlow />
                    </DesktopOptimizedLayout>
                )}
                enableViewportToggle={process.env.NODE_ENV === 'development'}
            >
                {/* Fallback for when progressive enhancement components are not available */}
                <IntegratedOnboardingFlow />
            </ProgressiveEnhancement>
        </OnboardingErrorBoundary>
    );
}