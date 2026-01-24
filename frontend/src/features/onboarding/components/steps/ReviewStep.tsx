/**
 * Review Step
 * Final review before publishing
 */

'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingDraft } from '../../types/onboarding';

interface ReviewStepProps {
    draftData: OnboardingDraft;
    onEditStep: (stepIndex: number) => void;
}

export function ReviewStep({ draftData, onEditStep }: ReviewStepProps) {
    const basicDetails = draftData['basic-details'] as any;
    const location = draftData['location'] as any;
    const amenities = draftData['amenities'] as any;
    const images = draftData['images'] as any;
    const rooms = draftData['rooms'] as any;
    const policies = draftData['policies'] as any;
    const businessFeatures = draftData['business-features'] as any;

    return (
        <div className="space-y-6">
            {/* Success message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-green-900">
                        Great! Your property profile is ready
                    </h3>
                    <p className="text-sm text-green-800 mt-1">
                        Review the information below and click "Publish" to make your property live
                    </p>
                </div>
            </div>

            {/* Basic Details */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Basic Details</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => onEditStep(0)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div>
                        <span className="text-sm text-gray-600">Property Name:</span>
                        <p className="font-medium">{basicDetails?.name || 'Not provided'}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Property Type:</span>
                        <p className="font-medium">{basicDetails?.hotelType || 'Not provided'}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Location */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Location</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => onEditStep(1)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div>
                        <span className="text-sm text-gray-600">Address:</span>
                        <p className="font-medium">{location?.address || 'Not provided'}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <span className="text-sm text-gray-600">City:</span>
                            <p className="font-medium">{location?.city || 'Not provided'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">State:</span>
                            <p className="font-medium">{location?.state || 'Not provided'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">Pincode:</span>
                            <p className="font-medium">{location?.pincode || 'Not provided'}</p>
                        </div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Phone:</span>
                        <p className="font-medium">{location?.phone || 'Not provided'}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Amenities</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => onEditStep(2)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-2">
                        {amenities?.selectedAmenities?.length || 0} amenities selected
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {amenities?.selectedAmenities?.slice(0, 10).map((amenityId: string) => (
                            <Badge key={amenityId} variant="secondary">
                                {amenityId}
                            </Badge>
                        ))}
                        {amenities?.selectedAmenities?.length > 10 && (
                            <Badge variant="outline">
                                +{amenities.selectedAmenities.length - 10} more
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Images */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Images</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => onEditStep(3)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                        {images?.images?.length || 0} images uploaded
                    </p>
                    {images?.images && images.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                            {images.images.slice(0, 8).map((image: any, index: number) => (
                                <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                        src={image.url}
                                        alt={`Property ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rooms */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Rooms</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => onEditStep(4)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-2">
                        {rooms?.rooms?.length || 0} room types configured
                    </p>
                    {rooms?.rooms && rooms.rooms.length > 0 && (
                        <div className="space-y-2">
                            {rooms.rooms.map((room: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{room.name}</p>
                                        <p className="text-sm text-gray-600">
                                            {room.roomType} • Max {room.maxOccupancy} guests
                                        </p>
                                    </div>
                                    <p className="font-semibold">₹{room.basePrice}/night</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Policies */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Policies</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => onEditStep(5)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-gray-600">Check-in:</span>
                            <p className="font-medium">{policies?.checkInTime || 'Not set'}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">Check-out:</span>
                            <p className="font-medium">{policies?.checkOutTime || 'Not set'}</p>
                        </div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Cancellation:</span>
                        <p className="font-medium">{policies?.cancellationPolicy || 'Not set'}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Business Features (if provided) */}
            {businessFeatures && businessFeatures.meetingRooms && businessFeatures.meetingRooms.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Business Features</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => onEditStep(6)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">
                            {businessFeatures.meetingRooms.length} meeting rooms configured
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Final note */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                    By publishing, you confirm that all information provided is accurate and you have the authority to list this property.
                </p>
            </div>
        </div>
    );
}
