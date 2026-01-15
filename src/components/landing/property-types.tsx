"use client";

import { motion } from "framer-motion";
import { Building2, Home, Hotel, Church, Crown, Wallet } from "lucide-react";
import { ArrowRight } from "lucide-react";

const PROPERTY_TYPES = [
    {
        id: 1,
        icon: Hotel,
        title: "Hotels",
        count: "450+ properties",
        color: "from-blue-500 to-blue-600",
        bgColor: "bg-blue-50",
        iconColor: "text-blue-600"
    },
    {
        id: 2,
        icon: Home,
        title: "Homestays",
        count: "280+ properties",
        color: "from-green-500 to-green-600",
        bgColor: "bg-green-50",
        iconColor: "text-green-600"
    },
    {
        id: 3,
        icon: Building2,
        title: "Guesthouses",
        count: "190+ properties",
        color: "from-purple-500 to-purple-600",
        bgColor: "bg-purple-50",
        iconColor: "text-purple-600"
    },
    {
        id: 4,
        icon: Church,
        title: "Dharamshalas",
        count: "120+ properties",
        color: "from-orange-500 to-orange-600",
        bgColor: "bg-orange-50",
        iconColor: "text-orange-600"
    },
    {
        id: 5,
        icon: Crown,
        title: "Luxury Resorts",
        count: "45+ properties",
        color: "from-yellow-500 to-yellow-600",
        bgColor: "bg-yellow-50",
        iconColor: "text-yellow-600"
    },
    {
        id: 6,
        icon: Wallet,
        title: "Budget Stays",
        count: "320+ properties",
        color: "from-teal-500 to-teal-600",
        bgColor: "bg-teal-50",
        iconColor: "text-teal-600"
    },
];

export function PropertyTypes() {
    return (
        <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        Browse by Property Type
                    </h2>
                    <p className="text-gray-600">
                        Find the perfect accommodation for your pilgrimage
                    </p>
                </div>

                {/* Property Type Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                    {PROPERTY_TYPES.map((type, index) => (
                        <motion.div
                            key={type.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group cursor-pointer"
                        >
                            <div className={`${type.bgColor} rounded-2xl p-6 text-center transition-all duration-300 group-hover:shadow-xl border border-transparent group-hover:border-gray-200 h-full flex flex-col items-center justify-center`}>
                                {/* Icon */}
                                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${type.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                    <type.icon className="w-8 h-8 text-white" />
                                </div>

                                {/* Title */}
                                <h3 className={`font-bold text-gray-900 text-base mb-1 ${type.iconColor}`}>
                                    {type.title}
                                </h3>

                                {/* Count */}
                                <p className="text-xs text-gray-500 mb-3">
                                    {type.count}
                                </p>

                                {/* Hover Arrow */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <ArrowRight className={`w-4 h-4 ${type.iconColor}`} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
