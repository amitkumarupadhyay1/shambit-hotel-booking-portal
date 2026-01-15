"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-gray-950 pt-20 pb-10 border-t border-gray-900 text-gray-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12">
                                <Image
                                    src="/ayodhya_logo.png"
                                    alt="Ayodhya Logo"
                                    fill
                                    className="object-contain brightness-0 invert"
                                />
                            </div>
                            <span className="font-serif text-3xl font-bold tracking-tight text-white">
                                Sham<span className="text-orange-500">Bit</span>
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed max-w-xs">
                            The official partner for authentic spiritual stays in Ayodhya. Verified listings, zero fees, and dedicated pilgrim support.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:text-white hover:bg-orange-600 transition-all">
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Company</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/about" className="hover:text-orange-500 transition-colors">About Us</Link></li>
                            <li><Link href="/careers" className="hover:text-orange-500 transition-colors">Careers</Link></li>
                            <li><Link href="/blog" className="hover:text-orange-500 transition-colors">Ayodhya Blog</Link></li>
                            <li><Link href="/press" className="hover:text-orange-500 transition-colors">Press & Media</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Support</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-gray-500" />
                                <a href="mailto:support@shambit.in" className="hover:text-orange-500">support@shambit.in</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-gray-500" />
                                <a href="tel:+919999999999" className="hover:text-orange-500">+91 999 999 9999</a>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                                <span>Ram Path, Naya Ghat,<br />Ayodhya, UP 224123</span>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Policies</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/privacy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-orange-500 transition-colors">Terms of Service</Link></li>
                            <li><Link href="/gst" className="hover:text-orange-500 transition-colors">GST Compliance</Link></li>
                            <li><Link href="https://uptourism.gov.in" target="_blank" className="hover:text-orange-500 transition-colors">UP Tourism Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-600">
                        © 2026 Shambit Pvt Ltd. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-xs text-gray-600 items-center">
                        <span className="flex items-center gap-2">
                            Made with <span className="text-red-500 animate-pulse">❤️</span> in Ayodhya
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
