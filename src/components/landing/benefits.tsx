"use client";

import { ShieldCheck, UserCheck, Headset, Wallet } from "lucide-react";

export function Benefits() {
    return (
        <section className="py-8 bg-teal-50/50 border-y border-teal-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center justify-center md:justify-between gap-6 md:gap-4">
                    {[
                        { icon: Wallet, title: "Pay at Hotel", sub: "No advance payment" },
                        { icon: ShieldCheck, title: "Free Cancellation", sub: "On most bookings" },
                        { icon: UserCheck, title: "Verified Reviews", sub: "From real travelers" },
                        { icon: Headset, title: "24/7 Support", sub: "We're here to help" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 min-w-[200px]">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                                <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 leading-none">{item.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{item.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
