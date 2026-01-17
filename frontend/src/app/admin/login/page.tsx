'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Shield } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminLoginPage() {
    const { login } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-black p-4">
            <Card className="w-full max-w-md shadow-2xl border-gray-800 bg-gray-900">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-red-500">Shambit Admin</span>
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-white">
                        Admin Access
                    </CardTitle>
                    <CardDescription className="text-base text-gray-400">
                        Authorized personnel only
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@shambit.com"
                                {...register('email')}
                                disabled={isSubmitting}
                                className="h-11 bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-red-500"
                            />
                            {errors.email && (
                                <p className="text-sm text-red-400">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-300">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                {...register('password')}
                                disabled={isSubmitting}
                                className="h-11 bg-gray-800 border-gray-700 text-white focus:border-red-500 focus:ring-red-500"
                            />
                            {errors.password && (
                                <p className="text-sm text-red-400">{errors.password.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base bg-red-600 hover:bg-red-700 focus:ring-red-500"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                'Access Admin Panel'
                            )}
                        </Button>
                    </form>

                    <div className="text-center text-xs text-gray-500 bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <p className="font-medium text-red-400">⚠️ Restricted Access</p>
                        <p className="mt-1">This area is for authorized administrators only</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}