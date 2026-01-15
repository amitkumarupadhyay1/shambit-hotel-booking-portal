"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SearchBar } from "./search-bar";
import Image from "next/image";
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
            {/* Hero Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/ramji.jpg"
                    alt="Ram Mandir Ayodhya - Divine spiritual destination"
                    fill
                    priority
                    quality={90}
                    sizes="100vw"
                    className="object-cover"
                />
                {/* Optimized Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/85 via-slate-900/70 to-slate-900/85" />
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
                            10,000+ pilgrims stayed last month
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
