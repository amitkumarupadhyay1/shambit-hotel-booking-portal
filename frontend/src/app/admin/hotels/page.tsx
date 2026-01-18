'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, ExternalLink, MapPin, Building, Info, AlertTriangle } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminHotelsPage() {
    const [hotels, setHotels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getPendingHotels();
            setHotels(data);
        } catch (error) {
            toast.error('Failed to fetch pending properties');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            await adminApi.approveHotel(id);
            toast.success('Property approved successfully');
            setHotels(hotels.filter(h => h.id !== id));
        } catch (error) {
            toast.error('Failed to approve property');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt('Enter rejection reason:');
        if (reason === null) return;

        setProcessingId(id);
        try {
            await adminApi.rejectHotel(id, reason || 'Incomplete details');
            toast.success('Property rejected');
            setHotels(hotels.filter(h => h.id !== id));
        } catch (error) {
            toast.error('Failed to reject property');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-500 font-medium">Loading pending approvals...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Property Approvals</h1>
                        <p className="text-slate-500">Review and verify new hotel listings before they go public.</p>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1 text-sm font-bold">
                        {hotels.length} Pending Actions
                    </Badge>
                </div>

                {hotels.length === 0 ? (
                    <Card className="bg-white border-dashed border-2 border-slate-200 shadow-none">
                        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                <CheckCircle className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Clear!</h3>
                            <p className="text-slate-500 max-w-xs">No pending property registrations to review at this time.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {hotels.map((hotel) => (
                            <Card key={hotel.id} className="bg-white border-slate-200 overflow-hidden shadow-md hover:shadow-lg transition-all">
                                <div className="p-1 bg-amber-400" />
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row justify-between gap-8">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h2 className="text-2xl font-black text-slate-900">{hotel.name}</h2>
                                                        <Badge variant="secondary" className="capitalize text-[10px] font-black tracking-widest">{hotel.hotelType}</Badge>
                                                    </div>
                                                    <div className="flex items-center text-slate-500 text-sm">
                                                        <MapPin className="h-4 w-4 mr-1 text-blue-500" />
                                                        {hotel.city}, {hotel.state}
                                                    </div>
                                                </div>
                                                <Link href={`/hotels/slug/${hotel.slug}`} target="_blank">
                                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                        <ExternalLink className="h-4 w-4 mr-1" /> Preview
                                                    </Button>
                                                </Link>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-3">
                                                        <Building className="h-5 w-5 text-slate-400 mt-0.5" />
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Address</p>
                                                            <p className="text-sm text-slate-700">{hotel.address}, {hotel.pincode}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <Info className="h-5 w-5 text-slate-400 mt-0.5" />
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Contact</p>
                                                            <p className="text-sm text-slate-700">{hotel.phone} {hotel.email ? `| ${hotel.email}` : ''}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-3 border-l pl-6 border-slate-200">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Owner Info</p>
                                                        <p className="text-sm text-slate-700 font-bold">{hotel.owner?.name || 'Loading...'}</p>
                                                        <p className="text-xs text-slate-500">{hotel.owner?.email || 'No email available'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Rooms</p>
                                                        <p className="text-sm text-slate-700 font-black">{hotel.rooms?.length || 0} Categories Registered</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 flex gap-3">
                                                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                                                <p className="text-xs text-slate-600 leading-normal">
                                                    Ensure you've verified the property documents and contact details before approval. Once approved, it will be visible to the public.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex lg:flex-col justify-end gap-3 min-w-[200px]">
                                            <Button
                                                onClick={() => handleApprove(hotel.id)}
                                                disabled={processingId === hotel.id}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs tracking-widest h-12 shadow-lg shadow-green-100"
                                            >
                                                {processingId === hotel.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                                    <><CheckCircle className="h-4 w-4 mr-2" /> Approve</>
                                                )}
                                            </Button>
                                            <Button
                                                onClick={() => handleReject(hotel.id)}
                                                disabled={processingId === hotel.id}
                                                variant="outline"
                                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-black uppercase text-xs tracking-widest h-12"
                                            >
                                                <XCircle className="h-4 w-4 mr-2" /> Reject
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
