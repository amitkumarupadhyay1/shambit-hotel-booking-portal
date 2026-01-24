/**
 * Business Features Step (Optional)
 * Configure business amenities and services
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BusinessFeaturesData, MeetingRoom } from '../../types/onboarding';

interface BusinessFeaturesStepProps {
    data: BusinessFeaturesData;
    onChange: (data: BusinessFeaturesData) => void;
}

export function BusinessFeaturesStep({ data, onChange }: BusinessFeaturesStepProps) {
    const [formData, setFormData] = useState<BusinessFeaturesData>(data || {
        meetingRooms: [],
        connectivity: {},
        businessServices: [],
    });

    useEffect(() => {
        onChange(formData);
    }, [formData, onChange]);

    const addMeetingRoom = () => {
        const newRoom: MeetingRoom = {
            name: '',
            capacity: 10,
            equipment: [],
        };
        setFormData(prev => ({
            ...prev,
            meetingRooms: [...(prev.meetingRooms || []), newRoom],
        }));
    };

    const removeMeetingRoom = (index: number) => {
        setFormData(prev => ({
            ...prev,
            meetingRooms: prev.meetingRooms?.filter((_, i) => i !== index) || [],
        }));
    };

    const updateMeetingRoom = (index: number, field: keyof MeetingRoom, value: any) => {
        setFormData(prev => ({
            ...prev,
            meetingRooms: prev.meetingRooms?.map((room, i) =>
                i === index ? { ...room, [field]: value } : room
            ) || [],
        }));
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    This step is optional. Add business features if your property caters to business travelers.
                </p>
            </div>

            {/* Meeting Rooms */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">Meeting Rooms</h3>
                        <p className="text-sm text-gray-600">
                            Add conference or meeting room facilities
                        </p>
                    </div>
                    <Button onClick={addMeetingRoom} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Meeting Room
                    </Button>
                </div>

                {formData.meetingRooms && formData.meetingRooms.length > 0 && (
                    <div className="space-y-3">
                        {formData.meetingRooms.map((room, index) => (
                            <Card key={index}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Room Name</Label>
                                                <Input
                                                    value={room.name}
                                                    onChange={(e) => updateMeetingRoom(index, 'name', e.target.value)}
                                                    placeholder="e.g., Conference Room A"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Capacity (people)</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={room.capacity}
                                                    onChange={(e) => updateMeetingRoom(index, 'capacity', parseInt(e.target.value) || 1)}
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeMeetingRoom(index)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* WiFi/Connectivity */}
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">WiFi & Connectivity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="wifiSpeed">WiFi Speed</Label>
                        <Input
                            id="wifiSpeed"
                            value={formData.connectivity?.wifiSpeed || ''}
                            onChange={(e) =>
                                setFormData(prev => ({
                                    ...prev,
                                    connectivity: { ...prev.connectivity, wifiSpeed: e.target.value },
                                }))
                            }
                            placeholder="e.g., 100 Mbps"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="coverage">Coverage</Label>
                        <Input
                            id="coverage"
                            value={formData.connectivity?.coverage || ''}
                            onChange={(e) =>
                                setFormData(prev => ({
                                    ...prev,
                                    connectivity: { ...prev.connectivity, coverage: e.target.value },
                                }))
                            }
                            placeholder="e.g., All rooms and common areas"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
