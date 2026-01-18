'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { searchApi, HotelDetailDto } from '@/lib/api/search';
import { Loader2, MapPin, Star, Users, Bed, Phone, Mail, Globe, Wifi, Car, Coffee } from 'lucide-react';

export default function HotelDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [hotel, setHotel] = useState<HotelDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hotelId = params.id as string;
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = searchParams.get('guests');

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const availabilityParams = checkIn && checkOut && guests ? {
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guests: parseInt(guests),
        } : undefined;
        
        const response = await searchApi.getHotelDetails(hotelId, availabilityParams);
        setHotel(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load hotel details');
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [hotelId, checkIn, checkOut, guests]);

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) return <Wifi className="h-4 w-4" />;
    if (amenityLower.includes('parking')) return <Car className="h-4 w-4" />;
    if (amenityLower.includes('breakfast') || amenityLower.includes('restaurant')) return <Coffee className="h-4 w-4" />;
    return null;
  };

  const handleContactHotel = () => {
    if (hotel?.phone) {
      window.open(`tel:${hotel.phone}`, '_self');
    }
  };

  const handleEmailHotel = () => {
    if (hotel?.email) {
      window.open(`mailto:${hotel.email}`, '_self');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading hotel details...</span>
        </div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error || 'Hotel not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hotel Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {hotel.address}, {hotel.city}, {hotel.state} - {hotel.pincode}
            </div>
            <div className="flex items-center">
              <Star className="h-5 w-5 text-yellow-400 mr-1" />
              <span className="font-semibold">{hotel.averageRating.toFixed(1)}</span>
              <span className="text-gray-600 ml-1">({hotel.totalReviews} reviews)</span>
              <Badge variant="secondary" className="ml-3">{hotel.hotelType}</Badge>
            </div>
          </div>
        </div>

        {/* Hotel Images */}
        {hotel.images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <img
              src={hotel.images[0]}
              alt={hotel.name}
              className="w-full h-64 md:h-80 object-cover rounded-lg md:col-span-2"
            />
            {hotel.images.slice(1, 3).map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${hotel.name} ${index + 2}`}
                className="w-full h-32 md:h-40 object-cover rounded-lg"
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Description */}
          {hotel.description && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>About this property</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{hotel.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Amenities */}
          {hotel.amenities.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {hotel.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      {getAmenityIcon(amenity)}
                      <span className="ml-2 text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rooms */}
          <Card>
            <CardHeader>
              <CardTitle>Available Rooms</CardTitle>
              {checkIn && checkOut && (
                <p className="text-sm text-gray-600">
                  For {checkIn} - {checkOut} • {guests} guest{parseInt(guests || '1') > 1 ? 's' : ''}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {hotel.rooms.length === 0 ? (
                <p className="text-gray-600">No rooms available for the selected dates.</p>
              ) : (
                <div className="space-y-4">
                  {hotel.rooms.map((room) => (
                    <div key={room.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{room.roomType}</h3>
                          <p className="text-sm text-gray-600">Room {room.name}</p> {/* Changed from roomNumber to name */}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            ₹{room.basePrice.toLocaleString()}
                            <span className="text-sm font-normal text-gray-600">/night</span>
                          </div>
                          {room.isAvailable ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              {room.availableCount} available
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Sold Out</Badge>
                          )}
                        </div>
                      </div>

                      {room.description && (
                        <p className="text-sm text-gray-700 mb-3">{room.description}</p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          Max {room.maxOccupancy} guests
                        </div>
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1" />
                          {room.bedCount} {room.bedType} bed{room.bedCount > 1 ? 's' : ''}
                        </div>
                        {room.roomSize && (
                          <div>{room.roomSize} sq m</div>
                        )}
                      </div>

                      {room.amenities.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-2">
                            {room.amenities.slice(0, 3).map((amenity, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                            {room.amenities.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{room.amenities.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <Button 
                        className="w-full" 
                        disabled={!room.isAvailable}
                        onClick={handleContactHotel}
                      >
                        {room.isAvailable ? 'Check Availability' : 'Sold Out'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Contact Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <span className="text-sm">{hotel.phone}</span>
              </div>
              
              {hotel.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm">{hotel.email}</span>
                </div>
              )}
              
              {hotel.website && (
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  <a 
                    href={hotel.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <Button 
                  className="w-full" 
                  onClick={handleContactHotel}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Hotel
                </Button>
                
                {hotel.email && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleEmailHotel}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email Hotel
                  </Button>
                )}
              </div>

              <div className="pt-4 text-xs text-gray-500">
                <p>
                  This property is not available for online booking yet. 
                  Please contact the hotel directly to make a reservation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}