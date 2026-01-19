import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Hotel, HotelStatus, HotelType } from '../../src/modules/hotels/entities/hotel.entity';
import { User, UserRole, UserStatus } from '../../src/modules/users/entities/user.entity';

// Mock HotelsService since we haven't created it yet
class MockHotelsService {
  constructor(
    private hotelRepository: Repository<Hotel>,
  ) {}

  async create(createHotelDto: any, ownerId: string): Promise<Hotel> {
    const hotel = this.hotelRepository.create({
      ...createHotelDto,
      ownerId,
      status: HotelStatus.PENDING,
    });
    return this.hotelRepository.save(hotel) as any;
  }

  async findAll(): Promise<Hotel[]> {
    return this.hotelRepository.find({
      where: { status: HotelStatus.APPROVED },
      relations: ['owner'],
    });
  }

  async findOne(id: string): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOne({
      where: { id },
      relations: ['owner', 'rooms'],
    });
    
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }
    
    return hotel;
  }

  async findByOwner(ownerId: string): Promise<Hotel[]> {
    return this.hotelRepository.find({
      where: { ownerId },
      relations: ['rooms'],
    });
  }

  async update(id: string, updateHotelDto: any, userId: string): Promise<Hotel> {
    const hotel = await this.findOne(id);
    
    if (hotel.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own hotels');
    }
    
    Object.assign(hotel, updateHotelDto);
    return this.hotelRepository.save(hotel) as any;
  }

  async remove(id: string, userId: string): Promise<void> {
    const hotel = await this.findOne(id);
    
    if (hotel.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own hotels');
    }
    
    await this.hotelRepository.remove(hotel);
  }

  async search(location: string, checkIn?: Date, checkOut?: Date): Promise<Hotel[]> {
    const query = this.hotelRepository.createQueryBuilder('hotel')
      .where('hotel.status = :status', { status: HotelStatus.APPROVED })
      .andWhere('(hotel.city ILIKE :location OR hotel.address ILIKE :location)', 
        { location: `%${location}%` });

    return query.getMany();
  }
}

describe('HotelsService', () => {
  let service: MockHotelsService;
  let repository: Repository<Hotel>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Hotel Owner',
    email: 'owner@example.com',
    password: 'hashedPassword123',
    phone: '+1234567890',
    roles: [UserRole.SELLER],
    isEmailVerified: true,
    status: UserStatus.ACTIVE,
    emailVerificationToken: undefined,
    emailVerificationExpires: undefined,
    passwordResetToken: undefined,
    passwordResetExpires: undefined,
    lastLoginAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: function() {
      const { password, emailVerificationToken, passwordResetToken, ...result } = this;
      return result;
    }
  };

  const mockHotel: Hotel = {
    id: '456e7890-e89b-12d3-a456-426614174001',
    name: 'Test Hotel',
    slug: 'test-hotel',
    description: 'A beautiful test hotel',
    hotelType: HotelType.HOTEL,
    status: HotelStatus.APPROVED,
    address: '123 Test Street, Test City',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456',
    latitude: 26.7606,
    longitude: 83.3732,
    phone: '+1234567890',
    email: 'hotel@example.com',
    website: 'https://testhotel.com',
    amenities: ['WiFi', 'Parking', 'Restaurant'],
    images: ['image1.jpg', 'image2.jpg'],
    startingPrice: 2500,
    averageRating: 4.5,
    totalReviews: 100,
    owner: mockUser,
    ownerId: mockUser.id,
    rooms: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-id' })),
    save: jest.fn().mockImplementation((entity) => {
      if (Array.isArray(entity)) {
        return Promise.resolve(entity);
      }
      return Promise.resolve(entity);
    }),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MockHotelsService,
        {
          provide: getRepositoryToken(Hotel),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MockHotelsService>(MockHotelsService);
    repository = module.get<Repository<Hotel>>(getRepositoryToken(Hotel));
    
    // Manually inject the repository into the service
    (service as any).hotelRepository = repository;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a hotel successfully', async () => {
      const createHotelDto = {
        name: 'Test Hotel',
        description: 'A beautiful test hotel',
        hotelType: HotelType.HOTEL,
        address: '123 Test Street, Test City',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        phone: '+1234567890',
        amenities: ['WiFi', 'Parking'],
        startingPrice: 2500,
      };

      mockRepository.create.mockReturnValue(mockHotel);
      mockRepository.save.mockResolvedValue(mockHotel);

      const result = await service.create(createHotelDto, mockUser.id);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createHotelDto,
        ownerId: mockUser.id,
        status: HotelStatus.PENDING,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockHotel);
      expect(result).toEqual(mockHotel);
    });
  });

  describe('findAll', () => {
    it('should return all approved hotels', async () => {
      mockRepository.find.mockResolvedValue([mockHotel]);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: HotelStatus.APPROVED },
        relations: ['owner'],
      });
      expect(result).toEqual([mockHotel]);
    });
  });

  describe('findOne', () => {
    it('should return a hotel by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockHotel);

      const result = await service.findOne(mockHotel.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockHotel.id },
        relations: ['owner', 'rooms'],
      });
      expect(result).toEqual(mockHotel);
    });

    it('should throw NotFoundException if hotel not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByOwner', () => {
    it('should return hotels by owner', async () => {
      mockRepository.find.mockResolvedValue([mockHotel]);

      const result = await service.findByOwner(mockUser.id);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { ownerId: mockUser.id },
        relations: ['rooms'],
      });
      expect(result).toEqual([mockHotel]);
    });
  });

  describe('update', () => {
    it('should update hotel successfully', async () => {
      const updateDto = { name: 'Updated Hotel Name' };
      const updatedHotel = { ...mockHotel, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockHotel);
      mockRepository.save.mockResolvedValue(updatedHotel);

      const result = await service.update(mockHotel.id, updateDto, mockUser.id);

      expect(result.name).toBe('Updated Hotel Name');
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const updateDto = { name: 'Updated Hotel Name' };
      const differentUserId = 'different-user-id';

      mockRepository.findOne.mockResolvedValue(mockHotel);

      await expect(
        service.update(mockHotel.id, updateDto, differentUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('search', () => {
    it('should search hotels by location', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockHotel]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.search('Test City');

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('hotel');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'hotel.status = :status',
        { status: HotelStatus.APPROVED },
      );
      expect(result).toEqual([mockHotel]);
    });
  });
});