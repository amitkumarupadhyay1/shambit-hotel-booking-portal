'use client';

import React, { useEffect, useState } from 'react';
import { IntegratedOnboardingFlow } from '@/components/onboarding/integrated-onboarding-flow';
import { OnboardingErrorBoundary } from '@/components/onboarding/error-boundary';
import { ProgressiveEnhancement, MobileOptimizedLayout, TabletOptimizedLayout, DesktopOptimizedLayout } from '@/components/onboarding/progressive-enhancement';

// Stable flag - computed once, not during render
const enableViewportToggle = process.env.NODE_ENV === 'development';

export default function OnboardingPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Memoized element - prevents double mount/unmount of flow
    const flow = <IntegratedOnboardingFlow />;

    return (
        <OnboardingErrorBoundary>
            {!mounted ? (
                // SSR + first client render match - stable tree
                flow
            ) : (
                // Progressive enhancement runs after hydration
                <ProgressiveEnhancement
                    mobileComponent={({ viewport }) => (
                        <MobileOptimizedLayout viewport={viewport}>
                            {flow}
                        </MobileOptimizedLayout>
                    )}
                    tabletComponent={({ viewport }) => (
                        <TabletOptimizedLayout viewport={viewport}>
                            {flow}
                        </TabletOptimizedLayout>
                    )}
                    desktopComponent={({ viewport }) => (
                        <DesktopOptimizedLayout viewport={viewport}>
                            {flow}
                        </DesktopOptimizedLayout>
                    )}
                    enableViewportToggle={enableViewportToggle}
                >
                    {/* Fallback for when progressive enhancement components are not available */}
                    {flow}
                </ProgressiveEnhancement>
            )}
        </OnboardingErrorBoundary>
    );
}