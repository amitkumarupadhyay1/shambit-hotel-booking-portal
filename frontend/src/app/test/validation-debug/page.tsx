'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export default function ValidationDebugPage() {
  const [validationState, setValidationState] = useState<ValidationResult>({
    isValid: false,
    errors: ['Please upload at least one image'],
    warnings: []
  });
  
  const [images, setImages] = useState<any[]>([]);

  const simulateImageUpload = useCallback(() => {
    const newImage = {
      id: Date.now().toString(),
      name: 'test-image.jpg',
      status: 'completed'
    };
    
    const updatedImages = [...images, newImage];
    setImages(updatedImages);
    
    // Update validation
    const newValidation: ValidationResult = {
      isValid: updatedImages.length > 0,
      errors: updatedImages.length === 0 ? ['Please upload at least one image'] : [],
      warnings: updatedImages.length < 5 ? ['Consider uploading more images'] : []
    };
    
    console.log('Setting validation:', newValidation);
    setValidationState(newValidation);
  }, [images]);

  const clearImages = useCallback(() => {
    setImages([]);
    const newValidation: ValidationResult = {
      isValid: false,
      errors: ['Please upload at least one image'],
      warnings: []
    };
    setValidationState(newValidation);
  }, []);

  const canProceed = validationState.isValid === true;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Validation Debug Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Current State:</h3>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <p><strong>Images:</strong> {images.length}</p>
              <p><strong>Is Valid:</strong> {validationState.isValid ? 'Yes' : 'No'}</p>
              <p><strong>Can Proceed:</strong> {canProceed ? 'Yes' : 'No'}</p>
              <p><strong>Errors:</strong> {validationState.errors.join(', ') || 'None'}</p>
              <p><strong>Warnings:</strong> {validationState.warnings.join(', ') || 'None'}</p>
            </div>
          </div>

          {/* Validation Display (same as mobile wizard) */}
          {validationState && (
            <div className="mt-3" key={`validation-${validationState.isValid}-${validationState.errors.length}`}>
              {validationState.errors.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-red-700">
                      Please complete all required fields before proceeding
                    </p>
                    <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                      {validationState.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {validationState.warnings.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-2">
                  <div className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-amber-700">
                      Recommendations:
                    </p>
                    <ul className="mt-1 text-sm text-amber-600 list-disc list-inside">
                      {validationState.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {validationState.isValid && validationState.errors.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0">✅</div>
                  <div>
                    <p className="text-sm font-medium text-green-700">
                      All requirements completed! You can proceed to the next step.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <Button onClick={simulateImageUpload}>
              Simulate Image Upload
            </Button>
            <Button onClick={clearImages} variant="outline">
              Clear Images
            </Button>
            <Button 
              disabled={!canProceed}
              className={canProceed ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              Next Step {canProceed ? '✅' : '❌'}
            </Button>
          </div>

          <div>
            <h3 className="font-medium mb-2">Images:</h3>
            {images.length === 0 ? (
              <p className="text-gray-500">No images uploaded</p>
            ) : (
              <ul className="space-y-1">
                {images.map((img, index) => (
                  <li key={img.id} className="text-sm">
                    {index + 1}. {img.name} - {img.status}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}