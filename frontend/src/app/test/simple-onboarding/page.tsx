'use client';

import React from 'react';

// Simple test to see if we can render anything
export default function SimpleOnboardingTest() {
  console.log('SimpleOnboardingTest - Component loaded');
  
  // Test basic imports first
  try {
    console.log('Testing React import...');
    
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Simple Onboarding Test</h1>
          <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <p>✅ Basic React rendering works</p>
            <p>✅ Tailwind CSS classes work</p>
            <p>Check console for: "SimpleOnboardingTest - Component loaded"</p>
            
            <div className="mt-4">
              <h2 className="font-bold">Next Steps:</h2>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>If you see this page, basic rendering works</li>
                <li>If console shows the log, JavaScript execution works</li>
                <li>The issue is likely in the IntegratedOnboardingFlow component</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in SimpleOnboardingTest:', error);
    return (
      <div className="min-h-screen bg-red-50 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <div className="bg-white p-4 rounded-lg shadow">
            <p>There was an error rendering the component.</p>
            <p>Check the browser console for details.</p>
          </div>
        </div>
      </div>
    );
  }
}