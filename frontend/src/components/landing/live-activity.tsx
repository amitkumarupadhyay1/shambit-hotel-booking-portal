"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Users, MapPin } from "lucide-react";

const MOCK_BOOKINGS = [
    { name: "Rajesh K.", location: "Lucknow", hotel: "Ram Prastham Homestay", time: "2 minutes ago" },
    { name: "Priya S.", location: "Delhi", hotel: "Saryu View Hotel", time: "5 minutes ago" },
    { name: "Amit P.", location: "Mumbai", hotel: "Ayodhya Palace", time: "8 minutes ago" },
    { name: "Sneha M.", location: "Bangalore", hotel: "Temple Town Inn", time: "12 minutes ago" },
    { name: "Vikram R.", location: "Pune", hotel: "Divine Homestay", time: "15 minutes ago" },
];

export function LiveActivity() {
    const [currentBooking, setCurrentBooking] = useState(0);
    const [show, setShow] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        // Show first notification after 3 seconds
        const initialTimeout = setTimeout(() => {
            setShow(true);
        }, 3000);

        const interval = setInterval(() => {
            setShow(false);
            setTimeout(() => {
                setCurrentBooking((prev) => (prev + 1) % MOCK_BOOKINGS.length);
                setShow(true);
            }, 500);
        }, 8000);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, []);

    const booking = MOCK_BOOKINGS[currentBooking];

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 50, scale: 0.3 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="fixed bottom-6 left-4 sm:left-6 z-40 bg-white rounded-xl shadow-2xl p-4 max-w-[calc(100vw-2rem)] sm:max-w-sm border border-gray-200"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md">
                            <Users className="w-5 h-5 text-white" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900">
                                {booking.name} from {booking.location}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                                <span className="truncate">Just booked <span className="font-semibold">{booking.hotel}</span></span>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">{booking.time}</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
