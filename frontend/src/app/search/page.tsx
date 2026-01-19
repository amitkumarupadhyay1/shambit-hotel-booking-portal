'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { searchApi, HotelSearchResult, PaginatedHotelSearchResult } from '@/lib/api/search';
import { Loader2, MapPin } from 'lucide-react';

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
    // MUST require city, checkInDate, checkOutDate
    if (!city || !checkIn || !checkOut) {
      setError('Missing required search parameters');
      setLoading(false);
      return;
    }

    const searchHotels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // MUST fetch data from /hotels/search - MUST NOT use mock data
        const response = await searchApi.searchHotels({
          city,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guests,
          hotelType,
          page,
          limit: 10,
        });
        
        setResults(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to search hotels');
      } finally {
        setLoading(false);
      }
    };

    searchHotels();
  }, [city, checkIn, checkOut, guests, hotelType, page]); // MUST update results when: Dates change, City changes

  const handleHotelClick = (hotel: HotelSearchResult) => {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: guests.toString(),
    });
    
    router.push(`/hotels/${hotel.hotelId}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/search?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* MUST show loading state during API calls */}
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
            {/* MUST show empty state with explanation: "No hotels available for selected dates." */}
            <h2 className="text-xl font-semibold mb-2">No hotels available for selected dates</h2>
            <p className="text-gray-600">
              No hotels are available in {city} for your selected dates.
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
          <Card key={hotel.hotelId} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                {/* MUST display: Hotel name */}
                <CardTitle className="text-lg">{hotel.name}</CardTitle>
                <Badge variant="secondary">{hotel.hotelType}</Badge>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                {hotel.city}
              </div>

              <div className="flex items-center justify-between mb-3">
                {/* MUST display: Availability indicator */}
                <div className="text-sm text-green-600 font-medium">
                  {hotel.availabilityStatus}
                </div>
                {/* MUST display: Starting price */}
                <div className="text-lg font-semibold">
                  ₹{hotel.minBasePrice.toLocaleString()}
                  <span className="text-sm font-normal text-gray-600">/night</span>
                </div>
              </div>

              {/* CTA MUST be: "View Details" - MUST NOT display: "Book Now", Ratings, Reviews */}
              <Button 
                className="w-full" 
                onClick={() => handleHotelClick(hotel)}
              >
                View Details
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