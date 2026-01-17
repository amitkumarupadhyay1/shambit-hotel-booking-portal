"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const DESTINATIONS = [
    {
        id: 1,
        name: "Ram Ki Paidi",
        properties: "180+ properties",
        description: "Riverside ghats with spiritual ambiance",
        image: "https://images.unsplash.com/photo-1609920658906-8223bd289001?q=80&w=1000&auto=format&fit=crop",
        tag: "Most Popular"
    },
    {
        id: 2,
        name: "Hanuman Garhi Area",
        properties: "220+ properties",
        description: "Near the famous Hanuman temple",
        image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1000&auto=format&fit=crop",
        tag: "Temple District"
    },
    {
        id: 3,
        name: "Civil Lines",
        properties: "150+ properties",
        description: "Modern amenities & luxury stays",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop",
        tag: "Luxury Zone"
    },
    {
        id: 4,
        name: "Naya Ghat",
        properties: "95+ properties",
        description: "Peaceful location near river",
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1000&auto=format&fit=crop",
        tag: "Serene"
    },
];

export function FeaturedDestinations() {
    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                            Popular areas in Ayodhya
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Find the perfect location for your stay
                        </p>
                    </div>
                    <Button variant="link" className="text-teal-600 font-bold hover:text-teal-700 hidden md:flex">
                        View All Areas <ArrowRight className="ml-1 w-4 h-4" />
                    </Button>
                </div>

                {/* Destinations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {DESTINATIONS.map((destination, index) => (
                        <motion.div
                            key={destination.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ y: -5 }}
                            className="group cursor-pointer rounded-xl overflow-hidden bg-white border border-gray-200 hover:shadow-2xl transition-all duration-300"
                        >
                            {/* Image Section */}
                            <div className="relative h-48 w-full overflow-hidden">
                                <Image
                                    src={destination.image}
                                    alt={destination.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                                {/* Tag */}
                                <div className="absolute top-3 left-3">
                                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-900 shadow-sm">
                                        {destination.tag}
                                    </span>
                                </div>

                                {/* Name & Properties Count - Overlaid on Image */}
                                <div className="absolute bottom-3 left-3 right-3">
                                    <h3 className="text-white font-bold text-lg mb-1 drop-shadow-lg">
                                        {destination.name}
                                    </h3>
                                    <div className="flex items-center gap-1 text-white/90 text-xs">
                                        <MapPin className="w-3 h-3" />
                                        <span>{destination.properties}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="p-4 bg-gradient-to-b from-gray-50 to-white">
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {destination.description}
                                </p>

                                {/* Explore Link */}
                                <div className="mt-3 flex items-center gap-1 text-teal-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span>Explore stays</span>
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Mobile View All Button */}
                <div className="mt-6 flex justify-center md:hidden">
                    <Button variant="outline" className="text-teal-600 font-bold border-teal-600 hover:bg-teal-50">
                        View All Areas <ArrowRight className="ml-1 w-4 h-4" />
                    </Button>
                </div>
            </div>
        </section>
    );
}
