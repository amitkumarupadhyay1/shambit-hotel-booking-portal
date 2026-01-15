"use client";

import { motion } from "framer-motion";
import { Sparkles, Gift, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PromotionsBanner() {
    return (
        <section className="py-6 bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-600 overflow-hidden relative">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-300 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Left Side - Main Promotion */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-4"
                    >
                        <div className="hidden sm:flex w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm items-center justify-center">
                            <Gift className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-center md:text-left">
                            <div className="flex items-center gap-2 justify-center md:justify-start">
                                <Sparkles className="w-4 h-4 text-yellow-300" />
                                <h3 className="text-white font-bold text-lg md:text-xl">
                                    Save up to 15% on your Ayodhya stay
                                </h3>
                            </div>
                            <p className="text-white/90 text-sm mt-1">
                                Book now and enjoy exclusive deals • Pay at hotel • Free cancellation
                            </p>
                        </div>
                    </motion.div>

                    {/* Right Side - CTA */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="flex items-center gap-3"
                    >
                        <Button
                            variant="secondary"
                            className="bg-white text-teal-600 hover:bg-teal-50 font-bold shadow-lg"
                        >
                            Find Deals
                        </Button>
                        <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                            <Crown className="w-4 h-4 text-yellow-300" />
                            <div className="text-left">
                                <p className="text-white text-xs font-semibold">Shambit Plus</p>
                                <p className="text-white/80 text-[10px]">Extra 10% off</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
