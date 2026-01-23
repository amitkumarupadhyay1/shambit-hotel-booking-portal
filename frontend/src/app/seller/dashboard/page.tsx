'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { sellerApi, SellerDashboardDto } from '@/lib/api/seller';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/auth';
import { 
  Loader2, 
  Hotel, 
  Bed, 
  TrendingUp, 
  Calendar, 
  Eye, 
  Plus,
  Building2,
  Users,
  IndianRupee,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function SellerDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [dashboard, setDashboard] = useState<SellerDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has seller role
  const isSellerUser = user?.roles.includes(UserRole.SELLER) || false;

  useEffect(() => {
    console.log('🔍 Dashboard useEffect triggered:', { 
      authLoading, 
      userId: user?.id, 
      isSellerUser 
    });

    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }

    if (!user || !isSellerUser) {
      console.log('❌ User not authenticated or not seller, redirecting to login');
      router.push('/login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        console.log('📊 Fetching dashboard data...');
        setLoading(true);
        setError(null);

        const response = await sellerApi.getDashboard();
        console.log('✅ Dashboard data received:', response.data);
        setDashboard(response.data);
      } catch (err: any) {
        console.error('❌ Dashboard fetch failed:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user?.id, authLoading, router]); // Simplified dependencies

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user || !isSellerUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <p className="text-gray-600">You need to be a registered hotel partner to access this page</p>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/register?type=owner">
              <Button>Become a Partner</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-8 w-8 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">Shambit Partner</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-700">Welcome, {user?.name}</span>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center">
            <CardContent className="py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to Load Dashboard</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-x-2">
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
                <Link href="/onboarding">
                  <Button variant="outline">
                    Add Your First Property
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'REJECTED': return <XCircle className="h-4 w-4" />;
      case 'SUSPENDED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">Shambit Partner</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboard?.totalHotels || 0}</p>
                </div>
                <Hotel className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Rooms</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboard?.totalRooms || 0}</p>
                </div>
                <Bed className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboard?.occupancyRate || 0}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboard?.summary?.totalBookings || 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Summary */}
        {dashboard?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved Properties</p>
                    <p className="text-2xl font-bold text-green-600">{dashboard.summary.approvedHotels}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                    <p className="text-2xl font-bold text-yellow-600">{dashboard.summary.pendingHotels}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rejected Properties</p>
                    <p className="text-2xl font-bold text-red-600">{dashboard.summary.rejectedHotels}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Properties Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">Your Properties</CardTitle>
            <Link href="/onboarding">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!dashboard?.hotels || dashboard.hotels.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Listed Yet</h3>
                <p className="text-gray-600 mb-6">Start by adding your first property to begin receiving bookings</p>
                <Link href="/onboarding">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Property
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard.hotels.map((hotel) => (
                  <div key={hotel.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{hotel.name}</h3>
                          <Badge className={`${getStatusColor(hotel.status)} flex items-center gap-1`}>
                            {getStatusIcon(hotel.status)}
                            {hotel.status}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-2">{hotel.city} • {hotel.hotelType}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Total Rooms:</span>
                            <span className="ml-1 font-medium">{hotel.totalRooms}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Available:</span>
                            <span className="ml-1 font-medium text-green-600">{hotel.availableRooms}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Blocked:</span>
                            <span className="ml-1 font-medium text-red-600">{hotel.blockedRooms}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Occupancy:</span>
                            <span className="ml-1 font-medium">{hotel.occupancyRate}%</span>
                          </div>
                        </div>

                        {hotel.averageRating > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center">
                              <span className="text-yellow-500">★</span>
                              <span className="ml-1 text-sm font-medium">{hotel.averageRating.toFixed(1)}</span>
                            </div>
                            <span className="text-sm text-gray-500">({hotel.totalReviews} reviews)</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Link href={`/seller/hotels/${hotel.id}/availability`}>
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                            <Calendar className="h-4 w-4 mr-1" />
                            Manage Availability
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Getting Started Guide (show only if no properties) */}
        {(!dashboard?.hotels || dashboard.hotels.length === 0) && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-orange-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Add Your Property</h4>
                    <p className="text-sm text-gray-600">Complete the onboarding process to list your first property</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-500">Wait for Approval</h4>
                    <p className="text-sm text-gray-500">Our team will review and approve your property within 24-48 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-500">Manage Availability</h4>
                    <p className="text-sm text-gray-500">Set room availability and pricing to start receiving bookings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-500">Start Earning</h4>
                    <p className="text-sm text-gray-500">Begin receiving bookings and earning revenue from your property</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}