'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Phone, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function MyBookingsPage() {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle>Please Login</CardTitle>
                        <CardDescription>You need to login to view your bookings</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Link href="/login">
                            <Button>Login to Continue</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <Link href="/" className="text-2xl font-bold text-blue-600">
                                Shambit
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-700">Welcome, {user?.name}</span>
                            <Link href="/">
                                <Button variant="outline">Browse Hotels</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
                    <p className="text-gray-600 mt-2">Manage your hotel reservations</p>
                </div>

                {/* Feature Coming Soon Notice */}
                <Card className="border-l-4 border-l-blue-500 mb-6">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Booking Feature Coming Soon!</h3>
                                <p className="text-gray-600 text-sm">
                                    Online booking functionality will be available in the next update. 
                                    For now, please contact hotels directly to make reservations.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bookings List - Placeholder for now */}
                <div className="space-y-6">
                    {/* No bookings state */}
                    <Card>
                        <CardContent className="text-center py-12">
                            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
                            <p className="text-gray-600 mb-6">Start exploring amazing hotels in Ayodhya</p>
                            <Link href="/">
                                <Button>Browse Hotels</Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Future booking functionality preview */}
                    <Card className="border-dashed border-2 border-gray-300 opacity-60">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg text-gray-500">Future Booking Example</CardTitle>
                                    <CardDescription className="flex items-center gap-1 mt-1">
                                        <MapPin className="h-4 w-4" />
                                        Ram Janmabhoomi, Ayodhya
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                        Coming Soon
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Check-in</p>
                                        <p className="text-sm text-gray-400">Future Date</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Check-out</p>
                                        <p className="text-sm text-gray-400">Future Date</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Guests</p>
                                        <p className="text-sm text-gray-400">2 Adults</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500">Total Amount</p>
                                    <p className="text-lg font-semibold text-gray-400">₹--,---</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" disabled>
                                        <Phone className="h-4 w-4 mr-1" />
                                        Contact Hotel
                                    </Button>
                                    <Button variant="outline" size="sm" disabled>
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}