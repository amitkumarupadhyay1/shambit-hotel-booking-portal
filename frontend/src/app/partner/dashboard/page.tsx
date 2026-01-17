'use client';

import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, Users, TrendingUp, Plus, Settings, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function PartnerDashboardPage() {
    const { user, isAuthenticated, isLoading, hasRole } = useAuth();

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
                        <Link href="/register?type=owner">
                            <Button>Become a Partner</Button>
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
                        <div className="flex items-center gap-2">
                            <Building2 className="h-8 w-8 text-orange-600" />
                            <span className="text-2xl font-bold text-orange-600">Shambit Partner</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-700">Welcome, {user?.name}</span>
                            <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-1" />
                                Settings
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Partner Dashboard</h1>
                    <p className="text-gray-600 mt-2">Manage your properties and bookings</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Properties</p>
                                    <p className="text-2xl font-bold text-gray-900">0</p>
                                </div>
                                <Building2 className="h-8 w-8 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                                    <p className="text-2xl font-bold text-gray-900">0</p>
                                </div>
                                <Calendar className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Guests</p>
                                    <p className="text-2xl font-bold text-gray-900">0</p>
                                </div>
                                <Users className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900">₹0</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Properties Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Your Properties
                            </CardTitle>
                            <CardDescription>
                                Manage your hotel listings and room inventory
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties listed yet</h3>
                                <p className="text-gray-600 mb-6">Add your first property to start receiving bookings</p>
                                <Link href="/onboarding">
                                    <Button className="bg-orange-600 hover:bg-orange-700">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Property
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Bookings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Recent Bookings
                            </CardTitle>
                            <CardDescription>
                                Latest reservations from your properties
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
                                <p className="text-gray-600 mb-6">Once you list a property, bookings will appear here</p>
                                <Button variant="outline">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    View Analytics
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Getting Started Guide */}
                <Card className="mt-8 border-orange-200 bg-orange-50">
                    <CardHeader>
                        <CardTitle className="text-orange-800">Getting Started</CardTitle>
                        <CardDescription className="text-orange-700">
                            Complete these steps to start earning with Shambit
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                                <div>
                                    <p className="font-medium text-orange-900">Add your property details</p>
                                    <p className="text-sm text-orange-700">Basic information, location, and amenities</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold">2</div>
                                <div>
                                    <p className="font-medium text-gray-700">Upload photos</p>
                                    <p className="text-sm text-gray-600">High-quality images of rooms and facilities</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold">3</div>
                                <div>
                                    <p className="font-medium text-gray-700">Set pricing and availability</p>
                                    <p className="text-sm text-gray-600">Configure room rates and calendar</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold">4</div>
                                <div>
                                    <p className="font-medium text-gray-700">Go live</p>
                                    <p className="text-sm text-gray-600">Submit for review and start receiving bookings</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}