'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAccessToken, setAccessToken } from '@/lib/api/client';
import { authManager } from '@/lib/auth/auth-manager';
import apiClient from '@/lib/api/client';

export default function DebugAuthPage() {
    const [tokenInfo, setTokenInfo] = useState<any>(null);
    const [apiStatus, setApiStatus] = useState<string>('');
    const [authResult, setAuthResult] = useState<any>(null);

    const checkToken = () => {
        const token = getAccessToken();
        if (token) {
            try {
                // Decode JWT payload (without verification - just for debugging)
                const payload = JSON.parse(atob(token.split('.')[1]));
                setTokenInfo({
                    token: token.substring(0, 50) + '...',
                    payload,
                    isExpired: payload.exp * 1000 < Date.now()
                });
            } catch (error) {
                setTokenInfo({ error: 'Invalid token format' });
            }
        } else {
            setTokenInfo(null);
        }
    };

    const testApiConnection = async () => {
        try {
            setApiStatus('Testing...');
            // Test health endpoint without API prefix
            const response = await fetch('http://localhost:3002/health');
            const data = await response.json();
            setApiStatus(`✅ API Connected: ${data.status}`);
        } catch (error: any) {
            setApiStatus(`❌ API Error: ${error.message}`);
        }
    };

    const testAuthEndpoint = async () => {
        try {
            setAuthResult('Testing...');
            const result = await authManager.checkAuth();
            setAuthResult(`✅ Auth Success: ${JSON.stringify(result, null, 2)}`);
        } catch (error: any) {
            setAuthResult(`❌ Auth Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
    };

    const testLogin = async () => {
        try {
            setAuthResult('Logging in...');
            const response = await apiClient.post('/auth/login', {
                email: 'owner@test.com',
                password: 'TestPass123!'
            });
            
            if (response.data.accessToken) {
                setAccessToken(response.data.accessToken);
                setAuthResult(`✅ Login Success: ${JSON.stringify(response.data.user, null, 2)}`);
                checkToken();
            }
        } catch (error: any) {
            setAuthResult(`❌ Login Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
    };

    const clearToken = () => {
        setAccessToken(null);
        setTokenInfo(null);
        setAuthResult(null);
    };

    useEffect(() => {
        checkToken();
        testApiConnection();
    }, []);

    return (
        <div className="container mx-auto p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Authentication Debug</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold">API Status:</h3>
                        <p className="text-sm">{apiStatus}</p>
                    </div>

                    <div>
                        <h3 className="font-semibold">Current Token:</h3>
                        {tokenInfo ? (
                            <pre className="text-xs bg-gray-100 p-2 rounded">
                                {JSON.stringify(tokenInfo, null, 2)}
                            </pre>
                        ) : (
                            <p className="text-sm text-gray-500">No token found</p>
                        )}
                    </div>

                    <div>
                        <h3 className="font-semibold">Auth Test Result:</h3>
                        <pre className="text-xs bg-gray-100 p-2 rounded whitespace-pre-wrap">
                            {authResult || 'Not tested yet'}
                        </pre>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={checkToken} size="sm">
                            Check Token
                        </Button>
                        <Button onClick={testApiConnection} size="sm">
                            Test API
                        </Button>
                        <Button onClick={testAuthEndpoint} size="sm">
                            Test Auth
                        </Button>
                        <Button onClick={testLogin} size="sm">
                            Test Login
                        </Button>
                        <Button onClick={clearToken} size="sm" variant="destructive">
                            Clear Token
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}