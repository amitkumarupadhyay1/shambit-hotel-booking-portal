'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, Plus, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hotelsApi } from '@/lib/api/hotels';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/auth';

// Validations
const roomSchema = z.object({
    name: z.string().min(1, 'Room name is required'), // Changed from roomNumber to name
    roomType: z.enum(['SINGLE', 'DOUBLE', 'DELUXE', 'SUITE', 'FAMILY']),
    basePrice: z.number().min(0, 'Price must be positive'),
    maxOccupancy: z.number().min(1, 'At least 1 person'),
    bedCount: z.number().min(1, 'At least 1 bed'),
    bedType: z.string().min(1, 'Bed type is required'),
});

const onboardingSchema = z.object({
    hotel: z.object({
        name: z.string().min(2, 'Hotel Name is required'),
        hotelType: z.enum(['HOTEL', 'RESORT', 'GUEST_HOUSE', 'HOMESTAY', 'APARTMENT']),
        description: z.string().optional(),
        address: z.string().min(5, 'Full address is required'),
        city: z.string().min(2, 'City is required'),
        state: z.string().min(2, 'State is required'),
        pincode: z.string().regex(/^[0-9]{6}$/, 'Must be a 6-digit pincode'),
        phone: z.string().min(10, 'Valid phone is required'),
        email: z.string().email('Invalid email').optional().or(z.literal('')),
    }),
    rooms: z.array(roomSchema).min(1, 'Add at least one room'),
});

type OnboardingData = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hotelData, setHotelData] = useState<any>({
        name: '',
        hotelType: 'HOTEL',
        description: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: ''
    });
    const router = useRouter();
    const { user, isAuthenticated, isLoading, hasRole } = useAuth();

    // Only initialize form hooks for step 3 (rooms)
    const { register, control, handleSubmit, formState: { errors }, setValue, trigger } = useForm<any>({
        resolver: zodResolver(z.object({
            rooms: z.array(roomSchema).min(1, 'Add at least one room'),
        })),
        defaultValues: {
            rooms: [{ 
                name: 'Deluxe Room', // Changed from roomNumber to name
                roomType: 'DOUBLE', 
                basePrice: 2000, 
                maxOccupancy: 2, 
                bedCount: 1, 
                bedType: 'Queen' 
            }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "rooms"
    });

    // Check authentication and role AFTER hooks are initialized
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (!isAuthenticated || !hasRole(UserRole.SELLER)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You need to be a registered hotel partner to access this page</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Button onClick={() => router.push('/register?type=owner')}>
                            Become a Partner
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const nextStep = async () => {
        console.log(`🔄 NextStep called - Current step: ${step}`);
        
        if (step === 1) {
            // Validate step 1 manually
            if (!hotelData.name || hotelData.name.length < 2) {
                toast.error('Hotel name is required (minimum 2 characters)');
                return;
            }
            if (!hotelData.hotelType) {
                toast.error('Hotel type is required');
                return;
            }
            console.log(`✅ Step 1 validation passed`);
            setStep(2);
        } else if (step === 2) {
            // Validate step 2 manually
            if (!hotelData.address || hotelData.address.length < 5) {
                toast.error('Address is required (minimum 5 characters)');
                return;
            }
            if (!hotelData.city || hotelData.city.length < 2) {
                toast.error('City is required');
                return;
            }
            if (!hotelData.state || hotelData.state.length < 2) {
                toast.error('State is required');
                return;
            }
            if (!hotelData.pincode || !/^[0-9]{6}$/.test(hotelData.pincode)) {
                toast.error('Valid 6-digit pincode is required');
                return;
            }
            if (!hotelData.phone || hotelData.phone.length < 10) {
                toast.error('Valid phone number is required');
                return;
            }
            console.log(`✅ Step 2 validation passed`);
            setStep(3);
        }
    };

    const onSubmit = async (roomsData: any) => {
        console.log(`🚀 Form submission attempted - Current step: ${step}`);
        
        // Only allow submission on step 3
        if (step !== 3) {
            console.log('❌ Form submission blocked - not on step 3');
            return;
        }

        // Validate rooms before submission
        const roomsValid = await trigger(['rooms']);
        console.log(`🏠 Rooms validation result: ${roomsValid}`);
        
        if (!roomsValid) {
            toast.error('Please complete all room details before submitting.');
            return;
        }

        // Combine hotel data with rooms data
        const completeData = {
            hotel: hotelData,
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
                    <span>Basic Info</span>
                    <span>Location</span>
                    <span>Rooms</span>
                </div>
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
                                handleSubmit(onSubmit as any)(e);
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
                                                <Label className="text-xs">Room Type</Label>
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
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Room/Category Name</Label>
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
                                                    <p className="text-red-500 text-xs">{(errors.rooms as any)[index].name.message}</p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Price per Night (₹)</Label>
                                                <Input 
                                                    type="number" 
                                                    className="h-9" 
                                                    {...register(`rooms.${index}.basePrice`, { valueAsNumber: true })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                />
                                                {(errors.rooms as any)?.[index]?.basePrice && (
                                                    <p className="text-red-500 text-xs">{(errors.rooms as any)[index].basePrice.message}</p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Max Occupancy</Label>
                                                <Input 
                                                    type="number" 
                                                    className="h-9" 
                                                    {...register(`rooms.${index}.maxOccupancy`, { valueAsNumber: true })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                />
                                                {(errors.rooms as any)?.[index]?.maxOccupancy && (
                                                    <p className="text-red-500 text-xs">{(errors.rooms as any)[index].maxOccupancy.message}</p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Bed Count</Label>
                                                <Input 
                                                    type="number" 
                                                    className="h-9" 
                                                    {...register(`rooms.${index}.bedCount`, { valueAsNumber: true })}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                />
                                                {(errors.rooms as any)?.[index]?.bedCount && (
                                                    <p className="text-red-500 text-xs">{(errors.rooms as any)[index].bedCount.message}</p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Bed Type</Label>
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
                                                    <p className="text-red-500 text-xs">{(errors.rooms as any)[index].bedType.message}</p>
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
                                        name: '', // Changed from roomNumber to name
                                        roomType: 'DOUBLE', 
                                        basePrice: 2000, 
                                        maxOccupancy: 2, 
                                        bedCount: 1, 
                                        bedType: 'Queen' 
                                    })}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Another Room Type
                                </Button>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-green-600 hover:bg-green-700 w-32"
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finish Setup"}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        // Steps 1 and 2 - No form element to prevent accidental submission
                        <div className="space-y-6">
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="hotelName">Property Name</Label>
                                        <Input 
                                            id="hotelName" 
                                            value={hotelData.name}
                                            onChange={(e) => setHotelData({...hotelData, name: e.target.value})}
                                            placeholder="e.g. Shambit Resort" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hotelType">Property Type</Label>
                                        <Select
                                            value={hotelData.hotelType}
                                            onValueChange={(val: any) => setHotelData({...hotelData, hotelType: val})}
                                        >
                                            <SelectTrigger>
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
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">About Your Property</Label>
                                        <Textarea 
                                            id="description" 
                                            value={hotelData.description}
                                            onChange={(e) => setHotelData({...hotelData, description: e.target.value})}
                                            placeholder="Tell guests what makes your place special..." 
                                            rows={4} 
                                        />
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input 
                                            id="address" 
                                            value={hotelData.address}
                                            onChange={(e) => setHotelData({...hotelData, address: e.target.value})}
                                            placeholder="Street address, locality"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input 
                                                id="city" 
                                                value={hotelData.city}
                                                onChange={(e) => setHotelData({...hotelData, city: e.target.value})}
                                                placeholder="Ayodhya"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="state">State</Label>
                                            <Input 
                                                id="state" 
                                                value={hotelData.state}
                                                onChange={(e) => setHotelData({...hotelData, state: e.target.value})}
                                                placeholder="Uttar Pradesh"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="pincode">Pincode</Label>
                                            <Input 
                                                id="pincode" 
                                                value={hotelData.pincode}
                                                onChange={(e) => setHotelData({...hotelData, pincode: e.target.value})}
                                                placeholder="224001"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Contact Number</Label>
                                            <Input 
                                                id="phone" 
                                                value={hotelData.phone}
                                                onChange={(e) => setHotelData({...hotelData, phone: e.target.value})}
                                                placeholder="+91 XXXXXXXXXX"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email (Optional)</Label>
                                        <Input 
                                            id="email" 
                                            type="email" 
                                            value={hotelData.email}
                                            onChange={(e) => setHotelData({...hotelData, email: e.target.value})}
                                            placeholder="contact@property.com"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t p-6 bg-slate-50/50">
                    <Button type="button" variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || isSubmitting}>
                        Back
                    </Button>

                    {step < 3 && (
                        <Button type="button" onClick={nextStep}>
                            Next Step <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
