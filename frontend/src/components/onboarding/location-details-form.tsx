import React, { useState, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  MapPin, 
  Plane, 
  Train, 
  Car, 
  Accessibility, 
  Star, 
  Volume2, 
  Plus, 
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export interface Attraction {
  name: string;
  type: string;
  distance: number;
  description?: string;
}

export interface TransportationOptions {
  nearestAirport?: {
    name: string;
    distance: number;
    code: string;
  };
  nearestRailway?: {
    name: string;
    distance: number;
  };
  publicTransport: string[];
  parkingAvailable: boolean;
  parkingType?: 'free' | 'paid' | 'valet';
}

export interface AccessibilityFeatures {
  wheelchairAccessible: boolean;
  elevatorAccess: boolean;
  brailleSignage: boolean;
  hearingAssistance: boolean;
  visualAssistance: boolean;
  accessibleRooms: number;
  accessibleBathrooms: boolean;
}

export interface NeighborhoodInfo {
  type: string;
  safetyRating: number;
  noiseLevel: 'quiet' | 'moderate' | 'busy';
  walkability: number;
}

export interface LocationDetails {
  nearbyAttractions: Attraction[];
  transportation: TransportationOptions;
  accessibility: AccessibilityFeatures;
  neighborhood: NeighborhoodInfo;
}

export interface LocationDetailsFormProps {
  initialData?: Partial<LocationDetails>;
  onSave: (locationDetails: LocationDetails) => Promise<void>;
  onValidate?: (data: LocationDetails) => { isValid: boolean; errors: string[]; warnings: string[] };
  className?: string;
}

export const LocationDetailsForm: React.FC<LocationDetailsFormProps> = ({
  initialData,
  onSave,
  onValidate,
  className = '',
}) => {
  const [attractions, setAttractions] = useState<Attraction[]>(initialData?.nearbyAttractions || []);
  const [transportation, setTransportation] = useState<TransportationOptions>(
    initialData?.transportation || {
      publicTransport: [],
      parkingAvailable: false,
    }
  );
  const [accessibility, setAccessibility] = useState<AccessibilityFeatures>(
    initialData?.accessibility || {
      wheelchairAccessible: false,
      elevatorAccess: false,
      brailleSignage: false,
      hearingAssistance: false,
      visualAssistance: false,
      accessibleRooms: 0,
      accessibleBathrooms: false,
    }
  );
  const [neighborhood, setNeighborhood] = useState<NeighborhoodInfo>(
    initialData?.neighborhood || {
      type: 'mixed',
      safetyRating: 3,
      noiseLevel: 'moderate',
      walkability: 3,
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[]; warnings: string[] } | null>(null);
  const [newTransportOption, setNewTransportOption] = useState('');

  const handleAddAttraction = useCallback(() => {
    setAttractions([...attractions, { name: '', type: '', distance: 0, description: '' }]);
  }, [attractions]);

  const handleRemoveAttraction = useCallback((index: number) => {
    setAttractions(attractions.filter((_, i) => i !== index));
  }, [attractions]);

  const handleAttractionChange = useCallback((index: number, field: keyof Attraction, value: string | number) => {
    const updated = [...attractions];
    updated[index] = { ...updated[index], [field]: value };
    setAttractions(updated);
  }, [attractions]);

  const handleAddTransportOption = useCallback(() => {
    if (newTransportOption.trim() && !transportation.publicTransport.includes(newTransportOption.trim())) {
      setTransportation({
        ...transportation,
        publicTransport: [...transportation.publicTransport, newTransportOption.trim()]
      });
      setNewTransportOption('');
    }
  }, [transportation, newTransportOption]);

  const handleRemoveTransportOption = useCallback((option: string) => {
    setTransportation({
      ...transportation,
      publicTransport: transportation.publicTransport.filter(t => t !== option)
    });
  }, [transportation]);

  const handleValidation = useCallback(() => {
    const locationData: LocationDetails = {
      nearbyAttractions: attractions,
      transportation,
      accessibility,
      neighborhood,
    };

    if (onValidate) {
      const validationResult = onValidate(locationData);
      setValidation(validationResult);
      return validationResult.isValid;
    }
    return true;
  }, [attractions, transportation, accessibility, neighborhood, onValidate]);

  const handleSave = async () => {
    if (!handleValidation()) return;

    setIsLoading(true);
    try {
      const locationData: LocationDetails = {
        nearbyAttractions: attractions.filter(a => a.name.trim() !== ''),
        transportation,
        accessibility,
        neighborhood,
      };

      await onSave(locationData);
    } catch (error) {
      console.error('Failed to save location details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const attractionTypes = [
    'Tourist Attraction',
    'Museum',
    'Restaurant',
    'Shopping Center',
    'Park',
    'Beach',
    'Historical Site',
    'Entertainment',
    'Sports Venue',
    'Religious Site',
    'Other'
  ];

  const neighborhoodTypes = [
    'Business District',
    'Residential',
    'Tourist Area',
    'Shopping District',
    'Historic Quarter',
    'Entertainment District',
    'Mixed Use',
    'Waterfront',
    'Suburban',
    'City Center'
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Validation Messages */}
      {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
        <Card className="border-l-4 border-l-red-500">
          <div className="p-4">
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
                  <CheckCircle className="h-4 w-4" />
                  Suggestions
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-amber-600">
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Nearby Attractions */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Nearby Attractions</h3>
          </div>
          
          <div className="space-y-4">
            {attractions.map((attraction, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div>
                  <Label htmlFor={`attraction-name-${index}`}>Attraction Name</Label>
                  <Input
                    id={`attraction-name-${index}`}
                    value={attraction.name}
                    onChange={(e) => handleAttractionChange(index, 'name', e.target.value)}
                    placeholder="e.g., Central Park"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`attraction-type-${index}`}>Type</Label>
                  <Select
                    value={attraction.type}
                    onValueChange={(value: string) => handleAttractionChange(index, 'type', value)}
                  >
                    <option value="">Select type</option>
                    {attractionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor={`attraction-distance-${index}`}>Distance (km)</Label>
                  <Input
                    id={`attraction-distance-${index}`}
                    type="number"
                    min="0"
                    step="0.1"
                    value={attraction.distance}
                    onChange={(e) => handleAttractionChange(index, 'distance', parseFloat(e.target.value) || 0)}
                    placeholder="0.5"
                  />
                </div>
                
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveAttraction(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="md:col-span-4">
                  <Label htmlFor={`attraction-description-${index}`}>Description (Optional)</Label>
                  <Textarea
                    id={`attraction-description-${index}`}
                    value={attraction.description || ''}
                    onChange={(e) => handleAttractionChange(index, 'description', e.target.value)}
                    placeholder="Brief description of the attraction..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddAttraction}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Attraction
            </Button>
          </div>
        </div>
      </Card>

      {/* Transportation */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Car className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Transportation</h3>
          </div>
          
          <div className="space-y-6">
            {/* Airport */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 mb-2 md:col-span-3">
                <Plane className="h-4 w-4 text-blue-600" />
                <Label className="font-medium">Nearest Airport</Label>
              </div>
              
              <div>
                <Label htmlFor="airport-name">Airport Name</Label>
                <Input
                  id="airport-name"
                  value={transportation.nearestAirport?.name || ''}
                  onChange={(e) => setTransportation({
                    ...transportation,
                    nearestAirport: {
                      ...transportation.nearestAirport,
                      name: e.target.value,
                      distance: transportation.nearestAirport?.distance || 0,
                      code: transportation.nearestAirport?.code || '',
                    }
                  })}
                  placeholder="e.g., John F. Kennedy International"
                />
              </div>
              
              <div>
                <Label htmlFor="airport-code">Airport Code</Label>
                <Input
                  id="airport-code"
                  value={transportation.nearestAirport?.code || ''}
                  onChange={(e) => setTransportation({
                    ...transportation,
                    nearestAirport: {
                      ...transportation.nearestAirport,
                      name: transportation.nearestAirport?.name || '',
                      distance: transportation.nearestAirport?.distance || 0,
                      code: e.target.value.toUpperCase(),
                    }
                  })}
                  placeholder="e.g., JFK"
                  maxLength={3}
                />
              </div>
              
              <div>
                <Label htmlFor="airport-distance">Distance (km)</Label>
                <Input
                  id="airport-distance"
                  type="number"
                  min="0"
                  step="0.1"
                  value={transportation.nearestAirport?.distance || ''}
                  onChange={(e) => setTransportation({
                    ...transportation,
                    nearestAirport: {
                      ...transportation.nearestAirport,
                      name: transportation.nearestAirport?.name || '',
                      code: transportation.nearestAirport?.code || '',
                      distance: parseFloat(e.target.value) || 0,
                    }
                  })}
                  placeholder="25.5"
                />
              </div>
            </div>

            {/* Railway */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 mb-2 md:col-span-2">
                <Train className="h-4 w-4 text-purple-600" />
                <Label className="font-medium">Nearest Railway Station</Label>
              </div>
              
              <div>
                <Label htmlFor="railway-name">Station Name</Label>
                <Input
                  id="railway-name"
                  value={transportation.nearestRailway?.name || ''}
                  onChange={(e) => setTransportation({
                    ...transportation,
                    nearestRailway: {
                      ...transportation.nearestRailway,
                      name: e.target.value,
                      distance: transportation.nearestRailway?.distance || 0,
                    }
                  })}
                  placeholder="e.g., Central Station"
                />
              </div>
              
              <div>
                <Label htmlFor="railway-distance">Distance (km)</Label>
                <Input
                  id="railway-distance"
                  type="number"
                  min="0"
                  step="0.1"
                  value={transportation.nearestRailway?.distance || ''}
                  onChange={(e) => setTransportation({
                    ...transportation,
                    nearestRailway: {
                      ...transportation.nearestRailway,
                      name: transportation.nearestRailway?.name || '',
                      distance: parseFloat(e.target.value) || 0,
                    }
                  })}
                  placeholder="2.5"
                />
              </div>
            </div>

            {/* Public Transport */}
            <div>
              <Label className="font-medium mb-2 block">Public Transportation Options</Label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newTransportOption}
                  onChange={(e) => setNewTransportOption(e.target.value)}
                  placeholder="e.g., Bus Route 42, Metro Line A"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTransportOption()}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTransportOption}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {transportation.publicTransport.map((option, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {option}
                    <button
                      type="button"
                      onClick={() => handleRemoveTransportOption(option)}
                      className="ml-1 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Parking */}
            <div className="space-y-3">
              <Label className="font-medium">Parking</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="parking-available"
                  checked={transportation.parkingAvailable}
                  onChange={(e) => setTransportation({
                    ...transportation,
                    parkingAvailable: e.target.checked,
                    parkingType: e.target.checked ? transportation.parkingType : undefined,
                  })}
                />
                <Label htmlFor="parking-available">Parking Available</Label>
              </div>
              
              {transportation.parkingAvailable && (
                <div>
                  <Label htmlFor="parking-type">Parking Type</Label>
                  <Select
                    value={transportation.parkingType || ''}
                    onValueChange={(value: 'free' | 'paid' | 'valet') => setTransportation({
                      ...transportation,
                      parkingType: value,
                    })}
                  >
                    <option value="">Select parking type</option>
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                    <option value="valet">Valet</option>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Accessibility Features */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Accessibility className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold">Accessibility Features</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="wheelchair-accessible"
                  checked={accessibility.wheelchairAccessible}
                  onChange={(e) => setAccessibility({
                    ...accessibility,
                    wheelchairAccessible: e.target.checked,
                  })}
                />
                <Label htmlFor="wheelchair-accessible">Wheelchair Accessible</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="elevator-access"
                  checked={accessibility.elevatorAccess}
                  onChange={(e) => setAccessibility({
                    ...accessibility,
                    elevatorAccess: e.target.checked,
                  })}
                />
                <Label htmlFor="elevator-access">Elevator Access</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="braille-signage"
                  checked={accessibility.brailleSignage}
                  onChange={(e) => setAccessibility({
                    ...accessibility,
                    brailleSignage: e.target.checked,
                  })}
                />
                <Label htmlFor="braille-signage">Braille Signage</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hearing-assistance"
                  checked={accessibility.hearingAssistance}
                  onChange={(e) => setAccessibility({
                    ...accessibility,
                    hearingAssistance: e.target.checked,
                  })}
                />
                <Label htmlFor="hearing-assistance">Hearing Assistance</Label>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="visual-assistance"
                  checked={accessibility.visualAssistance}
                  onChange={(e) => setAccessibility({
                    ...accessibility,
                    visualAssistance: e.target.checked,
                  })}
                />
                <Label htmlFor="visual-assistance">Visual Assistance</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="accessible-bathrooms"
                  checked={accessibility.accessibleBathrooms}
                  onChange={(e) => setAccessibility({
                    ...accessibility,
                    accessibleBathrooms: e.target.checked,
                  })}
                />
                <Label htmlFor="accessible-bathrooms">Accessible Bathrooms</Label>
              </div>
              
              <div>
                <Label htmlFor="accessible-rooms">Number of Accessible Rooms</Label>
                <Input
                  id="accessible-rooms"
                  type="number"
                  min="0"
                  value={accessibility.accessibleRooms}
                  onChange={(e) => setAccessibility({
                    ...accessibility,
                    accessibleRooms: parseInt(e.target.value) || 0,
                  })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Neighborhood Information */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Star className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold">Neighborhood Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="neighborhood-type">Neighborhood Type</Label>
              <Select
                value={neighborhood.type}
                onValueChange={(value: string) => setNeighborhood({
                  ...neighborhood,
                  type: value,
                })}
              >
                {neighborhoodTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </div>
            
            <div>
              <Label htmlFor="noise-level">Noise Level</Label>
              <Select
                value={neighborhood.noiseLevel}
                onValueChange={(value: 'quiet' | 'moderate' | 'busy') => setNeighborhood({
                  ...neighborhood,
                  noiseLevel: value,
                })}
              >
                <option value="quiet">Quiet</option>
                <option value="moderate">Moderate</option>
                <option value="busy">Busy</option>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="safety-rating">Safety Rating (1-5)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="safety-rating"
                  type="number"
                  min="1"
                  max="5"
                  value={neighborhood.safetyRating}
                  onChange={(e) => setNeighborhood({
                    ...neighborhood,
                    safetyRating: parseInt(e.target.value) || 3,
                  })}
                />
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= neighborhood.safetyRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="walkability">Walkability Score (1-5)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="walkability"
                  type="number"
                  min="1"
                  max="5"
                  value={neighborhood.walkability}
                  onChange={(e) => setNeighborhood({
                    ...neighborhood,
                    walkability: parseInt(e.target.value) || 3,
                  })}
                />
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= neighborhood.walkability
                          ? 'text-green-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isLoading || (validation !== null && !validation.isValid)}
          className="px-8"
        >
          {isLoading ? 'Saving...' : 'Save Location Details'}
        </Button>
      </div>
    </div>
  );
};