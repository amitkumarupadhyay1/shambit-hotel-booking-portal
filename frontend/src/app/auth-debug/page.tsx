'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/auth';

export default function AuthDebugPage() {
    const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();
    const [email, setEmail] = useState('test@example.com');
    const [password, setPassword] = useState('Test123!@#');
    const [name, setName] = useState('Test User');
    const [phone, setPhone] = useState('1234567890');

    const handleLogin = async () => {
        try {
            await login({ email, password });
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    const handleRegister = async () => {
        try {
            await register({ 
                email, 
                password, 
                name, 
                phone,
                role: UserRole.SELLER 
            });
        } catch (error) {
            console.error('Register error:', error);
        }
    };

    return (
        <div className="p-8 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">Auth Debug</h1>
            
            <div className="mb-6 p-4 bg-gray-100 rounded">
                <h2 className="font-semibold mb-2">Current State:</h2>
                <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
                <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
                <p>User: {user ? user.email : 'None'}</p>
                <p>Role: {user ? user.roles.join(', ') : 'None'}</p>
            </div>

            {!isAuthenticated ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Name:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone:</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={handleLogin}
                            disabled={isLoading}
                            className="flex-1 bg-blue-500 text-white p-2 rounded disabled:opacity-50"
                        >
                            {isLoading ? 'Loading...' : 'Login'}
                        </button>
                        
                        <button
                            onClick={handleRegister}
                            disabled={isLoading}
                            className="flex-1 bg-green-500 text-white p-2 rounded disabled:opacity-50"
                        >
                            {isLoading ? 'Loading...' : 'Register'}
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <p className="mb-4">Welcome, {user?.name}!</p>
                    <button
                        onClick={logout}
                        className="w-full bg-red-500 text-white p-2 rounded"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}