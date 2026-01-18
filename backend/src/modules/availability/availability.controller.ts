import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AvailabilityService } from './availability.service';
import { BlockDatesDto } from './dto/block-dates.dto';
import { UnblockDatesDto } from './dto/unblock-dates.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { AvailabilityCalendarDto } from './dto/availability-calendar.dto';

@Controller('availability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('rooms/:roomId/calendar')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async getAvailabilityCalendar(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<AvailabilityCalendarDto[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.availabilityService.getAvailabilityCalendar(roomId, start, end);
  }

  @Put('rooms/:roomId/block')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async blockDates(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() blockDatesDto: BlockDatesDto,
  ): Promise<{ message: string }> {
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
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async unblockDates(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() unblockDatesDto: UnblockDatesDto,
  ): Promise<{ message: string }> {
    const startDate = new Date(unblockDatesDto.startDate);
    const endDate = new Date(unblockDatesDto.endDate);
    
    await this.availabilityService.unblockDates(roomId, startDate, endDate);
    
    return { message: 'Dates unblocked successfully' };
  }

  @Put('rooms/:roomId/set')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async setAvailability(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() setAvailabilityDto: SetAvailabilityDto,
  ): Promise<{ message: string }> {
    const date = new Date(setAvailabilityDto.date);
    
    await this.availabilityService.setAvailability(
      roomId,
      date,
      setAvailabilityDto.availableCount,
    );
    
    return { message: 'Availability updated successfully' };
  }
}