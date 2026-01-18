import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
  Query,
  Put,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SellerDashboardService } from './seller-dashboard.service';
import { AvailabilityService } from '../availability/availability.service';
import { SellerDashboardDto } from './dto/seller-dashboard.dto';
import { AvailabilityCalendarDto } from '../availability/dto/availability-calendar.dto';
import { BlockDatesDto } from '../availability/dto/block-dates.dto';
import { UnblockDatesDto } from '../availability/dto/unblock-dates.dto';
import { SetAvailabilityDto } from '../availability/dto/set-availability.dto';

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER, UserRole.ADMIN)
export class SellerDashboardController {
  constructor(
    private readonly sellerDashboardService: SellerDashboardService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  @Get('dashboard')
  async getDashboard(@Request() req): Promise<SellerDashboardDto> {
    return this.sellerDashboardService.getSellerDashboard(req.user.id);
  }

  @Get('hotels/:id/overview')
  async getHotelOverview(
    @Param('id', ParseUUIDPipe) hotelId: string,
    @Request() req,
  ) {
    return this.sellerDashboardService.getHotelAvailabilityOverview(hotelId, req.user.id);
  }

  @Get('hotels/:id/availability')
  async getHotelAvailability(
    @Param('id', ParseUUIDPipe) hotelId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
  ) {
    // Validate hotel ownership
    await this.sellerDashboardService.validateHotelOwnership(hotelId, req.user.id);

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all rooms for the hotel with their availability
    const hotel = await this.sellerDashboardService.validateHotelOwnership(hotelId, req.user.id);
    
    const roomsAvailability = [];
    for (const room of hotel.rooms) {
      const calendar = await this.availabilityService.getAvailabilityCalendar(room.id, start, end);
      roomsAvailability.push({
        room: {
          id: room.id,
          name: room.name, // Changed from roomNumber to name
          roomType: room.roomType,
          quantity: room.quantity,
        },
        calendar,
      });
    }

    return roomsAvailability;
  }

  @Get('rooms/:roomId/availability')
  async getRoomAvailability(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
  ): Promise<AvailabilityCalendarDto[]> {
    // Validate room ownership
    await this.sellerDashboardService.validateRoomOwnership(roomId, req.user.id);

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.availabilityService.getAvailabilityCalendar(roomId, start, end);
  }

  @Put('rooms/:roomId/block')
  async blockDates(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() blockDatesDto: BlockDatesDto,
    @Request() req,
  ): Promise<{ message: string }> {
    // Validate room ownership
    await this.sellerDashboardService.validateRoomOwnership(roomId, req.user.id);

    const startDate = new Date(blockDatesDto.startDate);
    const endDate = new Date(blockDatesDto.endDate);
    
    await this.availabilityService.blockDates(
      roomId,
      startDate,
      endDate,
      blockDatesDto.reason,
    );
    
    return { message: 'Dates blocked successfully' };
  }

  @Put('rooms/:roomId/unblock')
  async unblockDates(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() unblockDatesDto: UnblockDatesDto,
    @Request() req,
  ): Promise<{ message: string }> {
    // Validate room ownership
    await this.sellerDashboardService.validateRoomOwnership(roomId, req.user.id);

    const startDate = new Date(unblockDatesDto.startDate);
    const endDate = new Date(unblockDatesDto.endDate);
    
    await this.availabilityService.unblockDates(roomId, startDate, endDate);
    
    return { message: 'Dates unblocked successfully' };
  }

  @Put('rooms/:roomId/set-availability')
  async setAvailability(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() setAvailabilityDto: SetAvailabilityDto,
    @Request() req,
  ): Promise<{ message: string }> {
    // Validate room ownership
    await this.sellerDashboardService.validateRoomOwnership(roomId, req.user.id);

    const date = new Date(setAvailabilityDto.date);
    
    await this.availabilityService.setAvailability(
      roomId,
      date,
      setAvailabilityDto.availableCount,
    );
    
    return { message: 'Availability updated successfully' };
  }
}