"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Heart } from "lucide-react";

const DEALS = [
    {
        id: 1,
        title: "Ram Prastham Homestay",
        location: "Near Hanuman Garhi",
        price: "₹1,299",
        originalPrice: "₹2,500",
        discount: "45% OFF",
        rating: 4.8,
        ratingCount: "(120)",
        image: "https://images.unsplash.com/photo-1590059390047-5804ee5574dc?q=80&w=1000&auto=format&fit=crop",
        tags: ["Couple Friendly", "Sanitized"]
    },
    {
        id: 2,
        title: "Saryu View Hotel",
        location: "Ram Ki Paidi",
        price: "₹2,499",
        originalPrice: "₹4,000",
        discount: "35% OFF",
        rating: 4.5,
        ratingCount: "(85)",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop",
        tags: ["River View", "Breakfast Included"]
    },
    {
        id: 3,
        title: "Ayodhya Palace",
        location: "Civil Lines",
        price: "₹3,999",
        originalPrice: "₹6,500",
        discount: "30% OFF",
        rating: 4.9,
        ratingCount: "(312)",
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1000&auto=format&fit=crop",
        tags: ["Luxury", "Spa"]
    },
    {
        id: 4,
        title: "Temple Town Inn",
        location: "Naya Ghat",
        price: "₹999",
        originalPrice: "₹1,800",
        discount: "50% OFF",
        rating: 4.2,
        ratingCount: "(45)",
        image: "https://images.unsplash.com/photo-1555854743-e3c2f6a581ad?q=80&w=1000&auto=format&fit=crop",
        tags: ["Budget", "Near Temple"]
    },
];

export function FeaturedDeals() {
    const shouldReduceMotion = useReducedMotion();

    return (
        <section 
            className="py-16 bg-white overflow-hidden"
            aria-labelledby="featured-deals-heading"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 
                            id="featured-deals-heading"
                            className="text-2xl md:text-3xl font-bold text-gray-900"
                        >
                            Deals for your next stay
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Save on top-rated properties in Ayodhya
                        </p>
                    </div>
                    <Button 
                        variant="link" 
                        className="text-teal-600 font-bold hover:text-teal-700 hidden md:flex min-h-[44px]"
                        aria-label="View all hotel deals in Ayodhya"
                    >
                        View All <ArrowRight className="ml-1 w-4 h-4" aria-hidden="true" />
                    </Button>
                </div>

                {/* Cards Grid */}
                <div 
                    className="flex overflow-x-auto pb-4 -mx-4 px-4 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:p-0 scrollbar-hide snap-x snap-mandatory"
                    role="list"
                    aria-label="Featured hotel deals"
                >
                    {DEALS.map((deal) => (
                        <motion.article
                            key={deal.id}
                            className="min-w-[280px] snap-center bg-white rounded-xl border border-gray-200 overflow-hidden group hover:shadow-xl transition-all duration-300 relative focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                            whileHover={shouldReduceMotion ? {} : { y: -5 }}
                            transition={{ duration: 0.2 }}
                            role="listitem"
                        >
                            <a 
                                href={`/hotel/${deal.id}`}
                                className="block focus:outline-none"
                                aria-label={`View ${deal.title} in ${deal.location}. Starting at ${deal.price} per night. Rated ${deal.rating} stars with ${deal.ratingCount} reviews.`}
                            >
                                {/* Image Section */}
                                <div className="relative h-48 w-full">
                                    <Image
                                        src={deal.image}
                                        alt={`${deal.title} - ${deal.location}`}
                                        fill
                                        sizes="(max-width: 768px) 280px, 25vw"
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <button 
                                        className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                                        aria-label={`Add ${deal.title} to favorites`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            // Handle favorite
                                        }}
                                    >
                                        <Heart className="w-5 h-5" aria-hidden="true" />
                                    </button>
                                    <div className="absolute bottom-2 left-2 flex gap-1.5 flex-wrap">
                                        {deal.tags.map(tag => (
                                            <span 
                                                key={tag} 
                                                className="px-2 py-1 rounded text-[10px] font-bold bg-white/95 text-gray-700 shadow-sm uppercase tracking-wide"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-teal-600 transition-colors line-clamp-1">
                                                {deal.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">{deal.location}</p>
                                        </div>
                                        <div 
                                            className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-sm font-bold shadow-sm ml-2 flex-shrink-0"
                                            aria-label={`Rated ${deal.rating} out of 5 stars`}
                                        >
                                            {deal.rating} <Star className="w-3 h-3 fill-white" aria-hidden="true" />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-end gap-2 flex-wrap">
                                        <span className="text-xl font-bold text-gray-900">{deal.price}</span>
                                        <span className="text-sm text-gray-400 line-through decoration-gray-400">{deal.originalPrice}</span>
                                        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{deal.discount}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">+ ₹145 taxes & fees</p>
                                </div>
                            </a>
                        </motion.article>
                    ))}
                </div>

                {/* Mobile View All Button */}
                <div className="mt-6 flex justify-center md:hidden">
                    <Button 
                        variant="outline" 
                        className="text-teal-600 font-bold border-teal-600 hover:bg-teal-50 min-h-[48px] touch-manipulation"
                        aria-label="View all hotel deals"
                    >
                        View All Deals <ArrowRight className="ml-1 w-4 h-4" aria-hidden="true" />
                    </Button>
                </div>
            </div>
        </section>
    );
}
