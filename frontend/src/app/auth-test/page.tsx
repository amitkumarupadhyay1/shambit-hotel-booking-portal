'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthTestPage() {
    const { user, isAuthenticated, isLoading, login, register, logout, checkAuth } = useAuth();
    const [email, setEmail] = useState('owner@test.com');
    const [password, setPassword] = useState('TestPass123!');
    const [name, setName] = useState('Test Hotel Owner');

    const handleLogin = async () => {
        try {
            await login({ email, password });
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const handleRegister = async () => {
        try {
            await register({ name, email, password, role: 'SELLER' as any });
        } catch (error) {
            console.error('Registration failed:', error);
        }
    };

    const handleCheckAuth = async () => {
        try {
            await checkAuth();
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Authentication Test</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <strong>Status:</strong> {isLoading ? 'Loading...' : isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                    </div>
                    
                    {user && (
                        <div>
                            <strong>User:</strong> {user.name} ({user.email}) - Roles: {user.roles.join(', ')}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Input
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Input
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

                    <div className="flex gap-2">
                        <Button onClick={handleLogin} disabled={isLoading}>
                            Login
                        </Button>
                        <Button onClick={handleRegister} disabled={isLoading}>
                            Register
                        </Button>
                        <Button onClick={handleCheckAuth} disabled={isLoading}>
                            Check Auth
                        </Button>
                        <Button onClick={logout} disabled={isLoading}>
                            Logout
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}