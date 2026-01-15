'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <Sidebar />
            <div className="md:pl-64 flex flex-col min-h-screen">
                <DashboardHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
