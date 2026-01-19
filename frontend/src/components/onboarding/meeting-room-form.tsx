'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Minus, 
  Users, 
  Monitor, 
  DollarSign,
  MapPin,
  X,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

import {
  MeetingRoom,
  MeetingRoomFormData,
  Equipment,
  MEETING_ROOM_LAYOUTS,
} from '@/lib/types/business-features';

interface MeetingRoomFormProps {
  meetingRoom?: MeetingRoom | null;
  onSave: (meetingRoom: MeetingRoom) => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  capacity?: string;
  layout?: string;
  bookingProcedure?: string;
  equipment?: string;
}

export const MeetingRoomForm: React.FC<MeetingRoomFormProps> = ({
  meetingRoom,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<MeetingRoomFormData>({
    id: meetingRoom?.id || '',
    name: meetingRoom?.name || '',
    capacity: meetingRoom?.capacity || 1,
    equipment: meetingRoom?.equipment || [],
    bookingProcedure: meetingRoom?.bookingProcedure || '',
    hourlyRate: meetingRoom?.hourlyRate || undefined,
    size: meetingRoom?.size || undefined,
    layout: meetingRoom?.layout || 'boardroom',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [newEquipment, setNewEquipment] = useState<Equipment>({
    name: '',
    quantity: 1,
    specifications: '',
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Meeting room name is required';
    }

    if (formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1 person';
    }

    if (!formData.layout) {
      newErrors.layout = 'Layout selection is required';
    }

    if (!formData.bookingProcedure.trim()) {
      newErrors.bookingProcedure = 'Booking procedure is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before saving');
      return;
    }

    const meetingRoomData: MeetingRoom = {
      id: formData.id || `meeting-room-${Date.now()}`,
      name: formData.name,
      capacity: formData.capacity,
      equipment: formData.equipment,
      bookingProcedure: formData.bookingProcedure,
      hourlyRate: formData.hourlyRate,
      size: formData.size,
      layout: formData.layout,
      images: meetingRoom?.images || [],
    };

    onSave(meetingRoomData);
  };

  const addEquipment = () => {
    if (!newEquipment.name.trim()) {
      toast.error('Equipment name is required');
      return;
    }

    setFormData(prev => ({
      ...prev,
      equipment: [...prev.equipment, { ...newEquipment }],
    }));

    setNewEquipment({
      name: '',
      quantity: 1,
      specifications: '',
    });
  };

  const removeEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index),
    }));
  };

  const updateEquipment = (index: number, field: keyof Equipment, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.map((eq, i) => 
        i === index ? { ...eq, [field]: value } : eq
      ),
    }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {meetingRoom ? 'Edit Meeting Room' : 'Add Meeting Room'}
        </CardTitle>
        <CardDescription>
          Configure meeting room details, capacity, equipment, and booking procedures.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Room Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Executive Boardroom"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                  className={`pl-10 ${errors.capacity ? 'border-red-500' : ''}`}
                  placeholder="Number of people"
                />
              </div>
              {errors.capacity && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.capacity}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="layout">Room Layout *</Label>
              <Select
                value={formData.layout}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, layout: value }))}
              >
                <SelectTrigger className={errors.layout ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select layout style" />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_ROOM_LAYOUTS.map((layout) => (
                    <SelectItem key={layout.value} value={layout.value}>
                      <div>
                        <div className="font-medium">{layout.label}</div>
                        <div className="text-sm text-gray-500">{layout.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.layout && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.layout}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Room Size (sq m)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="size"
                  type="number"
                  min="0"
                  value={formData.size || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    size: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  className="pl-10"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                value={formData.hourlyRate || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  hourlyRate: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="pl-10"
                placeholder="Optional - leave empty if complimentary"
              />
            </div>
          </div>

          {/* Booking Procedure */}
          <div className="space-y-2">
            <Label htmlFor="bookingProcedure">Booking Procedure *</Label>
            <Textarea
              id="bookingProcedure"
              value={formData.bookingProcedure}
              onChange={(e) => setFormData(prev => ({ ...prev, bookingProcedure: e.target.value }))}
              placeholder="Describe how guests can book this meeting room..."
              rows={3}
              className={errors.bookingProcedure ? 'border-red-500' : ''}
            />
            {errors.bookingProcedure && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.bookingProcedure}
              </p>
            )}
          </div>

          {/* Equipment Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Equipment & Amenities</Label>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                {formData.equipment.length} items
              </Badge>
            </div>

            {/* Existing Equipment */}
            {formData.equipment.length > 0 && (
              <div className="space-y-2">
                {formData.equipment.map((equipment, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input
                        value={equipment.name}
                        onChange={(e) => updateEquipment(index, 'name', e.target.value)}
                        placeholder="Equipment name"
                        className="bg-white"
                      />
                      <Input
                        type="number"
                        min="1"
                        value={equipment.quantity}
                        onChange={(e) => updateEquipment(index, 'quantity', parseInt(e.target.value) || 1)}
                        placeholder="Quantity"
                        className="bg-white"
                      />
                      <Input
                        value={equipment.specifications || ''}
                        onChange={(e) => updateEquipment(index, 'specifications', e.target.value)}
                        placeholder="Specifications (optional)"
                        className="bg-white"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEquipment(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Equipment */}
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Equipment name"
                />
                <Input
                  type="number"
                  min="1"
                  value={newEquipment.quantity}
                  onChange={(e) => setNewEquipment(prev => ({ 
                    ...prev, 
                    quantity: parseInt(e.target.value) || 1 
                  }))}
                  placeholder="Quantity"
                />
                <Input
                  value={newEquipment.specifications}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, specifications: e.target.value }))}
                  placeholder="Specifications (optional)"
                />
                <Button
                  type="button"
                  onClick={addEquipment}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {meetingRoom ? 'Update Meeting Room' : 'Add Meeting Room'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};