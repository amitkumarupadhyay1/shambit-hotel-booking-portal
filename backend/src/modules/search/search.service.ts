import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel, HotelStatus } from '../hotels/entities/hotel.entity';
import { Room } from '../rooms/entities/room.entity';
import { AvailabilityService } from '../availability/availability.service';
import { HotelSearchDto } from './dto/hotel-search.dto';
import { PaginatedHotelSearchResult, HotelSearchResult } from './dto/hotel-search-result.dto';
import { HotelDetailDto, RoomAvailabilityDto } from './dto/hotel-detail.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async searchHotels(searchDto: HotelSearchDto): Promise<PaginatedHotelSearchResult> {
    // Validate search criteria - MUST require city, checkInDate, checkOutDate
    await this.validateSearchCriteria(searchDto);

    const checkIn = new Date(searchDto.checkInDate);
    const checkOut = new Date(searchDto.checkOutDate);
    const guests = searchDto.guests || 1;

    // Normalize city name for better matching
    const normalizedCity = this.normalizeCity(searchDto.city);

    // Build base query for APPROVED hotels only in the city with database-level pagination
    const queryBuilder = this.hotelRepository
      .createQueryBuilder('hotel')
      .leftJoinAndSelect('hotel.rooms', 'room')
      .where('hotel.status = :status', { status: HotelStatus.APPROVED })
      .andWhere('LOWER(TRIM(hotel.city)) = LOWER(:city)', { city: normalizedCity });

    // MUST accept optional: hotelType
    if (searchDto.hotelType) {
      queryBuilder.andWhere('hotel.hotelType = :hotelType', {
        hotelType: searchDto.hotelType,
      });
    }

    // Get total count for pagination before applying limit/offset
    const totalCount = await queryBuilder.getCount();

    // Apply database-level pagination
    const offset = (searchDto.page - 1) * searchDto.limit;
    queryBuilder.skip(offset).take(searchDto.limit * 2); // Get more than needed to account for filtering

    // Execute query to get hotels with rooms
    const hotels = await queryBuilder.getMany();

    // Transform hotels for batch availability check
    const hotelData = hotels.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      city: hotel.city,
      hotelType: hotel.hotelType,
      rooms: hotel.rooms.map(room => ({
        id: room.id,
        basePrice: room.basePrice,
      })),
    }));

    // Use optimized batch availability check
    const availableHotels = await this.availabilityService.getHotelsWithAvailabilityOptimized(
      hotelData,
      checkIn,
      checkOut,
      guests,
    );

    // Build final results
    const results: HotelSearchResult[] = [];
    const availableHotelMap = new Map(availableHotels.map(h => [h.hotelId, h.minPrice]));

    for (const hotel of hotels) {
      const minPrice = availableHotelMap.get(hotel.id);
      if (minPrice !== undefined) {
        results.push({
          hotelId: hotel.id,
          name: hotel.name,
          city: hotel.city,
          hotelType: hotel.hotelType,
          minBasePrice: minPrice,
          availabilityStatus: 'AVAILABLE',
        });

        // Stop when we have enough results for this page
        if (results.length >= searchDto.limit) {
          break;
        }
      }
    }

    // If we don't have enough results and there are more hotels, we need to fetch more
    // This is a fallback for cases where many hotels don't have availability
    if (results.length < searchDto.limit && hotels.length === searchDto.limit * 2) {
      // Could implement additional fetching logic here if needed
      // For now, we'll work with what we have
    }

    return {
      data: results,
      pagination: {
        page: searchDto.page,
        limit: searchDto.limit,
        total: results.length, // Note: This is approximate due to availability filtering
        totalPages: Math.ceil(results.length / searchDto.limit),
      },
    };
  }

  /**
   * Normalize city name for better search matching
   */
  private normalizeCity(city: string): string {
    return city
      .trim()
      .toLowerCase()
      // Remove common prefixes/suffixes
      .replace(/^(new|old|greater|metro)\s+/i, '')
      .replace(/\s+(city|town|district)$/i, '')
      // Handle common variations
      .replace(/bengaluru/i, 'bangalore')
      .replace(/mumbai/i, 'bombay')
      .replace(/kolkata/i, 'calcutta')
      .replace(/chennai/i, 'madras')
      // Remove extra spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  async getHotelDetails(
    hotelId: string,
    checkIn?: Date,
    checkOut?: Date,
    guests?: number,
  ): Promise<HotelDetailDto> {
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId, status: HotelStatus.APPROVED },
      relations: ['rooms'],
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    // Get room availability information
    const roomsWithAvailability: RoomAvailabilityDto[] = [];

    for (const room of hotel.rooms) {
      let isAvailable = true;
      let availableCount = room.quantity;

      // If dates are provided, check actual availability
      if (checkIn && checkOut && guests) {
        isAvailable = await this.availabilityService.isRoomAvailable(
          room.id,
          checkIn,
          checkOut,
          guests,
        );

        // Get availability calendar for the date range to show available count
        if (isAvailable) {
          const calendar = await this.availabilityService.getAvailabilityCalendar(
            room.id,
            checkIn,
            new Date(checkOut.getTime() - 24 * 60 * 60 * 1000), // Exclude checkout date
          );
          
          // Find minimum available count across the date range
          availableCount = Math.min(...calendar.map(c => c.availableCount));
        } else {
          availableCount = 0;
        }
      }

      roomsWithAvailability.push({
        id: room.id,
        name: room.name, // Changed from roomNumber to name
        roomType: room.roomType,
        basePrice: room.basePrice,
        maxOccupancy: room.maxOccupancy,
        isAvailable,
        availableCount,
        amenities: room.amenities || [],
        images: room.images || [],
        description: room.description,
        bedCount: room.bedCount,
        bedType: room.bedType,
        roomSize: room.roomSize,
      });
    }

    return {
      id: hotel.id,
      name: hotel.name,
      description: hotel.description,
      hotelType: hotel.hotelType,
      address: hotel.address,
      city: hotel.city,
      state: hotel.state,
      pincode: hotel.pincode,
      phone: hotel.phone,
      email: hotel.email,
      website: hotel.website,
      amenities: hotel.amenities || [],
      images: hotel.images || [],
      averageRating: hotel.averageRating,
      totalReviews: hotel.totalReviews,
      rooms: roomsWithAvailability,
    };
  }

  async validateSearchCriteria(searchDto: HotelSearchDto): Promise<void> {
    // MUST require: city, checkInDate, checkOutDate
    if (!searchDto.city) {
      throw new BadRequestException('City is required');
    }

    if (!searchDto.checkInDate) {
      throw new BadRequestException('Check-in date is required');
    }

    if (!searchDto.checkOutDate) {
      throw new BadRequestException('Check-out date is required');
    }

    const checkIn = new Date(searchDto.checkInDate);
    const checkOut = new Date(searchDto.checkOutDate);

    // MUST reject: Missing dates → 400 Bad Request
    if (isNaN(checkIn.getTime())) {
      throw new BadRequestException('Invalid check-in date format');
    }

    if (isNaN(checkOut.getTime())) {
      throw new BadRequestException('Invalid check-out date format');
    }

    // MUST reject: checkOutDate ≤ checkInDate → 400 Bad Request
    if (checkOut <= checkIn) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if check-in date is not in the past
    if (checkIn < today) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }

    // Check if the stay is not too long (max 30 days)
    const daysDifference = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference > 30) {
      throw new BadRequestException('Maximum stay duration is 30 days');
    }

    // NEW: Validate dates are not too far in the future (max 365 days)
    const maxFutureDate = new Date(today);
    maxFutureDate.setDate(maxFutureDate.getDate() + 365);
    
    if (checkIn > maxFutureDate) {
      throw new BadRequestException('Check-in date cannot be more than 365 days in the future');
    }

    if (checkOut > maxFutureDate) {
      throw new BadRequestException('Check-out date cannot be more than 365 days in the future');
    }
  }
}