"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, User, Globe, Smartphone, Crown, Briefcase, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { InstallButton } from "@/components/pwa/install-button";

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            {/* Skip to main content link - Accessibility */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:font-bold focus:text-base"
            >
                Skip to main content
            </a>

            <header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b",
                    isScrolled
                        ? "bg-white border-gray-200 py-2 shadow-sm"
                        : "bg-white/95 backdrop-blur-md border-transparent py-3"
                )}
                role="banner"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    {/* Logo Section */}
                    <div className="flex items-center gap-6 lg:gap-8">
                        <Link 
                            href="/" 
                            className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                            aria-label="Shambit - Go to homepage"
                        >
                            <div className="relative flex flex-col items-start leading-none">
                                <span className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-amber-600">
                                    Sham<span className="text-blue-900">Bit</span>
                                </span>
                                <span className="text-[10px] font-medium text-gray-500 tracking-widest uppercase ml-0.5">
                                    Ayodhya Stays
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav 
                            className="hidden md:flex items-center gap-4 lg:gap-6"
                            role="navigation"
                            aria-label="Main navigation"
                        >
                            {[
                                { name: "Hotels", href: "/hotels", icon: Crown },
                                { name: "Homestays", href: "/homestays", icon: Home },
                                { name: "Packages", href: "/packages", icon: Briefcase },
                            ].map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-amber-600 transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1 min-h-[44px] touch-manipulation"
                                    aria-label={`Browse ${item.name}`}
                                >
                                    <item.icon className="w-4 h-4 text-gray-400 group-hover:text-amber-600 transition-colors" aria-hidden="true" />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3 md:gap-4">
                        {/* Partner Link */}
                        <Link 
                            href="/owner" 
                            className="hidden lg:flex flex-col items-end group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                            aria-label="List your property as a partner"
                        >
                            <span className="text-xs font-bold text-gray-500 group-hover:text-amber-600 transition-colors">List your property</span>
                            <span className="text-[10px] text-gray-400">Start earning today</span>
                        </Link>

                        <div className="h-8 w-[1px] bg-gray-200 hidden lg:block" aria-hidden="true" />

                        {/* Currency Selector */}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="hidden lg:flex gap-2 text-gray-600 hover:text-blue-700 hover:bg-blue-50 min-h-[44px] touch-manipulation"
                            aria-label="Change currency - Currently INR"
                        >
                            <Globe className="w-4 h-4" aria-hidden="true" />
                            <span className="text-xs font-bold">INR</span>
                        </Button>

                        {/* App Download */}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="hidden sm:flex gap-2 text-gray-600 hover:text-blue-700 hover:bg-blue-50 min-h-[44px] touch-manipulation"
                            aria-label="Download mobile app"
                        >
                            <Smartphone className="w-4 h-4" aria-hidden="true" />
                            <span className="text-xs font-bold">App</span>
                        </Button>

                        {/* PWA Install Button */}
                        <InstallButton 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-600 hover:text-blue-700 hover:bg-blue-50 min-h-[44px] touch-manipulation"
                        />

                        {/* Login Button */}
                        <Link href="/login">
                            <Button
                                size="sm"
                                className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm border border-blue-700 font-bold px-4 sm:px-6 rounded-md min-h-[44px] touch-manipulation"
                                aria-label="Login or Sign up"
                            >
                                <User className="w-4 h-4 sm:hidden" aria-hidden="true" />
                                <span className="hidden sm:inline">Login / Sign up</span>
                            </Button>
                        </Link>

                        {/* Mobile Menu Trigger */}
                        <button 
                            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                            aria-label="Open navigation menu"
                            aria-expanded="false"
                        >
                            <Menu className="w-6 h-6" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </header>
        </>
    );
}
