'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Users, 
  Clock, 
  Zap, 
  Lightbulb,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

import {
  WorkSpace,
  WorkSpaceFormData,
  OperatingHours,
  WORKSPACE_TYPES,
  LIGHTING_TYPES,
  DEFAULT_OPERATING_HOURS,
  DEFAULT_24X7_HOURS,
} from '@/lib/types/business-features';

interface WorkSpaceFormProps {
  workSpace?: WorkSpace | null;
  onSave: (workSpace: WorkSpace) => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  type?: string;
  capacity?: string;
  powerOutlets?: string;
  lighting?: string;
  amenities?: string;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

const WORKSPACE_AMENITIES = [
  'High-speed WiFi',
  'Power outlets at every seat',
  'USB charging ports',
  'Wireless charging pads',
  'Adjustable lighting',
  'Climate control',
  'Noise cancellation',
  'Whiteboards',
  'Flip charts',
  'Projector access',
  'Video conferencing',
  'Printing access',
  'Coffee/tea station',
  'Water cooler',
  'Comfortable seating',
  'Standing desks',
  'Ergonomic chairs',
  'Storage lockers',
  'Phone booths',
  'Quiet zones',
];

const WorkSpaceForm: React.FC<WorkSpaceFormProps> = ({
  workSpace,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<WorkSpaceFormData>({
    id: workSpace?.id || '',
    name: workSpace?.name || '',
    type: workSpace?.type || 'co_working',
    capacity: workSpace?.capacity || 1,
    hours: workSpace?.hours || DEFAULT_OPERATING_HOURS,
    amenities: workSpace?.amenities || [],
    isAccessible24x7: workSpace?.isAccessible24x7 || false,
    powerOutlets: workSpace?.powerOutlets || 0,
    lighting: workSpace?.lighting || 'mixed',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [newAmenity, setNewAmenity] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Workspace name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Workspace type is required';
    }

    if (formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1 person';
    }

    if (formData.powerOutlets < 0) {
      newErrors.powerOutlets = 'Power outlets cannot be negative';
    }

    if (!formData.lighting) {
      newErrors.lighting = 'Lighting type is required';
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

    const workSpaceData: WorkSpace = {
      id: formData.id || `workspace-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      capacity: formData.capacity,
      hours: formData.hours,
      amenities: formData.amenities,
      isAccessible24x7: formData.isAccessible24x7,
      powerOutlets: formData.powerOutlets,
      lighting: formData.lighting,
    };

    onSave(workSpaceData);
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const addCustomAmenity = () => {
    if (!newAmenity.trim()) {
      toast.error('Amenity name is required');
      return;
    }

    if (formData.amenities.includes(newAmenity)) {
      toast.error('Amenity already exists');
      return;
    }

    setFormData(prev => ({
      ...prev,
      amenities: [...prev.amenities, newAmenity],
    }));

    setNewAmenity('');
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity),
    }));
  };

  const updateHours = (day: keyof OperatingHours, field: 'open' | 'close', value: string) => {
    if (day === 'is24x7') return;

    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: prev.hours[day] ? { ...prev.hours[day], [field]: value } : { open: value, close: value },
      },
    }));
  };

  const toggleDayAvailability = (day: keyof OperatingHours) => {
    if (day === 'is24x7') return;

    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: prev.hours[day] ? null : { open: '09:00', close: '18:00' },
      },
    }));
  };

  const toggle24x7 = (is24x7: boolean) => {
    setFormData(prev => ({
      ...prev,
      isAccessible24x7: is24x7,
      hours: is24x7 ? DEFAULT_24X7_HOURS : DEFAULT_OPERATING_HOURS,
    }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {workSpace ? 'Edit Workspace' : 'Add Workspace'}
        </CardTitle>
        <CardDescription>
          Configure workspace details, capacity, amenities, and operating hours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Executive Lounge, Quiet Zone"
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
              <Label htmlFor="type">Workspace Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select workspace type" />
                </SelectTrigger>
                <SelectContent>
                  {WORKSPACE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.type}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="powerOutlets">Power Outlets</Label>
              <div className="relative">
                <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="powerOutlets"
                  type="number"
                  min="0"
                  value={formData.powerOutlets}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    powerOutlets: parseInt(e.target.value) || 0 
                  }))}
                  className={`pl-10 ${errors.powerOutlets ? 'border-red-500' : ''}`}
                  placeholder="Number of outlets"
                />
              </div>
              {errors.powerOutlets && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.powerOutlets}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lighting">Lighting Type *</Label>
              <Select
                value={formData.lighting}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, lighting: value }))}
              >
                <SelectTrigger className={errors.lighting ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select lighting" />
                </SelectTrigger>
                <SelectContent>
                  {LIGHTING_TYPES.map((lighting) => (
                    <SelectItem key={lighting.value} value={lighting.value}>
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{lighting.label}</div>
                          <div className="text-sm text-gray-500">{lighting.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.lighting && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.lighting}
                </p>
              )}
            </div>
          </div>

          {/* 24/7 Access */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="is24x7" className="text-base font-medium">24/7 Access</Label>
              <p className="text-sm text-gray-600">Workspace is accessible around the clock</p>
            </div>
            <Switch
              id="is24x7"
              checked={formData.isAccessible24x7}
              onCheckedChange={(checked: boolean) => toggle24x7(checked)}
            />
          </div>

          {/* Operating Hours */}
          {!formData.isAccessible24x7 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Operating Hours</Label>
              <div className="space-y-3">
                {DAYS_OF_WEEK.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="w-20">
                      <Switch
                        checked={formData.hours[key] !== null}
                        onCheckedChange={() => toggleDayAvailability(key)}
                      />
                    </div>
                    <div className="w-24 font-medium">{label}</div>
                    {formData.hours[key] && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={formData.hours[key]?.open || '09:00'}
                          onChange={(e) => updateHours(key, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={formData.hours[key]?.close || '18:00'}
                          onChange={(e) => updateHours(key, 'close', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    )}
                    {!formData.hours[key] && (
                      <div className="flex-1 text-gray-500">Closed</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Workspace Amenities</Label>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Plus className="h-3 w-3" />
                {formData.amenities.length} selected
              </Badge>
            </div>

            {/* Predefined Amenities */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {WORKSPACE_AMENITIES.map((amenity) => (
                <div
                  key={amenity}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.amenities.includes(amenity)
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => toggleAmenity(amenity)}
                >
                  <div className="text-sm font-medium">{amenity}</div>
                </div>
              ))}
            </div>

            {/* Custom Amenities */}
            {formData.amenities.filter(a => !WORKSPACE_AMENITIES.includes(a)).length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Custom Amenities</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities
                    .filter(a => !WORKSPACE_AMENITIES.includes(a))
                    .map((amenity) => (
                      <Badge
                        key={amenity}
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        {amenity}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAmenity(amenity)}
                          className="h-4 w-4 p-0 hover:bg-transparent"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* Add Custom Amenity */}
            <div className="flex gap-2">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="Add custom amenity..."
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addCustomAmenity}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {workSpace ? 'Update Workspace' : 'Add Workspace'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export { WorkSpaceForm };
export default WorkSpaceForm;