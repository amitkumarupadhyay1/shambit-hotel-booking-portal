/**
 * Basic Details Step
 * First step: Property name, type, and basic contact info
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BasicDetailsData } from '../../types/onboarding';

interface BasicDetailsStepProps {
    data: BasicDetailsData;
    onChange: (data: BasicDetailsData) => void;
}

export function BasicDetailsStep({ data, onChange }: BasicDetailsStepProps) {
    const [formData, setFormData] = useState<BasicDetailsData>(data || {
        name: '',
        hotelType: 'HOTEL',
        description: '',
    });

    // Update parent when form data changes
    useEffect(() => {
        onChange(formData);
    }, [formData, onChange]);

    const handleChange = (field: keyof BasicDetailsData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            {/* Property Name */}
            <div className="space-y-2">
                <Label htmlFor="name">
                    Property Name <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Grand Plaza Hotel"
                    className="text-base"
                />
                <p className="text-sm text-gray-500">
                    This is how your property will appear to guests
                </p>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
                <Label htmlFor="hotelType">
                    Property Type <span className="text-red-500">*</span>
                </Label>
                <Select
                    value={formData.hotelType}
                    onValueChange={(value: any) => handleChange('hotelType', value)}
                >
                    <SelectTrigger id="hotelType">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="HOTEL">Hotel</SelectItem>
                        <SelectItem value="RESORT">Resort</SelectItem>
                        <SelectItem value="GUEST_HOUSE">Guest House</SelectItem>
                        <SelectItem value="HOMESTAY">Homestay</SelectItem>
                        <SelectItem value="APARTMENT">Apartment</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">
                    Property Description (Optional)
                </Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Briefly describe your property..."
                    rows={4}
                    className="text-base resize-none"
                />
                <p className="text-sm text-gray-500">
                    You can add a detailed description later
                </p>
            </div>
        </div>
    );
}
