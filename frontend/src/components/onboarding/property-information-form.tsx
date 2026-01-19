import React, { useState, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  FileText, 
  MapPin, 
  Shield, 
  Eye, 
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  Star,
  Plane,
  Car,
  Accessibility
} from 'lucide-react';
import { PropertyDescriptionEditor, RichTextContent } from './property-description-editor';
import { LocationDetailsForm, LocationDetails } from './location-details-form';
import { PolicyManagementForm, HotelPolicies } from './policy-management-form';

export interface PropertyInformation {
  propertyDescription: RichTextContent | null;
  locationDetails: LocationDetails | null;
  policies: HotelPolicies | null;
}

export interface PropertyInformationFormProps {
  hotelId?: string; // Make optional for mobile integration
  initialData?: Partial<PropertyInformation>;
  onSave?: (data: PropertyInformation) => Promise<void>;
  onDataChange?: (data: any) => void; // For mobile integration
  onValidationChange?: () => void; // For mobile integration
  className?: string;
}

export interface CustomerDisplayData {
  description: string;
  location: {
    attractions: string[];
    transportation: string[];
    accessibility: string[];
  };
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation: string;
    important: string[];
  };
}

export const PropertyInformationForm: React.FC<PropertyInformationFormProps> = ({
  hotelId,
  initialData,
  onSave,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'description' | 'location' | 'policies' | 'preview'>('description');
  const [propertyDescription, setPropertyDescription] = useState<RichTextContent | null>(
    initialData?.propertyDescription || null
  );
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(
    initialData?.locationDetails || null
  );
  const [policies, setPolicies] = useState<HotelPolicies | null>(
    initialData?.policies || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<{
    description: { isValid: boolean; errors: string[]; warnings: string[] } | null;
    location: { isValid: boolean; errors: string[]; warnings: string[] } | null;
    policies: { isValid: boolean; errors: string[]; warnings: string[] } | null;
  }>({
    description: null,
    location: null,
    policies: null,
  });

  const handleDescriptionSave = useCallback(async (content: RichTextContent) => {
    try {
      const response = await fetch(`/api/hotels/${hotelId}/property-information/description`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.content,
          format: content.format,
        }),
      });

      if (!response.ok) throw new Error('Failed to save description');
      
      const savedContent = await response.json();
      setPropertyDescription(savedContent);
    } catch (error) {
      console.error('Failed to save property description:', error);
      throw error;
    }
  }, [hotelId]);

  const handleLocationSave = useCallback(async (location: LocationDetails) => {
    try {
      const response = await fetch(`/api/hotels/${hotelId}/property-information/location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(location),
      });

      if (!response.ok) throw new Error('Failed to save location details');
      
      const savedLocation = await response.json();
      setLocationDetails(savedLocation);
    } catch (error) {
      console.error('Failed to save location details:', error);
      throw error;
    }
  }, [hotelId]);

  const handlePoliciesSave = useCallback(async (policiesData: HotelPolicies) => {
    try {
      const response = await fetch(`/api/hotels/${hotelId}/property-information/policies`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policiesData),
      });

      if (!response.ok) throw new Error('Failed to save policies');
      
      const savedPolicies = await response.json();
      setPolicies(savedPolicies);
    } catch (error) {
      console.error('Failed to save policies:', error);
      throw error;
    }
  }, [hotelId]);

  const handleDescriptionValidate = useCallback((content: string) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!content.trim()) {
      errors.push('Property description is required');
    } else if (content.trim().length < 50) {
      warnings.push('Consider adding more detail to help guests understand your property better');
    }

    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < 20) {
      warnings.push('Property descriptions with more words tend to attract more bookings');
    }

    const result = { isValid: errors.length === 0, errors, warnings };
    setValidation(prev => ({ ...prev, description: result }));
    return result;
  }, []);

  const handleLocationValidate = useCallback((location: LocationDetails) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (location.nearbyAttractions.length === 0) {
      warnings.push('Adding nearby attractions helps guests understand your location better');
    }

    if (!location.transportation.nearestAirport && !location.transportation.nearestRailway) {
      warnings.push('Consider adding transportation information to help guests plan their journey');
    }

    if (location.accessibility.accessibleRooms === 0 && location.accessibility.wheelchairAccessible) {
      warnings.push('You marked the property as wheelchair accessible but have 0 accessible rooms');
    }

    const result = { isValid: errors.length === 0, errors, warnings };
    setValidation(prev => ({ ...prev, location: result }));
    return result;
  }, []);

  const handlePoliciesValidate = useCallback((policiesData: HotelPolicies) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!policiesData.checkIn.process.trim()) {
      warnings.push('Adding check-in process details helps set guest expectations');
    }

    if (!policiesData.checkOut.process.trim()) {
      warnings.push('Adding check-out process details helps set guest expectations');
    }

    if (!policiesData.cancellation.details.trim()) {
      warnings.push('Detailed cancellation policy helps avoid misunderstandings');
    }

    if (!policiesData.booking.paymentTerms.trim()) {
      warnings.push('Clear payment terms help guests understand booking requirements');
    }

    if (policiesData.pet.allowed && (!policiesData.pet.restrictions || policiesData.pet.restrictions.length === 0)) {
      warnings.push('Consider adding pet restrictions to set clear expectations');
    }

    const result = { isValid: errors.length === 0, errors, warnings };
    setValidation(prev => ({ ...prev, policies: result }));
    return result;
  }, []);

  const handleSaveAll = async () => {
    if (!onSave) return;

    setIsLoading(true);
    try {
      const data: PropertyInformation = {
        propertyDescription,
        locationDetails,
        policies,
      };

      await onSave(data);
    } catch (error) {
      console.error('Failed to save property information:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatForCustomerDisplay = useCallback((): CustomerDisplayData => {
    const display: CustomerDisplayData = {
      description: '',
      location: {
        attractions: [],
        transportation: [],
        accessibility: [],
      },
      policies: {
        checkIn: '',
        checkOut: '',
        cancellation: '',
        important: [],
      },
    };

    // Format description
    if (propertyDescription) {
      display.description = propertyDescription.format === 'markdown' 
        ? propertyDescription.content.replace(/[#*_`]/g, '') // Simple markdown removal
        : propertyDescription.content.replace(/<[^>]*>/g, ''); // Simple HTML removal
    }

    // Format location
    if (locationDetails) {
      // Attractions
      display.location.attractions = locationDetails.nearbyAttractions
        .map(attr => `${attr.name} (${attr.distance}km) - ${attr.type}`)
        .slice(0, 5); // Limit to top 5

      // Transportation
      const transport: string[] = [];
      if (locationDetails.transportation.nearestAirport) {
        transport.push(`${locationDetails.transportation.nearestAirport.name} Airport (${locationDetails.transportation.nearestAirport.distance}km)`);
      }
      if (locationDetails.transportation.nearestRailway) {
        transport.push(`${locationDetails.transportation.nearestRailway.name} Station (${locationDetails.transportation.nearestRailway.distance}km)`);
      }
      if (locationDetails.transportation.parkingAvailable) {
        transport.push(`${locationDetails.transportation.parkingType || 'Parking'} parking available`);
      }
      transport.push(...locationDetails.transportation.publicTransport.slice(0, 3));
      display.location.transportation = transport;

      // Accessibility
      const accessibility: string[] = [];
      if (locationDetails.accessibility.wheelchairAccessible) {
        accessibility.push('Wheelchair accessible');
      }
      if (locationDetails.accessibility.elevatorAccess) {
        accessibility.push('Elevator access');
      }
      if (locationDetails.accessibility.accessibleRooms > 0) {
        accessibility.push(`${locationDetails.accessibility.accessibleRooms} accessible rooms`);
      }
      if (locationDetails.accessibility.hearingAssistance) {
        accessibility.push('Hearing assistance available');
      }
      if (locationDetails.accessibility.visualAssistance) {
        accessibility.push('Visual assistance available');
      }
      display.location.accessibility = accessibility;
    }

    // Format policies
    if (policies) {
      display.policies.checkIn = `Check-in: ${policies.checkIn.standardTime}${
        policies.checkIn.earliestTime ? ` (earliest: ${policies.checkIn.earliestTime})` : ''
      }`;
      
      display.policies.checkOut = `Check-out: ${policies.checkOut.standardTime}${
        policies.checkOut.lateCheckoutAvailable ? ' (late checkout available)' : ''
      }`;

      const cancellationLabels = {
        flexible: 'Flexible cancellation',
        moderate: 'Moderate cancellation policy',
        strict: 'Strict cancellation policy',
        super_strict: 'Non-refundable'
      };
      display.policies.cancellation = `${cancellationLabels[policies.cancellation.type]} - Free until ${policies.cancellation.freeUntilHours} hours before`;

      // Important policies
      const important: string[] = [];
      if (!policies.pet.allowed) {
        important.push('No pets allowed');
      } else if (policies.pet.fee) {
        important.push(`Pet fee: $${policies.pet.fee}`);
      }
      
      if (!policies.smoking.allowed) {
        important.push('Non-smoking property');
      } else if (policies.smoking.designatedAreas) {
        important.push('Smoking allowed in designated areas only');
      }

      if (policies.booking.minimumStay) {
        important.push(`Minimum stay: ${policies.booking.minimumStay} nights`);
      }

      if (policies.booking.requiresApproval) {
        important.push('Booking requires host approval');
      }

      display.policies.important = important;
    }

    return display;
  }, [propertyDescription, locationDetails, policies]);

  const getCompletionStatus = () => {
    const completed = [
      propertyDescription !== null,
      locationDetails !== null,
      policies !== null,
    ];
    const completedCount = completed.filter(Boolean).length;
    return { completed: completedCount, total: 3, percentage: Math.round((completedCount / 3) * 100) };
  };

  const completionStatus = getCompletionStatus();
  const customerDisplay = formatForCustomerDisplay();

  const tabs = [
    { id: 'description', label: 'Description', icon: FileText, completed: propertyDescription !== null },
    { id: 'location', label: 'Location', icon: MapPin, completed: locationDetails !== null },
    { id: 'policies', label: 'Policies', icon: Shield, completed: policies !== null },
    { id: 'preview', label: 'Preview', icon: Eye, completed: false },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Header */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Property Information</h2>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                {completionStatus.completed}/{completionStatus.total} sections completed
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionStatus.percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium">{completionStatus.percentage}%</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.completed && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === 'description' && (
        <PropertyDescriptionEditor
          initialContent={propertyDescription || undefined}
          onSave={handleDescriptionSave}
          onValidate={handleDescriptionValidate}
        />
      )}

      {activeTab === 'location' && (
        <LocationDetailsForm
          initialData={locationDetails || undefined}
          onSave={handleLocationSave}
          onValidate={handleLocationValidate}
        />
      )}

      {activeTab === 'policies' && (
        <PolicyManagementForm
          initialData={policies || undefined}
          onSave={handlePoliciesSave}
          onValidate={handlePoliciesValidate}
        />
      )}

      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Customer-Friendly Display Preview */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Eye className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Customer View Preview</h3>
                <Badge variant="secondary">How guests will see your property information</Badge>
              </div>

              {/* Description Preview */}
              {customerDisplay.description && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    About This Property
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {customerDisplay.description}
                  </p>
                  {propertyDescription && (
                    <div className="mt-2 text-sm text-gray-500">
                      {propertyDescription.wordCount} words • {propertyDescription.readingTime} min read
                    </div>
                  )}
                </div>
              )}

              {/* Location Preview */}
              {(customerDisplay.location.attractions.length > 0 || 
                customerDisplay.location.transportation.length > 0 || 
                customerDisplay.location.accessibility.length > 0) && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location & Accessibility
                  </h4>
                  
                  {customerDisplay.location.attractions.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium mb-2 text-sm text-gray-600">Nearby Attractions</h5>
                      <ul className="space-y-1">
                        {customerDisplay.location.attractions.map((attraction, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {attraction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {customerDisplay.location.transportation.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium mb-2 text-sm text-gray-600">Transportation</h5>
                      <ul className="space-y-1">
                        {customerDisplay.location.transportation.map((transport, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                            {transport.includes('Airport') ? (
                              <Plane className="h-3 w-3 text-blue-500" />
                            ) : (
                              <Car className="h-3 w-3 text-green-500" />
                            )}
                            {transport}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {customerDisplay.location.accessibility.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium mb-2 text-sm text-gray-600">Accessibility</h5>
                      <ul className="space-y-1">
                        {customerDisplay.location.accessibility.map((feature, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                            <Accessibility className="h-3 w-3 text-purple-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Policies Preview */}
              {(customerDisplay.policies.checkIn || customerDisplay.policies.checkOut || 
                customerDisplay.policies.cancellation || customerDisplay.policies.important.length > 0) && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Policies & Important Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {customerDisplay.policies.checkIn && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Check-in:</span>
                        <span className="ml-2 text-gray-700">{customerDisplay.policies.checkIn.replace('Check-in: ', '')}</span>
                      </div>
                    )}
                    
                    {customerDisplay.policies.checkOut && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Check-out:</span>
                        <span className="ml-2 text-gray-700">{customerDisplay.policies.checkOut.replace('Check-out: ', '')}</span>
                      </div>
                    )}
                  </div>

                  {customerDisplay.policies.cancellation && (
                    <div className="mb-4">
                      <span className="font-medium text-gray-600 text-sm">Cancellation:</span>
                      <span className="ml-2 text-gray-700 text-sm">{customerDisplay.policies.cancellation}</span>
                    </div>
                  )}

                  {customerDisplay.policies.important.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2 text-sm text-gray-600">Important Policies</h5>
                      <div className="flex flex-wrap gap-2">
                        {customerDisplay.policies.important.map((policy, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {policy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!customerDisplay.description && 
               customerDisplay.location.attractions.length === 0 && 
               customerDisplay.location.transportation.length === 0 && 
               customerDisplay.location.accessibility.length === 0 && 
               !customerDisplay.policies.checkIn && (
                <div className="text-center py-12">
                  <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Information Available</h3>
                  <p className="text-gray-600 mb-4">
                    Complete the property description, location details, and policies to see how your property will appear to guests.
                  </p>
                  <Button
                    onClick={() => setActiveTab('description')}
                    variant="outline"
                  >
                    Start with Description
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Validation Summary */}
          {(validation.description || validation.location || validation.policies) && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Completion Summary</h3>
                
                <div className="space-y-4">
                  {validation.description && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Property Description</span>
                          {validation.description.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        {validation.description.errors.length > 0 && (
                          <ul className="text-sm text-red-600 mb-2">
                            {validation.description.errors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        )}
                        {validation.description.warnings.length > 0 && (
                          <ul className="text-sm text-amber-600">
                            {validation.description.warnings.map((warning, index) => (
                              <li key={index}>• {warning}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {validation.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Location Details</span>
                          {validation.location.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        {validation.location.errors.length > 0 && (
                          <ul className="text-sm text-red-600 mb-2">
                            {validation.location.errors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        )}
                        {validation.location.warnings.length > 0 && (
                          <ul className="text-sm text-amber-600">
                            {validation.location.warnings.map((warning, index) => (
                              <li key={index}>• {warning}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {validation.policies && (
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Hotel Policies</span>
                          {validation.policies.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        {validation.policies.errors.length > 0 && (
                          <ul className="text-sm text-red-600 mb-2">
                            {validation.policies.errors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        )}
                        {validation.policies.warnings.length > 0 && (
                          <ul className="text-sm text-amber-600">
                            {validation.policies.warnings.map((warning, index) => (
                              <li key={index}>• {warning}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Save All Button */}
      {onSave && completionStatus.completed > 0 && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveAll}
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? 'Saving...' : 'Save All Property Information'}
          </Button>
        </div>
      )}
    </div>
  );
};