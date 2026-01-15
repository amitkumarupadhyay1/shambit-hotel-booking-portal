"use client";

import { Button } from "@/components/ui/button";
import { Menu, Bell, User } from "lucide-react";

interface DashboardHeaderProps {
    onMenuClick: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
    return (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Toggle navigation menu"
                >
                    <Menu className="w-6 h-6" aria-hidden="true" />
                </button>

                {/* Page Title */}
                <div className="flex-1 md:flex-none">
                    <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative min-h-[44px] min-w-[44px]"
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5" aria-hidden="true" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-[44px] min-w-[44px]"
                        aria-label="User profile"
                    >
                        <User className="w-5 h-5" aria-hidden="true" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
