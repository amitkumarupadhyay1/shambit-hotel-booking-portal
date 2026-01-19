'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Wifi, 
  Car, 
  Coffee, 
  Dumbbell, 
  Utensils, 
  Leaf, 
  Gamepad2, 
  Monitor,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

// Types based on backend interfaces
export interface Amenity {
  id: string;
  name: string;
  description: string;
  icon: string;
  isEcoFriendly: boolean;
  category: AmenityCategory;
  applicablePropertyTypes: PropertyType[];
  businessRules: AmenityRule[];
}

export enum AmenityCategory {
  PROPERTY_WIDE = 'PROPERTY_WIDE',
  ROOM_SPECIFIC = 'ROOM_SPECIFIC',
  BUSINESS = 'BUSINESS',
  WELLNESS = 'WELLNESS',
  DINING = 'DINING',
  SUSTAINABILITY = 'SUSTAINABILITY',
  RECREATIONAL = 'RECREATIONAL',
  CONNECTIVITY = 'CONNECTIVITY',
}

export enum PropertyType {
  HOTEL = 'HOTEL',
  RESORT = 'RESORT',
  GUEST_HOUSE = 'GUEST_HOUSE',
  HOMESTAY = 'HOMESTAY',
  APARTMENT = 'APARTMENT',
  BOUTIQUE_HOTEL = 'BOUTIQUE_HOTEL',
  BUSINESS_HOTEL = 'BUSINESS_HOTEL',
  LUXURY_HOTEL = 'LUXURY_HOTEL',
}

export interface AmenityRule {
  type: 'requires' | 'excludes' | 'implies';
  amenityId: string;
  condition?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AmenitySelectionProps {
  categories?: any; // Optional categories for enhanced display
  propertyType: PropertyType;
  selectedAmenities: string[];
  onSelectionChange: (amenities: string[]) => void;
  onValidationChange?: (validation: ValidationResult) => void;
  validationRules?: any; // Optional validation rules
  className?: string;
}

// Icon mapping for amenities
const getAmenityIcon = (iconName: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    wifi: Wifi,
    parking: Car,
    coffee: Coffee,
    gym: Dumbbell,
    restaurant: Utensils,
    eco: Leaf,
    games: Gamepad2,
    business: Monitor,
    // Add more icons as needed
  };
  
  const IconComponent = iconMap[iconName] || Monitor;
  return <IconComponent className="h-5 w-5" />;
};

// Category display configuration
const categoryConfig = {
  [AmenityCategory.PROPERTY_WIDE]: {
    title: 'Property-Wide Amenities',
    description: 'Features available throughout the property',
    icon: <Monitor className="h-5 w-5" />,
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  [AmenityCategory.ROOM_SPECIFIC]: {
    title: 'Room Amenities',
    description: 'Features available in guest rooms',
    icon: <Monitor className="h-5 w-5" />,
    color: 'bg-green-50 border-green-200 text-green-800',
  },
  [AmenityCategory.BUSINESS]: {
    title: 'Business Facilities',
    description: 'Professional and business-oriented amenities',
    icon: <Monitor className="h-5 w-5" />,
    color: 'bg-purple-50 border-purple-200 text-purple-800',
  },
  [AmenityCategory.WELLNESS]: {
    title: 'Wellness & Recreation',
    description: 'Health, fitness, and relaxation facilities',
    icon: <Dumbbell className="h-5 w-5" />,
    color: 'bg-pink-50 border-pink-200 text-pink-800',
  },
  [AmenityCategory.DINING]: {
    title: 'Dining & Food Services',
    description: 'Restaurant, bar, and food-related amenities',
    icon: <Utensils className="h-5 w-5" />,
    color: 'bg-orange-50 border-orange-200 text-orange-800',
  },
  [AmenityCategory.SUSTAINABILITY]: {
    title: 'Sustainability Features',
    description: 'Eco-friendly and sustainable practices',
    icon: <Leaf className="h-5 w-5" />,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  },
  [AmenityCategory.RECREATIONAL]: {
    title: 'Recreation & Entertainment',
    description: 'Fun activities and entertainment options',
    icon: <Gamepad2 className="h-5 w-5" />,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  },
  [AmenityCategory.CONNECTIVITY]: {
    title: 'Connectivity & Technology',
    description: 'Internet, technology, and communication services',
    icon: <Wifi className="h-5 w-5" />,
    color: 'bg-cyan-50 border-cyan-200 text-cyan-800',
  },
};

export function AmenitySelection({
  propertyType,
  selectedAmenities,
  onSelectionChange,
  onValidationChange,
  className,
}: AmenitySelectionProps) {
  const [amenitiesByCategory, setAmenitiesByCategory] = useState<{ [category: string]: Amenity[] }>({});
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [], warnings: [] });
  const [loading, setLoading] = useState(true);

  // Load amenities on component mount
  useEffect(() => {
    loadAmenities();
  }, []);

  // Validate selection when amenities or selection changes
  useEffect(() => {
    if (Object.keys(amenitiesByCategory).length > 0) {
      validateSelection();
    }
  }, [selectedAmenities, amenitiesByCategory, propertyType]);

  const loadAmenities = async () => {
    try {
      setLoading(true);
      // This would be replaced with actual API call
      // const response = await apiClient.get('/hotels/amenities/details');
      // setAmenitiesByCategory(response.data);
      
      // Mock data for now - this will be replaced with actual API call
      const mockAmenities = getMockAmenities();
      setAmenitiesByCategory(mockAmenities);
    } catch (error) {
      console.error('Failed to load amenities:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateSelection = async () => {
    try {
      // This would be replaced with actual API call
      // const response = await apiClient.post('/hotels/amenities/validate', {
      //   amenityIds: selectedAmenities,
      //   propertyType,
      // });
      // const validationResult = response.data;
      
      // Mock validation for now
      const validationResult = mockValidateSelection(selectedAmenities, propertyType, amenitiesByCategory);
      
      setValidation(validationResult);
      onValidationChange?.(validationResult);
    } catch (error) {
      console.error('Failed to validate amenities:', error);
    }
  };

  const handleAmenityToggle = (amenityId: string) => {
    const newSelection = selectedAmenities.includes(amenityId)
      ? selectedAmenities.filter(id => id !== amenityId)
      : [...selectedAmenities, amenityId];
    
    onSelectionChange(newSelection);
  };

  const isAmenitySelected = (amenityId: string) => selectedAmenities.includes(amenityId);

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Validation Messages */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            {validation.errors.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Validation Errors
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-amber-600 font-medium mb-2">
                  <Info className="h-4 w-4" />
                  Recommendations
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-amber-600">
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Amenity Categories */}
      {Object.entries(categoryConfig).map(([category, config]) => {
        const amenities = amenitiesByCategory[category.toLowerCase()] || [];
        
        if (amenities.length === 0) return null;

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', config.color)}>
                  {config.icon}
                </div>
                <div>
                  <div className="text-lg font-semibold">{config.title}</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    {config.description}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {amenities.map((amenity) => (
                  <AmenityCard
                    key={amenity.id}
                    amenity={amenity}
                    isSelected={isAmenitySelected(amenity.id)}
                    onToggle={() => handleAmenityToggle(amenity.id)}
                    propertyType={propertyType}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Selection Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Selection Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedAmenities.length === 0 ? (
              <p className="text-muted-foreground">No amenities selected</p>
            ) : (
              selectedAmenities.map((amenityId) => {
                const amenity = Object.values(amenitiesByCategory)
                  .flat()
                  .find(a => a.id === amenityId);
                
                if (!amenity) return null;

                return (
                  <Badge
                    key={amenityId}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {getAmenityIcon(amenity.icon)}
                    {amenity.name}
                    {amenity.isEcoFriendly && (
                      <Leaf className="h-3 w-3 text-green-600" />
                    )}
                  </Badge>
                );
              })
            )}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            {selectedAmenities.length} amenities selected
            {validation.isValid ? (
              <span className="text-green-600 ml-2">✓ Valid selection</span>
            ) : (
              <span className="text-red-600 ml-2">⚠ Please fix validation errors</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Individual amenity card component
interface AmenityCardProps {
  amenity: Amenity;
  isSelected: boolean;
  onToggle: () => void;
  propertyType: PropertyType;
}

function AmenityCard({ amenity, isSelected, onToggle, propertyType }: AmenityCardProps) {
  const isApplicable = amenity.applicablePropertyTypes.length === 0 || 
                      amenity.applicablePropertyTypes.includes(propertyType);

  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      className={cn(
        "h-auto p-4 flex flex-col items-start gap-2 text-left transition-all",
        !isApplicable && "opacity-50 cursor-not-allowed",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={onToggle}
      disabled={!isApplicable}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          {getAmenityIcon(amenity.icon)}
          <span className="font-medium">{amenity.name}</span>
        </div>
        <div className="flex items-center gap-1">
          {amenity.isEcoFriendly && (
            <Leaf className="h-4 w-4 text-green-600" />
          )}
          {isSelected && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
        </div>
      </div>
      {amenity.description && (
        <p className="text-xs text-muted-foreground text-left">
          {amenity.description}
        </p>
      )}
      {!isApplicable && (
        <p className="text-xs text-red-500">
          Not applicable to {propertyType.toLowerCase().replace('_', ' ')} properties
        </p>
      )}
    </Button>
  );
}

// Mock data and validation functions (to be replaced with actual API calls)
function getMockAmenities(): { [category: string]: Amenity[] } {
  return {
    property_wide: [
      {
        id: '1',
        name: 'Free WiFi',
        description: 'Complimentary wireless internet access throughout the property',
        icon: 'wifi',
        isEcoFriendly: false,
        category: AmenityCategory.PROPERTY_WIDE,
        applicablePropertyTypes: Object.values(PropertyType),
        businessRules: [],
      },
      {
        id: '2',
        name: 'Parking',
        description: 'On-site parking facilities for guests',
        icon: 'parking',
        isEcoFriendly: false,
        category: AmenityCategory.PROPERTY_WIDE,
        applicablePropertyTypes: Object.values(PropertyType),
        businessRules: [],
      },
    ],
    sustainability: [
      {
        id: '3',
        name: 'Solar Power',
        description: 'Renewable energy from solar panels',
        icon: 'eco',
        isEcoFriendly: true,
        category: AmenityCategory.SUSTAINABILITY,
        applicablePropertyTypes: Object.values(PropertyType),
        businessRules: [],
      },
      {
        id: '4',
        name: 'Recycling Program',
        description: 'Comprehensive waste recycling and reduction program',
        icon: 'eco',
        isEcoFriendly: true,
        category: AmenityCategory.SUSTAINABILITY,
        applicablePropertyTypes: Object.values(PropertyType),
        businessRules: [],
      },
    ],
    business: [
      {
        id: '5',
        name: 'Business Center',
        description: 'Dedicated business facilities with computers and printing services',
        icon: 'business',
        isEcoFriendly: false,
        category: AmenityCategory.BUSINESS,
        applicablePropertyTypes: [PropertyType.BUSINESS_HOTEL, PropertyType.HOTEL, PropertyType.LUXURY_HOTEL],
        businessRules: [],
      },
    ],
  };
}

function mockValidateSelection(
  selectedIds: string[],
  propertyType: PropertyType,
  amenitiesByCategory: { [category: string]: Amenity[] }
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (selectedIds.length === 0) {
    result.warnings.push('No amenities selected');
    return result;
  }

  // Check property type compatibility
  const allAmenities = Object.values(amenitiesByCategory).flat();
  for (const amenityId of selectedIds) {
    const amenity = allAmenities.find(a => a.id === amenityId);
    if (amenity && amenity.applicablePropertyTypes.length > 0 && 
        !amenity.applicablePropertyTypes.includes(propertyType)) {
      result.errors.push(`${amenity.name} is not applicable to ${propertyType} properties`);
      result.isValid = false;
    }
  }

  return result;
}