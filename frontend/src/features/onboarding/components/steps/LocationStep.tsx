/**
 * Location Step Component
 * Simplified step component for location details
 */

import React from 'react';
import { useStepForm } from '../../hooks/useStepForm';
import { LocationData } from '../../types/onboarding';

interface StepProps {
  onNext?: () => void;
  onPrev?: () => void;
}

export function LocationStep({ onNext, onPrev }: StepProps) {
  const {
    formData,
    updateField,
    getFieldError,
    save
  } = useStepForm<LocationData>({
    stepId: 'location',
    defaultData: {
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
      website: ''
    }
  });

  const handleSave = async () => {
    try {
      const result = await save();
      if (result.success && onNext) {
        onNext();
      }
    } catch (error) {
      console.error('Failed to save location details:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Location Details</h2>
        <p className="text-gray-600">Where is your property located?</p>
      </div>

      <div className="space-y-6">
        {/* Address Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Address Information
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Enter complete street address"
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('address') ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {getFieldError('address') && (
              <p className="text-sm text-red-600 mt-1">{getFieldError('address')}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Enter city name"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('city') ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {getFieldError('city') && (
                <p className="text-sm text-red-600 mt-1">{getFieldError('city')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => updateField('state', e.target.value)}
                placeholder="Enter state name"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError('state') ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {getFieldError('state') && (
                <p className="text-sm text-red-600 mt-1">{getFieldError('state')}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pincode <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.pincode}
              onChange={(e) => updateField('pincode', e.target.value)}
              placeholder="Enter 6-digit pincode"
              maxLength={6}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('pincode') ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {getFieldError('pincode') && (
              <p className="text-sm text-red-600 mt-1">{getFieldError('pincode')}</p>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Contact Information
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+91 9999999999"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                getFieldError('phone') ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {getFieldError('phone') && (
              <p className="text-sm text-red-600 mt-1">{getFieldError('phone')}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">Primary contact number for guests</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="contact@yourproperty.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">Optional email for guest communication</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              value={formData.website || ''}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="https://yourproperty.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">Your property website (optional)</p>
          </div>
        </div>
      </div>

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