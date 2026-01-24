/**
 * Simplified Business Features Step
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useStepForm } from '../../hooks/useStepForm';

interface BusinessFeaturesData {
  instantBooking: boolean;
  paymentMethods: string[];
  languages: string[];
}

const defaultData: BusinessFeaturesData = {
  instantBooking: true,
  paymentMethods: [],
  languages: [],
};

const PAYMENT_METHODS = [
  'Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet', 'Bank Transfer'
];

const LANGUAGES = [
  'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'
];

export function BusinessFeaturesStep() {
  const { formData, errors, updateField } = useStepForm({
    stepId: 'business-features',
    defaultData,
  });

  const togglePaymentMethod = (method: string) => {
    const current = formData.paymentMethods || [];
    const updated = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method];
    updateField('paymentMethods', updated);
  };

  const toggleLanguage = (language: string) => {
    const current = formData.languages || [];
    const updated = current.includes(language)
      ? current.filter(l => l !== language)
      : [...current, language];
    updateField('languages', updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Features</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instant Booking */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-medium">Instant Booking</Label>
            <p className="text-sm text-gray-500">
              Allow guests to book immediately without approval
            </p>
          </div>
          <Switch
            checked={formData.instantBooking}
            onCheckedChange={(checked) => updateField('instantBooking', checked)}
          />
        </div>

        {/* Payment Methods */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Payment Methods *</Label>
          {errors.paymentMethods && (
            <p className="text-sm text-red-500">{errors.paymentMethods}</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PAYMENT_METHODS.map((method) => (
              <div key={method} className="flex items-center space-x-2">
                <Checkbox
                  id={method}
                  checked={formData.paymentMethods?.includes(method) || false}
                  onCheckedChange={() => togglePaymentMethod(method)}
                />
                <Label htmlFor={method} className="text-sm">
                  {method}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Languages Spoken *</Label>
          {errors.languages && (
            <p className="text-sm text-red-500">{errors.languages}</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {LANGUAGES.map((language) => (
              <div key={language} className="flex items-center space-x-2">
                <Checkbox
                  id={language}
                  checked={formData.languages?.includes(language) || false}
                  onCheckedChange={() => toggleLanguage(language)}
                />
                <Label htmlFor={language} className="text-sm">
                  {language}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="text-sm text-gray-600 space-y-1">
            <p>Payment methods: {formData.paymentMethods?.length || 0} selected</p>
            <p>Languages: {formData.languages?.length || 0} selected</p>
            <p>Instant booking: {formData.instantBooking ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}