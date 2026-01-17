"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Calendar, Users, Hotel, Utensils, Briefcase, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBar() {
    const [activeTab, setActiveTab] = useState("hotels");

    const tabs = [
        { id: "hotels", icon: Hotel, label: "Hotels" },
        { id: "homestays", icon: Home, label: "Homestays" },
        { id: "restaurants", icon: Utensils, label: "Restaurants" },
        { id: "packages", icon: Briefcase, label: "Packages" },
    ];

    return (
        <div 
            className="w-full bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            role="search"
            aria-label="Hotel search form"
        >
            {/* Top Tabs - MMT Style */}
            <div 
                className="flex bg-white border-b border-gray-100 overflow-x-auto scrollbar-hide"
                role="tablist"
                aria-label="Search categories"
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`${tab.id}-panel`}
                        className={cn(
                            "flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-bold transition-all relative min-w-[110px] justify-center whitespace-nowrap touch-manipulation min-h-[48px]",
                            activeTab === tab.id
                                ? "text-blue-600 bg-blue-50/50"
                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                        )}
                    >
                        {activeTab === tab.id && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 rounded-b-md" aria-hidden="true" />
                        )}
                        <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-blue-600" : "text-gray-400")} aria-hidden="true" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Input Area */}
            <div 
                className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4"
                id={`${activeTab}-panel`}
                role="tabpanel"
            >

                {/* Location Input */}
                <div className="md:col-span-4 relative group">
                    <label 
                        htmlFor="location-input"
                        className="absolute top-3 left-14 text-xs font-bold text-gray-500 uppercase tracking-wide pointer-events-none"
                    >
                        Where
                    </label>
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <MapPin className="w-6 h-6 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        id="location-input"
                        type="text"
                        className="w-full h-full min-h-[72px] border-2 border-transparent bg-gray-100/50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 pt-7 pb-2 pl-14 transition-all text-gray-900 font-bold text-base sm:text-lg placeholder:text-gray-400 focus:outline-none"
                        placeholder="Ayodhya, India"
                        defaultValue="Ayodhya, near Ram Mandir"
                        autoComplete="off"
                        aria-label="Enter destination city or location"
                    />
                    <p className="absolute bottom-2 left-14 text-[10px] text-gray-400 truncate max-w-[calc(100%-4rem)]" aria-hidden="true">
                        Ram Janmabhoomi, Hanuman Garhi...
                    </p>
                </div>

                {/* Date Input */}
                <div className="md:col-span-3 relative group">
                    <label 
                        htmlFor="date-input"
                        className="absolute top-3 left-14 text-xs font-bold text-gray-500 uppercase tracking-wide pointer-events-none"
                    >
                        Check-in — Out
                    </label>
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Calendar className="w-6 h-6 text-gray-400" aria-hidden="true" />
                    </div>
                    <button
                        id="date-input"
                        type="button"
                        className="w-full h-full min-h-[72px] border-2 border-transparent bg-gray-100/50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 pt-7 pb-2 pl-14 transition-all text-left focus:outline-none touch-manipulation"
                        aria-label="Select check-in and check-out dates"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-bold text-base sm:text-lg">Jan 16</span>
                            <span className="text-gray-400" aria-hidden="true">—</span>
                            <span className="text-gray-900 font-bold text-base sm:text-lg">Jan 17</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5" aria-hidden="true">1 Night</p>
                    </button>
                </div>

                {/* Guests Input */}
                <div className="md:col-span-3 relative group">
                    <label 
                        htmlFor="guests-input"
                        className="absolute top-3 left-14 text-xs font-bold text-gray-500 uppercase tracking-wide pointer-events-none"
                    >
                        Guests & Rooms
                    </label>
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Users className="w-6 h-6 text-gray-400" aria-hidden="true" />
                    </div>
                    <button
                        id="guests-input"
                        type="button"
                        className="w-full h-full min-h-[72px] border-2 border-transparent bg-gray-100/50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 pt-7 pb-2 pl-14 transition-all text-left focus:outline-none touch-manipulation"
                        aria-label="Select number of guests and rooms"
                    >
                        <span className="text-gray-900 font-bold text-base sm:text-lg block">2 Adults, 1 Room</span>
                        <p className="text-[10px] text-gray-400 mt-0.5" aria-hidden="true">Genius discounts applied</p>
                    </button>
                </div>

                {/* Search Button */}
                <div className="md:col-span-2">
                    <Button 
                        onClick={() => window.location.href = '/search?location=Ayodhya&checkin=2026-01-16&checkout=2026-01-17&guests=2'}
                        className="w-full h-full min-h-[72px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg sm:text-xl rounded-xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-[0.98] flex flex-col gap-1 touch-manipulation"
                        aria-label="Search hotels in Ayodhya"
                    >
                        <Search className="w-6 h-6" aria-hidden="true" />
                        <span className="text-xs sm:text-sm font-normal opacity-90 uppercase tracking-wider">Search</span>
                    </Button>
                </div>
            </div>

            {/* Recent Searches Footer */}
            <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-3 md:gap-4 overflow-x-auto scrollbar-hide">
                <span className="text-xs font-bold text-gray-400 whitespace-nowrap">Recent:</span>
                <div className="flex gap-2">
                    {["Ayodhya Dham", "Luxury Hotels", "Near Saryu Ghat"].map((term) => (
                        <button 
                            key={term} 
                            className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[36px]"
                            aria-label={`Search for ${term}`}
                        >
                            {term}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
