/**
 * Simplified Amenities Step
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useStepForm } from '../../hooks/useStepForm';

interface AmenitiesData {
  amenities: string[];
  services: string[];
}

const defaultData: AmenitiesData = {
  amenities: [],
  services: [],
};

const AMENITIES = [
  'WiFi', 'Parking', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Room Service',
  'Laundry', 'Concierge', 'Business Center', 'Conference Room', 'Pet Friendly'
];

const SERVICES = [
  'Airport Shuttle', 'Car Rental', 'Tour Booking', 'Currency Exchange',
  'Babysitting', 'Dry Cleaning', 'Shoe Shine', 'Wake-up Service'
];

export function AmenitiesStep() {
  const { formData, errors, updateField } = useStepForm({
    stepId: 'amenities',
    defaultData,
  });

  const toggleAmenity = (amenity: string) => {
    const current = formData.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    updateField('amenities', updated);
  };

  const toggleService = (service: string) => {
    const current = formData.services || [];
    const updated = current.includes(service)
      ? current.filter(s => s !== service)
      : [...current, service];
    updateField('services', updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Amenities & Services</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amenities */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Amenities *</Label>
          {errors.amenities && (
            <p className="text-sm text-red-500">{errors.amenities}</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AMENITIES.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity}
                  checked={formData.amenities?.includes(amenity) || false}
                  onCheckedChange={() => toggleAmenity(amenity)}
                />
                <Label htmlFor={amenity} className="text-sm">
                  {amenity}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Additional Services</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SERVICES.map((service) => (
              <div key={service} className="flex items-center space-x-2">
                <Checkbox
                  id={service}
                  checked={formData.services?.includes(service) || false}
                  onCheckedChange={() => toggleService(service)}
                />
                <Label htmlFor={service} className="text-sm">
                  {service}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}