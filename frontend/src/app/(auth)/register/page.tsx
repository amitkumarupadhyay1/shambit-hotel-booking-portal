'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { Loader2, Building2, User, CheckCircle, Star, Users, TrendingUp } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { registerSchema, RegisterInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';

export default function RegisterPage() {
    const { register: registerUser } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const searchParams = useSearchParams();
    const isOwner = searchParams.get('type') === 'owner';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterInput) => {
        setIsSubmitting(true);
        try {
            // Add role based on registration type
            const registrationData = {
                ...data,
                role: isOwner ? 'SELLER' : 'BUYER'
            };
            await registerUser(registrationData);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Owner-specific styling and content
    const theme = isOwner ? {
        gradient: "from-orange-50 via-white to-yellow-50",
        primary: "orange-600",
        primaryHover: "orange-700",
        border: "orange-200",
        focus: "orange-500",
        icon: Building2,
        title: "Start Your Journey",
        subtitle: "Create your property owner account",
        brandColor: "orange-600",
        loginLink: "/login?type=owner",
        loginText: "Sign in here"
    } : {
        gradient: "from-blue-50 to-indigo-100",
        primary: "blue-600",
        primaryHover: "blue-700",
        border: "gray-200",
        focus: "blue-500",
        icon: User,
        title: "Create Account",
        subtitle: "Join us to start your journey",
        brandColor: "blue-600",
        loginLink: "/login",
        loginText: "Sign in"
    };

    const IconComponent = theme.icon;

    if (isOwner) {
        // Owner registration with benefits sidebar
        return (
            <div className={`flex min-h-screen items-center justify-center bg-gradient-to-br ${theme.gradient} p-4`}>
                <div className="w-full max-w-4xl">
                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Left side - Benefits */}
                        <div className="hidden lg:flex lg:flex-col lg:justify-center">
                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <div className={`h-12 w-12 rounded-full bg-${theme.primary} flex items-center justify-center`}>
                                        <Building2 className="h-7 w-7 text-white" />
                                    </div>
                                    <span className={`text-3xl font-bold text-${theme.brandColor}`}>Shambit Partner</span>
                                </div>
                                
                                <h2 className="text-3xl font-bold text-gray-900">
                                    Join Ayodhya&apos;s Leading Hospitality Platform
                                </h2>
                                
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Zero Registration Fees</h3>
                                            <p className="text-gray-600">Start listing your property without any upfront costs</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-3">
                                        <TrendingUp className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Low Commission (5-10%)</h3>
                                            <p className="text-gray-600">Keep more of your earnings with our competitive rates</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-3">
                                        <Users className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Growing Customer Base</h3>
                                            <p className="text-gray-600">Access thousands of travelers visiting Ayodhya</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-3">
                                        <Star className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Easy Management</h3>
                                            <p className="text-gray-600">Simple dashboard to manage bookings and earnings</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-orange-100 p-4 rounded-lg">
                                    <p className="text-sm text-orange-800 font-medium">
                                        Join 500+ property owners already earning with Shambit
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Registration Form */}
                        <Card className={`shadow-2xl ${isOwner ? 'border-orange-100' : ''}`}>
                            <CardHeader className="space-y-1 text-center">
                                <div className="flex justify-center mb-4 lg:hidden">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-10 w-10 rounded-full bg-${theme.primary} flex items-center justify-center`}>
                                            <IconComponent className="h-6 w-6 text-white" />
                                        </div>
                                        <span className={`text-2xl font-bold text-${theme.brandColor}`}>Shambit</span>
                                    </div>
                                </div>
                                <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                                    {theme.title}
                                </CardTitle>
                                <CardDescription className="text-base text-gray-600">
                                    {theme.subtitle}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <GoogleSignInButton />

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className={`w-full border-t ${isOwner ? 'border-orange-200' : 'border-gray-200'}`} />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-gray-500">
                                            Or register with email
                                        </span>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="Your full name"
                                            {...register('name')}
                                            disabled={isSubmitting}
                                            className={`h-11 border-${theme.border} focus:border-${theme.focus} focus:ring-${theme.focus}`}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-500">{errors.name.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-gray-700">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            {...register('email')}
                                            disabled={isSubmitting}
                                            className={`h-11 border-${theme.border} focus:border-${theme.focus} focus:ring-${theme.focus}`}
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-500">{errors.email.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-gray-700">Phone Number (Optional)</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="+91 98765 43210"
                                            {...register('phone')}
                                            disabled={isSubmitting}
                                            className={`h-11 border-${theme.border} focus:border-${theme.focus} focus:ring-${theme.focus}`}
                                        />
                                        {errors.phone && (
                                            <p className="text-sm text-red-500">{errors.phone.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-gray-700">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            {...register('password')}
                                            disabled={isSubmitting}
                                            className={`h-11 border-${theme.border} focus:border-${theme.focus} focus:ring-${theme.focus}`}
                                        />
                                        {errors.password && (
                                            <p className="text-sm text-red-500">{errors.password.message}</p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        className={`w-full h-11 text-base bg-${theme.primary} hover:bg-${theme.primaryHover} focus:ring-${theme.focus}`}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating account...
                                            </>
                                        ) : (
                                            isOwner ? 'Create Property Owner Account' : 'Create Account'
                                        )}
                                    </Button>
                                </form>

                                <div className="text-center text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                                    By registering, you agree to our{' '}
                                    <Link href="/terms" className={`text-${theme.primary} hover:underline`}>
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link href="/privacy" className={`text-${theme.primary} hover:underline`}>
                                        Privacy Policy
                                    </Link>
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-center">
                                <p className="text-sm text-gray-600">
                                    Already have an account?{' '}
                                    <Link href={theme.loginLink} className={`font-semibold text-${theme.primary} hover:text-${theme.primaryHover} hover:underline`}>
                                        {theme.loginText}
                                    </Link>
                                </p>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Regular customer registration
    return (
        <div className={`flex min-h-screen items-center justify-center bg-gradient-to-br ${theme.gradient} p-4`}>
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className={`h-10 w-10 rounded-full bg-${theme.primary} flex items-center justify-center`}>
                                <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            <span className={`text-2xl font-bold text-${theme.brandColor}`}>Shambit</span>
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">
                        {theme.title}
                    </CardTitle>
                    <CardDescription className="text-base text-gray-600">
                        {theme.subtitle}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <GoogleSignInButton />

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">
                                Or register with email
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                {...register('name')}
                                disabled={isSubmitting}
                                className="h-11"
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                {...register('email')}
                                disabled={isSubmitting}
                                className="h-11"
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone (Optional)</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+91-9876543210"
                                {...register('phone')}
                                disabled={isSubmitting}
                                className="h-11"
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-500">{errors.phone.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                {...register('password')}
                                disabled={isSubmitting}
                                className="h-11"
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href={theme.loginLink} className={`font-semibold text-${theme.primary} hover:text-${theme.primaryHover} hover:underline`}>
                            {theme.loginText}
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
