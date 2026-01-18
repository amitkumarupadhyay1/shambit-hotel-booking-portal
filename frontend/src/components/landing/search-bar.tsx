"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Calendar, Users, Hotel, Utensils, Briefcase, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBar() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("hotels");
    const [city, setCity] = useState("Ayodhya");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [guests, setGuests] = useState(2);

    // Set default dates
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    // Set default dates if not set
    if (!checkIn) setCheckIn(formatDate(today));
    if (!checkOut) setCheckOut(formatDate(tomorrow));

    const handleSearch = () => {
        if (!city.trim()) {
            alert('Please enter a city');
            return;
        }

        if (!checkIn || !checkOut) {
            alert('Please select check-in and check-out dates');
            return;
        }

        if (new Date(checkOut) <= new Date(checkIn)) {
            alert('Check-out date must be after check-in date');
            return;
        }

        const params = new URLSearchParams({
            city: city.trim(),
            checkIn,
            checkOut,
            guests: guests.toString(),
        });

        router.push(`/search?${params.toString()}`);
    };

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
                        placeholder="Enter city name"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        autoComplete="off"
                        aria-label="Enter destination city or location"
                    />
                    <p className="absolute bottom-2 left-14 text-[10px] text-gray-400 truncate max-w-[calc(100%-4rem)]" aria-hidden="true">
                        Search available hotels
                    </p>
                </div>

                {/* Date Input */}
                <div className="md:col-span-3 relative group">
                    <label
                        htmlFor="checkin-input"
                        className="absolute top-3 left-14 text-xs font-bold text-gray-500 uppercase tracking-wide pointer-events-none"
                    >
                        Check-in — Out
                    </label>
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Calendar className="w-6 h-6 text-gray-400" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col pt-7 pb-2 pl-14 pr-4 min-h-[72px] border-2 border-transparent bg-gray-100/50 hover:bg-gray-100 focus-within:bg-white focus-within:border-blue-500 rounded-xl transition-all">
                        <div className="flex items-center gap-2">
                            <input
                                id="checkin-input"
                                type="date"
                                value={checkIn}
                                onChange={(e) => setCheckIn(e.target.value)}
                                min={formatDate(today)}
                                className="bg-transparent text-gray-900 font-bold text-sm focus:outline-none"
                                aria-label="Check-in date"
                            />
                            <span className="text-gray-400" aria-hidden="true">—</span>
                            <input
                                type="date"
                                value={checkOut}
                                onChange={(e) => setCheckOut(e.target.value)}
                                min={checkIn || formatDate(tomorrow)}
                                className="bg-transparent text-gray-900 font-bold text-sm focus:outline-none"
                                aria-label="Check-out date"
                            />
                        </div>
                    </div>
                </div>

                {/* Guests Input */}
                <div className="md:col-span-3 relative group">
                    <label
                        htmlFor="guests-input"
                        className="absolute top-3 left-14 text-xs font-bold text-gray-500 uppercase tracking-wide pointer-events-none"
                    >
                        Guests
                    </label>
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Users className="w-6 h-6 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        id="guests-input"
                        type="number"
                        min="1"
                        max="10"
                        value={guests}
                        onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                        className="w-full h-full min-h-[72px] border-2 border-transparent bg-gray-100/50 hover:bg-gray-100 focus:bg-white focus:border-blue-500 rounded-xl px-4 pt-7 pb-2 pl-14 transition-all text-gray-900 font-bold text-base sm:text-lg focus:outline-none"
                        aria-label="Number of guests"
                    />
                    <p className="absolute bottom-2 left-14 text-[10px] text-gray-400" aria-hidden="true">
                        Max 10 guests
                    </p>
                </div>

                {/* Search Button */}
                <div className="md:col-span-2">
                    <Button
                        onClick={handleSearch}
                        className="w-full h-full min-h-[72px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg sm:text-xl rounded-xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-[0.98] flex flex-col gap-1 touch-manipulation"
                        aria-label="Search hotels"
                    >
                        <Search className="w-6 h-6" aria-hidden="true" />
                        <span className="text-xs sm:text-sm font-normal opacity-90 uppercase tracking-wider">Search</span>
                    </Button>
                </div>
            </div>

            {/* Recent Searches Footer */}
            <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-3 md:gap-4 overflow-x-auto scrollbar-hide">
                <span className="text-xs font-bold text-gray-400 whitespace-nowrap">Popular:</span>
                <div className="flex gap-2">
                    {["Ayodhya", "Delhi", "Mumbai", "Goa"].map((term) => (
                        <button
                            key={term}
                            onClick={() => setCity(term)}
                            className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[36px]"
                            aria-label={`Search for hotels in ${term}`}
                        >
                            {term}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
