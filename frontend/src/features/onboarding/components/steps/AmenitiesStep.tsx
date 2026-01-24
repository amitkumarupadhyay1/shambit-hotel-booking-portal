/**
 * Amenities Step Component
 * Simplified step component for amenities selection
 */

import React from 'react';
import { useStepForm } from '../../hooks/useStepForm';
import { AmenitiesData } from '../../types/onboarding';

interface StepProps {
  onNext?: () => void;
  onPrev?: () => void;
}

const AMENITIES_OPTIONS = [
  { value: 'wifi', label: 'Free WiFi' },
  { value: 'parking', label: 'Free Parking' },
  { value: 'ac', label: 'Air Conditioning' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'pool', label: 'Swimming Pool' },
  { value: 'gym', label: 'Fitness Center' },
  { value: 'spa', label: 'Spa Services' },
  { value: 'laundry', label: 'Laundry Service' },
  { value: 'room-service', label: '24/7 Room Service' },
  { value: 'concierge', label: 'Concierge Service' },
  { value: 'business-center', label: 'Business Center' },
  { value: 'conference-room', label: 'Conference Rooms' },
  { value: 'elevator', label: 'Elevator' },
  { value: 'wheelchair-accessible', label: 'Wheelchair Accessible' },
  { value: 'pet-friendly', label: 'Pet Friendly' },
];

const SERVICES_OPTIONS = [
  { value: 'airport-shuttle', label: 'Airport Shuttle' },
  { value: 'car-rental', label: 'Car Rental' },
  { value: 'tour-booking', label: 'Tour Booking' },
  { value: 'currency-exchange', label: 'Currency Exchange' },
  { value: 'babysitting', label: 'Babysitting Service' },
  { value: 'dry-cleaning', label: 'Dry Cleaning' },
  { value: 'wake-up-service', label: 'Wake-up Service' },
  { value: 'luggage-storage', label: 'Luggage Storage' },
];

export function AmenitiesStep({ onNext, onPrev }: StepProps) {
  const {
    formData,
    updateField,
    getFieldError,
    save
  } = useStepForm<AmenitiesData>({
    stepId: 'amenities',
    defaultData: {
      amenities: [],
      services: []
    }
  });

  const handleAmenityToggle = (amenityValue: string) => {
    const currentAmenities = formData.amenities || [];
    const newAmenities = currentAmenities.includes(amenityValue)
      ? currentAmenities.filter(a => a !== amenityValue)
      : [...currentAmenities, amenityValue];
    
    updateField('amenities', newAmenities);
  };

  const handleServiceToggle = (serviceValue: string) => {
    const currentServices = formData.services || [];
    const newServices = currentServices.includes(serviceValue)
      ? currentServices.filter(s => s !== serviceValue)
      : [...currentServices, serviceValue];
    
    updateField('services', newServices);
  };

  const handleSave = async () => {
    try {
      const result = await save();
      if (result.success && onNext) {
        onNext();
      }
    } catch (error) {
      console.error('Failed to save amenities:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Amenities & Services</h2>
        <p className="text-gray-600">What amenities do you offer?</p>
      </div>

      <div className="space-y-6">
        {/* Property Amenities */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Property Amenities <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Select all amenities available at your property
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {AMENITIES_OPTIONS.map((amenity) => (
              <label key={amenity.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(formData.amenities || []).includes(amenity.value)}
                  onChange={() => handleAmenityToggle(amenity.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">{amenity.label}</span>
              </label>
            ))}
          </div>
          
          {getFieldError('amenities') && (
            <p className="text-sm text-red-600 mt-2">{getFieldError('amenities')}</p>
          )}
        </div>

        {/* Additional Services */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Additional Services
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Optional services you provide
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SERVICES_OPTIONS.map((service) => (
              <label key={service.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(formData.services || []).includes(service.value)}
                  onChange={() => handleServiceToggle(service.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">{service.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      {(formData.amenities?.length || 0) > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Selected Amenities:</h4>
          <div className="flex flex-wrap gap-2">
            {formData.amenities?.map((amenityValue) => {
              const amenity = AMENITIES_OPTIONS.find(a => a.value === amenityValue);
              return amenity ? (
                <span key={amenityValue} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {amenity.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onPrev}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Previous
        </button>
        
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
}