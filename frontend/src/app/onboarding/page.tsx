'use client';

import { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, Plus, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hotelsApi } from '@/lib/api/hotels';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/auth';
import { 
    step1Schema, 
    step2Schema, 
    step3Schema, 
    validateStep1, 
    validateStep2, 
    validateStep3,
    validateField,
    validateRoomField,
    type Step1Data,
    type Step2Data,
    type Step3Data,
    type OnboardingData 
} from '@/lib/validations/onboarding';

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Step-wise data state with validation tracking
    const [step1Data, setStep1Data] = useState<Partial<Step1Data>>({
        name: '',
        hotelType: 'HOTEL',
        description: ''
    });
    const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
    const [step1Touched, setStep1Touched] = useState<Record<string, boolean>>({});
    
    const [step2Data, setStep2Data] = useState<Partial<Step2Data>>({
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        website: ''
    });
    const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});
    const [step2Touched, setStep2Touched] = useState<Record<string, boolean>>({});
    
    const router = useRouter();
    const { user, isAuthenticated, isLoading, hasRole } = useAuth();

    // Step 3 form with react-hook-form for complex room management
    const { register, control, handleSubmit, formState: { errors }, setValue, trigger, watch } = useForm({
        resolver: zodResolver(step3Schema),
        defaultValues: {
            rooms: [{ 
                name: 'Deluxe Room',
                roomType: 'DOUBLE' as const, 
                basePrice: 2000, 
                maxOccupancy: 2, 
                bedCount: 1, 
                bedType: 'Queen',
                description: ''
            }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "rooms"
    });

    // Real-time validation for Step 1
    const validateStep1Field = useCallback((fieldName: string, value: any) => {
        const error = validateField(fieldName, value, 1);
        setStep1Errors(prev => ({
            ...prev,
            [fieldName]: error || ''
        }));
        return !error;
    }, []);

    // Real-time validation for Step 2
    const validateStep2Field = useCallback((fieldName: string, value: any) => {
        const error = validateField(fieldName, value, 2);
        setStep2Errors(prev => ({
            ...prev,
            [fieldName]: error || ''
        }));
        return !error;
    }, []);

    // Handle Step 1 field changes with validation
    const handleStep1Change = useCallback((fieldName: string, value: any) => {
        setStep1Data(prev => ({ ...prev, [fieldName]: value }));
        setStep1Touched(prev => ({ ...prev, [fieldName]: true }));
        
        // Debounced validation
        setTimeout(() => {
            validateStep1Field(fieldName, value);
        }, 300);
    }, [validateStep1Field]);

    // Handle Step 2 field changes with validation
    const handleStep2Change = useCallback((fieldName: string, value: any) => {
        setStep2Data(prev => ({ ...prev, [fieldName]: value }));
        setStep2Touched(prev => ({ ...prev, [fieldName]: true }));
        
        // Debounced validation
        setTimeout(() => {
            validateStep2Field(fieldName, value);
        }, 300);
    }, [validateStep2Field]);

    // Validate entire step before proceeding
    const validateCurrentStep = useCallback(() => {
        if (step === 1) {
            const validation = validateStep1(step1Data);
            if (!validation.success) {
                setStep1Errors(validation.errors);
                // Mark all fields as touched to show errors
                const touchedFields: Record<string, boolean> = {};
                Object.keys(validation.errors).forEach(key => {
                    touchedFields[key] = true;
                });
                setStep1Touched(prev => ({ ...prev, ...touchedFields }));
                
                // Show first error in toast
                const firstError = Object.values(validation.errors)[0];
                toast.error(firstError);
                return false;
            }
            return true;
        } else if (step === 2) {
            const validation = validateStep2(step2Data);
            if (!validation.success) {
                setStep2Errors(validation.errors);
                // Mark all fields as touched to show errors
                const touchedFields: Record<string, boolean> = {};
                Object.keys(validation.errors).forEach(key => {
                    touchedFields[key] = true;
                });
                setStep2Touched(prev => ({ ...prev, ...touchedFields }));
                
                // Show first error in toast
                const firstError = Object.values(validation.errors)[0];
                toast.error(firstError);
                return false;
            }
            return true;
        }
        return true;
    }, [step, step1Data, step2Data]);

    // Enhanced authentication and role checking with better error handling
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Verifying your session...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !hasRole(UserRole.SELLER)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>
                            {!isAuthenticated 
                                ? "Please log in to access the onboarding process" 
                                : "You need to be a registered hotel partner to access this page"
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-3">
                        {!isAuthenticated ? (
                            <>
                                <Button onClick={() => router.push('/login?redirect=/onboarding')} className="w-full">
                                    Log In
                                </Button>
                                <Button variant="outline" onClick={() => router.push('/register?type=owner')} className="w-full">
                                    Register as Hotel Partner
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => router.push('/register?type=owner')}>
                                Become a Partner
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    const nextStep = async () => {
        console.log(`🔄 NextStep called - Current step: ${step}`);
        
        if (!validateCurrentStep()) {
            return;
        }
        
        console.log(`✅ Step ${step} validation passed`);
        setStep(prev => prev + 1);
    };

    const onSubmit = async (roomsData: any) => {
        console.log(`🚀 Form submission attempted - Current step: ${step}`);
        
        // Only allow submission on step 3
        if (step !== 3) {
            console.log('❌ Form submission blocked - not on step 3');
            return;
        }

        // Final validation of all steps
        const step1Validation = validateStep1(step1Data);
        const step2Validation = validateStep2(step2Data);
        
        if (!step1Validation.success || !step2Validation.success) {
            toast.error('Please complete all previous steps correctly');
            return;
        }

        // Combine all data
        const completeData: OnboardingData = {
            hotel: {
                ...step1Validation.data!,
                ...step2Validation.data!
            },
            rooms: roomsData.rooms
        };

        setIsSubmitting(true);
        try {
            console.log('📤 Submitting onboarding data:', completeData);
            await hotelsApi.createOnboarding(completeData);
            toast.success('Property submitted successfully! Waiting for admin approval.');
            router.push('/seller/dashboard');
        } catch (error: any) {
            console.error('❌ Onboarding submission error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit property. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper component for field validation display
    const FieldValidation = ({ fieldName, errors, touched }: { 
        fieldName: string; 
        errors: Record<string, string>; 
        touched: Record<string, boolean> 
    }) => {
        const error = errors[fieldName];
        const isTouched = touched[fieldName];
        
        if (!isTouched) return null;
        
        return (
            <div className="flex items-center gap-1 mt-1">
                {error ? (
                    <>
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-500">{error}</span>
                    </>
                ) : (
                    <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-500">Valid</span>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-10 px-4 pb-20">
            <div className="w-full max-w-3xl mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-200 -z-10" />
                    {[1, 2, 3].map((idx) => (
                        <div key={idx} className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors bg-white border-2",
                            step > idx ? "bg-green-500 border-green-500 text-white" :
                                step === idx ? "border-blue-600 text-blue-600" : "border-slate-300 text-slate-400"
                        )}>
                            {step > idx ? <Check className="h-5 w-5" /> : idx}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <span className={cn(step >= 1 && "text-blue-600")}>Basic Info</span>
                    <span className={cn(step >= 2 && "text-blue-600")}>Location</span>
                    <span className={cn(step >= 3 && "text-blue-600")}>Rooms</span>
                </div>
                
                {/* Validation Summary */}
                {step > 1 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                            <CheckCircle className="h-4 w-4" />
                            <span>Step {step - 1} completed successfully</span>
                        </div>
                    </div>
                )}
            </div>

            <Card className="w-full max-w-2xl shadow-lg border-slate-200">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-slate-800">
                        {step === 1 && "Basic Property Details"}
                        {step === 2 && "Where is your property?"}
                        {step === 3 && "Room Inventory"}
                    </CardTitle>
                    <CardDescription>
                        Step {step} of 3 - Provide accurate information for faster approval.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Add form wrapper only for step 3 to prevent accidental submissions */}
                    {step === 3 ? (
                        <form 
                            id="onboarding-form" 
                            onSubmit={(e) => {
                                e.preventDefault();
                                console.log('🚀 Form submitted on step 3');
                                handleSubmit(onSubmit)(e);
                            }} 
                            className="space-y-6"
                        >
                            <div className="space-y-6">
                                {fields.map((field: any, index: number) => (
                                    <Card key={field.id} className="relative border-slate-200">
                                        <CardHeader className="py-4 bg-slate-50 border-b">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-semibold text-sm">Room Category #{index + 1}</h4>
                                                {fields.length > 1 && (
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4 grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Room Type *</Label>
                                                <Select
                                                    defaultValue={field.roomType}
                                                    onValueChange={(val: any) => setValue(`rooms.${index}.roomType`, val)}
                                                >
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="SINGLE">Single</SelectItem>
                                                        <SelectItem value="DOUBLE">Double</SelectItem>
                                                        <SelectItem value="DELUXE">Deluxe</SelectItem>
                                                        <SelectItem value="SUITE">Suite</SelectItem>
                                                        <SelectItem value="FAMILY">Family</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {(errors.rooms as any)?.[index]?.roomType && (
                                                    <p className="text-red-500 text-xs flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {(errors.rooms as any)[index].roomType.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Room/Category Name *</Label>
                                                <Input 
                                                    className="h-9" 
                                                    {...register(`rooms.${index}.name`)} 
                                                    placeholder="e.g. Deluxe Suite"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                />
                                                {(errors.rooms as any)?.[index]?.name && (
                                                    <p className="text-red-500 text-xs flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {(errors.rooms as any)[index].name.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Price per Night (₹) *</Label>
                                                <Input 
                                                    type="number" 
                                                    className="h-9" 
                                                    {...register(`rooms.${index}.basePrice`, { 
                                                        valueAsNumber: true,
                                                        min: 100,
                                                        max: 100000
                                                    })}
                                                    placeholder="2000"
                                                    min="100"
                                                    max="100000"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                />
                                                {(errors.rooms as any)?.[index]?.basePrice && (
                                                    <p className="text-red-500 text-xs flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {(errors.rooms as any)[index].basePrice.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Max Occupancy *</Label>
                                                <Input 
                                                    type="number" 
                                                    className="h-9" 
                                                    {...register(`rooms.${index}.maxOccupancy`, { 
                                                        valueAsNumber: true,
                                                        min: 1,
                                                        max: 20
                                                    })}
                                                    placeholder="2"
                                                    min="1"
                                                    max="20"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                />
                                                {(errors.rooms as any)?.[index]?.maxOccupancy && (
                                                    <p className="text-red-500 text-xs flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {(errors.rooms as any)[index].maxOccupancy.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Bed Count *</Label>
                                                <Input 
                                                    type="number" 
                                                    className="h-9" 
                                                    {...register(`rooms.${index}.bedCount`, { 
                                                        valueAsNumber: true,
                                                        min: 1,
                                                        max: 10
                                                    })}
                                                    placeholder="1"
                                                    min="1"
                                                    max="10"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                />
                                                {(errors.rooms as any)?.[index]?.bedCount && (
                                                    <p className="text-red-500 text-xs flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {(errors.rooms as any)[index].bedCount.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Bed Type *</Label>
                                                <Input 
                                                    className="h-9" 
                                                    {...register(`rooms.${index}.bedType`)} 
                                                    placeholder="e.g. Queen, King, Single"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                />
                                                {(errors.rooms as any)?.[index]?.bedType && (
                                                    <p className="text-red-500 text-xs flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {(errors.rooms as any)[index].bedType.message}
                                                    </p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full border-dashed py-6 text-blue-600 hover:bg-blue-50"
                                    onClick={() => append({ 
                                        name: '', 
                                        roomType: 'DOUBLE' as const, 
                                        basePrice: 2000, 
                                        maxOccupancy: 2, 
                                        bedCount: 1, 
                                        bedType: 'Queen',
                                        description: ''
                                    })}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Another Room Type
                                </Button>
                            </div>
                        </form>
                    ) : (
                        // Steps 1 and 2 - No form element to prevent accidental submission
                        <div className="space-y-6">
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="hotelName">Property Name *</Label>
                                        <Input 
                                            id="hotelName" 
                                            value={step1Data.name || ''}
                                            onChange={(e) => handleStep1Change('name', e.target.value)}
                                            placeholder="e.g. Shambit Resort"
                                            className={cn(
                                                step1Touched.name && step1Errors.name && "border-red-500",
                                                step1Touched.name && !step1Errors.name && "border-green-500"
                                            )}
                                        />
                                        <FieldValidation fieldName="name" errors={step1Errors} touched={step1Touched} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hotelType">Property Type *</Label>
                                        <Select
                                            value={step1Data.hotelType || 'HOTEL'}
                                            onValueChange={(val: string) => handleStep1Change('hotelType', val)}
                                        >
                                            <SelectTrigger className={cn(
                                                step1Touched.hotelType && step1Errors.hotelType && "border-red-500",
                                                step1Touched.hotelType && !step1Errors.hotelType && "border-green-500"
                                            )}>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="HOTEL">Hotel</SelectItem>
                                                <SelectItem value="RESORT">Resort</SelectItem>
                                                <SelectItem value="GUEST_HOUSE">Guest House</SelectItem>
                                                <SelectItem value="HOMESTAY">Homestay</SelectItem>
                                                <SelectItem value="APARTMENT">Apartment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FieldValidation fieldName="hotelType" errors={step1Errors} touched={step1Touched} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">About Your Property</Label>
                                        <Textarea 
                                            id="description" 
                                            value={step1Data.description || ''}
                                            onChange={(e) => handleStep1Change('description', e.target.value)}
                                            placeholder="Tell guests what makes your place special..."
                                            rows={4}
                                            maxLength={1000}
                                            className={cn(
                                                step1Touched.description && step1Errors.description && "border-red-500",
                                                step1Touched.description && !step1Errors.description && step1Data.description && "border-green-500"
                                            )}
                                        />
                                        <div className="flex justify-between items-center">
                                            <FieldValidation fieldName="description" errors={step1Errors} touched={step1Touched} />
                                            <span className="text-xs text-gray-400">
                                                {(step1Data.description || '').length}/1000
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Complete Address *</Label>
                                        <Input 
                                            id="address" 
                                            value={step2Data.address || ''}
                                            onChange={(e) => handleStep2Change('address', e.target.value)}
                                            placeholder="Street address, locality, landmarks"
                                            className={cn(
                                                step2Touched.address && step2Errors.address && "border-red-500",
                                                step2Touched.address && !step2Errors.address && "border-green-500"
                                            )}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                        <FieldValidation fieldName="address" errors={step2Errors} touched={step2Touched} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City *</Label>
                                            <Input 
                                                id="city" 
                                                value={step2Data.city || ''}
                                                onChange={(e) => handleStep2Change('city', e.target.value)}
                                                placeholder="Ayodhya"
                                                className={cn(
                                                    step2Touched.city && step2Errors.city && "border-red-500",
                                                    step2Touched.city && !step2Errors.city && "border-green-500"
                                                )}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                            <FieldValidation fieldName="city" errors={step2Errors} touched={step2Touched} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="state">State *</Label>
                                            <Input 
                                                id="state" 
                                                value={step2Data.state || ''}
                                                onChange={(e) => handleStep2Change('state', e.target.value)}
                                                placeholder="Uttar Pradesh"
                                                className={cn(
                                                    step2Touched.state && step2Errors.state && "border-red-500",
                                                    step2Touched.state && !step2Errors.state && "border-green-500"
                                                )}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                            <FieldValidation fieldName="state" errors={step2Errors} touched={step2Touched} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="pincode">Pincode *</Label>
                                            <Input 
                                                id="pincode" 
                                                value={step2Data.pincode || ''}
                                                onChange={(e) => {
                                                    // Only allow numbers and limit to 6 digits
                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                    handleStep2Change('pincode', value);
                                                }}
                                                placeholder="224001"
                                                maxLength={6}
                                                className={cn(
                                                    step2Touched.pincode && step2Errors.pincode && "border-red-500",
                                                    step2Touched.pincode && !step2Errors.pincode && "border-green-500"
                                                )}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                            <FieldValidation fieldName="pincode" errors={step2Errors} touched={step2Touched} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Contact Number *</Label>
                                            <Input 
                                                id="phone" 
                                                value={step2Data.phone || ''}
                                                onChange={(e) => handleStep2Change('phone', e.target.value)}
                                                placeholder="+91 9876543210"
                                                className={cn(
                                                    step2Touched.phone && step2Errors.phone && "border-red-500",
                                                    step2Touched.phone && !step2Errors.phone && "border-green-500"
                                                )}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                            <FieldValidation fieldName="phone" errors={step2Errors} touched={step2Touched} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input 
                                            id="email" 
                                            type="email" 
                                            value={step2Data.email || ''}
                                            onChange={(e) => handleStep2Change('email', e.target.value)}
                                            placeholder="contact@property.com"
                                            className={cn(
                                                step2Touched.email && step2Errors.email && "border-red-500",
                                                step2Touched.email && !step2Errors.email && step2Data.email && "border-green-500"
                                            )}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                        <FieldValidation fieldName="email" errors={step2Errors} touched={step2Touched} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="website">Website (Optional)</Label>
                                        <Input 
                                            id="website" 
                                            type="url" 
                                            value={step2Data.website || ''}
                                            onChange={(e) => handleStep2Change('website', e.target.value)}
                                            placeholder="https://yourproperty.com"
                                            className={cn(
                                                step2Touched.website && step2Errors.website && "border-red-500",
                                                step2Touched.website && !step2Errors.website && step2Data.website && "border-green-500"
                                            )}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                        <FieldValidation fieldName="website" errors={step2Errors} touched={step2Touched} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t p-6 bg-slate-50/50">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setStep(s => Math.max(1, s - 1))} 
                        disabled={step === 1 || isSubmitting}
                    >
                        Back
                    </Button>

                    {step < 3 && (
                        <Button 
                            type="button" 
                            onClick={nextStep}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Next Step <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                    
                    {step === 3 && (
                        <div className="flex items-center gap-3">
                            <div className="text-xs text-gray-500">
                                {fields.length} room type{fields.length !== 1 ? 's' : ''} added
                            </div>
                            <Button
                                type="submit"
                                form="onboarding-form"
                                disabled={isSubmitting}
                                className="bg-green-600 hover:bg-green-700 min-w-[120px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Complete Setup
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}