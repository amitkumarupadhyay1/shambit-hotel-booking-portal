"use client";

import { Quote, Star } from "lucide-react";

const TESTIMONIALS = [
    {
        quote: "The homestay near Ram Temple was serene and beautiful. The host made us feel like family.",
        author: "Rajesh Kumar",
        location: "Lucknow",
        rating: 5
    },
    {
        quote: "Booking was effortless. I loved the curated list of hygienic restaurants nearby.",
        author: "Priya Sharma",
        location: "Delhi",
        rating: 5
    },
    {
        quote: "As a property owner, Shambit has been a game changer. Zero fees and great support!",
        author: "Amit Singh",
        location: "Ayodhya Host",
        rating: 5
    }
];

export function Testimonials() {
    return (
        <section className="py-24 bg-white relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-bold font-serif text-center mb-16 tracking-tight text-gray-900">What Travelers Say</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="bg-gray-50 p-8 rounded-3xl relative hover:bg-orange-50/50 transition-colors duration-300">
                            <Quote className="absolute top-8 left-8 w-12 h-12 text-orange-200/50 fill-orange-200/20" />
                            <div className="relative z-10 pt-4">
                                <div className="flex gap-1 mb-6">
                                    {[...Array(t.rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 text-orange-400 fill-orange-400" />
                                    ))}
                                </div>
                                <p className="text-gray-700 text-lg font-medium italic mb-8 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                        {t.author[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 font-serif">{t.author}</h4>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{t.location}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
