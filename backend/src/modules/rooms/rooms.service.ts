import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus } from './entities/room.entity';
import { Hotel } from '../hotels/entities/hotel.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Hotel)
    private hotelRepository: Repository<Hotel>,
  ) { }

  async create(createRoomDto: CreateRoomDto, userId: string): Promise<Room> {
    // Verify hotel ownership
    const hotel = await this.hotelRepository.findOne({
      where: { id: createRoomDto.hotelId },
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    if (hotel.ownerId !== userId) {
      throw new ForbiddenException('You can only add rooms to your own hotels');
    }

    const room = this.roomRepository.create(createRoomDto);
    return this.roomRepository.save(room);
  }

  /**
   * Bulk create rooms within a transaction
   */
  async createBulkTransactional(
    hotelId: string,
    roomsDto: any[],
    manager: any, // Using any for EntityManager to avoid type strictness in this chunk if not imported
  ): Promise<any[]> {
    const rooms = roomsDto.map((dto) => {
      const room = manager.create(Room, {
        ...dto,
        hotelId,
      });
      return room;
    });

    return manager.save(Room, rooms);
  }

  async findAll(): Promise<Room[]> {
    return this.roomRepository.find({
      relations: ['hotel'],
    });
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['hotel'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async findByHotel(hotelId: string): Promise<Room[]> {
    return this.roomRepository.find({
      where: { hotelId },
      relations: ['hotel'],
    });
  }

  async findAvailableRooms(hotelId: string, checkIn: Date, checkOut: Date): Promise<Room[]> {
    // This is a simplified version - in production, you'd check against bookings
    return this.roomRepository.find({
      where: {
        hotelId,
        status: RoomStatus.AVAILABLE,
      },
      relations: ['hotel'],
    });
  }

  async update(id: string, updateRoomDto: UpdateRoomDto, userId: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['hotel'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.hotel.ownerId !== userId) {
      throw new ForbiddenException('You can only update rooms in your own hotels');
    }

    Object.assign(room, updateRoomDto);
    return this.roomRepository.save(room);
  }

  async remove(id: string, userId: string): Promise<void> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['hotel'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.hotel.ownerId !== userId) {
      throw new ForbiddenException('You can only delete rooms from your own hotels');
    }

    await this.roomRepository.remove(room);
  }

  async updateStatus(id: string, status: RoomStatus, userId: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['hotel'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.hotel.ownerId !== userId) {
      throw new ForbiddenException('You can only update rooms in your own hotels');
    }

    room.status = status;
    return this.roomRepository.save(room);
  }
}