'use client';

import React, { Suspense } from 'react';
import { IntegratedOnboardingFlow } from '@/components/onboarding/integrated-onboarding-flow';

export default function DirectFlowTest() {
  console.log('DirectFlowTest - Component rendered');
  
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Direct Flow Test</h1>
        <div className="bg-yellow-100 border border-yellow-400 rounded p-4 mb-4">
          <p><strong>Expected:</strong> You should see the onboarding wizard below this message.</p>
          <p><strong>If you don't see it:</strong> Check console for error messages.</p>
        </div>
      </div>
      
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading IntegratedOnboardingFlow...</p>
          </div>
        </div>
      }>
        <div className="border-2 border-red-500 border-dashed p-4 m-4">
          <p className="text-red-600 font-bold mb-2">IntegratedOnboardingFlow should render below:</p>
          <IntegratedOnboardingFlow />
        </div>
      </Suspense>
      
      <div className="p-4">
        <div className="bg-blue-100 border border-blue-400 rounded p-4">
          <p><strong>Debug Info:</strong> Check browser console for any logs starting with "IntegratedOnboardingFlow"</p>
        </div>
      </div>
    </div>
  );
}