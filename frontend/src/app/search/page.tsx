'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { searchApi, HotelSearchResult, PaginatedHotelSearchResult } from '@/lib/api/search';
import { Loader2, MapPin, Star, Users } from 'lucide-react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<PaginatedHotelSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract search parameters
  const city = searchParams.get('city') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guests = parseInt(searchParams.get('guests') || '1');
  const hotelType = searchParams.get('hotelType') || undefined;
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    if (!city || !checkIn || !checkOut) {
      setError('Missing required search parameters');
      setLoading(false);
      return;
    }

    const searchHotels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await searchApi.searchHotels({
          city,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guests,
          hotelType,
          page,
          limit: 20,
        });
        
        setResults(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to search hotels');
      } finally {
        setLoading(false);
      }
    };

    searchHotels();
  }, [city, checkIn, checkOut, guests, hotelType, page]);

  const handleHotelClick = (hotel: HotelSearchResult) => {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: guests.toString(),
    });
    
    router.push(`/hotels/${hotel.id}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/search?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Searching hotels...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!results || results.data.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">No hotels found</h2>
            <p className="text-gray-600">
              No hotels are available in {city} for your selected dates and guest count.
              Try different dates or search in a different city.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Summary */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          Hotels in {city}
        </h1>
        <p className="text-gray-600">
          {checkIn} - {checkOut} • {guests} guest{guests > 1 ? 's' : ''} • {results.data.length} hotel{results.data.length > 1 ? 's' : ''} available
        </p>
      </div>

      {/* Results Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {results.data.map((hotel) => (
          <Card key={hotel.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="p-0">
              {hotel.images.length > 0 && (
                <img
                  src={hotel.images[0]}
                  alt={hotel.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-lg">{hotel.name}</CardTitle>
                <Badge variant="secondary">{hotel.hotelType}</Badge>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                {hotel.address}
              </div>

              <div className="flex items-center mb-3">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="text-sm">
                  {hotel.averageRating.toFixed(1)} ({hotel.totalReviews} reviews)
                </span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-sm text-green-600">
                  <Users className="h-4 w-4 mr-1" />
                  {hotel.availableRooms} room{hotel.availableRooms > 1 ? 's' : ''} available
                </div>
                <div className="text-lg font-semibold">
                  ₹{hotel.startingPrice.toLocaleString()}
                  <span className="text-sm font-normal text-gray-600">/night</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => handleHotelClick(hotel)}
              >
                Check Availability
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {results.pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <Button
            variant="outline"
            disabled={results.pagination.page === 1}
            onClick={() => handlePageChange(results.pagination.page - 1)}
          >
            Previous
          </Button>
          
          <span className="flex items-center px-4">
            Page {results.pagination.page} of {results.pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            disabled={results.pagination.page === results.pagination.totalPages}
            onClick={() => handlePageChange(results.pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}