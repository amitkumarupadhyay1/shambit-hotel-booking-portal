"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SearchBar } from "./search-bar";
import { ShieldCheck, Clock, Headphones } from "lucide-react";

export function Hero() {
    const shouldReduceMotion = useReducedMotion();

    const fadeIn = shouldReduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
        };

    return (
        <section
            className="relative min-h-[100svh] flex flex-col pt-20 pb-12 overflow-hidden"
            aria-labelledby="hero-heading"
        >
            {/* Premium Gradient Background - Spiritual & Modern */}
            <div className="absolute inset-0 z-0">
                {/* Main Gradient - Saffron to Deep Teal (Indian spiritual colors) */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF9933] via-[#138808] to-[#000080]" />

                {/* Overlay Gradient for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/70" />

                {/* Animated Gradient Orbs for visual interest */}
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/30 to-orange-600/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-teal-500/30 to-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Subtle Pattern Overlay for texture */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                    backgroundSize: '32px 32px'
                }} />
            </div>

            {/* Content Container */}
            <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center flex-1 w-full">

                {/* Headline - Apple Style: Clear, Emotional, Purposeful */}
                <motion.div
                    {...fadeIn}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8 md:mb-12 max-w-4xl"
                >
                    <h1
                        id="hero-heading"
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-serif text-white tracking-tight mb-4 md:mb-6 leading-[1.1]"
                    >
                        Experience Divine Hospitality in{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
                            Ayodhya
                        </span>
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl text-white/95 font-medium max-w-3xl mx-auto leading-relaxed">
                        Book verified stays near Ram Janmabhoomi from ₹999
                    </p>
                    <p className="text-sm sm:text-base text-white/75 mt-3 font-normal">
                        <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
                            Honest platform for verified pilgrim stays
                        </span>
                    </p>
                </motion.div>

                {/* Search Widget */}
                <motion.div
                    {...fadeIn}
                    transition={{ delay: 0.15, duration: 0.6 }}
                    className="w-full max-w-6xl mb-8 md:mb-12"
                >
                    <SearchBar />
                </motion.div>

                {/* Trust Badges - Apple Style: Minimal, Confident */}
                <motion.div
                    {...fadeIn}
                    transition={{ delay: 0.25, duration: 0.6 }}
                    className="flex flex-wrap gap-4 md:gap-6 items-center justify-center"
                    role="list"
                    aria-label="Service benefits"
                >
                    {[
                        {
                            icon: ShieldCheck,
                            text: "Pay at Hotel",
                            color: "from-green-400 to-emerald-500",
                            ariaLabel: "Secure payment - Pay at hotel"
                        },
                        {
                            icon: Clock,
                            text: "Free Cancellation",
                            color: "from-blue-400 to-cyan-500",
                            ariaLabel: "Flexible booking - Free cancellation"
                        },
                        {
                            icon: Headphones,
                            text: "24/7 Support",
                            color: "from-purple-400 to-pink-500",
                            ariaLabel: "Always available - 24/7 customer support"
                        },
                    ].map((badge, i) => (
                        <div
                            key={i}
                            role="listitem"
                            className="group px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-sm sm:text-base font-semibold flex items-center gap-2.5 hover:bg-white/15 transition-all duration-300 touch-manipulation min-h-[48px]"
                            aria-label={badge.ariaLabel}
                        >
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                <badge.icon className="w-4 h-4 text-white" aria-hidden="true" />
                            </div>
                            <span className="text-white">{badge.text}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
