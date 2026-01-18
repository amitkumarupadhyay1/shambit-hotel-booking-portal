"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, User, Globe, Smartphone, Crown, Briefcase, Home, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { InstallButton } from "@/components/pwa/install-button";

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu when clicking outside or on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMobileMenuOpen(false);
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (isMobileMenuOpen && !target.closest('[data-mobile-menu]')) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('click', handleClickOutside);
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('click', handleClickOutside);
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

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
                            onClick={toggleMobileMenu}
                            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                            aria-expanded={isMobileMenuOpen}
                            data-mobile-menu
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6" aria-hidden="true" />
                            ) : (
                                <Menu className="w-6 h-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Panel */}
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                            onClick={closeMobileMenu}
                            aria-hidden="true"
                        />
                        
                        {/* Mobile Menu */}
                        <div 
                            className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-out"
                            data-mobile-menu
                        >
                            {/* Mobile Menu Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex flex-col items-start leading-none">
                                        <span className="font-serif text-xl font-bold tracking-tight text-amber-600">
                                            Sham<span className="text-blue-900">Bit</span>
                                        </span>
                                        <span className="text-[8px] font-medium text-gray-500 tracking-widest uppercase ml-0.5">
                                            Ayodhya Stays
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={closeMobileMenu}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                                    aria-label="Close menu"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Mobile Menu Content */}
                            <div className="flex flex-col h-full">
                                {/* Navigation Links */}
                                <nav className="flex-1 px-4 py-6 space-y-2">
                                    {[
                                        { name: "Hotels", href: "/hotels", icon: Crown, description: "Luxury stays & budget hotels" },
                                        { name: "Homestays", href: "/homestays", icon: Home, description: "Local family experiences" },
                                        { name: "Packages", href: "/packages", icon: Briefcase, description: "Complete travel deals" },
                                    ].map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={closeMobileMenu}
                                            className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                                <item.icon className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">{item.name}</div>
                                                <div className="text-sm text-gray-500">{item.description}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </nav>

                                {/* Mobile Menu Footer */}
                                <div className="border-t border-gray-200 p-4 space-y-4">
                                    {/* Partner Link */}
                                    <Link 
                                        href="/owner"
                                        onClick={closeMobileMenu}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <Crown className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-blue-900">List your property</div>
                                            <div className="text-xs text-blue-600">Start earning today</div>
                                        </div>
                                    </Link>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="flex-1 gap-2"
                                        >
                                            <Globe className="w-4 h-4" />
                                            INR
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="flex-1 gap-2"
                                        >
                                            <Smartphone className="w-4 h-4" />
                                            App
                                        </Button>
                                    </div>

                                    {/* Login Button */}
                                    <Link href="/login" onClick={closeMobileMenu} className="block">
                                        <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold">
                                            <User className="w-4 h-4 mr-2" />
                                            Login / Sign up
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </header>
        </>
    );
}
