'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Upload } from 'lucide-react';

// Mock validation function to test the fix
const validateImageStep = (images: any[]) => {
  return {
    isValid: images.length > 0,
    errors: images.length === 0 ? ['Please upload at least one image'] : [],
    warnings: images.length < 5 ? ['Consider uploading more images for better presentation'] : []
  };
};

// Mock canProceedToNext function (fixed version)
const canProceedToNext = (validation: any, isOptional: boolean) => {
  if (isOptional) {
    return true;
  }
  return validation?.isValid === true;
};

export default function OnboardingFixValidationTest() {
  const [images, setImages] = useState<any[]>([]);
  const [validation, setValidation] = useState(validateImageStep([]));

  const simulateImageUpload = () => {
    const newImages = [
      {
        id: 'img-1',
        url: 'https://example.com/image1.jpg',
        qualityScore: 95,
        category: 'EXTERIOR',
        uploadedAt: new Date().toISOString()
      },
      {
        id: 'img-2', 
        url: 'https://example.com/image2.jpg',
        qualityScore: 88,
        category: 'EXTERIOR',
        uploadedAt: new Date().toISOString()
      }
    ];
    
    setImages(newImages);
    const newValidation = validateImageStep(newImages);
    setValidation(newValidation);
  };

  const clearImages = () => {
    setImages([]);
    const newValidation = validateImageStep([]);
    setValidation(newValidation);
  };

  const canProceed = canProceedToNext(validation, false);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Fix Validation Test</CardTitle>
            <CardDescription>
              Testing the fix for the onboarding wizard step 2 issue where users get stuck after uploading images
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current State */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Current State</h4>
                <div className="space-y-2 text-sm">
                  <div>Images uploaded: <Badge variant="outline">{images.length}</Badge></div>
                  <div>Validation valid: <Badge variant={validation.isValid ? "default" : "destructive"}>{validation.isValid ? 'Yes' : 'No'}</Badge></div>
                  <div>Can proceed: <Badge variant={canProceed ? "default" : "destructive"}>{canProceed ? 'Yes' : 'No'}</Badge></div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Actions</h4>
                <div className="space-y-2">
                  <Button onClick={simulateImageUpload} size="sm" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Simulate Upload (2 images)
                  </Button>
                  <Button onClick={clearImages} variant="outline" size="sm" className="w-full">
                    Clear Images
                  </Button>
                </div>
              </div>
            </div>

            {/* Validation Display */}
            <div className="space-y-3">
              <h4 className="font-medium">Validation Feedback</h4>
              
              {validation.errors.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700">
                      Please complete all required fields before proceeding
                    </p>
                    <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                      {validation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {validation.warnings.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-700">
                      Recommendations:
                    </p>
                    <ul className="mt-1 text-sm text-amber-600 list-disc list-inside">
                      {validation.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {validation.isValid && validation.errors.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-700">
                      All requirements completed! You can proceed to the next step.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Next Button Simulation */}
            <div className="pt-4 border-t">
              <Button 
                disabled={!canProceed}
                className="w-full"
                variant={canProceed ? "default" : "secondary"}
              >
                {canProceed ? "Next Step" : "Complete Requirements First"}
              </Button>
            </div>

            {/* Debug Info */}
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
              <h5 className="font-medium mb-2">Debug Information</h5>
              <pre className="whitespace-pre-wrap">
{JSON.stringify({
  images: images.map(img => ({ id: img.id, qualityScore: img.qualityScore })),
  validation,
  canProceed
}, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Fix Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Fix Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h5 className="font-medium">Issues Fixed:</h5>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Removed special case handling for images step in canProceedToNext()</li>
                  <li>Fixed data structure mismatch between upload progress and validation</li>
                  <li>Standardized image data format across all components</li>
                  <li>Unified validation display logic for all steps</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium">Root Cause:</h5>
                <p>The mobile wizard had special case logic for the images step that bypassed the validation system, causing users to get stuck even when validation showed success.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}