/**
 * Policies Step
 * Hotel policies and house rules
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PoliciesData } from '../../types/onboarding';

interface PoliciesStepProps {
    data: PoliciesData;
    onChange: (data: PoliciesData) => void;
}

export function PoliciesStep({ data, onChange }: PoliciesStepProps) {
    const [formData, setFormData] = useState<PoliciesData>(data || {
        checkInTime: '14:00',
        checkOutTime: '11:00',
        cancellationPolicy: 'flexible',
        petPolicy: 'not-allowed',
        smokingPolicy: 'non-smoking',
        houseRules: '',
    });

    useEffect(() => {
        onChange(formData);
    }, [formData, onChange]);

    const handleChange = (field: keyof PoliciesData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            {/* Check-in/Check-out Times */}
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Check-in & Check-out</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="checkInTime">
                            Check-in Time <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="checkInTime"
                            type="time"
                            value={formData.checkInTime}
                            onChange={(e) => handleChange('checkInTime', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="checkOutTime">
                            Check-out Time <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="checkOutTime"
                            type="time"
                            value={formData.checkOutTime}
                            onChange={(e) => handleChange('checkOutTime', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Cancellation Policy */}
            <div className="space-y-2">
                <Label htmlFor="cancellationPolicy">
                    Cancellation Policy <span className="text-red-500">*</span>
                </Label>
                <Select
                    value={formData.cancellationPolicy}
                    onValueChange={(value: string) => handleChange('cancellationPolicy', value)}
                >
                    <SelectTrigger id="cancellationPolicy">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="flexible">
                            Flexible - Free cancellation up to 24 hours before check-in
                        </SelectItem>
                        <SelectItem value="moderate">
                            Moderate - Free cancellation up to 5 days before check-in
                        </SelectItem>
                        <SelectItem value="strict">
                            Strict - Free cancellation up to 14 days before check-in
                        </SelectItem>
                        <SelectItem value="non-refundable">
                            Non-refundable - No cancellation allowed
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Pet Policy */}
            <div className="space-y-2">
                <Label htmlFor="petPolicy">
                    Pet Policy <span className="text-red-500">*</span>
                </Label>
                <Select
                    value={formData.petPolicy}
                    onValueChange={(value: string) => handleChange('petPolicy', value)}
                >
                    <SelectTrigger id="petPolicy">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="allowed">Pets Allowed</SelectItem>
                        <SelectItem value="allowed-with-fee">
                            Pets Allowed (with additional fee)
                        </SelectItem>
                        <SelectItem value="not-allowed">Pets Not Allowed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Smoking Policy */}
            <div className="space-y-2">
                <Label htmlFor="smokingPolicy">
                    Smoking Policy <span className="text-red-500">*</span>
                </Label>
                <Select
                    value={formData.smokingPolicy}
                    onValueChange={(value: string) => handleChange('smokingPolicy', value)}
                >
                    <SelectTrigger id="smokingPolicy">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="non-smoking">
                            Non-smoking Property
                        </SelectItem>
                        <SelectItem value="designated-areas">
                            Smoking in Designated Areas Only
                        </SelectItem>
                        <SelectItem value="smoking-allowed">
                            Smoking Allowed
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* House Rules */}
            <div className="space-y-2">
                <Label htmlFor="houseRules">
                    House Rules (Optional)
                </Label>
                <Textarea
                    id="houseRules"
                    value={formData.houseRules}
                    onChange={(e) => handleChange('houseRules', e.target.value)}
                    placeholder="Enter any additional house rules or policies..."
                    rows={5}
                    className="resize-none"
                />
                <p className="text-sm text-gray-500">
                    Include any specific rules guests should know about
                </p>
            </div>
        </div>
    );
}
