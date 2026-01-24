/**
 * Location Step
 * Property location and contact information
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LocationData } from '../../types/onboarding';

interface LocationStepProps {
    data: LocationData;
    onChange: (data: LocationData) => void;
}

export function LocationStep({ data, onChange }: LocationStepProps) {
    const [formData, setFormData] = useState<LocationData>(data || {
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        website: '',
    });

    useEffect(() => {
        onChange(formData);
    }, [formData, onChange]);

    const handleChange = (field: keyof LocationData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            {/* Address */}
            <div className="space-y-2">
                <Label htmlFor="address">
                    Street Address <span className="text-red-500">*</span>
                </Label>
                <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Enter complete street address"
                    rows={3}
                    className="text-base resize-none"
                />
            </div>

            {/* City, State, Pincode */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="city">
                        City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        placeholder="e.g., Mumbai"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="state">
                        State <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        placeholder="e.g., Maharashtra"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="pincode">
                        Pincode <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="pincode"
                        value={formData.pincode}
                        onChange={(e) => handleChange('pincode', e.target.value)}
                        placeholder="e.g., 400001"
                        maxLength={6}
                    />
                </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Contact Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone">
                            Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">
                            Email Address (Optional)
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="contact@hotel.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="website">
                        Website (Optional)
                    </Label>
                    <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="https://www.yourhotel.com"
                    />
                </div>
            </div>
        </div>
    );
}
