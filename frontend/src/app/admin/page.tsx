'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, Building, Activity, TrendingUp } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalHotels: 0,
        pendingApprovals: 0,
        totalBookings: 0,
    });

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'owner')) {
            router.push('/admin/login');
            return;
        }
    }, [user, isLoading, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/admin/login');
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-black">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!user || user.role !== 'owner') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Shambit Admin</h1>
                                <p className="text-sm text-gray-400">System Administration</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-white">{user.name}</p>
                                <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                            <Button
                                onClick={handleLogout}
                                variant="outline"
                                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {user.name}</h2>
                    <p className="text-gray-400">Manage your hotel booking platform from here.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
                            <p className="text-xs text-gray-500">Registered users</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-300">Total Hotels</CardTitle>
                            <Building className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.totalHotels}</div>
                            <p className="text-xs text-gray-500">Listed properties</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-300">Pending Approvals</CardTitle>
                            <Activity className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.pendingApprovals}</div>
                            <p className="text-xs text-gray-500">Awaiting review</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-300">Total Bookings</CardTitle>
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stats.totalBookings}</div>
                            <p className="text-xs text-gray-500">All time bookings</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-white">Hotel Management</CardTitle>
                            <CardDescription className="text-gray-400">
                                Manage hotel listings and approvals
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button
                                onClick={() => router.push('/admin/hotels')}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                View All Hotels
                            </Button>
                            <Button
                                onClick={() => router.push('/admin/hotels?status=pending')}
                                variant="outline"
                                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                                Pending Approvals
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-white">User Management</CardTitle>
                            <CardDescription className="text-gray-400">
                                Manage user accounts and permissions
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button
                                onClick={() => router.push('/admin/users')}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                View All Users
                            </Button>
                            <Button
                                onClick={() => router.push('/admin/users?role=seller')}
                                variant="outline"
                                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                            >
                                Hotel Owners
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Test Users Info */}
                <Card className="mt-8 bg-gray-900 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white">Test Users Available</CardTitle>
                        <CardDescription className="text-gray-400">
                            Use these credentials for testing different user roles
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h4 className="font-semibold text-red-400 mb-2">🔐 Admin</h4>
                                <p className="text-gray-300">Email: admin@shambithotels.com</p>
                                <p className="text-gray-300">Password: Admin123!</p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-400 mb-2">🏨 Hotel Owner</h4>
                                <p className="text-gray-300">Email: owner@example.com</p>
                                <p className="text-gray-300">Password: Seller123!</p>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h4 className="font-semibold text-green-400 mb-2">🛒 Customer</h4>
                                <p className="text-gray-300">Email: customer@example.com</p>
                                <p className="text-gray-300">Password: Customer123!</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}