'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SimpleTestPage() {
    const [result, setResult] = useState('');

    const testDirectFetch = async () => {
        try {
            setResult('Testing direct fetch...');
            
            const response = await fetch('http://localhost:3002/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'TestPass123!'
                })
            });

            const data = await response.json();
            setResult(`Response: ${response.status} - ${JSON.stringify(data, null, 2)}`);
            
        } catch (error) {
            setResult(`Error: ${(error as Error).message}`);
        }
    };

    const testAxios = async () => {
        try {
            setResult('Testing axios...');
            
            // Import axios dynamically to avoid SSR issues
            const axios = (await import('axios')).default;
            
            const response = await axios.post('http://localhost:3002/api/v1/auth/login', {
                email: 'test@example.com',
                password: 'TestPass123!'
            }, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            setResult(`Axios Response: ${response.status} - ${JSON.stringify(response.data, null, 2)}`);
            
        } catch (error: any) {
            setResult(`Axios Error: ${error.response?.status} - ${JSON.stringify(error.response?.data, null, 2) || error.message}`);
        }
    };

    const testHealth = async () => {
        try {
            setResult('Testing health endpoint...');
            
            const response = await fetch('http://localhost:3002/health');
            const data = await response.json();
            setResult(`Health: ${response.status} - ${JSON.stringify(data, null, 2)}`);
            
        } catch (error) {
            setResult(`Health Error: ${(error as Error).message}`);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-4">Simple API Test</h1>
            
            <div className="space-y-4">
                <div className="flex gap-2">
                    <Button onClick={testHealth}>Test Health</Button>
                    <Button onClick={testDirectFetch}>Test Direct Fetch</Button>
                    <Button onClick={testAxios}>Test Axios</Button>
                </div>
                
                <div className="bg-gray-100 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Result:</h3>
                    <pre className="whitespace-pre-wrap text-sm">{result || 'No test run yet'}</pre>
                </div>
            </div>
        </div>
    );
}