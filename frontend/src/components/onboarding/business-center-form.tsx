'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Clock, 
  Plus, 
  X, 
  Users,
  Settings,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

import {
  BusinessCenter,
  BusinessCenterFormData,
  Equipment,
  OperatingHours,
  DEFAULT_OPERATING_HOURS,
  DEFAULT_24X7_HOURS,
} from '@/lib/types/business-features';

interface BusinessCenterFormProps {
  businessCenter?: BusinessCenter; // Make optional
  initialData?: any; // For mobile integration
  onSave?: (businessCenter: BusinessCenter) => void; // Make optional
  onDataChange?: (data: any) => void; // For mobile integration
  onValidationChange?: () => void; // For mobile integration
  hotelId?: string; // For mobile integration
}

interface FormErrors {
  services?: string;
  equipment?: string;
  hours?: string;
}

const BUSINESS_CENTER_SERVICES = [
  'Printing Services',
  'Copying Services',
  'Fax Services',
  'Scanning Services',
  'Computer Access',
  'Internet Access',
  'Administrative Support',
  'Secretarial Services',
  'Translation Services',
  'Courier Services',
  'Package Handling',
  'Meeting Room Booking',
];

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

const BusinessCenterForm: React.FC<BusinessCenterFormProps> = ({
  businessCenter,
  initialData,
  onSave,
  onDataChange,
  onValidationChange,
  hotelId,
}) => {
  // Use businessCenter or initialData or defaults
  const defaultData = businessCenter || initialData || {
    available: false,
    hours: { open: '09:00', close: '17:00', days: [] },
    services: [],
    equipment: [],
    staffed: false,
  };

  const [formData, setFormData] = useState<BusinessCenterFormData>({
    available: defaultData.available,
    hours: defaultData.hours,
    services: defaultData.services,
    equipment: defaultData.equipment,
    staffed: defaultData.staffed,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [newService, setNewService] = useState('');
  const [newEquipment, setNewEquipment] = useState<Equipment>({
    name: '',
    quantity: 1,
    specifications: '',
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (formData.available && formData.services.length === 0) {
      newErrors.services = 'At least one service is required when business center is available';
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

    // Call onSave if provided, otherwise call onDataChange for mobile integration
    if (onSave) {
      onSave(formData);
    } else if (onDataChange) {
      onDataChange(formData);
    }
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  };

  const addCustomService = () => {
    if (!newService.trim()) {
      toast.error('Service name is required');
      return;
    }

    if (formData.services.includes(newService)) {
      toast.error('Service already exists');
      return;
    }

    setFormData(prev => ({
      ...prev,
      services: [...prev.services, newService],
    }));

    setNewService('');
  };

  const removeService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s !== service),
    }));
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
      hours: is24x7 ? DEFAULT_24X7_HOURS : DEFAULT_OPERATING_HOURS,
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Business Center
        </CardTitle>
        <CardDescription>
          Configure business center availability, services, equipment, and operating hours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Availability Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="available" className="text-base font-medium">Business Center Available</Label>
              <p className="text-sm text-gray-600">Enable business center services for guests</p>
            </div>
            <Switch
              id="available"
              checked={formData.available}
              onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, available: checked }))}
            />
          </div>

          {formData.available && (
            <>
              {/* Staffing */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="staffed" className="font-medium">Staffed Business Center</Label>
                  <p className="text-sm text-gray-600">Dedicated staff available to assist guests</p>
                </div>
                <Switch
                  id="staffed"
                  checked={formData.staffed}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, staffed: checked }))}
                />
              </div>

              {/* Operating Hours */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Operating Hours</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="is24x7" className="text-sm">24/7 Access</Label>
                    <Switch
                      id="is24x7"
                      checked={formData.hours.is24x7}
                      onCheckedChange={(checked: boolean) => toggle24x7(checked)}
                    />
                  </div>
                </div>

                {!formData.hours.is24x7 && (
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
                )}
              </div>

              {/* Services */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Available Services</Label>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    {formData.services.length} services
                  </Badge>
                </div>

                {/* Predefined Services */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {BUSINESS_CENTER_SERVICES.map((service) => (
                    <div
                      key={service}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.services.includes(service)
                          ? 'bg-blue-50 border-blue-200 text-blue-900'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => toggleService(service)}
                    >
                      <div className="text-sm font-medium">{service}</div>
                    </div>
                  ))}
                </div>

                {/* Custom Services */}
                {formData.services.filter(s => !BUSINESS_CENTER_SERVICES.includes(s)).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Custom Services</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.services
                        .filter(s => !BUSINESS_CENTER_SERVICES.includes(s))
                        .map((service) => (
                          <Badge
                            key={service}
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            {service}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeService(service)}
                              className="h-4 w-4 p-0 hover:bg-transparent"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                {/* Add Custom Service */}
                <div className="flex gap-2">
                  <Input
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    placeholder="Add custom service..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addCustomService}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                {errors.services && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.services}
                  </p>
                )}
              </div>

              {/* Equipment */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Equipment & Facilities</Label>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
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
            </>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Save Business Center Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export { BusinessCenterForm };
export default BusinessCenterForm;