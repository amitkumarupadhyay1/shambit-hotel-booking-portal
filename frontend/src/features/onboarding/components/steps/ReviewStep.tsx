/**
 * Simplified Review Step
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useOnboardingStore } from '../../store/onboarding';
import { useStepForm } from '../../hooks/useStepForm';
import {
  BasicDetailsData,
  LocationData,
  AmenitiesData,
  ImagesData,
  RoomsData
} from '../../types/onboarding';

interface ReviewData {
  agreedToTerms: boolean;
}

const defaultData: ReviewData = {
  agreedToTerms: false,
};

export function ReviewStep() {
  const { draftData } = useOnboardingStore();
  const { formData, errors, updateField } = useStepForm({
    stepId: 'review',
    defaultData,
  });

  const sections = [
    {
      title: 'Basic Details',
      data: draftData['basic-details'],
      fields: ['name', 'hotelType', 'description'],
    },
    {
      title: 'Location',
      data: draftData['location'],
      fields: ['address', 'city', 'state', 'pincode', 'phone', 'email'],
    },
    {
      title: 'Amenities',
      data: draftData['amenities'],
      fields: ['amenities'],
    },
    {
      title: 'Images',
      data: draftData['images'],
      fields: ['images'],
    },
    {
      title: 'Rooms',
      data: draftData['rooms'],
      fields: ['rooms'],
    },
    {
      title: 'Policies',
      data: draftData['policies'],
      fields: ['checkIn', 'checkOut', 'cancellationPolicy'],
    },
    {
      title: 'Business Features',
      data: draftData['business-features'],
      fields: ['instantBooking', 'paymentMethods', 'languages'],
    },
  ];

  const isComplete = (data: any, fields: string[]) => {
    if (!data) return false;
    return fields.every(field => {
      const value = data[field];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return true;
      return value && value.toString().trim().length > 0;
    });
  };

  const completedSections = sections.filter(section =>
    isComplete(section.data, section.fields)
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Your Information</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={completedSections === sections.length ? 'default' : 'secondary'}>
            {completedSections}/{sections.length} sections completed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Summary */}
        <div className="space-y-4">
          {sections.map((section) => {
            const complete = isComplete(section.data, section.fields);
            return (
              <div key={section.title} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {complete ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  )}
                  <div>
                    <h4 className="font-medium">{section.title}</h4>
                    <p className="text-sm text-gray-500">
                      {complete ? 'Complete' : 'Incomplete - please review'}
                    </p>
                  </div>
                </div>
                <Badge variant={complete ? 'default' : 'secondary'}>
                  {complete ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Data Preview */}
        <div className="space-y-4">
          <h4 className="font-medium">Quick Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Hotel Name:</strong> {(draftData['basic-details'] as BasicDetailsData)?.name || 'Not provided'}
            </div>
            <div>
              <strong>Type:</strong> {(draftData['basic-details'] as BasicDetailsData)?.hotelType || 'Not provided'}
            </div>
            <div>
              <strong>City:</strong> {(draftData['location'] as LocationData)?.city || 'Not provided'}
            </div>
            <div>
              <strong>Rooms:</strong> {(draftData['rooms'] as RoomsData)?.rooms?.length || 0} types
            </div>
            <div>
              <strong>Images:</strong> {(draftData['images'] as ImagesData)?.images?.length || 0} uploaded
            </div>
            <div>
              <strong>Amenities:</strong> {(draftData['amenities'] as AmenitiesData)?.amenities?.length || 0} selected
            </div>
          </div>
        </div>

        {/* Terms Agreement */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={formData.agreedToTerms}
              onCheckedChange={(checked: boolean | 'indeterminate') => updateField('agreedToTerms', checked)}
              className={errors.agreedToTerms ? 'border-red-500' : ''}
            />
            <div className="space-y-1">
              <Label htmlFor="terms" className="text-sm font-medium">
                I agree to the Terms of Service and Privacy Policy *
              </Label>
              <p className="text-xs text-gray-500">
                By checking this box, you confirm that all information provided is accurate
                and you agree to our terms and conditions.
              </p>
            </div>
          </div>
          {errors.agreedToTerms && (
            <p className="text-sm text-red-500">{errors.agreedToTerms}</p>
          )}
        </div>

        {/* Completion Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {completedSections === sections.length ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-500" />
            )}
            <h4 className="font-medium">
              {completedSections === sections.length
                ? 'Ready to Submit!'
                : 'Please Complete Missing Sections'
              }
            </h4>
          </div>
          <p className="text-sm text-gray-600">
            {completedSections === sections.length
              ? 'All sections are complete. You can now submit your hotel information.'
              : `Complete the remaining ${sections.length - completedSections} sections to proceed.`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}