import React, { useState, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Clock, 
  CreditCard, 
  XCircle, 
  PawPrint, 
  Cigarette, 
  CheckCircle,
  AlertCircle,
  Info,
  Plus,
  Trash2
} from 'lucide-react';

export interface CheckInPolicy {
  standardTime: string;
  earliestTime?: string;
  latestTime?: string;
  requirements: string[];
  process: string;
}

export interface CheckOutPolicy {
  standardTime: string;
  lateCheckoutAvailable: boolean;
  lateCheckoutFee?: number;
  process: string;
}

export interface CancellationPolicy {
  type: 'flexible' | 'moderate' | 'strict' | 'super_strict';
  freeUntilHours: number;
  penaltyPercentage: number;
  noShowPolicy: string;
  details: string;
}

export interface BookingPolicy {
  advanceBookingDays: number;
  minimumStay?: number;
  maximumStay?: number;
  instantBooking: boolean;
  requiresApproval: boolean;
  paymentTerms: string;
}

export interface PetPolicy {
  allowed: boolean;
  fee?: number;
  restrictions?: string[];
  areas?: string[];
}

export interface SmokingPolicy {
  allowed: boolean;
  designatedAreas?: string[];
  penalty?: number;
}

export interface HotelPolicies {
  checkIn: CheckInPolicy;
  checkOut: CheckOutPolicy;
  cancellation: CancellationPolicy;
  booking: BookingPolicy;
  pet: PetPolicy;
  smoking: SmokingPolicy;
}

export interface PolicyManagementFormProps {
  initialData?: Partial<HotelPolicies>;
  onSave: (policies: HotelPolicies) => Promise<void>;
  onValidate?: (data: HotelPolicies) => { isValid: boolean; errors: string[]; warnings: string[] };
  className?: string;
}

export const PolicyManagementForm: React.FC<PolicyManagementFormProps> = ({
  initialData,
  onSave,
  onValidate,
  className = '',
}) => {
  const [checkIn, setCheckIn] = useState<CheckInPolicy>(
    initialData?.checkIn || {
      standardTime: '15:00',
      requirements: [],
      process: '',
    }
  );
  
  const [checkOut, setCheckOut] = useState<CheckOutPolicy>(
    initialData?.checkOut || {
      standardTime: '11:00',
      lateCheckoutAvailable: false,
      process: '',
    }
  );
  
  const [cancellation, setCancellation] = useState<CancellationPolicy>(
    initialData?.cancellation || {
      type: 'moderate',
      freeUntilHours: 24,
      penaltyPercentage: 50,
      noShowPolicy: '',
      details: '',
    }
  );
  
  const [booking, setBooking] = useState<BookingPolicy>(
    initialData?.booking || {
      advanceBookingDays: 365,
      instantBooking: true,
      requiresApproval: false,
      paymentTerms: '',
    }
  );
  
  const [pet, setPet] = useState<PetPolicy>(
    initialData?.pet || {
      allowed: false,
    }
  );
  
  const [smoking, setSmoking] = useState<SmokingPolicy>(
    initialData?.smoking || {
      allowed: false,
    }
  );

  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[]; warnings: string[] } | null>(null);
  const [newRequirement, setNewRequirement] = useState('');
  const [newPetRestriction, setNewPetRestriction] = useState('');
  const [newPetArea, setNewPetArea] = useState('');
  const [newSmokingArea, setNewSmokingArea] = useState('');

  const handleAddRequirement = useCallback(() => {
    if (newRequirement.trim() && !checkIn.requirements.includes(newRequirement.trim())) {
      setCheckIn({
        ...checkIn,
        requirements: [...checkIn.requirements, newRequirement.trim()]
      });
      setNewRequirement('');
    }
  }, [checkIn, newRequirement]);

  const handleRemoveRequirement = useCallback((requirement: string) => {
    setCheckIn({
      ...checkIn,
      requirements: checkIn.requirements.filter(r => r !== requirement)
    });
  }, [checkIn]);

  const handleAddPetRestriction = useCallback(() => {
    if (newPetRestriction.trim() && !(pet.restrictions || []).includes(newPetRestriction.trim())) {
      setPet({
        ...pet,
        restrictions: [...(pet.restrictions || []), newPetRestriction.trim()]
      });
      setNewPetRestriction('');
    }
  }, [pet, newPetRestriction]);

  const handleRemovePetRestriction = useCallback((restriction: string) => {
    setPet({
      ...pet,
      restrictions: (pet.restrictions || []).filter(r => r !== restriction)
    });
  }, [pet]);

  const handleAddPetArea = useCallback(() => {
    if (newPetArea.trim() && !(pet.areas || []).includes(newPetArea.trim())) {
      setPet({
        ...pet,
        areas: [...(pet.areas || []), newPetArea.trim()]
      });
      setNewPetArea('');
    }
  }, [pet, newPetArea]);

  const handleRemovePetArea = useCallback((area: string) => {
    setPet({
      ...pet,
      areas: (pet.areas || []).filter(a => a !== area)
    });
  }, [pet]);

  const handleAddSmokingArea = useCallback(() => {
    if (newSmokingArea.trim() && !(smoking.designatedAreas || []).includes(newSmokingArea.trim())) {
      setSmoking({
        ...smoking,
        designatedAreas: [...(smoking.designatedAreas || []), newSmokingArea.trim()]
      });
      setNewSmokingArea('');
    }
  }, [smoking, newSmokingArea]);

  const handleRemoveSmokingArea = useCallback((area: string) => {
    setSmoking({
      ...smoking,
      designatedAreas: (smoking.designatedAreas || []).filter(a => a !== area)
    });
  }, [smoking]);

  const handleValidation = useCallback(() => {
    const policiesData: HotelPolicies = {
      checkIn,
      checkOut,
      cancellation,
      booking,
      pet,
      smoking,
    };

    if (onValidate) {
      const validationResult = onValidate(policiesData);
      setValidation(validationResult);
      return validationResult.isValid;
    }
    return true;
  }, [checkIn, checkOut, cancellation, booking, pet, smoking, onValidate]);

  const handleSave = async () => {
    if (!handleValidation()) return;

    setIsLoading(true);
    try {
      const policiesData: HotelPolicies = {
        checkIn,
        checkOut,
        cancellation,
        booking,
        pet,
        smoking,
      };

      await onSave(policiesData);
    } catch (error) {
      console.error('Failed to save hotel policies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancellationTypes = [
    { value: 'flexible', label: 'Flexible', description: 'Free cancellation until check-in' },
    { value: 'moderate', label: 'Moderate', description: 'Free cancellation 24-48 hours before' },
    { value: 'strict', label: 'Strict', description: 'Free cancellation 7+ days before' },
    { value: 'super_strict', label: 'Super Strict', description: 'Non-refundable or very limited cancellation' },
  ];

  const commonRequirements = [
    'Valid government-issued photo ID',
    'Credit card for incidentals',
    'Booking confirmation',
    'Age verification (18+ or 21+)',
    'Security deposit',
  ];

  const commonPetRestrictions = [
    'Maximum 2 pets per room',
    'Dogs only (no cats)',
    'Weight limit: 25kg maximum',
    'Must be house-trained',
    'Current vaccination records required',
    'No aggressive breeds',
  ];

  const commonPetAreas = [
    'Guest rooms only',
    'Lobby and common areas',
    'Outdoor spaces',
    'Designated pet relief areas',
    'Restaurant patio',
  ];

  const commonSmokingAreas = [
    'Designated outdoor areas',
    'Balconies',
    'Smoking rooms',
    'Rooftop terrace',
    'Garden areas',
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
                  <Info className="h-4 w-4" />
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

      {/* Check-In Policy */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Check-In Policy</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="checkin-standard">Standard Check-In Time</Label>
                <Input
                  id="checkin-standard"
                  type="time"
                  value={checkIn.standardTime}
                  onChange={(e) => setCheckIn({ ...checkIn, standardTime: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="checkin-earliest">Earliest Check-In (Optional)</Label>
                <Input
                  id="checkin-earliest"
                  type="time"
                  value={checkIn.earliestTime || ''}
                  onChange={(e) => setCheckIn({ ...checkIn, earliestTime: e.target.value || undefined })}
                />
              </div>
              
              <div>
                <Label htmlFor="checkin-latest">Latest Check-In (Optional)</Label>
                <Input
                  id="checkin-latest"
                  type="time"
                  value={checkIn.latestTime || ''}
                  onChange={(e) => setCheckIn({ ...checkIn, latestTime: e.target.value || undefined })}
                />
              </div>
            </div>

            <div>
              <Label className="font-medium mb-2 block">Check-In Requirements</Label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Add a check-in requirement..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRequirement()}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddRequirement}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mb-3">
                <Label className="text-sm text-gray-600 mb-2 block">Common Requirements (click to add):</Label>
                <div className="flex flex-wrap gap-2">
                  {commonRequirements.map((req) => (
                    <Button
                      key={req}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!checkIn.requirements.includes(req)) {
                          setCheckIn({ ...checkIn, requirements: [...checkIn.requirements, req] });
                        }
                      }}
                      className="text-xs"
                    >
                      {req}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {checkIn.requirements.map((requirement, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {requirement}
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(requirement)}
                      className="ml-1 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="checkin-process">Check-In Process Description</Label>
              <Textarea
                id="checkin-process"
                value={checkIn.process}
                onChange={(e) => setCheckIn({ ...checkIn, process: e.target.value })}
                placeholder="Describe the check-in process for guests..."
                rows={3}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Check-Out Policy */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold">Check-Out Policy</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkout-standard">Standard Check-Out Time</Label>
                <Input
                  id="checkout-standard"
                  type="time"
                  value={checkOut.standardTime}
                  onChange={(e) => setCheckOut({ ...checkOut, standardTime: e.target.value })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="late-checkout-available"
                  checked={checkOut.lateCheckoutAvailable}
                  onChange={(e) => setCheckOut({
                    ...checkOut,
                    lateCheckoutAvailable: e.target.checked,
                    lateCheckoutFee: e.target.checked ? checkOut.lateCheckoutFee : undefined,
                  })}
                />
                <Label htmlFor="late-checkout-available">Late Check-Out Available</Label>
              </div>
            </div>

            {checkOut.lateCheckoutAvailable && (
              <div>
                <Label htmlFor="late-checkout-fee">Late Check-Out Fee (Optional)</Label>
                <Input
                  id="late-checkout-fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={checkOut.lateCheckoutFee || ''}
                  onChange={(e) => setCheckOut({
                    ...checkOut,
                    lateCheckoutFee: parseFloat(e.target.value) || undefined,
                  })}
                  placeholder="0.00"
                />
              </div>
            )}

            <div>
              <Label htmlFor="checkout-process">Check-Out Process Description</Label>
              <Textarea
                id="checkout-process"
                value={checkOut.process}
                onChange={(e) => setCheckOut({ ...checkOut, process: e.target.value })}
                placeholder="Describe the check-out process for guests..."
                rows={3}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Cancellation Policy */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold">Cancellation Policy</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancellation-type">Policy Type</Label>
              <Select
                value={cancellation.type}
                onValueChange={(value: 'flexible' | 'moderate' | 'strict' | 'super_strict') => 
                  setCancellation({ ...cancellation, type: value })
                }
              >
                {cancellationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="free-until-hours">Free Cancellation Until (Hours Before)</Label>
                <Input
                  id="free-until-hours"
                  type="number"
                  min="0"
                  value={cancellation.freeUntilHours}
                  onChange={(e) => setCancellation({
                    ...cancellation,
                    freeUntilHours: parseInt(e.target.value) || 0,
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="penalty-percentage">Penalty Percentage (%)</Label>
                <Input
                  id="penalty-percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={cancellation.penaltyPercentage}
                  onChange={(e) => setCancellation({
                    ...cancellation,
                    penaltyPercentage: parseInt(e.target.value) || 0,
                  })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="no-show-policy">No-Show Policy</Label>
              <Textarea
                id="no-show-policy"
                value={cancellation.noShowPolicy}
                onChange={(e) => setCancellation({ ...cancellation, noShowPolicy: e.target.value })}
                placeholder="Describe what happens when guests don't show up..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="cancellation-details">Additional Details</Label>
              <Textarea
                id="cancellation-details"
                value={cancellation.details}
                onChange={(e) => setCancellation({ ...cancellation, details: e.target.value })}
                placeholder="Any additional cancellation policy details..."
                rows={3}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Booking Policy */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Booking Policy</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="advance-booking">Advance Booking (Days)</Label>
                <Input
                  id="advance-booking"
                  type="number"
                  min="0"
                  value={booking.advanceBookingDays}
                  onChange={(e) => setBooking({
                    ...booking,
                    advanceBookingDays: parseInt(e.target.value) || 0,
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="minimum-stay">Minimum Stay (Nights, Optional)</Label>
                <Input
                  id="minimum-stay"
                  type="number"
                  min="1"
                  value={booking.minimumStay || ''}
                  onChange={(e) => setBooking({
                    ...booking,
                    minimumStay: parseInt(e.target.value) || undefined,
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="maximum-stay">Maximum Stay (Nights, Optional)</Label>
                <Input
                  id="maximum-stay"
                  type="number"
                  min="1"
                  value={booking.maximumStay || ''}
                  onChange={(e) => setBooking({
                    ...booking,
                    maximumStay: parseInt(e.target.value) || undefined,
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="instant-booking"
                  checked={booking.instantBooking}
                  onChange={(e) => setBooking({ ...booking, instantBooking: e.target.checked })}
                />
                <Label htmlFor="instant-booking">Instant Booking Available</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requires-approval"
                  checked={booking.requiresApproval}
                  onChange={(e) => setBooking({ ...booking, requiresApproval: e.target.checked })}
                />
                <Label htmlFor="requires-approval">Requires Host Approval</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="payment-terms">Payment Terms</Label>
              <Textarea
                id="payment-terms"
                value={booking.paymentTerms}
                onChange={(e) => setBooking({ ...booking, paymentTerms: e.target.value })}
                placeholder="Describe payment terms, accepted methods, deposit requirements..."
                rows={3}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Pet Policy */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <PawPrint className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Pet Policy</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="pets-allowed"
                checked={pet.allowed}
                onChange={(e) => setPet({
                  ...pet,
                  allowed: e.target.checked,
                  fee: e.target.checked ? pet.fee : undefined,
                  restrictions: e.target.checked ? pet.restrictions : undefined,
                  areas: e.target.checked ? pet.areas : undefined,
                })}
              />
              <Label htmlFor="pets-allowed">Pets Allowed</Label>
            </div>

            {pet.allowed && (
              <>
                <div>
                  <Label htmlFor="pet-fee">Pet Fee (Optional)</Label>
                  <Input
                    id="pet-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={pet.fee || ''}
                    onChange={(e) => setPet({
                      ...pet,
                      fee: parseFloat(e.target.value) || undefined,
                    })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label className="font-medium mb-2 block">Pet Restrictions</Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newPetRestriction}
                      onChange={(e) => setNewPetRestriction(e.target.value)}
                      placeholder="Add a pet restriction..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddPetRestriction()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddPetRestriction}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="mb-3">
                    <Label className="text-sm text-gray-600 mb-2 block">Common Restrictions (click to add):</Label>
                    <div className="flex flex-wrap gap-2">
                      {commonPetRestrictions.map((restriction) => (
                        <Button
                          key={restriction}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!(pet.restrictions || []).includes(restriction)) {
                              setPet({ ...pet, restrictions: [...(pet.restrictions || []), restriction] });
                            }
                          }}
                          className="text-xs"
                        >
                          {restriction}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(pet.restrictions || []).map((restriction, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {restriction}
                        <button
                          type="button"
                          onClick={() => handleRemovePetRestriction(restriction)}
                          className="ml-1 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="font-medium mb-2 block">Allowed Pet Areas</Label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newPetArea}
                      onChange={(e) => setNewPetArea(e.target.value)}
                      placeholder="Add an allowed area..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddPetArea()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddPetArea}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="mb-3">
                    <Label className="text-sm text-gray-600 mb-2 block">Common Areas (click to add):</Label>
                    <div className="flex flex-wrap gap-2">
                      {commonPetAreas.map((area) => (
                        <Button
                          key={area}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!(pet.areas || []).includes(area)) {
                              setPet({ ...pet, areas: [...(pet.areas || []), area] });
                            }
                          }}
                          className="text-xs"
                        >
                          {area}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {(pet.areas || []).map((area, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {area}
                        <button
                          type="button"
                          onClick={() => handleRemovePetArea(area)}
                          className="ml-1 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Smoking Policy */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Cigarette className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Smoking Policy</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="smoking-allowed"
                checked={smoking.allowed}
                onChange={(e) => setSmoking({
                  ...smoking,
                  allowed: e.target.checked,
                  designatedAreas: e.target.checked ? smoking.designatedAreas : undefined,
                  penalty: e.target.checked ? undefined : smoking.penalty,
                })}
              />
              <Label htmlFor="smoking-allowed">Smoking Allowed</Label>
            </div>

            {smoking.allowed ? (
              <div>
                <Label className="font-medium mb-2 block">Designated Smoking Areas</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newSmokingArea}
                    onChange={(e) => setNewSmokingArea(e.target.value)}
                    placeholder="Add a smoking area..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSmokingArea()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddSmokingArea}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mb-3">
                  <Label className="text-sm text-gray-600 mb-2 block">Common Areas (click to add):</Label>
                  <div className="flex flex-wrap gap-2">
                    {commonSmokingAreas.map((area) => (
                      <Button
                        key={area}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!(smoking.designatedAreas || []).includes(area)) {
                            setSmoking({ ...smoking, designatedAreas: [...(smoking.designatedAreas || []), area] });
                          }
                        }}
                        className="text-xs"
                      >
                        {area}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(smoking.designatedAreas || []).map((area, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {area}
                      <button
                        type="button"
                        onClick={() => handleRemoveSmokingArea(area)}
                        className="ml-1 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="smoking-penalty">Smoking Violation Penalty (Optional)</Label>
                <Input
                  id="smoking-penalty"
                  type="number"
                  min="0"
                  step="0.01"
                  value={smoking.penalty || ''}
                  onChange={(e) => setSmoking({
                    ...smoking,
                    penalty: parseFloat(e.target.value) || undefined,
                  })}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isLoading || (validation ? !validation.isValid : false)}
          className="px-8"
        >
          {isLoading ? 'Saving...' : 'Save Hotel Policies'}
        </Button>
      </div>
    </div>
  );
};