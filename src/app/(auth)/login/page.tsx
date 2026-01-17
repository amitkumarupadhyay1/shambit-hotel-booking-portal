'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { Loader2, Building2, User } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';

export default function LoginPage() {
    const { login } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const searchParams = useSearchParams();
    const isOwner = searchParams.get('type') === 'owner';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginInput) => {
        setIsSubmitting(true);
        try {
            await login(data);
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
        title: "Welcome Back, Partner",
        subtitle: "Sign in to manage your Ayodhya property",
        brandColor: "orange-600",
        registerLink: "/register?type=owner",
        registerText: "Register your property"
    } : {
        gradient: "from-blue-50 to-indigo-100",
        primary: "blue-600",
        primaryHover: "blue-700",
        border: "gray-200",
        focus: "blue-500",
        icon: User,
        title: "Welcome Back",
        subtitle: "Sign in to your account to continue",
        brandColor: "blue-600",
        registerLink: "/register",
        registerText: "Sign up"
    };

    const IconComponent = theme.icon;

    return (
        <div className={`flex min-h-screen items-center justify-center bg-gradient-to-br ${theme.gradient} p-4`}>
            <Card className={`w-full max-w-md shadow-2xl ${isOwner ? 'border-orange-100' : ''}`}>
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className={`h-10 w-10 rounded-full bg-${theme.primary} flex items-center justify-center`}>
                                <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            <span className={`text-2xl font-bold text-${theme.brandColor}`}>
                                Shambit{isOwner ? ' Partner' : ''}
                            </span>
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
                            <span className={`w-full border-t ${isOwner ? 'border-orange-200' : 'border-gray-200'}`} />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-gray-700">Password</Label>
                                <Link
                                    href="/forgot-password"
                                    className={`text-sm text-${theme.primary} hover:text-${theme.primaryHover} hover:underline`}
                                >
                                    Forgot password?
                                </Link>
                            </div>
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
                                    Signing in...
                                </>
                            ) : (
                                isOwner ? 'Sign In to Dashboard' : 'Sign In'
                            )}
                        </Button>
                    </form>

                    {isOwner && (
                        <div className="text-center text-sm text-gray-600 bg-orange-50 p-3 rounded-lg">
                            <p className="font-medium text-orange-800">Property Owner Benefits:</p>
                            <p className="mt-1">• Zero registration fees • 5-10% commission only • Easy management</p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-600">
                        {isOwner ? "New to Shambit?" : "Don't have an account?"}{' '}
                        <Link href={theme.registerLink} className={`font-semibold text-${theme.primary} hover:text-${theme.primaryHover} hover:underline`}>
                            {theme.registerText}
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
