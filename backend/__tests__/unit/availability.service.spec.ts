import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AvailabilityService } from '../../src/modules/availability/availability.service';
import { RoomAvailability } from '../../src/modules/availability/entities/room-availability.entity';
import { Room } from '../../src/modules/rooms/entities/room.entity';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let availabilityRepository: Repository<RoomAvailability>;
  let roomRepository: Repository<Room>;

  const mockRoom = {
    id: 'room-1',
    quantity: 2,
    maxOccupancy: 4,
  };

  const mockAvailabilityRepository = {
    upsert: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockRoomRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        {
          provide: getRepositoryToken(RoomAvailability),
          useValue: mockAvailabilityRepository,
        },
        {
          provide: getRepositoryToken(Room),
          useValue: mockRoomRepository,
        },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
    availabilityRepository = module.get<Repository<RoomAvailability>>(
      getRepositoryToken(RoomAvailability),
    );
    roomRepository = module.get<Repository<Room>>(getRepositoryToken(Room));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeRoomAvailability', () => {
    it('should initialize availability for a room', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockAvailabilityRepository.upsert.mockResolvedValue(undefined);

      await service.initializeRoomAvailability('room-1', 2);

      expect(mockRoomRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'room-1' },
      });
      expect(mockAvailabilityRepository.upsert).toHaveBeenCalled();
    });

    it('should throw NotFoundException if room not found', async () => {
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(
        service.initializeRoomAvailability('room-1', 2),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('isRoomAvailable', () => {
    const checkIn = new Date('2024-01-01');
    const checkOut = new Date('2024-01-03');

    it('should return true if room is available', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockAvailabilityRepository.count.mockResolvedValue(0);

      const result = await service.isRoomAvailable('room-1', checkIn, checkOut, 2);

      expect(result).toBe(true);
      expect(mockAvailabilityRepository.count).toHaveBeenCalledWith({
        where: {
          roomId: 'room-1',
          date: expect.any(Object),
          availableCount: 0,
        },
      });
    });

    it('should return false if room not found', async () => {
      mockRoomRepository.findOne.mockResolvedValue(null);

      const result = await service.isRoomAvailable('room-1', checkIn, checkOut, 2);

      expect(result).toBe(false);
    });

    it('should return false if guests exceed max occupancy', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);

      const result = await service.isRoomAvailable('room-1', checkIn, checkOut, 5);

      expect(result).toBe(false);
    });

    it('should return false if room has unavailable dates', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockAvailabilityRepository.count.mockResolvedValue(1);

      const result = await service.isRoomAvailable('room-1', checkIn, checkOut, 2);

      expect(result).toBe(false);
    });
  });

  describe('blockDates', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-03');

    it('should block dates for a room', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockAvailabilityRepository.upsert.mockResolvedValue(undefined);

      await service.blockDates('room-1', startDate, endDate, 'Maintenance');

      expect(mockRoomRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'room-1' },
      });
      expect(mockAvailabilityRepository.upsert).toHaveBeenCalledTimes(2); // 2 days
    });

    it('should throw NotFoundException if room not found', async () => {
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(
        service.blockDates('room-1', startDate, endDate),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if start date >= end date', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);

      await expect(
        service.blockDates('room-1', endDate, startDate),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('unblockDates', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-03');

    it('should unblock dates for a room', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockAvailabilityRepository.upsert.mockResolvedValue(undefined);

      await service.unblockDates('room-1', startDate, endDate);

      expect(mockRoomRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'room-1' },
      });
      expect(mockAvailabilityRepository.upsert).toHaveBeenCalledTimes(2); // 2 days
    });

    it('should throw NotFoundException if room not found', async () => {
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(
        service.unblockDates('room-1', startDate, endDate),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setAvailability', () => {
    const date = new Date('2024-01-01');

    it('should set availability count for a date', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockAvailabilityRepository.upsert.mockResolvedValue(undefined);

      await service.setAvailability('room-1', date, 1);

      expect(mockRoomRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'room-1' },
      });
      expect(mockAvailabilityRepository.upsert).toHaveBeenCalledWith(
        {
          roomId: 'room-1',
          date,
          availableCount: 1,
          isBlocked: false,
        },
        ['roomId', 'date'],
      );
    });

    it('should throw NotFoundException if room not found', async () => {
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(
        service.setAvailability('room-1', date, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if count is invalid', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);

      await expect(
        service.setAvailability('room-1', date, -1),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.setAvailability('room-1', date, 5),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAvailabilityCalendar', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-03');

    it('should return availability calendar', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockAvailabilityRepository.find.mockResolvedValue([
        {
          date: new Date('2024-01-01'),
          availableCount: 1,
          isBlocked: false,
          blockReason: null,
        },
      ]);

      const result = await service.getAvailabilityCalendar('room-1', startDate, endDate);

      expect(result).toHaveLength(3); // 3 days
      expect(result[0]).toEqual({
        date: '2024-01-01',
        availableCount: 1,
        totalCount: 2,
        isBlocked: false,
        blockReason: null,
      });
    });

    it('should throw NotFoundException if room not found', async () => {
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getAvailabilityCalendar('room-1', startDate, endDate),
      ).rejects.toThrow(NotFoundException);
    });
  });
});