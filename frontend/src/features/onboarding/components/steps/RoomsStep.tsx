/**
 * Rooms Step
 * Configure room types, pricing, and details
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoomsData, RoomData } from '../../types/onboarding';

interface RoomsStepProps {
    data: RoomsData;
    onChange: (data: RoomsData) => void;
}

const EMPTY_ROOM: RoomData = {
    name: '',
    roomType: 'DOUBLE',
    basePrice: 1000,
    maxOccupancy: 2,
    bedCount: 1,
    bedType: 'Double Bed',
    description: '',
};

export function RoomsStep({ data, onChange }: RoomsStepProps) {
    const [rooms, setRooms] = useState<RoomData[]>(
        data?.rooms && data.rooms.length > 0 ? data.rooms : [{ ...EMPTY_ROOM }]
    );

    useEffect(() => {
        onChange({ rooms });
    }, [rooms, onChange]);

    const addRoom = () => {
        setRooms(prev => [...prev, { ...EMPTY_ROOM }]);
    };

    const removeRoom = (index: number) => {
        if (rooms.length > 1) {
            setRooms(prev => prev.filter((_, i) => i !== index));
        }
    };

    const updateRoom = (index: number, field: keyof RoomData, value: any) => {
        setRooms(prev =>
            prev.map((room, i) => (i === index ? { ...room, [field]: value } : room))
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Room Types</h3>
                    <p className="text-sm text-gray-600">
                        Add all the different room types available at your property
                    </p>
                </div>
                <Button onClick={addRoom} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Room Type
                </Button>
            </div>

            <div className="space-y-4">
                {rooms.map((room, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">
                                    Room {index + 1}
                                </CardTitle>
                                {rooms.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeRoom(index)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Room Name and Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>
                                        Room Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={room.name}
                                        onChange={(e) => updateRoom(index, 'name', e.target.value)}
                                        placeholder="e.g., Deluxe Double Room"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        Room Type <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={room.roomType}
                                        onValueChange={(value: any) => updateRoom(index, 'roomType', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SINGLE">Single</SelectItem>
                                            <SelectItem value="DOUBLE">Double</SelectItem>
                                            <SelectItem value="DELUXE">Deluxe</SelectItem>
                                            <SelectItem value="SUITE">Suite</SelectItem>
                                            <SelectItem value="FAMILY">Family</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Occupancy and Beds */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>
                                        Max Occupancy <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={room.maxOccupancy}
                                        onChange={(e) => updateRoom(index, 'maxOccupancy', parseInt(e.target.value) || 1)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        Bed Count <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={room.bedCount}
                                        onChange={(e) => updateRoom(index, 'bedCount', parseInt(e.target.value) || 1)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        Bed Type <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={room.bedType}
                                        onChange={(e) => updateRoom(index, 'bedType', e.target.value)}
                                        placeholder="e.g., King Size"
                                    />
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>
                                        Base Price (₹/night) <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        min="100"
                                        value={room.basePrice}
                                        onChange={(e) => updateRoom(index, 'basePrice', parseInt(e.target.value) || 100)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Weekend Price (₹/night) (Optional)</Label>
                                    <Input
                                        type="number"
                                        min="100"
                                        value={room.weekendPrice || ''}
                                        onChange={(e) => updateRoom(index, 'weekendPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                                        placeholder="Leave empty if same as base"
                                    />
                                </div>
                            </div>

                            {/* Room Size (Optional) */}
                            <div className="space-y-2">
                                <Label>Room Size (sq ft) (Optional)</Label>
                                <Input
                                    type="number"
                                    min="50"
                                    value={room.roomSize || ''}
                                    onChange={(e) => updateRoom(index, 'roomSize', e.target.value ? parseInt(e.target.value) : undefined)}
                                    placeholder="e.g., 250"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
