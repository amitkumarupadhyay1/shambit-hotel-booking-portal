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

    // Simplified approach - just render the flow directly
    return (
        <OnboardingErrorBoundary>
            <IntegratedOnboardingFlow />
        </OnboardingErrorBoundary>
    );
}