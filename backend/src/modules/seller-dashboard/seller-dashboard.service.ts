import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Hotel, HotelStatus } from '../hotels/entities/hotel.entity';
import { Room } from '../rooms/entities/room.entity';
import { RoomAvailability } from '../availability/entities/room-availability.entity';
import { AvailabilityService } from '../availability/availability.service';
import { SellerDashboardDto, SellerHotelSummaryDto } from './dto/seller-dashboard.dto';

@Injectable()
export class SellerDashboardService {
  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(RoomAvailability)
    private readonly availabilityRepository: Repository<RoomAvailability>,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async getSellerDashboard(sellerId: string): Promise<SellerDashboardDto> {
    // Get all hotels owned by the seller
    const hotels = await this.hotelRepository.find({
      where: { ownerId: sellerId },
      relations: ['rooms'],
    });

    const hotelSummaries: SellerHotelSummaryDto[] = [];
    let totalRooms = 0;
    let totalBlockedRooms = 0;

    // Calculate statistics for each hotel
    for (const hotel of hotels) {
      const roomCount = hotel.rooms.length;
      totalRooms += roomCount;

      // Calculate blocked rooms for today
      const today = new Date();
      const blockedRoomsToday = await this.availabilityRepository.count({
        where: {
          roomId: In(hotel.rooms.map(r => r.id)),
          date: today,
          isBlocked: true,
        },
      });

      totalBlockedRooms += blockedRoomsToday;

      const occupancyRate = roomCount > 0 ? (blockedRoomsToday / roomCount) * 100 : 0;

      hotelSummaries.push({
        id: hotel.id,
        name: hotel.name,
        slug: hotel.slug,
        hotelType: hotel.hotelType,
        status: hotel.status,
        city: hotel.city,
        totalRooms: roomCount,
        availableRooms: roomCount - blockedRoomsToday,
        blockedRooms: blockedRoomsToday,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        averageRating: hotel.averageRating,
        totalReviews: hotel.totalReviews,
        images: hotel.images || [],
      });
    }

    // Calculate overall statistics
    const overallOccupancyRate = totalRooms > 0 ? (totalBlockedRooms / totalRooms) * 100 : 0;

    // Count hotels by status
    const approvedHotels = hotels.filter(h => h.status === HotelStatus.APPROVED).length;
    const pendingHotels = hotels.filter(h => h.status === HotelStatus.PENDING).length;
    const rejectedHotels = hotels.filter(h => h.status === HotelStatus.REJECTED).length;

    return {
      hotels: hotelSummaries,
      totalHotels: hotels.length,
      totalRooms,
      occupancyRate: Math.round(overallOccupancyRate * 100) / 100,
      summary: {
        approvedHotels,
        pendingHotels,
        rejectedHotels,
        totalBookings: 0, // Will be 0 in Spiral 2
      },
    };
  }

  async validateHotelOwnership(hotelId: string, sellerId: string): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      relations: ['rooms'],
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    if (hotel.ownerId !== sellerId) {
      throw new ForbiddenException('You do not have permission to manage this hotel');
    }

    return hotel;
  }

  async validateRoomOwnership(roomId: string, sellerId: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['hotel'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.hotel.ownerId !== sellerId) {
      throw new ForbiddenException('You do not have permission to manage this room');
    }

    return room;
  }

  async getHotelAvailabilityOverview(hotelId: string, sellerId: string) {
    // Validate ownership
    const hotel = await this.validateHotelOwnership(hotelId, sellerId);

    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);

    const roomsWithAvailability = [];

    for (const room of hotel.rooms) {
      const calendar = await this.availabilityService.getAvailabilityCalendar(
        room.id,
        today,
        nextMonth,
      );

      const totalDays = calendar.length;
      const blockedDays = calendar.filter(c => c.isBlocked).length;
      const occupancyRate = totalDays > 0 ? (blockedDays / totalDays) * 100 : 0;

      roomsWithAvailability.push({
        id: room.id,
        name: room.name, // Changed from roomNumber to name
        roomType: room.roomType,
        quantity: room.quantity,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        nextAvailableDate: calendar.find(c => !c.isBlocked)?.date,
        calendar: calendar.slice(0, 7), // Show next 7 days
      });
    }

    return {
      hotel: {
        id: hotel.id,
        name: hotel.name,
        status: hotel.status,
      },
      rooms: roomsWithAvailability,
    };
  }
}