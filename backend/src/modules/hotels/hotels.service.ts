import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, Not, Any } from 'typeorm';
import { Hotel, HotelStatus } from './entities/hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { CreateHotelOnboardingDto } from './dto/create-hotel-onboarding.dto';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class HotelsService {
  constructor(
    @InjectRepository(Hotel)
    private hotelRepository: Repository<Hotel>,
    private roomsService: RoomsService,
    private dataSource: DataSource,
  ) { }

  async create(createHotelDto: CreateHotelDto, ownerId: string): Promise<Hotel> {
    const hotel = this.hotelRepository.create({
      ...createHotelDto,
      ownerId,
      status: HotelStatus.PENDING,
    });

    const savedHotel = await this.hotelRepository.save(hotel);
    savedHotel.slug = this.generateSlug(savedHotel.name, savedHotel.id);
    return this.hotelRepository.save(savedHotel);
  }

  /**
   * TRANSACTIONAL ONBOARDING: Hotel + Rooms
   */
  async onboard(dto: CreateHotelOnboardingDto, ownerId: string): Promise<Hotel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create Hotel
      const hotel = queryRunner.manager.create(Hotel, {
        ...dto.hotel,
        ownerId,
        status: HotelStatus.PENDING,
      });

      const savedHotel = await queryRunner.manager.save(Hotel, hotel);
      savedHotel.slug = this.generateSlug(savedHotel.name, savedHotel.id);
      await queryRunner.manager.save(Hotel, savedHotel);

      // 2. Create Rooms
      if (dto.rooms && dto.rooms.length > 0) {
        await this.roomsService.createBulkTransactional(
          savedHotel.id,
          dto.rooms,
          queryRunner.manager,
        );
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedHotel.id, ownerId); // Pass ownerId to allow access
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllPublic(filters?: any): Promise<Hotel[]> {
    const where: any = { status: HotelStatus.APPROVED };
    if (filters?.city) where.city = filters.city;
    if (filters?.hotelType) where.hotelType = filters.hotelType;

    return this.hotelRepository.find({
      where,
      relations: ['rooms'],
    });
  }

  async findMyHotels(ownerId: string): Promise<Hotel[]> {
    return this.hotelRepository.find({
      where: { ownerId },
      relations: ['rooms'],
    });
  }

  async findOne(id: string, userId?: string, isAdmin: boolean = false): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOne({
      where: { id },
      relations: ['owner', 'rooms'],
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    // Visibility logic:
    // 1. Admin sees everything
    // 2. Owner sees everything
    // 3. Others only see APPROVED
    if (!isAdmin && hotel.ownerId !== userId && hotel.status !== HotelStatus.APPROVED) {
      throw new ForbiddenException('You do not have permission to view this hotel');
    }

    return hotel;
  }

  async findBySlug(slug: string): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOne({
      where: { slug, status: HotelStatus.APPROVED },
      relations: ['rooms'],
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    return hotel;
  }

  async update(id: string, updateHotelDto: UpdateHotelDto, userId: string): Promise<Hotel> {
    const hotel = await this.findOne(id, userId);

    if (hotel.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own hotels');
    }

    Object.assign(hotel, updateHotelDto);
    if (updateHotelDto.name) {
      hotel.slug = this.generateSlug(hotel.name, hotel.id);
    }

    return this.hotelRepository.save(hotel);
  }

  async remove(id: string, userId: string): Promise<void> {
    const hotel = await this.findOne(id, userId);

    if (hotel.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own hotels');
    }

    await this.hotelRepository.remove(hotel);
  }

  private generateSlug(name: string, id: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    return `${base}-${id.split('-')[0]}`;
  }

  // Admin Methods (used by AdminHotelsService)
  async findByStatus(status: HotelStatus): Promise<Hotel[]> {
    return this.hotelRepository.find({
      where: { status },
      relations: ['owner', 'rooms'],
    });
  }

  async setStatus(id: string, status: HotelStatus): Promise<Hotel> {
    const hotel = await this.findOne(id, undefined, true);
    hotel.status = status;
    return this.hotelRepository.save(hotel);
  }
}
