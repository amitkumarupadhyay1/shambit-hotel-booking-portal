/**
 * Simplified Rooms Step
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useStepForm } from '../../hooks/useStepForm';

interface RoomData {
  name: string;
  type: 'SINGLE' | 'DOUBLE' | 'SUITE' | 'FAMILY' | 'DORMITORY';
  capacity: number;
  basePrice: number;
  amenities: string[];
  images: string[];
}

interface RoomsData {
  rooms: RoomData[];
}

const defaultData: RoomsData = {
  rooms: [],
};

const defaultRoom: RoomData = {
  name: '',
  type: 'DOUBLE',
  capacity: 2,
  basePrice: 0,
  amenities: [],
  images: [],
};

export function RoomsStep() {
  const { formData, errors, updateField } = useStepForm({
    stepId: 'rooms',
    defaultData,
  });

  const addRoom = () => {
    const updatedRooms = [...(formData.rooms || []), { ...defaultRoom }];
    updateField('rooms', updatedRooms);
  };

  const removeRoom = (index: number) => {
    const updatedRooms = formData.rooms.filter((_, i) => i !== index);
    updateField('rooms', updatedRooms);
  };

  const updateRoom = (index: number, field: keyof RoomData, value: any) => {
    const updatedRooms = formData.rooms.map((room, i) => 
      i === index ? { ...room, [field]: value } : room
    );
    updateField('rooms', updatedRooms);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Types</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {errors.rooms && (
          <p className="text-sm text-red-500">{errors.rooms}</p>
        )}

        {/* Room List */}
        {formData.rooms && formData.rooms.length > 0 ? (
          <div className="space-y-4">
            {formData.rooms.map((room, index) => (
              <Card key={index} className="border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Room {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRoom(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Room Name & Type */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Room Name *</Label>
                      <Input
                        value={room.name}
                        onChange={(e) => updateRoom(index, 'name', e.target.value)}
                        placeholder="e.g., Deluxe Double Room"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Room Type *</Label>
                      <Select
                        value={room.type}
                        onValueChange={(value) => updateRoom(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINGLE">Single</SelectItem>
                          <SelectItem value="DOUBLE">Double</SelectItem>
                          <SelectItem value="SUITE">Suite</SelectItem>
                          <SelectItem value="FAMILY">Family</SelectItem>
                          <SelectItem value="DORMITORY">Dormitory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Capacity & Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Capacity *</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={room.capacity}
                        onChange={(e) => updateRoom(index, 'capacity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Base Price (₹) *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={room.basePrice}
                        onChange={(e) => updateRoom(index, 'basePrice', parseInt(e.target.value) || 0)}
                        placeholder="Per night"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No rooms added yet</p>
          </div>
        )}

        {/* Add Room Button */}
        <Button
          type="button"
          variant="outline"
          onClick={addRoom}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Room Type
        </Button>

        <p className="text-sm text-gray-500">
          Added: {formData.rooms?.length || 0} room types
        </p>
      </CardContent>
    </Card>
  );
}