'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api/auth';
import { getApiUrl } from '@/lib/api/config';
import { UserRole } from '@/types/auth';

export default function AuthTestPage() {
    const [results, setResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const log = (message: string) => {
        console.log(message);
        setResults(prev => [...prev, message]);
    };

    const clearResults = () => {
        setResults([]);
    };

    const testApiConnection = async () => {
        setIsLoading(true);
        clearResults();
        
        try {
            log('🔍 Testing API Connection...');
            log(`API URL: ${getApiUrl()}`);
            
            // Test health endpoint
            const response = await fetch(getApiUrl().replace('/api/v1', '/health'));
            const data = await response.json();
            log('✅ Health check successful: ' + JSON.stringify(data));
            
        } catch (error) {
            log('❌ Health check failed: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const testRegistration = async () => {
        if (!email || !password) {
            log('❌ Please enter email and password');
            return;
        }

        setIsLoading(true);
        
        try {
            log('🔍 Testing Registration...');
            
            const registerData = {
                name: 'Test User',
                email: email,
                password: password,
                phone: '+1234567890',
                role: UserRole.BUYER
            };
            
            const response = await authApi.register(registerData);
            log('✅ Registration successful: ' + JSON.stringify(response.user));
            
        } catch (error: any) {
            log('❌ Registration failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const testLogin = async () => {
        if (!email || !password) {
            log('❌ Please enter email and password');
            return;
        }

        setIsLoading(true);
        
        try {
            log('🔍 Testing Login...');
            
            const response = await authApi.login({ email, password });
            log('✅ Login successful: ' + JSON.stringify(response.user));
            
            // Test protected route
            log('🔍 Testing protected route...');
            const profile = await authApi.getProfile();
            log('✅ Profile fetch successful: ' + JSON.stringify(profile));
            
        } catch (error: any) {
            log('❌ Login failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Authentication Test Page</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Input
                            type="password"
                            placeholder="Password (min 8 chars, uppercase, lowercase, number, special)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                        <Button 
                            onClick={testApiConnection} 
                            disabled={isLoading}
                            variant="outline"
                        >
                            Test API Connection
                        </Button>
                        <Button 
                            onClick={testRegistration} 
                            disabled={isLoading}
                            variant="outline"
                        >
                            Test Registration
                        </Button>
                        <Button 
                            onClick={testLogin} 
                            disabled={isLoading}
                            variant="outline"
                        >
                            Test Login
                        </Button>
                        <Button 
                            onClick={clearResults} 
                            disabled={isLoading}
                            variant="outline"
                        >
                            Clear Results
                        </Button>
                    </div>
                    
                    <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <h3 className="font-semibold mb-2">Test Results:</h3>
                        {results.length === 0 ? (
                            <p className="text-gray-500">No tests run yet</p>
                        ) : (
                            <div className="space-y-1">
                                {results.map((result, index) => (
                                    <div key={index} className="text-sm font-mono">
                                        {result}
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