/**
 * Simplified Policies Step
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStepForm } from '../../hooks/useStepForm';

interface PoliciesData {
  checkIn: string;
  checkOut: string;
  cancellationPolicy: 'FLEXIBLE' | 'MODERATE' | 'STRICT';
  childPolicy: string;
  petPolicy: 'ALLOWED' | 'NOT_ALLOWED' | 'ON_REQUEST';
  smokingPolicy: 'ALLOWED' | 'NOT_ALLOWED' | 'DESIGNATED_AREAS';
}

const defaultData: PoliciesData = {
  checkIn: '14:00',
  checkOut: '11:00',
  cancellationPolicy: 'MODERATE',
  childPolicy: '',
  petPolicy: 'NOT_ALLOWED',
  smokingPolicy: 'NOT_ALLOWED',
};

export function PoliciesStep() {
  const { formData, errors, updateField } = useStepForm({
    stepId: 'policies',
    defaultData,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hotel Policies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Check-in/Check-out Times */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="checkIn">Check-in Time *</Label>
            <Input
              id="checkIn"
              type="time"
              value={formData.checkIn}
              onChange={(e) => updateField('checkIn', e.target.value)}
              className={errors.checkIn ? 'border-red-500' : ''}
            />
            {errors.checkIn && (
              <p className="text-sm text-red-500">{errors.checkIn}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkOut">Check-out Time *</Label>
            <Input
              id="checkOut"
              type="time"
              value={formData.checkOut}
              onChange={(e) => updateField('checkOut', e.target.value)}
              className={errors.checkOut ? 'border-red-500' : ''}
            />
            {errors.checkOut && (
              <p className="text-sm text-red-500">{errors.checkOut}</p>
            )}
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="space-y-2">
          <Label>Cancellation Policy *</Label>
          <Select
            value={formData.cancellationPolicy}
            onValueChange={(value) => updateField('cancellationPolicy', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FLEXIBLE">
                Flexible - Free cancellation up to 24 hours
              </SelectItem>
              <SelectItem value="MODERATE">
                Moderate - Free cancellation up to 7 days
              </SelectItem>
              <SelectItem value="STRICT">
                Strict - No free cancellation
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.cancellationPolicy && (
            <p className="text-sm text-red-500">{errors.cancellationPolicy}</p>
          )}
        </div>

        {/* Child Policy */}
        <div className="space-y-2">
          <Label htmlFor="childPolicy">Child Policy *</Label>
          <Textarea
            id="childPolicy"
            value={formData.childPolicy}
            onChange={(e) => updateField('childPolicy', e.target.value)}
            placeholder="Describe your policy for children (age limits, extra charges, etc.)"
            rows={3}
            className={errors.childPolicy ? 'border-red-500' : ''}
          />
          {errors.childPolicy && (
            <p className="text-sm text-red-500">{errors.childPolicy}</p>
          )}
        </div>

        {/* Pet Policy */}
        <div className="space-y-2">
          <Label>Pet Policy *</Label>
          <Select
            value={formData.petPolicy}
            onValueChange={(value) => updateField('petPolicy', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALLOWED">Pets Allowed</SelectItem>
              <SelectItem value="NOT_ALLOWED">Pets Not Allowed</SelectItem>
              <SelectItem value="ON_REQUEST">Pets Allowed on Request</SelectItem>
            </SelectContent>
          </Select>
          {errors.petPolicy && (
            <p className="text-sm text-red-500">{errors.petPolicy}</p>
          )}
        </div>

        {/* Smoking Policy */}
        <div className="space-y-2">
          <Label>Smoking Policy *</Label>
          <Select
            value={formData.smokingPolicy}
            onValueChange={(value) => updateField('smokingPolicy', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALLOWED">Smoking Allowed</SelectItem>
              <SelectItem value="NOT_ALLOWED">No Smoking</SelectItem>
              <SelectItem value="DESIGNATED_AREAS">Designated Areas Only</SelectItem>
            </SelectContent>
          </Select>
          {errors.smokingPolicy && (
            <p className="text-sm text-red-500">{errors.smokingPolicy}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}