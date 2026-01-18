import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FeatureFlagGuard } from '../../common/guards/feature-flag.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FeatureFlag } from '../../common/decorators/feature-flag.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BookingStatus, PaymentStatus } from './entities/booking.entity';

@Controller('bookings')
@UseGuards(FeatureFlagGuard)
@FeatureFlag('BOOKING_CREATION')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    // Set customer ID from authenticated user if not provided
    if (!createBookingDto.customerId) {
      createBookingDto.customerId = req.user.id;
    }
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get('my-bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER)
  findMyBookings(@Request() req) {
    return this.bookingsService.findByCustomer(req.user.id);
  }

  @Get('hotel-bookings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  findHotelBookings(@Request() req, @Query('hotelId') hotelId?: string) {
    if (hotelId) {
      return this.bookingsService.findByHotel(hotelId);
    }
    return this.bookingsService.findByOwner(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto, @Request() req) {
    return this.bookingsService.update(id, updateBookingDto, req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.bookingsService.updateStatus(id, status);
  }

  @Patch(':id/payment')
  @UseGuards(JwtAuthGuard)
  @FeatureFlag('PAYMENT_PROCESSING')
  updatePaymentStatus(
    @Param('id') id: string,
    @Body('paymentStatus') paymentStatus: PaymentStatus,
    @Body('paymentId') paymentId?: string,
  ) {
    return this.bookingsService.updatePaymentStatus(id, paymentStatus, paymentId);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER)
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.bookingsService.cancel(id, reason, req.user.id);
  }

  @Post(':id/check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  checkIn(@Param('id') id: string, @Request() req) {
    return this.bookingsService.checkIn(id, req.user.id);
  }

  @Post(':id/check-out')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  checkOut(@Param('id') id: string, @Request() req) {
    return this.bookingsService.checkOut(id, req.user.id);
  }
}