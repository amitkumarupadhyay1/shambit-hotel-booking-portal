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
        // Show the overlay after a short delay if it's installable and not dismissed
        if ((canInstall || showIOSInstructions || showAndroidInstructions) && !isDismissed) {
            const timer = setTimeout(() => setIsOpen(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [canInstall, showIOSInstructions, showAndroidInstructions, isDismissed]);

    const handleDismiss = () => {
        setIsOpen(false);
        setTimeout(() => setIsDismissed(true), 300);
    };

    const handleInstall = async () => {
        const success = await installApp();
        if (success) {
            handleDismiss();
        }
    };

    if (isDismissed) return null;

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

                    {/* Bottom Sheet Modal */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-50 p-6 pb-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-white/20 dark:border-zinc-800/50 rounded-t-[32px] shadow-2xl md:max-w-lg md:mx-auto md:bottom-6 md:left-6 md:right-6 md:rounded-[32px] md:border md:pb-6"
                    >
                        {/* Handle Bar for Mobile Feel */}
                        <div className="w-12 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full mx-auto mb-6 md:hidden" />

                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 shadow-xl flex items-center justify-center p-1.5 overflow-hidden border border-gray-100 dark:border-zinc-700">
                                    <img src="/logo.png" alt="Shambit" className="w-[60%] h-[60%] object-contain" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Install Shambit</h2>
                                    <p className="text-sm text-gray-500 dark:text-zinc-400">Next-gen Hotel Booking</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleDismiss}
                                className="rounded-full bg-gray-100/50 dark:bg-zinc-800/50 hover:bg-gray-200 dark:hover:bg-zinc-700"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Content Section */}
                        <div className="space-y-6">
                            <p className="text-gray-600 dark:text-zinc-300">
                                Install our app for a faster experience, offline booking access, and exclusive app-only deals in Ayodhya.
                            </p>

                            {/* Action/Instructions */}
                            {canInstall ? (
                                <div className="flex flex-col gap-3">
                                    <Button
                                        onClick={handleInstall}
                                        className="w-full h-14 rounded-2xl bg-teal text-white text-lg font-semibold hover:bg-teal/90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-teal/20"
                                    >
                                        <Download className="w-5 h-5" />
                                        Add to Home Screen
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={handleDismiss}
                                        className="text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300"
                                    >
                                        Maybe Later
                                    </Button>
                                </div>
                            ) : showIOSInstructions ? (
                                <div className="bg-white/50 dark:bg-zinc-800/50 rounded-2xl p-4 space-y-4 border border-white/20">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">How to Install</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <Share className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-zinc-200">
                                                1. Tap the <span className="font-bold">Share</span> button in Safari.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-zinc-200">
                                                2. Select <span className="font-bold">Add to Home Screen</span>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : showAndroidInstructions ? (
                                <div className="bg-white/50 dark:bg-zinc-800/50 rounded-2xl p-4 space-y-4 border border-white/20">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">How to Install</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="w-1 h-1 bg-gray-600 rounded-full" />
                                                    <div className="w-1 h-1 bg-gray-600 rounded-full" />
                                                    <div className="w-1 h-1 bg-gray-600 rounded-full" />
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-zinc-200">
                                                1. Tap the <span className="font-bold">Menu (⋮)</span> in Chrome.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                <Smartphone className="w-5 h-5 text-gray-600" />
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-zinc-200">
                                                2. Tap <span className="font-bold">Install App</span> or <span className="font-bold">Add to Home screen</span>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {/* Footer Badge */}
                            <div className="pt-2 flex items-center justify-center gap-2 opacity-40 grayscale pointer-events-none">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Crafted for Ayodhya</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
