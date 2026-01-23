'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { sellerApi, AvailabilityCalendarDto } from '@/lib/api/seller';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types/auth';
import { Loader2, Calendar, Ban, CheckCircle, ArrowLeft } from 'lucide-react';

interface RoomAvailability {
  room: {
    id: string;
    name: string; // Changed from roomNumber to name
    roomType: string;
    quantity: number;
  };
  calendar: AvailabilityCalendarDto[];
}

export default function AvailabilityManagement() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [roomsAvailability, setRoomsAvailability] = useState<RoomAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'block' | 'unblock' | 'set' | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [availableCount, setAvailableCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const hotelId = params.id as string;

  // Get date range for next 30 days
  const today = new Date();
  const endDateRange = new Date();
  endDateRange.setDate(today.getDate() + 30);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user || !user.roles.includes(UserRole.SELLER)) {
      router.push('/login');
      return;
    }

    const fetchAvailability = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await sellerApi.getHotelAvailability(
          hotelId,
          formatDate(today),
          formatDate(endDateRange)
        );

        setRoomsAvailability(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load availability');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [hotelId, user, authLoading, router]);

  const handleAction = async () => {
    if (!selectedRoom || !actionType) return;

    try {
      setActionLoading(true);

      if (actionType === 'block') {
        await sellerApi.blockDates(selectedRoom, {
          startDate,
          endDate,
          reason,
        });
      } else if (actionType === 'unblock') {
        await sellerApi.unblockDates(selectedRoom, {
          startDate,
          endDate,
        });
      } else if (actionType === 'set') {
        await sellerApi.setAvailability(selectedRoom, {
          date: startDate,
          availableCount,
        });
      }

      // Refresh data
      const response = await sellerApi.getHotelAvailability(
        hotelId,
        formatDate(today),
        formatDate(endDateRange)
      );
      setRoomsAvailability(response.data);

      // Reset form
      setSelectedRoom(null);
      setActionType(null);
      setStartDate('');
      setEndDate('');
      setReason('');
      setAvailableCount(0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update availability');
    } finally {
      setActionLoading(false);
    }
  };

  const openActionModal = (roomId: string, action: 'block' | 'unblock' | 'set') => {
    setSelectedRoom(roomId);
    setActionType(action);
    setStartDate(formatDate(today));
    setEndDate(formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000))); // Tomorrow
    setReason('');
    setAvailableCount(0);
  };

  const closeActionModal = () => {
    setSelectedRoom(null);
    setActionType(null);
    setStartDate('');
    setEndDate('');
    setReason('');
    setAvailableCount(0);
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading availability...</span>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => router.push('/seller/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-2">Availability Management</h1>
        <p className="text-gray-600">Manage room availability for the next 30 days</p>
      </div>

      {roomsAvailability.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No rooms found</h3>
            <p className="text-gray-600">This hotel doesn't have any rooms configured yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {roomsAvailability.map((roomData) => (
            <Card key={roomData.room.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      Room {roomData.room.name} - {roomData.room.roomType} {/* Changed from roomNumber to name */}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Total quantity: {roomData.room.quantity}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openActionModal(roomData.room.id, 'block')}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Block Dates
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openActionModal(roomData.room.id, 'unblock')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Unblock Dates
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Available</th>
                        <th className="text-left p-2">Total</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Reason</th>
                        <th className="text-left p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomData.calendar.map((day) => (
                        <tr key={day.date} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">
                            {new Date(day.date).toLocaleDateString()}
                          </td>
                          <td className="p-2">
                            <span className={day.availableCount > 0 ? 'text-green-600' : 'text-red-600'}>
                              {day.availableCount}
                            </span>
                          </td>
                          <td className="p-2">{day.totalCount}</td>
                          <td className="p-2">
                            <Badge
                              variant={day.isBlocked ? 'destructive' : 'default'}
                              className={day.isBlocked ? '' : 'bg-green-100 text-green-800'}
                            >
                              {day.isBlocked ? 'Blocked' : 'Available'}
                            </Badge>
                          </td>
                          <td className="p-2 text-gray-600">
                            {day.blockReason || '-'}
                          </td>
                          <td className="p-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openActionModal(roomData.room.id, 'set')}
                            >
                              Set Count
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selectedRoom && actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {actionType === 'block' && 'Block Dates'}
                {actionType === 'unblock' && 'Unblock Dates'}
                {actionType === 'set' && 'Set Availability Count'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="startDate">
                  {actionType === 'set' ? 'Date' : 'Start Date'}
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={formatDate(today)}
                />
              </div>

              {actionType !== 'set' && (
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
                </div>
              )}

              {actionType === 'block' && (
                <div>
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Maintenance, Private booking"
                  />
                </div>
              )}

              {actionType === 'set' && (
                <div>
                  <Label htmlFor="availableCount">Available Count</Label>
                  <Input
                    id="availableCount"
                    type="number"
                    min="0"
                    value={availableCount}
                    onChange={(e) => setAvailableCount(parseInt(e.target.value) || 0)}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={closeActionModal}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAction}
                  disabled={actionLoading || !startDate || (actionType !== 'set' && !endDate)}
                >
                  {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {actionType === 'block' && 'Block Dates'}
                  {actionType === 'unblock' && 'Unblock Dates'}
                  {actionType === 'set' && 'Set Count'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}