/**
 * Simplified Basic Details Step
 * Uses reusable useStepForm hook - no more duplicated patterns
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStepForm } from '../../hooks/useStepForm';

interface BasicDetailsData {
  name: string;
  hotelType: 'HOTEL' | 'RESORT' | 'GUESTHOUSE' | 'HOMESTAY' | 'APARTMENT';
  description: string;
}

const defaultData: BasicDetailsData = {
  name: '',
  hotelType: 'HOTEL',
  description: '',
};

export function BasicDetailsStep() {
  const { formData, errors, updateField } = useStepForm({
    stepId: 'basic-details',
    defaultData,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hotel Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Hotel Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Enter your hotel name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Hotel Type */}
        <div className="space-y-2">
          <Label htmlFor="hotelType">Property Type *</Label>
          <Select
            value={formData.hotelType}
            onValueChange={(value) => updateField('hotelType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HOTEL">Hotel</SelectItem>
              <SelectItem value="RESORT">Resort</SelectItem>
              <SelectItem value="GUESTHOUSE">Guest House</SelectItem>
              <SelectItem value="HOMESTAY">Homestay</SelectItem>
              <SelectItem value="APARTMENT">Apartment</SelectItem>
            </SelectContent>
          </Select>
          {errors.hotelType && (
            <p className="text-sm text-red-500">{errors.hotelType}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe your property..."
            rows={4}
            className={errors.description ? 'border-red-500' : ''}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description}</p>
          )}
          <p className="text-sm text-gray-500">
            {formData.description.length}/1000 characters
          </p>
        </div>
      </CardContent>
    </Card>
  );
}