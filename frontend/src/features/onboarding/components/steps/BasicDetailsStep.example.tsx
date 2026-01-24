/**
 * Example: Basic Details Step using Enhanced Store
 * Phase 2: Demonstrates single source of truth implementation
 * Features: Real-time validation, optimistic updates, rollback
 */

import React from 'react';
import { useStepForm } from '../../hooks/useStepForm';
import { useOptimisticUpdates } from '../../hooks/useOptimisticUpdates';
import { useValidation } from '../../hooks/useValidation';
import { BasicDetailsData } from '../../types/onboarding';

const defaultData: BasicDetailsData = {
  name: '',
  hotelType: 'HOTEL',
  description: '',
};

export function BasicDetailsStep() {
  const {
    formData,
    updateField,
    getFieldError,
    isFieldValid,
    validateStep,
    rollback,
  } = useStepForm({
    stepId: 'basic-details',
    defaultData,
  });

  const {
    hasPendingUpdates,
    canRollback,
    isSaving,
    saveWithRollback,
    rollbackChanges,
  } = useOptimisticUpdates();

  const {
    getFieldValidationStatus,
    getStepCompletionPercentage,
  } = useValidation();

  const completionPercentage = getStepCompletionPercentage('basic-details');

  const handleSave = async () => {
    const result = await saveWithRollback();
    if (result.success) {
      console.log('Saved successfully');
    } else {
      console.error('Save failed:', result.error);
      if (result.rolledBack) {
        console.log('Changes rolled back automatically');
      }
    }
  };

  const handleRollback = () => {
    const success = rollbackChanges();
    if (success) {
      console.log('Changes rolled back');
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Step completion</span>
          <span>{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Status indicators */}
      {hasPendingUpdates && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2" />
            <span className="text-yellow-800 text-sm">
              {isSaving ? 'Saving changes...' : 'Unsaved changes'}
            </span>
          </div>
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-4">
        {/* Property Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              getFieldError('name') 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300'
            }`}
            placeholder="Enter your property name"
          />
          {getFieldError('name') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('name')}</p>
          )}
          {isFieldValid('name') && formData.name && (
            <p className="mt-1 text-sm text-green-600">✓ Valid property name</p>
          )}
        </div>

        {/* Hotel Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Type *
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
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              getFieldError('description') 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300'
            }`}
            placeholder="Describe your property (optional)"
          />
          {getFieldError('description') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('description')}</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between pt-4">
        <div className="flex space-x-2">
          {canRollback && (
            <button
              onClick={handleRollback}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Undo Changes
            </button>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          
          <button
            onClick={() => validateStep()}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Validate
          </button>
        </div>
      </div>
    </div>
  );
}