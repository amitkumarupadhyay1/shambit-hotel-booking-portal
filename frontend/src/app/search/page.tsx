'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Wifi, Car, Coffee, Users, Calendar, Filter, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

// Mock hotel data - replace with API call
const mockHotels = [
    {
        id: '1',
        name: 'Shambit Grand Hotel',
        location: 'Ram Janmabhoomi, Ayodhya',
        distance: '0.5 km from Ram Mandir',
        rating: 4.5,
        reviews: 1250,
        price: 2500,
        originalPrice: 3200,
        images: ['/api/placeholder/400/300'],
        amenities: ['Free WiFi', 'Parking', 'Restaurant', 'AC'],
        type: 'Hotel',
        availability: 'Only 2 rooms left'
    },
    {
        id: '2',
        name: 'Ayodhya Heritage Resort',
        location: 'Saryu Ghat, Ayodhya',
        distance: '1.2 km from Ram Mandir',
        rating: 4.2,
        reviews: 890,
        price: 3500,
        originalPrice: 4200,
        images: ['/api/placeholder/400/300'],
        amenities: ['Pool', 'Spa', 'Free WiFi', 'Restaurant'],
        type: 'Resort',
        availability: 'Available'
    },
    {
        id: '3',
        name: 'Rama Homestay',
        location: 'Hanuman Garhi, Ayodhya',
        distance: '0.8 km from Ram Mandir',
        rating: 4.0,
        reviews: 456,
        price: 1800,
        originalPrice: 2200,
        images: ['/api/placeholder/400/300'],
        amenities: ['Free WiFi', 'Kitchen', 'Parking'],
        type: 'Homestay',
        availability: 'Available'
    }
];

export default function SearchPage() {
    const searchParams = useSearchParams();
    const [hotels, setHotels] = useState(mockHotels);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        priceRange: [0, 10000],
        rating: 0,
        amenities: [],
        propertyType: 'all'
    });

    const location = searchParams.get('location') || 'Ayodhya';
    const checkin = searchParams.get('checkin') || '';
    const checkout = searchParams.get('checkout') || '';
    const guests = searchParams.get('guests') || '2';

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-lg h-64"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <Link href="/" className="text-2xl font-bold text-blue-600">
                            Shambit
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/login">
                                <Button variant="outline">Login</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Summary */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Hotels in {location}
                            </h1>
                            <p className="text-gray-600">
                                {checkin} - {checkout} • {guests} guests • {hotels.length} properties found
                            </p>
                        </div>
                        <Button variant="outline" className="flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4" />
                            Filters
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-6">
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Filter by</h3>
                                
                                {/* Price Range */}
                                <div className="mb-6">
                                    <h4 className="font-medium text-gray-700 mb-2">Price per night</h4>
                                    <div className="space-y-2">
                                        <label className="flex items-center">
                                            <input type="checkbox" className="mr-2" />
                                            <span className="text-sm">₹0 - ₹2,000</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input type="checkbox" className="mr-2" />
                                            <span className="text-sm">₹2,000 - ₹4,000</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input type="checkbox" className="mr-2" />
                                            <span className="text-sm">₹4,000+</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Property Type */}
                                <div className="mb-6">
                                    <h4 className="font-medium text-gray-700 mb-2">Property type</h4>
                                    <div className="space-y-2">
                                        <label className="flex items-center">
                                            <input type="checkbox" className="mr-2" />
                                            <span className="text-sm">Hotels</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input type="checkbox" className="mr-2" />
                                            <span className="text-sm">Resorts</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input type="checkbox" className="mr-2" />
                                            <span className="text-sm">Homestays</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Amenities */}
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Amenities</h4>
                                    <div className="space-y-2">
                                        <label className="flex items-center">
                                            <input type="checkbox" className="mr-2" />
                                            <span className="text-sm">Free WiFi</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input type="checkbox" className="mr-2" />
                                            <span className="text-sm">Parking</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input type="checkbox" className="mr-2" />
                                            <span className="text-sm">Restaurant</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input type="checkbox" className="mr-2" />
                                            <span className="text-sm">Pool</span>
                                        </label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Hotels List */}
                    <div className="lg:col-span-3">
                        <div className="space-y-4">
                            {hotels.map((hotel) => (
                                <Card key={hotel.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <CardContent className="p-0">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                                            {/* Hotel Image */}
                                            <div className="md:col-span-1">
                                                <div className="relative h-48 md:h-full bg-gray-200">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-20"></div>
                                                    <div className="absolute top-4 left-4">
                                                        <Badge variant="secondary" className="bg-white/90 text-gray-800">
                                                            {hotel.type}
                                                        </Badge>
                                                    </div>
                                                    {hotel.availability === 'Only 2 rooms left' && (
                                                        <div className="absolute bottom-4 left-4">
                                                            <Badge variant="destructive" className="bg-red-500">
                                                                {hotel.availability}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Hotel Details */}
                                            <div className="md:col-span-2 p-6">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                            {hotel.name}
                                                        </h3>
                                                        <div className="flex items-center text-gray-600 text-sm mb-2">
                                                            <MapPin className="h-4 w-4 mr-1" />
                                                            {hotel.location}
                                                        </div>
                                                        <p className="text-sm text-gray-500">{hotel.distance}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                            <span className="font-semibold">{hotel.rating}</span>
                                                            <span className="text-sm text-gray-500">({hotel.reviews})</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500">Excellent</p>
                                                    </div>
                                                </div>

                                                {/* Amenities */}
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {hotel.amenities.map((amenity) => (
                                                        <Badge key={amenity} variant="outline" className="text-xs">
                                                            {amenity}
                                                        </Badge>
                                                    ))}
                                                </div>

                                                {/* Pricing and Book Button */}
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-500 line-through">
                                                                ₹{hotel.originalPrice.toLocaleString()}
                                                            </span>
                                                            <span className="text-2xl font-bold text-gray-900">
                                                                ₹{hotel.price.toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-500">per night</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline">View Details</Button>
                                                        <Button className="bg-blue-600 hover:bg-blue-700">
                                                            Book Now
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Load More */}
                        <div className="text-center mt-8">
                            <Button variant="outline" size="lg">
                                Load More Hotels
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}