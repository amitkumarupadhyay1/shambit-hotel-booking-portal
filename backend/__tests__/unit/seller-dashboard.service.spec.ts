import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SellerDashboardService } from '../../src/modules/seller-dashboard/seller-dashboard.service';
import { Hotel, HotelStatus, HotelType } from '../../src/modules/hotels/entities/hotel.entity';
import { Room, RoomType } from '../../src/modules/rooms/entities/room.entity';
import { RoomAvailability } from '../../src/modules/availability/entities/room-availability.entity';
import { AvailabilityService } from '../../src/modules/availability/availability.service';

describe('SellerDashboardService', () => {
  let service: SellerDashboardService;
  let hotelRepository: Repository<Hotel>;
  let roomRepository: Repository<Room>;
  let availabilityRepository: Repository<RoomAvailability>;
  let availabilityService: AvailabilityService;

  const mockHotel = {
    id: 'hotel-1',
    name: 'Test Hotel',
    slug: 'test-hotel',
    hotelType: HotelType.HOTEL,
    status: HotelStatus.APPROVED,
    city: 'Test City',
    ownerId: 'seller-1',
    averageRating: 4.5,
    totalReviews: 100,
    images: ['image1.jpg'],
    rooms: [
      {
        id: 'room-1',
        roomType: RoomType.DELUXE,
        quantity: 2,
      },
      {
        id: 'room-2',
        roomType: RoomType.SUITE,
        quantity: 1,
      },
    ],
  };

  const mockRoom = {
    id: 'room-1',
    hotel: mockHotel,
  };

  const mockHotelRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockRoomRepository = {
    findOne: jest.fn(),
  };

  const mockAvailabilityRepository = {
    count: jest.fn(),
  };

  const mockAvailabilityService = {
    getAvailabilityCalendar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerDashboardService,
        {
          provide: getRepositoryToken(Hotel),
          useValue: mockHotelRepository,
        },
        {
          provide: getRepositoryToken(Room),
          useValue: mockRoomRepository,
        },
        {
          provide: getRepositoryToken(RoomAvailability),
          useValue: mockAvailabilityRepository,
        },
        {
          provide: AvailabilityService,
          useValue: mockAvailabilityService,
        },
      ],
    }).compile();

    service = module.get<SellerDashboardService>(SellerDashboardService);
    hotelRepository = module.get<Repository<Hotel>>(getRepositoryToken(Hotel));
    roomRepository = module.get<Repository<Room>>(getRepositoryToken(Room));
    availabilityRepository = module.get<Repository<RoomAvailability>>(
      getRepositoryToken(RoomAvailability),
    );
    availabilityService = module.get<AvailabilityService>(AvailabilityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSellerDashboard', () => {
    it('should return seller dashboard data', async () => {
      mockHotelRepository.find.mockResolvedValue([mockHotel]);
      mockAvailabilityRepository.count.mockResolvedValue(1); // 1 blocked room

      const result = await service.getSellerDashboard('seller-1');

      expect(result.totalHotels).toBe(1);
      expect(result.totalRooms).toBe(2); // 2 rooms total
      expect(result.hotels).toHaveLength(1);
      expect(result.hotels[0].id).toBe('hotel-1');
      expect(result.hotels[0].totalRooms).toBe(2);
      expect(result.hotels[0].availableRooms).toBe(1); // 2 - 1 blocked
      expect(result.hotels[0].blockedRooms).toBe(1);
      expect(result.summary.approvedHotels).toBe(1);
      expect(result.summary.pendingHotels).toBe(0);
      expect(result.summary.rejectedHotels).toBe(0);
    });

    it('should handle seller with no hotels', async () => {
      mockHotelRepository.find.mockResolvedValue([]);

      const result = await service.getSellerDashboard('seller-1');

      expect(result.totalHotels).toBe(0);
      expect(result.totalRooms).toBe(0);
      expect(result.hotels).toHaveLength(0);
      expect(result.occupancyRate).toBe(0);
    });

    it('should calculate occupancy rate correctly', async () => {
      const hotelWithManyRooms = {
        ...mockHotel,
        rooms: Array(10).fill(0).map((_, i) => ({
          id: `room-${i}`,
          quantity: 1,
        })),
      };
      
      mockHotelRepository.find.mockResolvedValue([hotelWithManyRooms]);
      mockAvailabilityRepository.count.mockResolvedValue(3); // 3 blocked out of 10

      const result = await service.getSellerDashboard('seller-1');

      expect(result.occupancyRate).toBe(30); // 3/10 * 100
    });
  });

  describe('validateHotelOwnership', () => {
    it('should return hotel if owned by seller', async () => {
      mockHotelRepository.findOne.mockResolvedValue(mockHotel);

      const result = await service.validateHotelOwnership('hotel-1', 'seller-1');

      expect(result).toBe(mockHotel);
      expect(mockHotelRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'hotel-1' },
        relations: ['rooms'],
      });
    });

    it('should throw NotFoundException if hotel not found', async () => {
      mockHotelRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateHotelOwnership('hotel-1', 'seller-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if hotel not owned by seller', async () => {
      const otherSellerHotel = { ...mockHotel, ownerId: 'other-seller' };
      mockHotelRepository.findOne.mockResolvedValue(otherSellerHotel);

      await expect(
        service.validateHotelOwnership('hotel-1', 'seller-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('validateRoomOwnership', () => {
    it('should return room if owned by seller', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);

      const result = await service.validateRoomOwnership('room-1', 'seller-1');

      expect(result).toBe(mockRoom);
      expect(mockRoomRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'room-1' },
        relations: ['hotel'],
      });
    });

    it('should throw NotFoundException if room not found', async () => {
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateRoomOwnership('room-1', 'seller-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if room not owned by seller', async () => {
      const otherSellerRoom = {
        ...mockRoom,
        hotel: { ...mockHotel, ownerId: 'other-seller' },
      };
      mockRoomRepository.findOne.mockResolvedValue(otherSellerRoom);

      await expect(
        service.validateRoomOwnership('room-1', 'seller-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getHotelAvailabilityOverview', () => {
    it('should return hotel availability overview', async () => {
      mockHotelRepository.findOne.mockResolvedValue(mockHotel);
      mockAvailabilityService.getAvailabilityCalendar.mockResolvedValue([
        { isBlocked: false, date: '2024-01-01' },
        { isBlocked: true, date: '2024-01-02' },
        { isBlocked: false, date: '2024-01-03' },
      ]);

      const result = await service.getHotelAvailabilityOverview('hotel-1', 'seller-1');

      expect(result.hotel.id).toBe('hotel-1');
      expect(result.rooms).toHaveLength(2);
      expect(result.rooms[0].occupancyRate).toBe(33.33); // 1 blocked out of 3 days
    });

    it('should throw error if hotel not owned by seller', async () => {
      mockHotelRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getHotelAvailabilityOverview('hotel-1', 'seller-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});