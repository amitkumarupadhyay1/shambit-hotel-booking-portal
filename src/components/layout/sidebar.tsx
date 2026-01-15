'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Building2,
    BedDouble,
    CalendarDays,
    Banknote,
    BarChart3,
    Settings,
    HelpCircle,
    LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Building2, label: 'My Hotels', href: '/dashboard/hotels' },
    { icon: BedDouble, label: 'Rooms', href: '/dashboard/rooms' },
    { icon: CalendarDays, label: 'Bookings', href: '/dashboard/bookings' },
    { icon: Banknote, label: 'Revenue', href: '/dashboard/revenue' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-white dark:bg-slate-950 transition-transform duration-300 ease-in-out hidden md:flex flex-col">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-blue-600">
                    <span>Shambit</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3">
                <nav className="space-y-1">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                pathname === item.href
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="border-t p-4">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-200">
                            {user?.name}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {user?.email}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => logout()}
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </aside>
    );
}
