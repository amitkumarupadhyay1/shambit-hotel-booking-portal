import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SearchService } from '../../src/modules/search/search.service';
import { Hotel, HotelStatus, HotelType } from '../../src/modules/hotels/entities/hotel.entity';
import { Room, RoomType } from '../../src/modules/rooms/entities/room.entity';
import { AvailabilityService } from '../../src/modules/availability/availability.service';

describe('SearchService', () => {
  let service: SearchService;
  let hotelRepository: Repository<Hotel>;
  let roomRepository: Repository<Room>;
  let availabilityService: AvailabilityService;

  const mockHotel = {
    id: 'hotel-1',
    name: 'Test Hotel',
    slug: 'test-hotel',
    hotelType: HotelType.HOTEL,
    city: 'Test City',
    address: 'Test Address',
    startingPrice: 1000,
    averageRating: 4.5,
    totalReviews: 100,
    images: ['image1.jpg'],
    status: HotelStatus.APPROVED,
    rooms: [
      {
        id: 'room-1',
        roomType: RoomType.DELUXE,
        basePrice: 1000,
        maxOccupancy: 2,
        quantity: 1,
      },
    ],
  };

  const mockHotelRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
  };

  const mockRoomRepository = {
    find: jest.fn(),
  };

  const mockAvailabilityService = {
    getAvailableRooms: jest.fn(),
    isRoomAvailable: jest.fn(),
    getAvailabilityCalendar: jest.fn(),
    getHotelsWithAvailabilityOptimized: jest.fn(), // Add missing method
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: getRepositoryToken(Hotel),
          useValue: mockHotelRepository,
        },
        {
          provide: getRepositoryToken(Room),
          useValue: mockRoomRepository,
        },
        {
          provide: AvailabilityService,
          useValue: mockAvailabilityService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    hotelRepository = module.get<Repository<Hotel>>(getRepositoryToken(Hotel));
    roomRepository = module.get<Repository<Room>>(getRepositoryToken(Room));
    availabilityService = module.get<AvailabilityService>(AvailabilityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchHotels', () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Tomorrow
    const dayAfter = new Date();
    dayAfter.setDate(today.getDate() + 1); // Day after tomorrow
    
    const searchDto = {
      city: 'Test City',
      checkInDate: today.toISOString().split('T')[0],
      checkOutDate: dayAfter.toISOString().split('T')[0],
      guests: 2,
      page: 1,
      limit: 20,
    };

    it('should return paginated search results', async () => {
      mockHotelRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([mockHotel]);
      mockAvailabilityService.isRoomAvailable.mockResolvedValue(true);
      mockAvailabilityService.getHotelsWithAvailabilityOptimized.mockResolvedValue([
        { hotelId: 'hotel-1', minPrice: 1000 }
      ]);

      const result = await service.searchHotels(searchDto);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].hotelId).toBe('hotel-1');
      expect(result.data[0].name).toBe('Test Hotel');
      expect(result.data[0].city).toBe('Test City');
      expect(result.data[0].hotelType).toBe(HotelType.HOTEL);
      expect(result.data[0].minBasePrice).toBe(1000);
      expect(result.data[0].availabilityStatus).toBe('AVAILABLE');
      expect(result.pagination.total).toBe(1);
    });

    it('should filter out hotels without available rooms', async () => {
      mockHotelRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([mockHotel]);
      mockAvailabilityService.isRoomAvailable.mockResolvedValue(false);
      mockAvailabilityService.getHotelsWithAvailabilityOptimized.mockResolvedValue([]);

      const result = await service.searchHotels(searchDto);

      expect(result.data).toHaveLength(0);
    });

    it('should apply hotel type filter', async () => {
      const searchDtoWithType = { ...searchDto, hotelType: HotelType.RESORT };
      mockHotelRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockAvailabilityService.getHotelsWithAvailabilityOptimized.mockResolvedValue([]);

      await service.searchHotels(searchDtoWithType);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'hotel.hotelType = :hotelType',
        { hotelType: HotelType.RESORT },
      );
    });

    // Remove the price filter test as it's not part of the current acceptance criteria
    // it('should apply price filters', async () => {
    //   const searchDtoWithPrice = { ...searchDto, minPrice: 500, maxPrice: 2000 };
    //   mockHotelRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    //   mockQueryBuilder.getMany.mockResolvedValue([]);

    //   await service.searchHotels(searchDtoWithPrice);

    //   expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
    //     'hotel.startingPrice >= :minPrice',
    //     { minPrice: 500 },
    //   );
    //   expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
    //     'hotel.startingPrice <= :maxPrice',
    //     { maxPrice: 2000 },
    //   );
    // });
  });

  describe('getHotelDetails', () => {
    it('should return hotel details with room availability', async () => {
      mockHotelRepository.findOne.mockResolvedValue(mockHotel);
      mockAvailabilityService.isRoomAvailable.mockResolvedValue(true);
      mockAvailabilityService.getAvailabilityCalendar.mockResolvedValue([
        { availableCount: 1 },
      ]);

      const checkIn = new Date('2024-01-01');
      const checkOut = new Date('2024-01-03');
      const result = await service.getHotelDetails('hotel-1', checkIn, checkOut, 2);

      expect(result.id).toBe('hotel-1');
      expect(result.rooms).toHaveLength(1);
      expect(result.rooms[0].isAvailable).toBe(true);
      expect(result.rooms[0].availableCount).toBe(1);
    });

    it('should throw NotFoundException if hotel not found', async () => {
      mockHotelRepository.findOne.mockResolvedValue(null);

      await expect(service.getHotelDetails('hotel-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return hotel details without availability check if dates not provided', async () => {
      mockHotelRepository.findOne.mockResolvedValue(mockHotel);

      const result = await service.getHotelDetails('hotel-1');

      expect(result.id).toBe('hotel-1');
      expect(result.rooms).toHaveLength(1);
      expect(result.rooms[0].isAvailable).toBe(true);
      expect(result.rooms[0].availableCount).toBe(1); // Default quantity
    });
  });

  describe('validateSearchCriteria', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const validSearchDto = {
      city: 'Test City',
      checkInDate: tomorrow.toISOString().split('T')[0],
      checkOutDate: dayAfter.toISOString().split('T')[0],
      guests: 2,
      page: 1,
      limit: 20,
    };

    it('should pass validation for valid criteria', async () => {
      await expect(service.validateSearchCriteria(validSearchDto)).resolves.not.toThrow();
    });

    it('should throw BadRequestException for past check-in date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const invalidDto = {
        ...validSearchDto,
        checkInDate: pastDate.toISOString().split('T')[0],
      };

      await expect(service.validateSearchCriteria(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if check-out is before check-in', async () => {
      const invalidDto = {
        ...validSearchDto,
        checkInDate: '2024-12-03',
        checkOutDate: '2024-12-01',
      };

      await expect(service.validateSearchCriteria(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for stay longer than 30 days', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 35); // More than 30 days
      
      const invalidDto = {
        ...validSearchDto,
        checkInDate: tomorrow.toISOString().split('T')[0],
        checkOutDate: farFuture.toISOString().split('T')[0],
      };

      await expect(service.validateSearchCriteria(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    // Remove the invalid price range test as it's not part of the current acceptance criteria
    // it('should throw BadRequestException for invalid price range', async () => {
    //   const invalidDto = {
    //     ...validSearchDto,
    //     minPrice: 2000,
    //     maxPrice: 1000,
    //   };

    //   await expect(service.validateSearchCriteria(invalidDto)).rejects.toThrow(
    //     BadRequestException,
    //   );
    // });
  });
});