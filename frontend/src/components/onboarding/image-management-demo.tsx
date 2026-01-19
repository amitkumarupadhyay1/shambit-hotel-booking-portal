'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageUpload, MobileImageUpload, ImageGallery } from './index';

type ImageCategoryKey = 'EXTERIOR' | 'LOBBY' | 'ROOMS' | 'AMENITIES' | 'DINING' | 'RECREATIONAL' | 'BUSINESS' | 'VIRTUAL_TOURS';

export const ImageManagementDemo: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ImageCategoryKey>('EXTERIOR');
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const categories: { key: ImageCategoryKey; label: string }[] = [
    { key: 'EXTERIOR', label: 'Exterior' },
    { key: 'LOBBY', label: 'Lobby' },
    { key: 'ROOMS', label: 'Rooms' },
    { key: 'AMENITIES', label: 'Amenities' },
    { key: 'DINING', label: 'Dining' },
    { key: 'RECREATIONAL', label: 'Recreational' },
    { key: 'BUSINESS', label: 'Business' },
  ];

  const handleUploadComplete = (images: any[]) => {
    setUploadedImages(prev => [...prev, ...images]);
  };

  const handleImageDelete = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const toggleMobileView = () => {
    setIsMobile(!isMobile);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Image Management System Demo
        </h1>
        <p className="text-gray-600 mb-6">
          Comprehensive image upload, quality validation, and gallery management
        </p>
        
        {/* View Toggle */}
        <div className="flex justify-center space-x-4 mb-8">
          <Button
            variant={!isMobile ? 'default' : 'outline'}
            onClick={() => setIsMobile(false)}
          >
            Desktop View
          </Button>
          <Button
            variant={isMobile ? 'default' : 'outline'}
            onClick={() => setIsMobile(true)}
          >
            Mobile View
          </Button>
        </div>
      </div>

      {/* Category Selection */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Select Image Category</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category.key}
              variant={selectedCategory === category.key ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.key)}
              className="mb-2"
            >
              {category.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Upload Component */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Upload {categories.find(c => c.key === selectedCategory)?.label} Images
        </h2>
        
        {isMobile ? (
          <MobileImageUpload
            category={selectedCategory}
            maxFiles={5}
            onUploadComplete={handleUploadComplete}
            onQualityCheck={(results) => console.log('Quality check:', results)}
          />
        ) : (
          <ImageUpload
            category={selectedCategory}
            maxFiles={5}
            onUploadComplete={handleUploadComplete}
            onQualityCheck={(results) => console.log('Quality check:', results)}
          />
        )}
      </Card>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Quality Validation</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Resolution standards (1920x1080 minimum)</li>
            <li>• Aspect ratio validation</li>
            <li>• Brightness and contrast checks</li>
            <li>• Blur detection</li>
            <li>• File size limits (5MB max)</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Image Optimization</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Multiple resolution variants</li>
            <li>• WebP format conversion</li>
            <li>• Thumbnail generation</li>
            <li>• Progressive loading</li>
            <li>• CDN-ready optimization</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Mobile Features</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Camera integration</li>
            <li>• Touch-optimized interface</li>
            <li>• Real-time feedback</li>
            <li>• Offline draft saving</li>
            <li>• Progressive enhancement</li>
          </ul>
        </Card>
      </div>

      {/* Gallery */}
      {uploadedImages.length > 0 && (
        <Card className="p-6">
          <ImageGallery
            images={uploadedImages}
            category={selectedCategory}
            onImageDelete={handleImageDelete}
            onImageSelect={(image) => console.log('Selected image:', image)}
          />
        </Card>
      )}

      {/* Technical Details */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Technical Implementation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Backend Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• NestJS ImageManagementService</li>
              <li>• Sharp image processing</li>
              <li>• TypeORM database integration</li>
              <li>• Quality assurance engine</li>
              <li>• File system management</li>
              <li>• Metadata extraction</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">Frontend Features</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• React TypeScript components</li>
              <li>• Mobile camera API integration</li>
              <li>• Drag & drop file upload</li>
              <li>• Real-time progress tracking</li>
              <li>• Responsive design</li>
              <li>• Accessibility compliant</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Property-Based Testing */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quality Assurance</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Property-Based Testing</h3>
            <p className="text-sm text-gray-600 mb-3">
              Comprehensive testing with Fast-check library ensuring correctness across all possible inputs:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Badge variant="outline" className="p-2 justify-center">
                Image Processing & Optimization
              </Badge>
              <Badge variant="outline" className="p-2 justify-center">
                Quality Validation Standards
              </Badge>
              <Badge variant="outline" className="p-2 justify-center">
                Virtual Tour Integration
              </Badge>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>
              <strong>100+ test iterations</strong> per property ensure robust validation of:
              categorization, optimization pipelines, quality standards enforcement, 
              and virtual tour handling across diverse input scenarios.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};