'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ImageUpload, ImageCategory as ImageUploadCategory } from './image-upload';
import { AmenitySelection, PropertyType } from './amenity-selection';
import { ValidationFeedback } from './amenity-validation';
import { 
  Bed, 
  Users, 
  Ruler, 
  MapPin, 
  Camera, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Minus,
  Eye,
  Sun,
  Mountain,
  Building,
  Trees,
  Waves
} from 'lucide-react';

// Types
export interface RoomBasicInfo {
  name: string;
  type: RoomType;
  capacity: RoomCapacity;
  size: RoomSize;
  bedConfiguration: BedConfiguration;
  floor?: number;
  roomNumber?: string;
}

export interface RoomCapacity {
  adults: number;
  children: number;
  infants: number;
  maxOccupancy: number;
}

export interface RoomSize {
  area: number;
  unit: 'sqm' | 'sqft';
}

export interface BedConfiguration {
  beds: BedInfo[];
  totalBeds: number;
  sofaBeds: number;
  cribs: number;
}

export interface BedInfo {
  type: BedType;
  count: number;
  size: string;
}

export interface RoomLayout {
  dimensions: RoomDimensions;
  features: LayoutFeature[];
  floorPlan?: string;
  view: string;
  naturalLight: 'excellent' | 'good' | 'moderate' | 'limited';
}

export interface RoomDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'meters' | 'feet';
}

export interface LayoutFeature {
  name: string;
  type: FeatureType;
  description?: string;
  size?: number;
  facing?: ViewDirection;
}

export interface RoomAmenities {
  inherited: string[];
  specific: string[];
  overrides: AmenityOverride[];
}

export interface AmenityOverride {
  amenityId: string;
  action: 'add' | 'remove' | 'modify';
  value?: any;
  reason?: string;
}

export interface ProcessedImage {
  id: string;
  originalUrl: string;
  optimizedUrls: { [size: string]: string };
  thumbnails: { [size: string]: string };
  category: ImageCategory;
  qualityScore: number;
}

export interface RoomContentValidation {
  isComplete: boolean;
  missingElements: string[];
  qualityScore: number;
  recommendations: string[];
}

export enum RoomType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  DELUXE = 'DELUXE',
  SUITE = 'SUITE',
  FAMILY = 'FAMILY',
  PRESIDENTIAL = 'PRESIDENTIAL',
  STUDIO = 'STUDIO',
  APARTMENT = 'APARTMENT',
}

export enum BedType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  QUEEN = 'QUEEN',
  KING = 'KING',
  TWIN = 'TWIN',
  SOFA_BED = 'SOFA_BED',
  BUNK_BED = 'BUNK_BED',
}

export enum FeatureType {
  WINDOW = 'window',
  BALCONY = 'balcony',
  TERRACE = 'terrace',
  KITCHENETTE = 'kitchenette',
  SEATING_AREA = 'seating_area',
  WORK_DESK = 'work_desk',
  CLOSET = 'closet',
}

export enum ViewDirection {
  NORTH = 'north',
  SOUTH = 'south',
  EAST = 'east',
  WEST = 'west',
  GARDEN = 'garden',
  POOL = 'pool',
  CITY = 'city',
  MOUNTAIN = 'mountain',
  SEA = 'sea',
}

export enum ImageCategory {
  ROOM_OVERVIEW = 'room_overview',
  BEDROOM = 'bedroom',
  BATHROOM = 'bathroom',
  BALCONY = 'balcony',
  AMENITIES = 'amenities',
  VIEW = 'view',
}

export interface RoomConfigurationFormProps {
  hotelId: string;
  roomId?: string;
  initialData?: Partial<RoomBasicInfo & { 
    description: string;
    amenities: RoomAmenities;
    images: ProcessedImage[];
    layout: RoomLayout;
  }>;
  propertyAmenities?: string[];
  onSave?: (roomData: any) => Promise<void>; // Make optional for mobile integration
  onDataChange?: (data: any) => void; // For mobile integration
  onValidationChange?: () => void; // For mobile integration
  onValidate?: (validation: RoomContentValidation) => void;
  className?: string;
}

export function RoomConfigurationForm({
  hotelId,
  roomId,
  initialData,
  propertyAmenities = [],
  onSave,
  onDataChange,
  onValidationChange,
  onValidate,
  className = '',
}: RoomConfigurationFormProps) {
  // Form state
  const [basicInfo, setBasicInfo] = useState<RoomBasicInfo>({
    name: initialData?.name || '',
    type: initialData?.type || RoomType.DOUBLE,
    capacity: initialData?.capacity || {
      adults: 2,
      children: 0,
      infants: 0,
      maxOccupancy: 2,
    },
    size: initialData?.size || {
      area: 25,
      unit: 'sqm',
    },
    bedConfiguration: initialData?.bedConfiguration || {
      beds: [{ type: BedType.DOUBLE, count: 1, size: 'Double' }],
      totalBeds: 1,
      sofaBeds: 0,
      cribs: 0,
    },
    floor: initialData?.floor,
    roomNumber: initialData?.roomNumber,
  });

  const [description, setDescription] = useState(initialData?.description || '');
  const [amenities, setAmenities] = useState<RoomAmenities>(
    initialData?.amenities || {
      inherited: propertyAmenities,
      specific: [],
      overrides: [],
    }
  );
  const [images, setImages] = useState<ProcessedImage[]>(initialData?.images || []);
  const [layout, setLayout] = useState<RoomLayout>(
    initialData?.layout || {
      dimensions: { length: 5, width: 4, height: 3, unit: 'meters' },
      features: [],
      view: '',
      naturalLight: 'good',
    }
  );

  // UI state
  const [activeTab, setActiveTab] = useState<'basic' | 'amenities' | 'images' | 'layout'>('basic');
  const [validation, setValidation] = useState<RoomContentValidation>({
    isComplete: false,
    missingElements: [],
    qualityScore: 0,
    recommendations: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Validation effect
  useEffect(() => {
    const newValidation = validateRoomContent();
    setValidation(newValidation);
    onValidate?.(newValidation);
  }, [basicInfo, description, amenities, images, layout]);

  const validateRoomContent = (): RoomContentValidation => {
    const missingElements: string[] = [];
    const recommendations: string[] = [];

    // Basic info validation
    if (!basicInfo.name || basicInfo.name.trim().length < 3) {
      missingElements.push('Room name (minimum 3 characters)');
    }

    if (basicInfo.capacity.maxOccupancy < 1) {
      missingElements.push('Room capacity information');
    }

    if (basicInfo.size.area < 10) {
      missingElements.push('Room size information');
    }

    // Description validation
    if (!description || description.trim().length < 20) {
      missingElements.push('Room description (minimum 20 words)');
    }

    // Image validation
    if (images.length === 0) {
      missingElements.push('Room images (minimum 1 required)');
    } else if (images.length < 3) {
      recommendations.push('Add more room images for better presentation (recommended: 3-5 images)');
    }

    // Amenity validation
    const totalAmenities = amenities.inherited.length + amenities.specific.length;
    if (totalAmenities === 0) {
      missingElements.push('Room amenities');
    } else if (totalAmenities < 3) {
      recommendations.push('Consider adding more amenities to highlight room features');
    }

    // Layout validation
    if (!layout.view) {
      recommendations.push('Add room view description for better guest understanding');
    }

    if (layout.features.length === 0) {
      recommendations.push('Add room features (windows, balcony, etc.) for better description');
    }

    // Calculate quality score
    let qualityScore = 0;
    
    // Image quality (40%)
    if (images.length > 0) {
      const avgImageQuality = images.reduce((sum, img) => sum + img.qualityScore, 0) / images.length;
      const imageCountBonus = Math.min(images.length * 10, 30);
      qualityScore += Math.min(avgImageQuality + imageCountBonus, 100) * 0.4;
    }

    // Description quality (30%)
    if (description) {
      const wordCount = description.trim().split(/\s+/).length;
      if (wordCount >= 20) {
        qualityScore += Math.min(wordCount / 2, 100) * 0.3;
      }
    }

    // Amenity completeness (30%)
    qualityScore += Math.min(totalAmenities * 10, 100) * 0.3;

    const isComplete = missingElements.length === 0 && qualityScore >= 60;

    return {
      isComplete,
      missingElements,
      qualityScore: Math.round(qualityScore),
      recommendations,
    };
  };

  const handleBedConfigurationChange = (beds: BedInfo[]) => {
    const totalBeds = beds.reduce((sum, bed) => sum + bed.count, 0);
    const sofaBeds = beds
      .filter(bed => bed.type === BedType.SOFA_BED)
      .reduce((sum, bed) => sum + bed.count, 0);
    
    setBasicInfo(prev => ({
      ...prev,
      bedConfiguration: {
        ...prev.bedConfiguration,
        beds,
        totalBeds,
        sofaBeds,
      },
    }));
  };

  const handleLayoutFeatureAdd = () => {
    setLayout(prev => ({
      ...prev,
      features: [
        ...prev.features,
        {
          name: '',
          type: FeatureType.WINDOW,
          description: '',
        },
      ],
    }));
  };

  const handleLayoutFeatureUpdate = (index: number, feature: LayoutFeature) => {
    setLayout(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? feature : f),
    }));
  };

  const handleLayoutFeatureRemove = (index: number) => {
    setLayout(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const roomData = {
        basicInfo,
        description,
        amenities,
        images,
        layout,
      };
      
      // Call onSave if provided, otherwise call onDataChange for mobile integration
      if (onSave) {
        await onSave(roomData);
      } else if (onDataChange) {
        onDataChange(roomData);
      }
    } catch (error) {
      console.error('Failed to save room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getViewIcon = (direction: ViewDirection) => {
    switch (direction) {
      case ViewDirection.MOUNTAIN: return <Mountain className="h-4 w-4" />;
      case ViewDirection.SEA: return <Waves className="h-4 w-4" />;
      case ViewDirection.CITY: return <Building className="h-4 w-4" />;
      case ViewDirection.GARDEN: return <Trees className="h-4 w-4" />;
      case ViewDirection.POOL: return <Waves className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getNaturalLightIcon = (level: string) => {
    switch (level) {
      case 'excellent': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'good': return <Sun className="h-4 w-4 text-yellow-400" />;
      case 'moderate': return <Sun className="h-4 w-4 text-yellow-300" />;
      case 'limited': return <Sun className="h-4 w-4 text-gray-400" />;
      default: return <Sun className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with validation status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {roomId ? 'Edit Room' : 'Add New Room'}
          </h2>
          <p className="text-gray-600">
            Configure room details, amenities, and layout
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {validation.isComplete ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-500" />
            )}
            <span className="text-sm font-medium">
              Quality Score: {validation.qualityScore}%
            </span>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !validation.isComplete}
            className="min-w-[100px]"
          >
            {isLoading ? 'Saving...' : 'Save Room'}
          </Button>
        </div>
      </div>

      {/* Validation feedback */}
      {(validation.missingElements.length > 0 || validation.recommendations.length > 0) && (
        <ValidationFeedback
          validation={{
            isValid: validation.isComplete,
            errors: validation.missingElements,
            warnings: validation.recommendations,
          }}
          className="mb-6"
        />
      )}

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'basic', label: 'Basic Info', icon: <Bed className="h-4 w-4" /> },
            { id: 'amenities', label: 'Amenities', icon: <CheckCircle className="h-4 w-4" /> },
            { id: 'images', label: 'Images', icon: <Camera className="h-4 w-4" /> },
            { id: 'layout', label: 'Layout', icon: <Ruler className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'basic' && (
          <div className="space-y-6">
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
                      value={basicInfo.name}
                      onChange={(e) => setBasicInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Deluxe Ocean View"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="roomType">Room Type *</Label>
                    <Select
                      value={basicInfo.type}
                      onValueChange={(value: string) => setBasicInfo(prev => ({ ...prev, type: value as RoomType }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(RoomType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="floor">Floor</Label>
                    <Input
                      id="floor"
                      type="number"
                      value={basicInfo.floor || ''}
                      onChange={(e) => setBasicInfo(prev => ({ 
                        ...prev, 
                        floor: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      placeholder="e.g., 3"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="roomNumber">Room Number</Label>
                    <Input
                      id="roomNumber"
                      value={basicInfo.roomNumber || ''}
                      onChange={(e) => setBasicInfo(prev => ({ ...prev, roomNumber: e.target.value }))}
                      placeholder="e.g., 301"
                      className="mt-1"
                    />
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="adults">Adults *</Label>
                    <Input
                      id="adults"
                      type="number"
                      min="1"
                      max="20"
                      value={basicInfo.capacity.adults}
                      onChange={(e) => setBasicInfo(prev => ({
                        ...prev,
                        capacity: {
                          ...prev.capacity,
                          adults: parseInt(e.target.value) || 1,
                          maxOccupancy: Math.max(
                            parseInt(e.target.value) || 1,
                            prev.capacity.children + prev.capacity.infants
                          ),
                        },
                      }))}
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
                      value={basicInfo.capacity.children}
                      onChange={(e) => setBasicInfo(prev => ({
                        ...prev,
                        capacity: {
                          ...prev.capacity,
                          children: parseInt(e.target.value) || 0,
                          maxOccupancy: Math.max(
                            prev.capacity.adults,
                            prev.capacity.adults + parseInt(e.target.value) + prev.capacity.infants
                          ),
                        },
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="infants">Infants</Label>
                    <Input
                      id="infants"
                      type="number"
                      min="0"
                      max="5"
                      value={basicInfo.capacity.infants}
                      onChange={(e) => setBasicInfo(prev => ({
                        ...prev,
                        capacity: {
                          ...prev.capacity,
                          infants: parseInt(e.target.value) || 0,
                          maxOccupancy: Math.max(
                            prev.capacity.adults,
                            prev.capacity.adults + prev.capacity.children + parseInt(e.target.value)
                          ),
                        },
                      }))}
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
                      value={basicInfo.capacity.maxOccupancy}
                      onChange={(e) => setBasicInfo(prev => ({
                        ...prev,
                        capacity: {
                          ...prev.capacity,
                          maxOccupancy: parseInt(e.target.value) || 1,
                        },
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
                      value={basicInfo.size.area}
                      onChange={(e) => setBasicInfo(prev => ({
                        ...prev,
                        size: {
                          ...prev.size,
                          area: parseFloat(e.target.value) || 25,
                        },
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit *</Label>
                    <Select
                      value={basicInfo.size.unit}
                      onValueChange={(value: string) => setBasicInfo(prev => ({
                        ...prev,
                        size: {
                          ...prev.size,
                          unit: value as 'sqm' | 'sqft',
                        },
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
                    onClick={() => {
                      const newBeds = [...basicInfo.bedConfiguration.beds, { type: BedType.DOUBLE, count: 1, size: 'Double' }];
                      handleBedConfigurationChange(newBeds);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Bed
                  </Button>
                </CardTitle>
                <CardDescription>
                  Configure the bed types and arrangements in this room
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {basicInfo.bedConfiguration.beds.map((bed, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`bedType-${index}`}>Bed Type</Label>
                          <Select
                            value={bed.type}
                            onValueChange={(value: string) => {
                              const newBeds = [...basicInfo.bedConfiguration.beds];
                              newBeds[index] = { ...bed, type: value as BedType };
                              handleBedConfigurationChange(newBeds);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(BedType).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.replace('_', ' ')}
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
                            onChange={(e) => {
                              const newBeds = [...basicInfo.bedConfiguration.beds];
                              newBeds[index] = { ...bed, count: parseInt(e.target.value) || 1 };
                              handleBedConfigurationChange(newBeds);
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newBeds = basicInfo.bedConfiguration.beds.filter((_, i) => i !== index);
                              handleBedConfigurationChange(newBeds);
                            }}
                            disabled={basicInfo.bedConfiguration.beds.length === 1}
                          >
                            <Minus className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Bed Configuration Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Configuration Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Beds:</span>
                        <span className="ml-2 font-medium">{basicInfo.bedConfiguration.totalBeds}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Sofa Beds:</span>
                        <span className="ml-2 font-medium">{basicInfo.bedConfiguration.sofaBeds}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Cribs Available:</span>
                        <Input
                          type="number"
                          min="0"
                          max="5"
                          value={basicInfo.bedConfiguration.cribs}
                          onChange={(e) => setBasicInfo(prev => ({
                            ...prev,
                            bedConfiguration: {
                              ...prev.bedConfiguration,
                              cribs: parseInt(e.target.value) || 0,
                            },
                          }))}
                          className="w-16 h-8 text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room Description */}
            <Card>
              <CardHeader>
                <CardTitle>Room Description</CardTitle>
                <CardDescription>
                  Provide a detailed description of the room (minimum 20 words)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the room's unique features, ambiance, and what makes it special for guests..."
                  rows={4}
                  className="resize-none"
                />
                <div className="mt-2 text-sm text-gray-500">
                  {description.trim().split(/\s+/).filter(word => word.length > 0).length} words
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'amenities' && (
          <Card>
            <CardHeader>
              <CardTitle>Room Amenities</CardTitle>
              <CardDescription>
                Select room-specific amenities. Property-wide amenities are automatically inherited.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Inherited amenities display */}
              {amenities.inherited.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Inherited from Property ({amenities.inherited.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {amenities.inherited.map((amenityId) => (
                      <Badge key={amenityId} variant="secondary" className="text-xs">
                        {amenityId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Room-specific amenity selection */}
              <AmenitySelection
                propertyType={PropertyType.HOTEL} // This would come from props
                selectedAmenities={amenities.specific}
                onSelectionChange={(selected) => setAmenities(prev => ({
                  ...prev,
                  specific: selected,
                }))}
                onValidationChange={(validationResult) => {
                  // Handle validation changes if needed
                }}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'images' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Room Images</span>
              </CardTitle>
              <CardDescription>
                Upload high-quality images showcasing different aspects of the room
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                category={ImageUploadCategory.ROOMS}
                maxFiles={10}
                maxFileSize={5 * 1024 * 1024} // 5MB
                onUploadComplete={(uploadedImages) => {
                  // Convert UploadedImage to ProcessedImage format
                  const processedImages = uploadedImages.map(img => ({
                    id: img.id,
                    originalUrl: img.url,
                    optimizedUrls: {
                      large: img.url,
                      medium: img.url,
                      small: img.url
                    },
                    thumbnails: {
                      small: img.url,
                      medium: img.url
                    },
                    category: ImageCategory.ROOM_OVERVIEW,
                    qualityScore: img.qualityScore,
                    uploadedAt: img.uploadedAt
                  }));
                  setImages(prev => [...prev, ...processedImages]);
                }}
                onUploadProgress={(progress) => {
                  // Handle upload progress
                }}
                className="mb-6"
              />

              {/* Image gallery */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.optimizedUrls.medium || image.originalUrl}
                        alt={`Room image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setImages(prev => prev.filter(img => img.id !== image.id))}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(image.qualityScore)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-6">
            {/* Room Dimensions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Ruler className="h-5 w-5" />
                  <span>Room Dimensions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="length">Length</Label>
                    <Input
                      id="length"
                      type="number"
                      min="1"
                      step="0.1"
                      value={layout.dimensions.length}
                      onChange={(e) => setLayout(prev => ({
                        ...prev,
                        dimensions: {
                          ...prev.dimensions,
                          length: parseFloat(e.target.value) || 5,
                        },
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="width">Width</Label>
                    <Input
                      id="width"
                      type="number"
                      min="1"
                      step="0.1"
                      value={layout.dimensions.width}
                      onChange={(e) => setLayout(prev => ({
                        ...prev,
                        dimensions: {
                          ...prev.dimensions,
                          width: parseFloat(e.target.value) || 4,
                        },
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      type="number"
                      min="2"
                      step="0.1"
                      value={layout.dimensions.height}
                      onChange={(e) => setLayout(prev => ({
                        ...prev,
                        dimensions: {
                          ...prev.dimensions,
                          height: parseFloat(e.target.value) || 3,
                        },
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dimensionUnit">Unit</Label>
                    <Select
                      value={layout.dimensions.unit}
                      onValueChange={(value: string) => setLayout(prev => ({
                        ...prev,
                        dimensions: {
                          ...prev.dimensions,
                          unit: value as 'meters' | 'feet',
                        },
                      }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meters">Meters</SelectItem>
                        <SelectItem value="feet">Feet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room View and Natural Light */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>View & Lighting</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="view">Room View</Label>
                  <Textarea
                    id="view"
                    value={layout.view}
                    onChange={(e) => setLayout(prev => ({ ...prev, view: e.target.value }))}
                    placeholder="Describe what guests can see from this room..."
                    rows={2}
                    className="mt-1 resize-none"
                  />
                </div>
                <div>
                  <Label htmlFor="naturalLight">Natural Light</Label>
                  <Select
                    value={layout.naturalLight}
                    onValueChange={(value: string) => setLayout(prev => ({
                      ...prev,
                      naturalLight: value as 'excellent' | 'good' | 'moderate' | 'limited',
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">
                        <div className="flex items-center space-x-2">
                          {getNaturalLightIcon('excellent')}
                          <span>Excellent</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="good">
                        <div className="flex items-center space-x-2">
                          {getNaturalLightIcon('good')}
                          <span>Good</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="moderate">
                        <div className="flex items-center space-x-2">
                          {getNaturalLightIcon('moderate')}
                          <span>Moderate</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="limited">
                        <div className="flex items-center space-x-2">
                          {getNaturalLightIcon('limited')}
                          <span>Limited</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Room Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Room Features</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLayoutFeatureAdd}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Feature
                  </Button>
                </CardTitle>
                <CardDescription>
                  Add specific features like windows, balcony, work desk, etc.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {layout.features.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No features added yet</p>
                    <p className="text-sm">Click "Add Feature" to start describing room features</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {layout.features.map((feature, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`feature-name-${index}`}>Feature Name</Label>
                            <Input
                              id={`feature-name-${index}`}
                              value={feature.name}
                              onChange={(e) => handleLayoutFeatureUpdate(index, {
                                ...feature,
                                name: e.target.value,
                              })}
                              placeholder="e.g., Large Window"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`feature-type-${index}`}>Type</Label>
                            <Select
                              value={feature.type}
                              onValueChange={(value: string) => handleLayoutFeatureUpdate(index, {
                                ...feature,
                                type: value as FeatureType,
                              })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(FeatureType).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`feature-facing-${index}`}>Facing</Label>
                            <Select
                              value={feature.facing || ''}
                              onValueChange={(value: string) => handleLayoutFeatureUpdate(index, {
                                ...feature,
                                facing: value as ViewDirection,
                              })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select direction" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(ViewDirection).map((direction) => (
                                  <SelectItem key={direction} value={direction}>
                                    <div className="flex items-center space-x-2">
                                      {getViewIcon(direction)}
                                      <span>{direction.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label htmlFor={`feature-description-${index}`}>Description</Label>
                          <Textarea
                            id={`feature-description-${index}`}
                            value={feature.description || ''}
                            onChange={(e) => handleLayoutFeatureUpdate(index, {
                              ...feature,
                              description: e.target.value,
                            })}
                            placeholder="Describe this feature in detail..."
                            rows={2}
                            className="mt-1 resize-none"
                          />
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleLayoutFeatureRemove(index)}
                          >
                            <Minus className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}