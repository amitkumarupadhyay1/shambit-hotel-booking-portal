"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTABanner() {
    return (
        <section className="py-32 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-teal-600 to-cyan-700">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white space-y-8">
                <h2 className="text-4xl md:text-6xl font-bold font-serif tracking-tight max-w-4xl mx-auto drop-shadow-xl">
                    Ready for your Ayodhya journey?
                </h2>
                <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-md font-light">
                    Book your perfect stay today and experience the spiritual heart of India
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                    <Button size="lg" className="h-16 px-10 text-xl bg-white text-teal-600 hover:bg-teal-50 border-0 transition-all rounded-2xl shadow-2xl hover:scale-105 active:scale-95 duration-200 font-bold">
                        Find Your Stay
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </div>
        </section>
    );
}
