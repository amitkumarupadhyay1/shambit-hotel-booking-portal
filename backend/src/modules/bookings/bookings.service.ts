import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus, PaymentStatus } from './entities/booking.entity';
import { Room } from '../rooms/entities/room.entity';
import { Hotel } from '../hotels/entities/hotel.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Hotel)
    private hotelRepository: Repository<Hotel>,
  ) { }

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // Generate booking reference
    const bookingReference = 'SH' + Date.now().toString().slice(-6);

    // Calculate nights
    const checkIn = new Date(createBookingDto.checkInDate);
    const checkOut = new Date(createBookingDto.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    // Verify room exists and is available
    const room = await this.roomRepository.findOne({
      where: { id: createBookingDto.roomId },
      relations: ['hotel'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check room availability (simplified - in production, check against existing bookings)
    const existingBooking = await this.bookingRepository.findOne({
      where: {
        roomId: createBookingDto.roomId,
        status: BookingStatus.CONFIRMED,
        // Add date overlap check here
      },
    });

    if (existingBooking) {
      throw new BadRequestException('Room is not available for selected dates');
    }

    const booking = this.bookingRepository.create({
      ...createBookingDto,
      bookingReference,
      nights,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    });

    return this.bookingRepository.save(booking);
  }

  async findAll(): Promise<Booking[]> {
    return this.bookingRepository.find({
      relations: ['customer', 'hotel', 'room'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string, roles?: UserRole[]): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['customer', 'hotel', 'room'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (userId && roles) {
      const isAdmin = roles.includes(UserRole.ADMIN);
      const isOwner = booking.customerId === userId || booking.hotel.ownerId === userId;

      if (!isAdmin && !isOwner) {
        throw new ForbiddenException('Access denied');
      }
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

  async findByOwner(ownerId: string): Promise<Booking[]> {
    return this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.hotel', 'hotel')
      .leftJoinAndSelect('booking.room', 'room')
      .leftJoinAndSelect('booking.customer', 'customer')
      .where('hotel.ownerId = :ownerId', { ownerId })
      .orderBy('booking.createdAt', 'DESC')
      .getMany();
  }

  async update(id: string, updateBookingDto: UpdateBookingDto, userId: string): Promise<Booking> {
    const booking = await this.findOne(id);

    // Only customer can update their own booking or hotel owner can update bookings for their hotels
    if (booking.customerId !== userId && booking.hotel.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own bookings');
    }

    Object.assign(booking, updateBookingDto);
    return this.bookingRepository.save(booking);
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.status = status;

    if (status === BookingStatus.CANCELLED) {
      booking.cancelledAt = new Date();
    }

    return this.bookingRepository.save(booking);
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

    return this.bookingRepository.save(booking);
  }

  async cancel(id: string, reason: string, userId: string): Promise<Booking> {
    const booking = await this.findOne(id);

    // Only customer can cancel their own booking
    if (booking.customerId !== userId) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === BookingStatus.CHECKED_OUT) {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;

    return this.bookingRepository.save(booking);
  }

  async checkIn(id: string, userId: string): Promise<Booking> {
    const booking = await this.findOne(id);

    // Only hotel owner can check in guests
    if (booking.hotel.ownerId !== userId) {
      throw new ForbiddenException('Only hotel owner can check in guests');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Booking must be confirmed to check in');
    }

    booking.status = BookingStatus.CHECKED_IN;
    return this.bookingRepository.save(booking);
  }

  async checkOut(id: string, userId: string): Promise<Booking> {
    const booking = await this.findOne(id);

    // Only hotel owner can check out guests
    if (booking.hotel.ownerId !== userId) {
      throw new ForbiddenException('Only hotel owner can check out guests');
    }

    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new BadRequestException('Guest must be checked in to check out');
    }

    booking.status = BookingStatus.CHECKED_OUT;
    return this.bookingRepository.save(booking);
  }
}