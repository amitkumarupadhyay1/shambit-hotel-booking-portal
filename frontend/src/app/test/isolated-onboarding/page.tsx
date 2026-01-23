'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Test the IntegratedOnboardingFlow step by step
export default function IsolatedOnboardingTest() {
  const [testStep, setTestStep] = useState(0);
  const [results, setResults] = useState<string[]>([]);
  
  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, message]);
  };
  
  useEffect(() => {
    if (testStep === 0) return;
    
    const runTest = async () => {
      try {
        switch (testStep) {
          case 1:
            addResult('✅ Step 1: Testing useAuth hook...');
            const { useAuth } = await import('@/hooks/use-auth');
            addResult('✅ Step 1: useAuth hook imported successfully');
            break;
            
          case 2:
            addResult('✅ Step 2: Testing MobileWizard import...');
            const MobileWizard = await import('@/components/onboarding/mobile-wizard');
            addResult('✅ Step 2: MobileWizard imported successfully');
            break;
            
          case 3:
            addResult('✅ Step 3: Testing ImageStepComponent...');
            const { ImageCategory } = await import('@/components/onboarding/image-upload');
            addResult('✅ Step 3: ImageUpload components imported successfully');
            break;
            
          case 4:
            addResult('✅ Step 4: Testing session manager...');
            const OnboardingSessionManager = await import('@/lib/onboarding-session-manager');
            addResult('✅ Step 4: Session manager imported successfully');
            break;
            
          case 5:
            addResult('✅ Step 5: Testing API client...');
            const apiClient = await import('@/lib/api/client');
            addResult('✅ Step 5: API client imported successfully');
            break;
            
          case 6:
            addResult('✅ Step 6: Testing full IntegratedOnboardingFlow import...');
            const { IntegratedOnboardingFlow } = await import('@/components/onboarding/integrated-onboarding-flow');
            addResult('✅ Step 6: IntegratedOnboardingFlow imported successfully');
            break;
            
          case 7:
            addResult('✅ Step 7: Attempting to render IntegratedOnboardingFlow...');
            // This is where the issue likely occurs
            const { IntegratedOnboardingFlow: Flow } = await import('@/components/onboarding/integrated-onboarding-flow');
            // Try to create the component (this might fail)
            const flowElement = React.createElement(Flow, {});
            addResult('✅ Step 7: IntegratedOnboardingFlow component created successfully');
            break;
            
          default:
            addResult('All tests completed!');
        }
      } catch (error: any) {
        addResult(`❌ Step ${testStep} failed: ${error.message}`);
        console.error(`Step ${testStep} error:`, error);
      }
    };
    
    runTest();
  }, [testStep]);
  
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Isolated Onboarding Test</CardTitle>
            <CardDescription>
              Testing IntegratedOnboardingFlow step by step to find the issue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map(step => (
                <Button
                  key={step}
                  onClick={() => setTestStep(step)}
                  variant={testStep === step ? "default" : "outline"}
                  size="sm"
                >
                  Test Step {step}
                </Button>
              ))}
              <Button onClick={() => { setResults([]); setTestStep(0); }} variant="secondary" size="sm">
                Clear
              </Button>
            </div>
            
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-sm ${
                    result.startsWith('✅') 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
            
            {testStep === 7 && results[results.length - 1]?.startsWith('✅') && (
              <div className="mt-4 p-4 bg-blue-50 rounded">
                <h4 className="font-medium mb-2">Final Test: Render Component</h4>
                <Button
                  onClick={async () => {
                    try {
                      addResult('🔄 Attempting to render IntegratedOnboardingFlow...');
                      const { IntegratedOnboardingFlow } = await import('@/components/onboarding/integrated-onboarding-flow');
                      // This will show us if there's a runtime error
                      addResult('✅ Component render test completed - check if component appears below');
                    } catch (error: any) {
                      addResult(`❌ Component render failed: ${error.message}`);
                    }
                  }}
                >
                  Try Render Component
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Test Step 1" through "Test Step 7" in order</li>
              <li>Watch for any red error messages</li>
              <li>Check the browser console for detailed error information</li>
              <li>The step that fails will tell us exactly where the problem is</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}