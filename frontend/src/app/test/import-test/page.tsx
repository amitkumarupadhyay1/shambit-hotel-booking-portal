'use client';

import React from 'react';

export default function ImportTestPage() {
  console.log('ImportTestPage - Starting import tests...');
  
  const testResults: { [key: string]: boolean } = {};
  
  // Test 1: Basic React
  try {
    console.log('✅ React import successful');
    testResults.react = true;
  } catch (error) {
    console.error('❌ React import failed:', error);
    testResults.react = false;
  }
  
  // Test 2: Next.js router
  try {
    const { useRouter } = require('next/navigation');
    console.log('✅ Next.js router import successful');
    testResults.router = true;
  } catch (error) {
    console.error('❌ Next.js router import failed:', error);
    testResults.router = false;
  }
  
  // Test 3: Sonner toast
  try {
    const { toast } = require('sonner');
    console.log('✅ Sonner toast import successful');
    testResults.toast = true;
  } catch (error) {
    console.error('❌ Sonner toast import failed:', error);
    testResults.toast = false;
  }
  
  // Test 4: useAuth hook
  try {
    const { useAuth } = require('@/hooks/use-auth');
    console.log('✅ useAuth hook import successful');
    testResults.useAuth = true;
  } catch (error) {
    console.error('❌ useAuth hook import failed:', error);
    testResults.useAuth = false;
  }
  
  // Test 5: UI components
  try {
    const { Card } = require('@/components/ui/card');
    console.log('✅ UI components import successful');
    testResults.uiComponents = true;
  } catch (error) {
    console.error('❌ UI components import failed:', error);
    testResults.uiComponents = false;
  }
  
  // Test 6: API client
  try {
    const apiClient = require('@/lib/api/client');
    console.log('✅ API client import successful');
    testResults.apiClient = true;
  } catch (error) {
    console.error('❌ API client import failed:', error);
    testResults.apiClient = false;
  }
  
  // Test 7: Onboarding session manager
  try {
    const OnboardingSessionManager = require('@/lib/onboarding-session-manager');
    console.log('✅ Onboarding session manager import successful');
    testResults.sessionManager = true;
  } catch (error) {
    console.error('❌ Onboarding session manager import failed:', error);
    testResults.sessionManager = false;
  }
  
  // Test 8: Mobile wizard
  try {
    const MobileWizard = require('@/components/onboarding/mobile-wizard');
    console.log('✅ Mobile wizard import successful');
    testResults.mobileWizard = true;
  } catch (error) {
    console.error('❌ Mobile wizard import failed:', error);
    testResults.mobileWizard = false;
  }
  
  console.log('ImportTestPage - All tests completed. Results:', testResults);
  
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Import Test Results</h1>
        <div className="bg-white p-4 rounded-lg shadow space-y-2">
          {Object.entries(testResults).map(([test, success]) => (
            <div key={test} className={`p-2 rounded ${success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {success ? '✅' : '❌'} {test}: {success ? 'Success' : 'Failed'}
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm">
              <strong>Instructions:</strong> Check the browser console for detailed error messages. 
              Any failed imports will show the specific error that's preventing the onboarding page from loading.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}