/**
 * Amenities Step
 * Select property amenities from categorized list
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { AmenitiesData } from '../../types/onboarding';

interface AmenityCategory {
    id: string;
    name: string;
    amenities: Array<{ id: string; name: string; icon?: string }>;
}

// Sample amenities - in production, fetch from backend
const AMENITY_CATEGORIES: AmenityCategory[] = [
    {
        id: 'essentials',
        name: 'Essentials',
        amenities: [
            { id: 'wifi', name: 'Free WiFi' },
            { id: 'parking', name: 'Free Parking' },
            { id: 'ac', name: 'Air Conditioning' },
            { id: 'tv', name: 'TV' },
            { id: 'hot-water', name: 'Hot Water' },
        ],
    },
    {
        id: 'dining',
        name: 'Dining',
        amenities: [
            { id: 'restaurant', name: 'Restaurant' },
            { id: 'room-service', name: 'Room Service' },
            { id: 'breakfast', name: 'Breakfast' },
            { id: 'bar', name: 'Bar/Lounge' },
        ],
    },
    {
        id: 'recreation',
        name: 'Recreation',
        amenities: [
            { id: 'pool', name: 'Swimming Pool' },
            { id: 'gym', name: 'Fitness Center' },
            { id: 'spa', name: 'Spa' },
            { id: 'garden', name: 'Garden' },
        ],
    },
    {
        id: 'services',
        name: 'Services',
        amenities: [
            { id: 'front-desk', name: '24/7 Front Desk' },
            { id: 'concierge', name: 'Concierge' },
            { id: 'laundry', name: 'Laundry Service' },
            { id: 'housekeeping', name: 'Housekeeping' },
        ],
    },
];

interface AmenitiesStepProps {
    data: AmenitiesData;
    onChange: (data: AmenitiesData) => void;
}

export function AmenitiesStep({ data, onChange }: AmenitiesStepProps) {
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
        data?.selectedAmenities || []
    );
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        onChange({ selectedAmenities });
    }, [selectedAmenities, onChange]);

    const toggleAmenity = (amenityId: string) => {
        setSelectedAmenities(prev =>
            prev.includes(amenityId)
                ? prev.filter(id => id !== amenityId)
                : [...prev, amenityId]
        );
    };

    // Filter amenities based on search
    const filteredCategories = AMENITY_CATEGORIES.map(category => ({
        ...category,
        amenities: category.amenities.filter(amenity =>
            amenity.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    })).filter(category => category.amenities.length > 0);

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search amenities..."
                    className="pl-10"
                />
            </div>

            {/* Selected count */}
            <div className="text-sm text-gray-600">
                {selectedAmenities.length} amenities selected
            </div>

            {/* Amenity categories */}
            <div className="space-y-6">
                {filteredCategories.map(category => (
                    <div key={category.id} className="space-y-3">
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {category.amenities.map(amenity => (
                                <div
                                    key={amenity.id}
                                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => toggleAmenity(amenity.id)}
                                >
                                    <Checkbox
                                        id={amenity.id}
                                        checked={selectedAmenities.includes(amenity.id)}
                                        onCheckedChange={() => toggleAmenity(amenity.id)}
                                    />
                                    <Label
                                        htmlFor={amenity.id}
                                        className="flex-1 cursor-pointer"
                                    >
                                        {amenity.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {filteredCategories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No amenities found matching "{searchQuery}"
                </div>
            )}
        </div>
    );
}
