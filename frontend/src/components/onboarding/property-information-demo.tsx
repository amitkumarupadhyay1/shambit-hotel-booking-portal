'use client';

import React from 'react';
import { PropertyInformationForm } from './property-information-form';

export const PropertyInformationDemo: React.FC = () => {
  const handleSave = async (data: any) => {
    console.log('Saving property information:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Property information saved successfully!');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Property Information Management Demo
          </h1>
          <p className="text-gray-600">
            Complete demo of the property information forms including description editor, 
            location details, policy management, and customer-friendly display preview.
          </p>
        </div>

        <PropertyInformationForm
          hotelId="demo-hotel-123"
          onSave={handleSave}
        />
      </div>
    </div>
  );
};