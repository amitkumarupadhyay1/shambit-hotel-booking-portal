/**
 * Basic Details Step Component
 * Simplified step component for basic hotel details
 */

import React from 'react';
import { useStepForm } from '../../hooks/useStepForm';
import { BasicDetailsData } from '../../types/onboarding';

interface StepProps {
  onNext?: () => void;
  onPrev?: () => void;
}

export function BasicDetailsStep({ onNext, onPrev }: StepProps) {
  const {
    formData,
    updateField,
    getFieldError,
    isFieldValid,
    validateStep,
    save
  } = useStepForm<BasicDetailsData>({
    stepId: 'basic-details',
    defaultData: {
      name: '',
      hotelType: 'HOTEL',
      description: ''
    }
  });

  const handleSave = async () => {
    try {
      const result = await save();
      if (result.success && onNext) {
        onNext();
      }
    } catch (error) {
      console.error('Failed to save basic details:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Basic Details</h2>
        <p className="text-gray-600">Tell us about your property</p>
      </div>

      <div className="space-y-4">
        {/* Property Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Enter your property name"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              getFieldError('name') ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {getFieldError('name') && (
            <p className="text-sm text-red-600 mt-1">{getFieldError('name')}</p>
          )}
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.hotelType}
            onChange={(e) => updateField('hotelType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="HOTEL">Hotel</option>
            <option value="RESORT">Resort</option>
            <option value="GUESTHOUSE">Guest House</option>
            <option value="HOMESTAY">Homestay</option>
            <option value="APARTMENT">Apartment</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe your property (optional)"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Help guests understand what makes your property special
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onPrev}
          disabled={!onPrev}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
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