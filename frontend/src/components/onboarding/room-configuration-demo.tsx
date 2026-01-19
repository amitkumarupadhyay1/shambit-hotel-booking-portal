'use client';

import React, { useState } from 'react';
import { RoomConfigurationForm, RoomType, BedType, FeatureType, ViewDirection } from './room-configuration-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function RoomConfigurationDemo() {
  const [savedData, setSavedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (roomData: any) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSavedData(roomData);
      console.log('Room data saved:', roomData);
    } catch (error) {
      console.error('Failed to save room data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidation = (validation: any) => {
    console.log('Validation result:', validation);
  };

  const mockPropertyAmenities = [
    'free-wifi',
    'parking',
    'pool',
    'gym',
    'restaurant',
    'spa',
    'business-center',
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Room Configuration Demo</h1>
          <p className="text-gray-600 mt-2">
            Test the room configuration UI with all features including amenities, images, and layout.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <RoomConfigurationForm
              hotelId="demo-hotel-123"
              propertyAmenities={mockPropertyAmenities}
              onSave={handleSave}
              onValidate={handleValidation}
              initialData={{
                name: 'Deluxe Ocean View Suite',
                type: RoomType.DELUXE,
                capacity: {
                  adults: 2,
                  children: 1,
                  infants: 0,
                  maxOccupancy: 3,
                },
                size: {
                  area: 45,
                  unit: 'sqm',
                },
                bedConfiguration: {
                  beds: [
                    { type: BedType.KING, count: 1, size: 'King Size' },
                    { type: BedType.SOFA_BED, count: 1, size: 'Sofa Bed' },
                  ],
                  totalBeds: 2,
                  sofaBeds: 1,
                  cribs: 0,
                },
                description: 'A luxurious suite with panoramic ocean views, featuring modern amenities and elegant furnishings. Perfect for couples or small families seeking comfort and style.',
                amenities: {
                  inherited: mockPropertyAmenities,
                  specific: ['ocean-view', 'balcony', 'minibar', 'coffee-machine'],
                  overrides: [],
                },
                images: [],
                layout: {
                  dimensions: { length: 8, width: 6, height: 3, unit: 'meters' },
                  features: [
                    {
                      name: 'Ocean View Balcony',
                      type: FeatureType.BALCONY,
                      description: 'Private balcony with stunning ocean views',
                      facing: ViewDirection.SEA,
                    },
                    {
                      name: 'Floor-to-Ceiling Windows',
                      type: FeatureType.WINDOW,
                      description: 'Large windows providing natural light and ocean views',
                      facing: ViewDirection.SOUTH,
                    },
                  ],
                  view: 'Panoramic ocean view with private balcony overlooking the coastline',
                  naturalLight: 'excellent',
                },
              }}
            />
          </div>

          {/* Sidebar with saved data */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Saved Data</CardTitle>
              </CardHeader>
              <CardContent>
                {savedData ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700">Room Name</h4>
                      <p className="text-sm">{savedData.basicInfo?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700">Type</h4>
                      <p className="text-sm">{savedData.basicInfo?.type || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700">Capacity</h4>
                      <p className="text-sm">
                        {savedData.basicInfo?.capacity?.adults || 0} adults, {' '}
                        {savedData.basicInfo?.capacity?.children || 0} children
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700">Size</h4>
                      <p className="text-sm">
                        {savedData.basicInfo?.size?.area || 0} {savedData.basicInfo?.size?.unit || 'sqm'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700">Description</h4>
                      <p className="text-xs text-gray-600 line-clamp-3">
                        {savedData.description || 'No description'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700">Amenities</h4>
                      <p className="text-xs text-gray-600">
                        {savedData.amenities?.specific?.length || 0} room-specific amenities
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700">Images</h4>
                      <p className="text-xs text-gray-600">
                        {savedData.images?.length || 0} images uploaded
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-700">Layout Features</h4>
                      <p className="text-xs text-gray-600">
                        {savedData.layout?.features?.length || 0} features defined
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => console.log('Full saved data:', savedData)}
                      className="w-full"
                    >
                      Log Full Data
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No data saved yet. Complete and save the room configuration to see the results here.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}