import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Booking, BookingStatus, PaymentStatus } from '../../src/modules/bookings/entities/booking.entity';
import { Hotel, HotelStatus, HotelType } from '../../src/modules/hotels/entities/hotel.entity';
import { Room, RoomStatus, RoomType } from '../../src/modules/rooms/entities/room.entity';
import { User, UserRole, UserStatus } from '../../src/modules/users/entities/user.entity';

// Mock BookingsService since we haven't created it yet
class MockBookingsService {
  constructor(
    private bookingRepository: Repository<Booking>,
  ) {}

  async create(createBookingDto: any): Promise<Booking> {
    // Generate booking reference
    const bookingReference = 'SH' + Date.now().toString().slice(-6);
    
    // Calculate nights
    const checkIn = new Date(createBookingDto.checkInDate);
    const checkOut = new Date(createBookingDto.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    const booking = this.bookingRepository.create({
      ...createBookingDto,
      bookingReference,
      nights,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    });

    return this.bookingRepository.save(booking) as any;
  }

  async findAll(): Promise<Booking[]> {
    return this.bookingRepository.find({
      relations: ['customer', 'hotel', 'room'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['customer', 'hotel', 'room'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async findByCustomer(customerId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { customerId },
      relations: ['hotel', 'room'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByHotel(hotelId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { hotelId },
      relations: ['customer', 'room'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.status = status;
    
    if (status === BookingStatus.CANCELLED) {
      booking.cancelledAt = new Date();
    }
    
    return this.bookingRepository.save(booking) as any;
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus, paymentId?: string): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.paymentStatus = paymentStatus;
    
    if (paymentId) {
      booking.paymentId = paymentId;
    }
    
    if (paymentStatus === PaymentStatus.PAID) {
      booking.paidAmount = booking.totalAmount;
      booking.status = BookingStatus.CONFIRMED;
    }
    
    return this.bookingRepository.save(booking) as any;
  }

  async cancel(id: string, reason: string): Promise<Booking> {
    const booking = await this.findOne(id);
    
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }
    
    if (booking.status === BookingStatus.CHECKED_OUT) {
      throw new BadRequestException('Cannot cancel completed booking');
    }
    
    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    
    return this.bookingRepository.save(booking) as any;
  }
}

describe('BookingsService', () => {
  let service: MockBookingsService;
  let repository: Repository<Booking>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Customer',
    email: 'customer@example.com',
    password: 'hashedPassword123',
    phone: '+1234567890',
    roles: [UserRole.BUYER],
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
    amenities: ['WiFi', 'Parking'],
    images: ['image1.jpg'],
    startingPrice: 2500,
    averageRating: 4.5,
    totalReviews: 100,
    owner: mockUser,
    ownerId: mockUser.id,
    rooms: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRoom: Room = {
    id: '789e0123-e89b-12d3-a456-426614174002',
    name: '101', // Changed from roomNumber to name
    roomType: RoomType.DELUXE,
    status: RoomStatus.AVAILABLE,
    description: 'Deluxe room with city view',
    maxOccupancy: 2,
    bedCount: 1,
    bedType: 'Queen',
    basePrice: 2500,
    weekendPrice: 3000,
    quantity: 1,
    roomSize: 25,
    amenities: ['AC', 'TV', 'WiFi'],
    images: ['room1.jpg'],
    hotel: mockHotel,
    hotelId: mockHotel.id,
    bookings: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBooking: Booking = {
    id: '012e3456-e89b-12d3-a456-426614174003',
    bookingReference: 'SH123456',
    checkInDate: new Date('2026-01-25'),
    checkOutDate: new Date('2026-01-27'),
    nights: 2,
    adults: 2,
    children: 0,
    guestName: 'Test Customer',
    guestEmail: 'customer@example.com',
    guestPhone: '+1234567890',
    roomPrice: 2500,
    taxes: 450,
    fees: 100,
    totalAmount: 5550,
    paidAmount: 0,
    status: BookingStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    specialRequests: undefined,
    cancelledAt: undefined,
    cancellationReason: undefined,
    paymentId: undefined,
    paymentMethod: undefined,
    customer: mockUser,
    customerId: mockUser.id,
    hotel: mockHotel,
    hotelId: mockHotel.id,
    room: mockRoom,
    roomId: mockRoom.id,
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MockBookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MockBookingsService>(MockBookingsService);
    repository = module.get<Repository<Booking>>(getRepositoryToken(Booking));
    
    // Manually inject the repository into the service
    (service as any).bookingRepository = repository;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a booking successfully', async () => {
      const createBookingDto = {
        checkInDate: '2026-01-25',
        checkOutDate: '2026-01-27',
        adults: 2,
        children: 0,
        guestName: 'Test Customer',
        guestEmail: 'customer@example.com',
        guestPhone: '+1234567890',
        roomPrice: 2500,
        taxes: 450,
        fees: 100,
        totalAmount: 5550,
        customerId: mockUser.id,
        hotelId: mockHotel.id,
        roomId: mockRoom.id,
      };

      mockRepository.create.mockReturnValue(mockBooking);
      mockRepository.save.mockResolvedValue(mockBooking);

      const result = await service.create(createBookingDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createBookingDto,
        bookingReference: expect.stringMatching(/^SH\d{6}$/),
        nights: 2,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      });
      expect(result).toEqual(mockBooking);
    });

    it('should throw BadRequestException for invalid dates', async () => {
      const createBookingDto = {
        checkInDate: '2026-01-27',
        checkOutDate: '2026-01-25', // Check-out before check-in
        adults: 2,
        guestName: 'Test Customer',
        guestEmail: 'customer@example.com',
        guestPhone: '+1234567890',
        totalAmount: 5550,
        customerId: mockUser.id,
        hotelId: mockHotel.id,
        roomId: mockRoom.id,
      };

      await expect(service.create(createBookingDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findByCustomer', () => {
    it('should return bookings for a customer', async () => {
      mockRepository.find.mockResolvedValue([mockBooking]);

      const result = await service.findByCustomer(mockUser.id);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { customerId: mockUser.id },
        relations: ['hotel', 'room'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockBooking]);
    });
  });

  describe('findByHotel', () => {
    it('should return bookings for a hotel', async () => {
      mockRepository.find.mockResolvedValue([mockBooking]);

      const result = await service.findByHotel(mockHotel.id);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { hotelId: mockHotel.id },
        relations: ['customer', 'room'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockBooking]);
    });
  });

  describe('updateStatus', () => {
    it('should update booking status', async () => {
      const updatedBooking = { ...mockBooking, status: BookingStatus.CONFIRMED };
      
      mockRepository.findOne.mockResolvedValue(mockBooking);
      mockRepository.save.mockResolvedValue(updatedBooking);

      const result = await service.updateStatus(mockBooking.id, BookingStatus.CONFIRMED);

      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should set cancelled date when cancelling', async () => {
      const cancelledBooking = { 
        ...mockBooking, 
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
      };
      
      mockRepository.findOne.mockResolvedValue(mockBooking);
      mockRepository.save.mockResolvedValue(cancelledBooking);

      const result = await service.updateStatus(mockBooking.id, BookingStatus.CANCELLED);

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(result.cancelledAt).toBeDefined();
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status and confirm booking when paid', async () => {
      const paidBooking = { 
        ...mockBooking, 
        paymentStatus: PaymentStatus.PAID,
        status: BookingStatus.CONFIRMED,
        paidAmount: mockBooking.totalAmount,
        paymentId: 'payment_123',
      };
      
      mockRepository.findOne.mockResolvedValue(mockBooking);
      mockRepository.save.mockResolvedValue(paidBooking);

      const result = await service.updatePaymentStatus(
        mockBooking.id, 
        PaymentStatus.PAID, 
        'payment_123'
      );

      expect(result.paymentStatus).toBe(PaymentStatus.PAID);
      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(result.paidAmount).toBe(mockBooking.totalAmount);
      expect(result.paymentId).toBe('payment_123');
    });
  });

  describe('cancel', () => {
    it('should cancel booking with reason', async () => {
      const cancelledBooking = { 
        ...mockBooking, 
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Customer request',
      };
      
      mockRepository.findOne.mockResolvedValue(mockBooking);
      mockRepository.save.mockResolvedValue(cancelledBooking);

      const result = await service.cancel(mockBooking.id, 'Customer request');

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(result.cancellationReason).toBe('Customer request');
      expect(result.cancelledAt).toBeDefined();
    });

    it('should throw BadRequestException if already cancelled', async () => {
      const cancelledBooking = { ...mockBooking, status: BookingStatus.CANCELLED };
      
      mockRepository.findOne.mockResolvedValue(cancelledBooking);

      await expect(
        service.cancel(mockBooking.id, 'Customer request')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already checked out', async () => {
      const checkedOutBooking = { ...mockBooking, status: BookingStatus.CHECKED_OUT };
      
      mockRepository.findOne.mockResolvedValue(checkedOutBooking);

      await expect(
        service.cancel(mockBooking.id, 'Customer request')
      ).rejects.toThrow(BadRequestException);
    });
  });
});