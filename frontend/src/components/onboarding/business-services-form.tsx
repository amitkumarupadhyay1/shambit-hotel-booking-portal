'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

import {
  BusinessService,
  BusinessServiceFormData,
  OperatingHours,
  DEFAULT_OPERATING_HOURS,
  DEFAULT_24X7_HOURS,
} from '@/lib/types/business-features';

interface BusinessServicesFormProps {
  services: BusinessService[];
  onSave: (services: BusinessService[]) => void;
}

interface FormErrors {
  name?: string;
  description?: string;
  fee?: string;
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

const PREDEFINED_SERVICES = [
  {
    name: 'Airport Shuttle',
    description: 'Complimentary shuttle service to and from the airport',
    available: true,
    fee: 0,
  },
  {
    name: 'Laundry Service',
    description: 'Professional laundry and dry cleaning services',
    available: true,
    fee: 500,
  },
  {
    name: 'Room Service',
    description: '24/7 in-room dining service',
    available: true,
    fee: 0,
  },
  {
    name: 'Concierge Service',
    description: 'Personal assistance with bookings, recommendations, and arrangements',
    available: true,
    fee: 0,
  },
  {
    name: 'Car Rental',
    description: 'On-site car rental services and arrangements',
    available: true,
    fee: 2000,
  },
  {
    name: 'Tour Booking',
    description: 'Local tour and activity booking assistance',
    available: true,
    fee: 0,
  },
  {
    name: 'Currency Exchange',
    description: 'Foreign currency exchange services',
    available: true,
    fee: 0,
  },
  {
    name: 'Babysitting Service',
    description: 'Professional childcare services',
    available: true,
    fee: 800,
  },
];

const BusinessServicesForm: React.FC<BusinessServicesFormProps> = ({
  services,
  onSave,
}) => {
  const [servicesList, setServicesList] = useState<BusinessService[]>(services);
  const [editingService, setEditingService] = useState<BusinessService | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<BusinessServiceFormData>({
    name: '',
    description: '',
    available: true,
    fee: undefined,
    hours: undefined,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Service description is required';
    }

    if (formData.fee !== undefined && formData.fee < 0) {
      newErrors.fee = 'Fee cannot be negative';
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

    const serviceData: BusinessService = {
      name: formData.name,
      description: formData.description,
      available: formData.available,
      fee: formData.fee,
      hours: formData.hours,
    };

    if (editingService) {
      // Update existing service
      const updatedServices = servicesList.map(service =>
        service.name === editingService.name ? serviceData : service
      );
      setServicesList(updatedServices);
      setEditingService(null);
      toast.success('Service updated successfully');
    } else {
      // Add new service
      if (servicesList.some(s => s.name === serviceData.name)) {
        toast.error('Service with this name already exists');
        return;
      }
      setServicesList([...servicesList, serviceData]);
      toast.success('Service added successfully');
    }

    // Reset form
    setFormData({
      name: '',
      description: '',
      available: true,
      fee: undefined,
      hours: undefined,
    });
    setShowAddForm(false);
  };

  const handleEdit = (service: BusinessService) => {
    setFormData({
      name: service.name,
      description: service.description,
      available: service.available,
      fee: service.fee,
      hours: service.hours,
    });
    setEditingService(service);
    setShowAddForm(true);
  };

  const handleDelete = (serviceName: string) => {
    const updatedServices = servicesList.filter(s => s.name !== serviceName);
    setServicesList(updatedServices);
    toast.success('Service deleted successfully');
  };

  const handleToggleAvailability = (serviceName: string) => {
    const updatedServices = servicesList.map(service =>
      service.name === serviceName 
        ? { ...service, available: !service.available }
        : service
    );
    setServicesList(updatedServices);
  };

  const addPredefinedService = (predefinedService: typeof PREDEFINED_SERVICES[0]) => {
    if (servicesList.some(s => s.name === predefinedService.name)) {
      toast.error('Service already exists');
      return;
    }

    const newService: BusinessService = {
      ...predefinedService,
      hours: DEFAULT_OPERATING_HOURS,
    };

    setServicesList([...servicesList, newService]);
    toast.success('Service added successfully');
  };

  const updateHours = (day: keyof OperatingHours, field: 'open' | 'close', value: string) => {
    if (day === 'is24x7') return;

    setFormData(prev => ({
      ...prev,
      hours: prev.hours ? {
        ...prev.hours,
        [day]: prev.hours[day] ? { ...prev.hours[day], [field]: value } : { open: value, close: value },
      } : {
        ...DEFAULT_OPERATING_HOURS,
        [day]: { open: value, close: value },
      },
    }));
  };

  const toggleDayAvailability = (day: keyof OperatingHours) => {
    if (day === 'is24x7') return;

    setFormData(prev => ({
      ...prev,
      hours: prev.hours ? {
        ...prev.hours,
        [day]: prev.hours[day] ? null : { open: '09:00', close: '18:00' },
      } : {
        ...DEFAULT_OPERATING_HOURS,
        [day]: { open: '09:00', close: '18:00' },
      },
    }));
  };

  const toggle24x7 = (is24x7: boolean) => {
    setFormData(prev => ({
      ...prev,
      hours: is24x7 ? DEFAULT_24X7_HOURS : DEFAULT_OPERATING_HOURS,
    }));
  };

  const handleSaveAll = () => {
    onSave(servicesList);
  };

  const cancelEdit = () => {
    setFormData({
      name: '',
      description: '',
      available: true,
      fee: undefined,
      hours: undefined,
    });
    setEditingService(null);
    setShowAddForm(false);
    setErrors({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Business Services</h3>
          <p className="text-sm text-gray-600">
            Configure additional services available to business travelers and corporate guests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Settings className="h-3 w-3" />
            {servicesList.filter(s => s.available).length} active
          </Badge>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Quick Add Predefined Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Add Services</CardTitle>
          <CardDescription>
            Add common business services with predefined settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PREDEFINED_SERVICES.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{service.name}</div>
                  <div className="text-sm text-gray-600">{service.description}</div>
                  {service.fee > 0 && (
                    <div className="text-sm text-green-600 font-medium">₹{service.fee}</div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addPredefinedService(service)}
                  disabled={servicesList.some(s => s.name === service.name)}
                >
                  {servicesList.some(s => s.name === service.name) ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Services */}
      {servicesList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Services</CardTitle>
            <CardDescription>
              Manage your business services and their availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {servicesList.map((service) => (
                <div
                  key={service.name}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    service.available ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{service.name}</h4>
                      <Badge variant={service.available ? "default" : "secondary"}>
                        {service.available ? "Available" : "Unavailable"}
                      </Badge>
                      {service.fee && service.fee > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ₹{service.fee}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                    {service.hours && !service.hours.is24x7 && (
                      <div className="text-xs text-gray-500">
                        Operating hours configured
                      </div>
                    )}
                    {service.hours?.is24x7 && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        24/7 Available
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={service.available}
                      onCheckedChange={(checked: boolean) => handleToggleAvailability(service.name)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(service.name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Service Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </CardTitle>
            <CardDescription>
              Configure service details, pricing, and availability hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceName">Service Name *</Label>
                  <Input
                    id="serviceName"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Airport Shuttle"
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
                  <Label htmlFor="serviceFee">Service Fee (₹)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="serviceFee"
                      type="number"
                      min="0"
                      value={formData.fee || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        fee: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      className={`pl-10 ${errors.fee ? 'border-red-500' : ''}`}
                      placeholder="Leave empty if free"
                    />
                  </div>
                  {errors.fee && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.fee}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceDescription">Description *</Label>
                <Textarea
                  id="serviceDescription"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the service and what it includes..."
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="serviceAvailable" className="font-medium">Service Available</Label>
                  <p className="text-sm text-gray-600">Enable this service for guests</p>
                </div>
                <Switch
                  id="serviceAvailable"
                  checked={formData.available}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, available: checked }))}
                />
              </div>

              {/* Operating Hours */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Service Hours</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="service24x7" className="text-sm">24/7 Available</Label>
                    <Switch
                      id="service24x7"
                      checked={formData.hours?.is24x7 || false}
                      onCheckedChange={(checked: boolean) => toggle24x7(checked)}
                    />
                  </div>
                </div>

                {formData.hours && !formData.hours.is24x7 && (
                  <div className="space-y-3">
                    {DAYS_OF_WEEK.map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="w-20">
                          <Switch
                            checked={formData.hours![key] !== null}
                            onCheckedChange={() => toggleDayAvailability(key)}
                          />
                        </div>
                        <div className="w-24 font-medium">{label}</div>
                        {formData.hours![key] && (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="time"
                              value={formData.hours![key]?.open || '09:00'}
                              onChange={(e) => updateHours(key, 'open', e.target.value)}
                              className="w-32"
                            />
                            <span className="text-gray-500">to</span>
                            <Input
                              type="time"
                              value={formData.hours![key]?.close || '18:00'}
                              onChange={(e) => updateHours(key, 'close', e.target.value)}
                              className="w-32"
                            />
                          </div>
                        )}
                        {!formData.hours![key] && (
                          <div className="flex-1 text-gray-500">Not available</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingService ? 'Update Service' : 'Add Service'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Save All Changes */}
      <div className="flex items-center justify-end pt-6 border-t">
        <Button onClick={handleSaveAll} className="bg-blue-600 hover:bg-blue-700">
          Save All Services
        </Button>
      </div>
    </div>
  );
};

export { BusinessServicesForm };
export default BusinessServicesForm;