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
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RoomStatus } from './entities/room.entity';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  create(@Body() createRoomDto: CreateRoomDto, @Request() req) {
    return this.roomsService.create(createRoomDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get('hotel/:hotelId')
  findByHotel(@Param('hotelId') hotelId: string) {
    return this.roomsService.findByHotel(hotelId);
  }

  @Get('available/:hotelId')
  findAvailableRooms(
    @Param('hotelId') hotelId: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
  ) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    return this.roomsService.findAvailableRooms(hotelId, checkInDate, checkOutDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto, @Request() req) {
    return this.roomsService.update(id, updateRoomDto, req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: RoomStatus,
    @Request() req,
  ) {
    return this.roomsService.updateStatus(id, status, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  remove(@Param('id') id: string, @Request() req) {
    return this.roomsService.remove(id, req.user.id);
  }
}