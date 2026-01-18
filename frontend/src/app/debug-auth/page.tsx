'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/lib/store/auth-store';
import { getAccessToken } from '@/lib/api/client';
import { authApi } from '@/lib/api/auth';
import { UserRole } from '@/types/auth';

export default function DebugAuthPage() {
    const [email, setEmail] = useState('debug@example.com');
    const [password, setPassword] = useState('DebugPass123!');
    const [logs, setLogs] = useState<string[]>([]);
    const { user, isAuthenticated, isLoading, login, register } = useAuth();
    const authStore = useAuthStore();

    const log = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        setLogs(prev => [...prev, logMessage]);
    };

    const clearLogs = () => setLogs([]);

    useEffect(() => {
        log('🔍 Debug Auth Page Loaded');
        log(`User: ${user ? JSON.stringify(user) : 'null'}`);
        log(`Is Authenticated: ${isAuthenticated}`);
        log(`Is Loading: ${isLoading}`);
        log(`Access Token: ${getAccessToken() ? 'Present' : 'None'}`);
    }, [user, isAuthenticated, isLoading]);

    const testRegister = async () => {
        try {
            log('🔐 Testing Registration...');
            await register({
                name: 'Debug User',
                email,
                password,
                role: UserRole.SELLER
            });
            log('✅ Registration successful');
            log(`New Access Token: ${getAccessToken() ? 'Present' : 'None'}`);
        } catch (error: any) {
            log(`❌ Registration failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const testLogin = async () => {
        try {
            log('🔐 Testing Login...');
            await login({ email, password });
            log('✅ Login successful');
            log(`New Access Token: ${getAccessToken() ? 'Present' : 'None'}`);
        } catch (error: any) {
            log(`❌ Login failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const testProtectedRoute = async () => {
        try {
            log('🔒 Testing Protected Route...');
            const profile = await authApi.getProfile();
            log(`✅ Profile fetch successful: ${JSON.stringify(profile)}`);
        } catch (error: any) {
            log(`❌ Profile fetch failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const testHotelOnboarding = async () => {
        try {
            log('🏨 Testing Hotel Onboarding...');
            
            // Import hotels API dynamically
            const { hotelsApi } = await import('@/lib/api/hotels');
            
            const hotelData = {
                name: 'Debug Hotel',
                description: 'A test hotel for debugging',
                address: '123 Debug Street',
                city: 'Debug City',
                state: 'Debug State',
                pincode: '123456',
                phone: '+1234567890',
                email: 'debug@hotel.com',
                hotelType: 'HOTEL' as const,
                amenities: ['WiFi', 'Parking'],
                rooms: [{
                    name: 'Debug Room',
                    description: 'A test room',
                    roomType: 'SINGLE' as const,
                    basePrice: 1000,
                    maxOccupancy: 2,
                    amenities: ['AC', 'TV'],
                    totalRooms: 5
                }]
            };
            
            const result = await hotelsApi.createOnboarding(hotelData);
            log(`✅ Hotel onboarding successful: ${JSON.stringify(result)}`);
        } catch (error: any) {
            log(`❌ Hotel onboarding failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const checkTokens = () => {
        log('🔍 Checking Token State...');
        log(`Access Token: ${getAccessToken() ? 'Present' : 'None'}`);
        log(`LocalStorage Auth: ${JSON.stringify(localStorage.getItem('auth-storage'))}`);
        log(`Auth Store State: ${JSON.stringify({ user: authStore.user, isAuthenticated: authStore.isAuthenticated })}`);
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle>Authentication Debug Page</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold mb-2">Current State</h3>
                            <div className="text-sm space-y-1">
                                <p>User: {user ? user.email : 'Not logged in'}</p>
                                <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
                                <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
                                <p>Access Token: {getAccessToken() ? 'Present' : 'None'}</p>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold mb-2">Test Credentials</h3>
                            <div className="space-y-2">
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={testRegister} size="sm">Register</Button>
                        <Button onClick={testLogin} size="sm">Login</Button>
                        <Button onClick={testProtectedRoute} size="sm">Test Profile</Button>
                        <Button onClick={testHotelOnboarding} size="sm">Test Hotel Onboarding</Button>
                        <Button onClick={checkTokens} size="sm" variant="outline">Check Tokens</Button>
                        <Button onClick={clearLogs} size="sm" variant="outline">Clear Logs</Button>
                    </div>
                    
                    <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <h3 className="font-semibold mb-2">Debug Logs:</h3>
                        {logs.length === 0 ? (
                            <p className="text-gray-500">No logs yet</p>
                        ) : (
                            <div className="space-y-1">
                                {logs.map((log, index) => (
                                    <div key={index} className="text-xs font-mono">
                                        {log}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}