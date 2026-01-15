'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Step 1 Schema
const basicInfoSchema = z.object({
    hotelName: z.string().min(2, 'Hotel Name is required'),
    hotelType: z.enum(['Hotel', 'Resort', 'Guest House', 'Homestay']),
    description: z.string().optional(),
});

type BasicInfoData = z.infer<typeof basicInfoSchema>;

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const router = useRouter();
    const { user } = useAuth();
    const [formData, setFormData] = useState<any>({});

    const basicInfoForm = useForm<BasicInfoData>({
        resolver: zodResolver(basicInfoSchema),
        defaultValues: { hotelType: 'Hotel' }
    });

    const onBasicInfoSubmit = (data: BasicInfoData) => {
        setFormData({ ...formData, ...data });
        setStep(2);
    };

    const submitAll = async () => {
        // Submit to API
        console.log('Submitting', formData);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-10 px-4">
            <div className="w-full max-w-3xl mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-200 -z-10" />
                    {[1, 2, 3, 4, 5, 6].map((idx) => (
                        <div key={idx} className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors bg-white border-2",
                            step > idx ? "bg-green-500 border-green-500 text-white" :
                                step === idx ? "border-blue-600 text-blue-600" : "border-slate-300 text-slate-400"
                        )}>
                            {step > idx ? <Check className="h-5 w-5" /> : idx}
                        </div>
                    ))}
                </div>
            </div>

            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>
                        {step === 1 && "Hotel Basic Details"}
                        {step === 2 && "Location"}
                        {step === 3 && "Amenities"}
                        {step === 4 && "Photos"}
                        {step === 5 && "Policies"}
                        {step === 6 && "Legal Compliance"}
                    </CardTitle>
                    <CardDescription>
                        Step {step} of 6 - Let's get your property listed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 1 && (
                        <form id="step1-form" onSubmit={basicInfoForm.handleSubmit(onBasicInfoSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="hotelName">Hotel Name</Label>
                                <Input id="hotelName" {...basicInfoForm.register('hotelName')} placeholder="e.g. Shambit Resort" />
                                {basicInfoForm.formState.errors.hotelName && (
                                    <p className="text-red-500 text-sm">{basicInfoForm.formState.errors.hotelName.message}</p>
                                )}
                            </div>
                            {/* Simplified for demo */}
                        </form>
                    )}

                    {step > 1 && (
                        <div className="text-center py-10 text-muted-foreground">
                            Next steps placeholder for MVP...
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
                        Back
                    </Button>

                    {step === 1 ? (
                        <Button type="submit" form="step1-form">Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
                    ) : step < 6 ? (
                        <Button onClick={() => setStep(s => s + 1)}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
                    ) : (
                        <Button onClick={submitAll} className="bg-green-600 hover:bg-green-700">Finish Setup</Button>
                    )}
                </CardFooter>
            </Card>

            <Button variant="link" onClick={() => router.push('/dashboard')} className="mt-4 text-slate-500">
                Skip for now (Dev only)
            </Button>
        </div>
    );
}
