'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function OnboardingDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Check localStorage for onboarding data
    const draftData = localStorage.getItem('onboarding-draft');
    const parsedData = draftData ? JSON.parse(draftData) : null;
    
    setDebugInfo({
      localStorage: parsedData,
      timestamp: new Date().toISOString()
    });
  }, []);

  const clearLocalStorage = () => {
    localStorage.removeItem('onboarding-draft');
    setDebugInfo({
      localStorage: null,
      timestamp: new Date().toISOString(),
      cleared: true
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Debug Information</CardTitle>
            <CardDescription>
              Debug information for the onboarding wizard issue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Actions</h4>
                <div className="space-y-2">
                  <Button onClick={() => window.location.reload()} className="w-full">
                    Refresh Page
                  </Button>
                  <Button onClick={clearLocalStorage} variant="outline" className="w-full">
                    Clear LocalStorage
                  </Button>
                  <Button onClick={() => window.open('/onboarding', '_blank')} variant="outline" className="w-full">
                    Open Onboarding (New Tab)
                  </Button>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Quick Info</h4>
                <div className="space-y-2 text-sm">
                  <div>Has Draft Data: <Badge variant={debugInfo.localStorage ? "default" : "secondary"}>{debugInfo.localStorage ? 'Yes' : 'No'}</Badge></div>
                  <div>Images Step Data: <Badge variant={debugInfo.localStorage?.data?.images ? "default" : "secondary"}>{debugInfo.localStorage?.data?.images ? 'Present' : 'Missing'}</Badge></div>
                  <div>Images Count: <Badge variant="outline">{debugInfo.localStorage?.data?.images?.images?.length || 0}</Badge></div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Raw Debug Data</h4>
              <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-96">
{JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Instructions to Debug</h4>
              <div className="text-sm space-y-2">
                <p>1. Open the onboarding page in a new tab</p>
                <p>2. Open browser developer tools (F12)</p>
                <p>3. Go to Console tab</p>
                <p>4. Upload images and watch for these console messages:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><code>ImageStepComponent - Initial validation effect triggered</code></li>
                  <li><code>Upload progress received:</code></li>
                  <li><code>Setting validation:</code></li>
                  <li><code>Mobile wizard - Validation change for step images:</code></li>
                  <li><code>Can proceed check for step images:</code></li>
                </ul>
                <p>5. Check if validation.isValid is true when images are uploaded</p>
                <p>6. Check if canProceed is true in the console logs</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-medium text-yellow-800 mb-2">Expected Behavior</h5>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>• When you upload images, you should see validation change logs</p>
                <p>• The validation should show isValid: true</p>
                <p>• The canProceed check should return true</p>
                <p>• The Next button should become enabled (orange color)</p>
                <p>• The error message should disappear</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}