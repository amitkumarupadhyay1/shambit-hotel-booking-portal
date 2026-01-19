import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { RoomAvailability } from './entities/room-availability.entity';
import { Room } from '../rooms/entities/room.entity';
import { AvailabilityCalendarDto } from './dto/availability-calendar.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(RoomAvailability)
    private readonly availabilityRepository: Repository<RoomAvailability>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  /**
   * Initialize availability for new rooms
   * Creates availability records for the next 365 days
   */
  async initializeRoomAvailability(roomId: string, quantity: number): Promise<void> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 365); // Initialize for next 365 days

    const availabilityRecords: Partial<RoomAvailability>[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      availabilityRecords.push({
        roomId,
        date: new Date(currentDate),
        availableCount: quantity,
        isBlocked: false,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Use upsert to handle existing records
    await this.availabilityRepository.upsert(availabilityRecords, ['roomId', 'date']);
  }

  /**
   * Check if room is available for date range
   */
  async isRoomAvailable(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    guests: number = 1,
  ): Promise<boolean> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      return false;
    }

    // Check if room can accommodate guests
    if (guests > room.maxOccupancy) {
      return false;
    }

    // Check availability for each night (excluding checkout date)
    const endDate = new Date(checkOut);
    endDate.setDate(endDate.getDate() - 1);

    const unavailableDates = await this.availabilityRepository.count({
      where: {
        roomId,
        date: Between(checkIn, endDate),
        availableCount: 0,
      },
    });

    return unavailableDates === 0;
  }

  /**
   * Get available rooms for a hotel
   */
  async getAvailableRooms(
    hotelId: string,
    checkIn: Date,
    checkOut: Date,
    guests: number = 1,
  ): Promise<Room[]> {
    const rooms = await this.roomRepository.find({
      where: { hotelId },
    });

    const availableRooms: Room[] = [];

    for (const room of rooms) {
      const isAvailable = await this.isRoomAvailable(room.id, checkIn, checkOut, guests);
      if (isAvailable) {
        availableRooms.push(room);
      }
    }

    return availableRooms;
  }

  /**
   * Block dates for a room
   */
  async blockDates(
    roomId: string,
    startDate: Date,
    endDate: Date,
    reason?: string,
  ): Promise<void> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Block each date in the range
    const currentDate = new Date(startDate);
    while (currentDate < endDate) {
      await this.availabilityRepository.upsert(
        {
          roomId,
          date: new Date(currentDate),
          availableCount: 0,
          isBlocked: true,
          blockReason: reason,
        },
        ['roomId', 'date'],
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  /**
   * Unblock dates for a room
   */
  async unblockDates(roomId: string, startDate: Date, endDate: Date): Promise<void> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Unblock each date in the range
    const currentDate = new Date(startDate);
    while (currentDate < endDate) {
      await this.availabilityRepository.upsert(
        {
          roomId,
          date: new Date(currentDate),
          availableCount: room.quantity,
          isBlocked: false,
          blockReason: null,
        },
        ['roomId', 'date'],
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  /**
   * Set specific availability count for a date
   */
  async setAvailability(roomId: string, date: Date, count: number): Promise<void> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (count < 0 || count > room.quantity) {
      throw new BadRequestException(
        `Available count must be between 0 and ${room.quantity}`,
      );
    }

    await this.availabilityRepository.upsert(
      {
        roomId,
        date,
        availableCount: count,
        isBlocked: count === 0,
      },
      ['roomId', 'date'],
    );
  }

  /**
   * Get availability calendar for seller dashboard
   */
  async getAvailabilityCalendar(
    roomId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AvailabilityCalendarDto[]> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const availability = await this.availabilityRepository.find({
      where: {
        roomId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });

    // Create calendar entries, filling missing dates with default availability
    const calendar: AvailabilityCalendarDto[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const availabilityRecord = availability.find(
        (a) => a.date.toISOString().split('T')[0] === dateStr,
      );

      calendar.push({
        date: dateStr,
        availableCount: availabilityRecord?.availableCount ?? room.quantity,
        totalCount: room.quantity,
        isBlocked: availabilityRecord?.isBlocked ?? false,
        blockReason: availabilityRecord?.blockReason,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return calendar;
  }

  /**
   * Get hotels with available rooms for search
   */
  async getHotelsWithAvailability(
    hotelIds: string[],
    checkIn: Date,
    checkOut: Date,
    guests: number = 1,
  ): Promise<string[]> {
    const availableHotelIds: string[] = [];

    for (const hotelId of hotelIds) {
      const availableRooms = await this.getAvailableRooms(hotelId, checkIn, checkOut, guests);
      if (availableRooms.length > 0) {
        availableHotelIds.push(hotelId);
      }
    }

    return availableHotelIds;
  }

  /**
   * Batch check room availability for multiple rooms - OPTIMIZED VERSION
   * Fixes N+1 query problem by checking all rooms in a single query
   */
  async batchCheckRoomAvailability(
    roomIds: string[],
    checkIn: Date,
    checkOut: Date,
    guests: number = 1,
  ): Promise<Map<string, { isAvailable: boolean; minPrice: number }>> {
    if (roomIds.length === 0) {
      return new Map();
    }

    // Get all rooms with their details in one query
    const rooms = await this.roomRepository.find({
      where: { id: In(roomIds) },
      select: ['id', 'maxOccupancy', 'basePrice'],
    });

    // Filter rooms that can accommodate guests
    const eligibleRooms = rooms.filter(room => room.maxOccupancy >= guests);
    const eligibleRoomIds = eligibleRooms.map(room => room.id);

    if (eligibleRoomIds.length === 0) {
      return new Map();
    }

    // Check availability for all eligible rooms in a single query
    const endDate = new Date(checkOut);
    endDate.setDate(endDate.getDate() - 1);

    const unavailableRooms = await this.availabilityRepository
      .createQueryBuilder('availability')
      .select('availability.roomId')
      .where('availability.roomId IN (:...roomIds)', { roomIds: eligibleRoomIds })
      .andWhere('availability.date BETWEEN :checkIn AND :endDate', { checkIn, endDate })
      .andWhere('availability.availableCount = 0')
      .getMany();

    const unavailableRoomIds = new Set(unavailableRooms.map(r => r.roomId));

    // Build result map
    const result = new Map<string, { isAvailable: boolean; minPrice: number }>();
    
    for (const room of eligibleRooms) {
      const isAvailable = !unavailableRoomIds.has(room.id);
      result.set(room.id, {
        isAvailable,
        minPrice: room.basePrice,
      });
    }

    return result;
  }

  /**
   * Get hotels with availability using optimized batch queries
   */
  async getHotelsWithAvailabilityOptimized(
    hotels: Array<{ id: string; rooms: Array<{ id: string; basePrice: number }> }>,
    checkIn: Date,
    checkOut: Date,
    guests: number = 1,
  ): Promise<Array<{ hotelId: string; minPrice: number }>> {
    // Collect all room IDs
    const allRoomIds: string[] = [];
    const hotelRoomMap = new Map<string, string[]>();
    
    for (const hotel of hotels) {
      const roomIds = hotel.rooms.map(room => room.id);
      allRoomIds.push(...roomIds);
      hotelRoomMap.set(hotel.id, roomIds);
    }

    // Batch check availability for all rooms
    const roomAvailability = await this.batchCheckRoomAvailability(
      allRoomIds,
      checkIn,
      checkOut,
      guests,
    );

    // Process results by hotel
    const availableHotels: Array<{ hotelId: string; minPrice: number }> = [];

    for (const hotel of hotels) {
      let hasAvailableRooms = false;
      let minPrice = Infinity;

      for (const room of hotel.rooms) {
        const availability = roomAvailability.get(room.id);
        if (availability?.isAvailable) {
          hasAvailableRooms = true;
          minPrice = Math.min(minPrice, availability.minPrice);
        }
      }

      if (hasAvailableRooms) {
        availableHotels.push({
          hotelId: hotel.id,
          minPrice: minPrice === Infinity ? 0 : minPrice,
        });
      }
    }

    return availableHotels;
  }
}