'use client';

import React, { useState } from 'react';
import { ImageUpload, ImageCategory } from '@/components/onboarding/image-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ImageUploadTestPage() {
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const handleUploadComplete = (images: any[]) => {
    console.log('Upload complete:', images);
    setUploadedImages(images);
    setIsValid(images.length > 0);
    setValidationMessage(images.length > 0 ? 'Images uploaded successfully!' : 'Please upload at least one image');
  };

  const handleUploadProgress = (progress: any[]) => {
    console.log('Upload progress:', progress);
    const completedImages = progress.filter(p => p.status === 'completed');
    setUploadedImages(completedImages);
    setIsValid(completedImages.length > 0);
    setValidationMessage(completedImages.length > 0 ? `${completedImages.length} images uploaded` : 'Please upload at least one image');
  };

  const handleNext = () => {
    if (isValid) {
      alert('Validation passed! You can proceed to the next step.');
    } else {
      alert('Please upload at least one image before proceeding.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Image Upload Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImageUpload
            category={ImageCategory.EXTERIOR}
            maxFiles={10}
            maxFileSize={5 * 1024 * 1024} // 5MB
            onUploadComplete={handleUploadComplete}
            onUploadProgress={handleUploadProgress}
            onQualityCheck={(results) => console.log('Quality check:', results)}
          />

          <div className="border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Validation Status: 
                  <span className={`ml-2 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {isValid ? 'Valid' : 'Invalid'}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-1">{validationMessage}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Uploaded Images: {uploadedImages.length}
                </p>
              </div>
              <Button 
                onClick={handleNext}
                disabled={!isValid}
                className={isValid ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Next Step
              </Button>
            </div>
          </div>

          {uploadedImages.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Uploaded Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={image.id || index} className="space-y-2">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={image.url} 
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-xs text-gray-600">
                      <p>Quality: {image.qualityScore}/100</p>
                      <p>Size: {(image.file?.size / (1024 * 1024)).toFixed(2)}MB</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}