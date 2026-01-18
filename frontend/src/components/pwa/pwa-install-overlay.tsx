'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share, Plus, ChevronRight, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/use-pwa-install';

export function PWAInstallOverlay() {
    const {
        canInstall,
        showIOSInstructions,
        showAndroidInstructions,
        installApp,
        isMobileDevice
    } = usePWAInstall();

    const [isOpen, setIsOpen] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if user has already dismissed the overlay in this session
        const hasBeenDismissed = sessionStorage.getItem('pwa-install-dismissed');
        if (hasBeenDismissed) {
            setIsDismissed(true);
            return;
        }

        // Show the overlay after a delay if it's installable and not dismissed
        if ((canInstall || showIOSInstructions || showAndroidInstructions) && !isDismissed) {
            const timer = setTimeout(() => setIsOpen(true), 3000); // Increased delay
            return () => clearTimeout(timer);
        }
    }, [canInstall, showIOSInstructions, showAndroidInstructions, isDismissed]);

    const handleDismiss = () => {
        setIsOpen(false);
        setTimeout(() => {
            setIsDismissed(true);
            // Remember dismissal for this session
            sessionStorage.setItem('pwa-install-dismissed', 'true');
        }, 300);
    };

    const handleInstall = async () => {
        const success = await installApp();
        if (success) {
            handleDismiss();
        }
    };

    // Don't show if dismissed or not on mobile
    if (isDismissed || !isMobileDevice) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop Blur Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Bottom Sheet Modal - Mobile First */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-white/20 dark:border-zinc-800/50 rounded-t-3xl shadow-2xl max-w-md mx-auto"
                    >
                        {/* Handle Bar for Mobile Feel */}
                        <div className="w-10 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />

                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 shadow-lg flex items-center justify-center p-1 overflow-hidden border border-gray-100 dark:border-zinc-700">
                                    <img src="/logo.png" alt="Shambit" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Install Shambit</h2>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">Ayodhya Hotel Booking</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleDismiss}
                                className="rounded-full bg-gray-100/50 dark:bg-zinc-800/50 hover:bg-gray-200 dark:hover:bg-zinc-700 w-8 h-8"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Content Section */}
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-zinc-300">
                                Get faster access, offline booking, and exclusive mobile deals for Ayodhya hotels.
                            </p>

                            {/* Action/Instructions */}
                            {canInstall ? (
                                <div className="flex flex-col gap-2">
                                    <Button
                                        onClick={handleInstall}
                                        className="w-full h-12 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                                    >
                                        <Download className="w-4 h-4" />
                                        Add to Home Screen
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={handleDismiss}
                                        className="text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300 text-sm"
                                    >
                                        Maybe Later
                                    </Button>
                                </div>
                            ) : showIOSInstructions ? (
                                <div className="bg-white/50 dark:bg-zinc-800/50 rounded-xl p-3 space-y-3 border border-white/20">
                                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">How to Install</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <Share className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <p className="text-xs text-gray-700 dark:text-zinc-200">
                                                1. Tap the <span className="font-bold">Share</span> button in Safari
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <p className="text-xs text-gray-700 dark:text-zinc-200">
                                                2. Select <span className="font-bold">Add to Home Screen</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : showAndroidInstructions ? (
                                <div className="bg-white/50 dark:bg-zinc-800/50 rounded-xl p-3 space-y-3 border border-white/20">
                                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">How to Install</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="w-0.5 h-0.5 bg-gray-600 rounded-full" />
                                                    <div className="w-0.5 h-0.5 bg-gray-600 rounded-full" />
                                                    <div className="w-0.5 h-0.5 bg-gray-600 rounded-full" />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-700 dark:text-zinc-200">
                                                1. Tap the <span className="font-bold">Menu (⋮)</span> in Chrome
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                <Smartphone className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <p className="text-xs text-gray-700 dark:text-zinc-200">
                                                2. Tap <span className="font-bold">Install App</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {/* Footer Badge */}
                            <div className="pt-1 flex items-center justify-center gap-2 opacity-30 grayscale pointer-events-none">
                                <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Ayodhya Hotels</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
