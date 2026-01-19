'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Bed, 
  Users, 
  Ruler, 
  Plus,
  Minus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Simplified types for basic room setup
export interface BasicRoomInfo {
  name: string;
  type: string;
  adults: number;
  children: number;
  maxOccupancy: number;
  area: number;
  unit: 'sqm' | 'sqft';
  beds: BedInfo[];
}

export interface BedInfo {
  type: string;
  count: number;
  size: string;
}

export interface RoomSetupFormProps {
  onSave: (roomData: BasicRoomInfo) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<BasicRoomInfo>;
  className?: string;
}

const ROOM_TYPES = [
  { value: 'SINGLE', label: 'Single Room' },
  { value: 'DOUBLE', label: 'Double Room' },
  { value: 'DELUXE', label: 'Deluxe Room' },
  { value: 'SUITE', label: 'Suite' },
  { value: 'FAMILY', label: 'Family Room' },
  { value: 'STUDIO', label: 'Studio' },
];

const BED_TYPES = [
  { value: 'SINGLE', label: 'Single Bed', sizes: ['Single'] },
  { value: 'DOUBLE', label: 'Double Bed', sizes: ['Double'] },
  { value: 'QUEEN', label: 'Queen Bed', sizes: ['Queen Size'] },
  { value: 'KING', label: 'King Bed', sizes: ['King Size'] },
  { value: 'TWIN', label: 'Twin Beds', sizes: ['Twin'] },
  { value: 'SOFA_BED', label: 'Sofa Bed', sizes: ['Sofa Bed'] },
];

export function RoomSetupForm({
  onSave,
  onCancel,
  initialData,
  className = '',
}: RoomSetupFormProps) {
  const [roomData, setRoomData] = useState<BasicRoomInfo>({
    name: initialData?.name || '',
    type: initialData?.type || 'DOUBLE',
    adults: initialData?.adults || 2,
    children: initialData?.children || 0,
    maxOccupancy: initialData?.maxOccupancy || 2,
    area: initialData?.area || 25,
    unit: initialData?.unit || 'sqm',
    beds: initialData?.beds || [{ type: 'DOUBLE', count: 1, size: 'Double' }],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!roomData.name || roomData.name.trim().length < 3) {
      newErrors.push('Room name must be at least 3 characters long');
    }

    if (roomData.adults < 1) {
      newErrors.push('At least 1 adult capacity is required');
    }

    if (roomData.maxOccupancy < roomData.adults) {
      newErrors.push('Max occupancy cannot be less than adult capacity');
    }

    if (roomData.area < 10) {
      newErrors.push('Room area must be at least 10 square units');
    }

    if (roomData.beds.length === 0) {
      newErrors.push('At least one bed configuration is required');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSave(roomData);
    } catch (error) {
      console.error('Failed to save room:', error);
      setErrors(['Failed to save room. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const addBed = () => {
    setRoomData(prev => ({
      ...prev,
      beds: [...prev.beds, { type: 'DOUBLE', count: 1, size: 'Double' }],
    }));
  };

  const updateBed = (index: number, bed: BedInfo) => {
    setRoomData(prev => ({
      ...prev,
      beds: prev.beds.map((b, i) => i === index ? bed : b),
    }));
  };

  const removeBed = (index: number) => {
    setRoomData(prev => ({
      ...prev,
      beds: prev.beds.filter((_, i) => i !== index),
    }));
  };

  const updateMaxOccupancy = () => {
    const totalCapacity = roomData.adults + roomData.children;
    if (roomData.maxOccupancy < totalCapacity) {
      setRoomData(prev => ({
        ...prev,
        maxOccupancy: totalCapacity,
      }));
    }
  };

  const isValid = errors.length === 0 && roomData.name.trim().length >= 3;

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Room Setup</h2>
          <p className="text-gray-600">Configure basic room information</p>
        </div>
        <div className="flex items-center space-x-2">
          {isValid ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          <Badge variant={isValid ? "default" : "destructive"}>
            {isValid ? "Valid" : "Invalid"}
          </Badge>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
              <AlertCircle className="h-4 w-4" />
              Please fix the following errors:
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bed className="h-5 w-5" />
            <span>Basic Information</span>
          </CardTitle>
          <CardDescription>
            Configure the fundamental details of your room
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="roomName">Room Name *</Label>
              <Input
                id="roomName"
                value={roomData.name}
                onChange={(e) => setRoomData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Deluxe Ocean View"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="roomType">Room Type *</Label>
              <Select
                value={roomData.type}
                onValueChange={(value: string) => setRoomData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Capacity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Room Capacity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="adults">Adults *</Label>
              <Input
                id="adults"
                type="number"
                min="1"
                max="20"
                value={roomData.adults}
                onChange={(e) => {
                  const adults = parseInt(e.target.value) || 1;
                  setRoomData(prev => ({
                    ...prev,
                    adults,
                    maxOccupancy: Math.max(adults, prev.children),
                  }));
                  updateMaxOccupancy();
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="children">Children</Label>
              <Input
                id="children"
                type="number"
                min="0"
                max="10"
                value={roomData.children}
                onChange={(e) => {
                  const children = parseInt(e.target.value) || 0;
                  setRoomData(prev => ({
                    ...prev,
                    children,
                    maxOccupancy: Math.max(prev.adults, prev.adults + children),
                  }));
                  updateMaxOccupancy();
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxOccupancy">Max Occupancy *</Label>
              <Input
                id="maxOccupancy"
                type="number"
                min="1"
                max="20"
                value={roomData.maxOccupancy}
                onChange={(e) => setRoomData(prev => ({
                  ...prev,
                  maxOccupancy: parseInt(e.target.value) || 1,
                }))}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Size */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Ruler className="h-5 w-5" />
            <span>Room Size</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="area">Area *</Label>
              <Input
                id="area"
                type="number"
                min="10"
                max="1000"
                value={roomData.area}
                onChange={(e) => setRoomData(prev => ({
                  ...prev,
                  area: parseFloat(e.target.value) || 25,
                }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit *</Label>
              <Select
                value={roomData.unit}
                onValueChange={(value: string) => setRoomData(prev => ({
                  ...prev,
                  unit: value as 'sqm' | 'sqft',
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sqm">Square Meters (m²)</SelectItem>
                  <SelectItem value="sqft">Square Feet (ft²)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bed Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bed className="h-5 w-5" />
              <span>Bed Configuration</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBed}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Bed
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roomData.beds.map((bed, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`bedType-${index}`}>Bed Type</Label>
                    <Select
                      value={bed.type}
                      onValueChange={(value: string) => updateBed(index, { ...bed, type: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BED_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`bedCount-${index}`}>Count</Label>
                    <Input
                      id={`bedCount-${index}`}
                      type="number"
                      min="1"
                      max="10"
                      value={bed.count}
                      onChange={(e) => updateBed(index, { 
                        ...bed, 
                        count: parseInt(e.target.value) || 1 
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeBed(index)}
                      disabled={roomData.beds.length === 1}
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={isLoading || !isValid}
          className="min-w-[100px]"
        >
          {isLoading ? 'Saving...' : 'Save Room'}
        </Button>
      </div>
    </div>
  );
}