'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Loader2, Hotel as HotelIcon, ChevronLeft, Wifi, Car, Coffee, Info } from 'lucide-react';
import Link from 'next/link';
import { hotelsApi } from '@/lib/api/hotels';

export default function HotelDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [hotel, setHotel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHotel = async () => {
            if (!params.slug) return;
            setLoading(true);
            try {
                const data = await hotelsApi.getHotelBySlug(params.slug as string);
                setHotel(data);
                setError(null);
            } catch (err: any) {
                console.error('Fetch hotel error:', err);
                setError(err.response?.data?.message || 'Property not found.');
            } finally {
                setLoading(false);
            }
        };

        fetchHotel();
    }, [params.slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500 font-medium">Verifying property details...</p>
            </div>
        );
    }

    if (error || !hotel) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Oops!</h2>
                <p className="text-slate-500 mb-6">{error || 'This property might have been moved or is pending approval.'}</p>
                <Button onClick={() => router.push('/search')}>Back to Search</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => router.back()}>
                                <ChevronLeft className="h-4 w-4 mr-1" /> Back
                            </Button>
                            <span className="h-6 w-px bg-slate-200" />
                            <h1 className="font-bold text-slate-900 hidden md:block">{hotel.name}</h1>
                        </div>
                        <Link href="/">
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Shambit</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Summary */}
                        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 capitalize">
                                    {hotel.hotelType.toLowerCase()}
                                </Badge>
                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Verified Property</Badge>
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{hotel.name}</h2>
                            <div className="flex items-center text-slate-600 mb-6">
                                <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                                {hotel.address}, {hotel.city}, {hotel.state} - {hotel.pincode}
                            </div>

                            <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center mb-8 border border-slate-200">
                                <HotelIcon className="h-16 w-16 text-slate-300" />
                            </div>

                            <div className="prose prose-slate max-w-none">
                                <h3 className="text-lg font-bold text-slate-800 mb-3">About this property</h3>
                                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                                    {hotel.description || 'No description provided by the owner.'}
                                </p>
                            </div>
                        </section>

                        {/* Rooms List */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <HotelIcon className="h-5 w-5 text-blue-500" /> Available Room Types
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {hotel.rooms && hotel.rooms.length > 0 ? (
                                    hotel.rooms.map((room: any) => (
                                        <Card key={room.id} className="border-slate-200 hover:border-blue-200 transition-colors">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                    <div>
                                                        <h4 className="text-lg font-bold text-slate-800">{room.name}</h4> {/* Changed from roomNumber to name */}
                                                        <p className="text-sm text-slate-500 capitalize">{room.roomType.toLowerCase()} Room</p>
                                                        <div className="flex gap-4 mt-2">
                                                            <div className="flex items-center text-xs text-slate-400">
                                                                <Wifi className="h-3 w-3 mr-1" /> Free WiFi
                                                            </div>
                                                            <div className="flex items-center text-xs text-slate-400">
                                                                <Coffee className="h-3 w-3 mr-1" /> Breakfast Available
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right w-full md:w-auto">
                                                        <div className="mb-2">
                                                            <span className="text-2xl font-black text-slate-900">₹{room.basePrice.toLocaleString()}</span>
                                                            <span className="text-sm text-slate-500">/night</span>
                                                        </div>
                                                        <Button className="w-full md:w-auto bg-blue-600">Reserve</Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
                                        <p className="text-slate-500">No rooms listed for this property yet.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Quick Contact */}
                        <Card className="shadow-lg border-2 border-blue-100">
                            <CardHeader className="bg-blue-50/50">
                                <CardTitle className="text-lg">Contact Property</CardTitle>
                                <CardDescription>Direct support for your stay</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Phone</span>
                                    <p className="font-medium text-slate-800">{hotel.phone}</p>
                                </div>
                                {hotel.email && (
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Email</span>
                                        <p className="font-medium text-slate-800">{hotel.email}</p>
                                    </div>
                                )}
                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3">
                                    <Info className="h-5 w-5 text-amber-500 flex-shrink-0" />
                                    <p className="text-xs text-amber-700 leading-tight">
                                        For your safety, always book through the platform or verified channels.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Amenities Sidebar */}
                        <Card className="border-slate-200">
                            <CardHeader>
                                <CardTitle className="text-lg">Amenities</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-y-3">
                                    {hotel.amenities?.map((amenity: string) => (
                                        <div key={amenity} className="flex items-center text-sm text-slate-600">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2" />
                                            {amenity}
                                        </div>
                                    ))}
                                </div>
                                {!hotel.amenities?.length && <p className="text-sm text-slate-400 italic">No amenities listed.</p>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
