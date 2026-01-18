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
    // Validate search criteria
    await this.validateSearchCriteria(searchDto);

    const checkIn = new Date(searchDto.checkInDate);
    const checkOut = new Date(searchDto.checkOutDate);

    // Build base query for approved hotels in the city
    const queryBuilder = this.hotelRepository
      .createQueryBuilder('hotel')
      .where('hotel.status = :status', { status: HotelStatus.APPROVED })
      .andWhere('LOWER(hotel.city) = LOWER(:city)', { city: searchDto.city });

    // Add hotel type filter if specified
    if (searchDto.hotelType) {
      queryBuilder.andWhere('hotel.hotelType = :hotelType', {
        hotelType: searchDto.hotelType,
      });
    }

    // Add price filter if specified
    if (searchDto.minPrice !== undefined) {
      queryBuilder.andWhere('hotel.startingPrice >= :minPrice', {
        minPrice: searchDto.minPrice,
      });
    }

    if (searchDto.maxPrice !== undefined) {
      queryBuilder.andWhere('hotel.startingPrice <= :maxPrice', {
        maxPrice: searchDto.maxPrice,
      });
    }

    // Get total count before applying pagination
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    const offset = (searchDto.page - 1) * searchDto.limit;
    queryBuilder.skip(offset).take(searchDto.limit);

    // Execute query
    const hotels = await queryBuilder.getMany();

    // Filter hotels by availability
    const availableHotels: HotelSearchResult[] = [];

    for (const hotel of hotels) {
      const availableRooms = await this.availabilityService.getAvailableRooms(
        hotel.id,
        checkIn,
        checkOut,
        searchDto.guests,
      );

      if (availableRooms.length > 0) {
        availableHotels.push({
          id: hotel.id,
          name: hotel.name,
          slug: hotel.slug,
          hotelType: hotel.hotelType,
          city: hotel.city,
          address: hotel.address,
          startingPrice: hotel.startingPrice,
          averageRating: hotel.averageRating,
          totalReviews: hotel.totalReviews,
          images: hotel.images || [],
          availableRooms: availableRooms.length,
        });
      }
    }

    return {
      data: availableHotels,
      pagination: {
        page: searchDto.page,
        limit: searchDto.limit,
        total: availableHotels.length, // Note: This is the count of available hotels, not total hotels
        totalPages: Math.ceil(availableHotels.length / searchDto.limit),
      },
    };
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
    const checkIn = new Date(searchDto.checkInDate);
    const checkOut = new Date(searchDto.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if check-in date is not in the past
    if (checkIn < today) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }

    // Check if check-out date is after check-in date
    if (checkOut <= checkIn) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    // Check if the stay is not too long (max 30 days)
    const daysDifference = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference > 30) {
      throw new BadRequestException('Maximum stay duration is 30 days');
    }

    // Validate price range
    if (searchDto.minPrice !== undefined && searchDto.maxPrice !== undefined) {
      if (searchDto.minPrice > searchDto.maxPrice) {
        throw new BadRequestException('Minimum price cannot be greater than maximum price');
      }
    }
  }
}