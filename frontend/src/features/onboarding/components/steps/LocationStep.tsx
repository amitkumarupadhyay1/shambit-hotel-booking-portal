/**
 * Simplified Location Step
 * Uses reusable useStepForm hook - no more duplicated patterns
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStepForm } from '../../hooks/useStepForm';

interface LocationData {
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
}

const defaultData: LocationData = {
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
  website: '',
};

export function LocationStep() {
  const { formData, errors, updateField } = useStepForm({
    stepId: 'location',
    defaultData,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location & Contact</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Enter full address"
            className={errors.address ? 'border-red-500' : ''}
          />
          {errors.address && (
            <p className="text-sm text-red-500">{errors.address}</p>
          )}
        </div>

        {/* City & State */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="City"
              className={errors.city ? 'border-red-500' : ''}
            />
            {errors.city && (
              <p className="text-sm text-red-500">{errors.city}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => updateField('state', e.target.value)}
              placeholder="State"
              className={errors.state ? 'border-red-500' : ''}
            />
            {errors.state && (
              <p className="text-sm text-red-500">{errors.state}</p>
            )}
          </div>
        </div>

        {/* Pincode */}
        <div className="space-y-2">
          <Label htmlFor="pincode">Pincode *</Label>
          <Input
            id="pincode"
            value={formData.pincode}
            onChange={(e) => updateField('pincode', e.target.value)}
            placeholder="6-digit pincode"
            maxLength={6}
            className={errors.pincode ? 'border-red-500' : ''}
          />
          {errors.pincode && (
            <p className="text-sm text-red-500">{errors.pincode}</p>
          )}
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+91 9876543210"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="hotel@example.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website">Website (Optional)</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => updateField('website', e.target.value)}
            placeholder="https://yourhotel.com"
            className={errors.website ? 'border-red-500' : ''}
          />
          {errors.website && (
            <p className="text-sm text-red-500">{errors.website}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}