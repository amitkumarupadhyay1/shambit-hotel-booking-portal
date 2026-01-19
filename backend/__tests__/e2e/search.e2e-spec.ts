import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel, HotelStatus, HotelType } from '../../src/modules/hotels/entities/hotel.entity';
import { Room, RoomType } from '../../src/modules/rooms/entities/room.entity';
import { RoomAvailability } from '../../src/modules/availability/entities/room-availability.entity';
import { User, UserRole } from '../../src/modules/users/entities/user.entity';

describe('Search (e2e)', () => {
  let app: INestApplication;
  let hotelRepository: Repository<Hotel>;
  let roomRepository: Repository<Room>;
  let availabilityRepository: Repository<RoomAvailability>;
  let userRepository: Repository<User>;

  let testUser: User;
  let testHotel: Hotel;
  let testRoom: Room;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    hotelRepository = moduleFixture.get<Repository<Hotel>>(getRepositoryToken(Hotel));
    roomRepository = moduleFixture.get<Repository<Room>>(getRepositoryToken(Room));
    availabilityRepository = moduleFixture.get<Repository<RoomAvailability>>(
      getRepositoryToken(RoomAvailability),
    );
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));

    // Create test data
    testUser = await userRepository.save({
      name: 'Test Seller',
      email: 'seller@test.com',
      password: 'hashedpassword',
      roles: [UserRole.SELLER],
    });

    testHotel = await hotelRepository.save({
      name: 'Test Hotel',
      slug: 'test-hotel',
      description: 'A test hotel',
      hotelType: HotelType.HOTEL,
      status: HotelStatus.APPROVED,
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      phone: '1234567890',
      email: 'hotel@test.com',
      startingPrice: 1000,
      averageRating: 4.5,
      totalReviews: 100,
      ownerId: testUser.id,
    });

    testRoom = await roomRepository.save({
      name: '101', // Changed from roomNumber to name
      roomType: RoomType.DELUXE,
      description: 'A deluxe room',
      maxOccupancy: 2,
      bedCount: 1,
      bedType: 'Queen',
      basePrice: 1000,
      quantity: 2,
      hotelId: testHotel.id,
    });

    // Create availability records
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    await availabilityRepository.save([
      {
        roomId: testRoom.id,
        date: today,
        availableCount: 2,
        isBlocked: false,
      },
      {
        roomId: testRoom.id,
        date: tomorrow,
        availableCount: 1,
        isBlocked: false,
      },
    ]);
  });

  afterAll(async () => {
    // Clean up test data
    await availabilityRepository.delete({});
    await roomRepository.delete({});
    await hotelRepository.delete({});
    await userRepository.delete({});
    await app.close();
  });

  describe('/hotels/search (GET)', () => {
    it('should return hotels with availability', () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      return request(app.getHttpServer())
        .get('/hotels/search')
        .query({
          city: 'Test City',
          checkInDate: today.toISOString().split('T')[0],
          checkOutDate: tomorrow.toISOString().split('T')[0],
          guests: 2,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expect(res.body.data[0].hotelId).toBe(testHotel.id);
          expect(res.body.data[0].name).toBe('Test Hotel');
          expect(res.body.data[0].city).toBe('Test City');
          expect(res.body.data[0].hotelType).toBe(HotelType.HOTEL);
          expect(res.body.data[0].minBasePrice).toBe(1000);
          expect(res.body.data[0].availabilityStatus).toBe('AVAILABLE');
          expect(res.body.pagination.total).toBe(1);
        });
    });

    it('should return empty results for unavailable dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 11);

      return request(app.getHttpServer())
        .get('/hotels/search')
        .query({
          city: 'Test City',
          checkInDate: futureDate.toISOString().split('T')[0],
          checkOutDate: futureDate2.toISOString().split('T')[0],
          guests: 2,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(0);
        });
    });

    it('should filter by hotel type', () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      return request(app.getHttpServer())
        .get('/hotels/search')
        .query({
          city: 'Test City',
          checkInDate: today.toISOString().split('T')[0],
          checkOutDate: tomorrow.toISOString().split('T')[0],
          guests: 2,
          hotelType: HotelType.RESORT,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(0);
        });
    });

    it('should validate required parameters', () => {
      return request(app.getHttpServer())
        .get('/hotels/search')
        .query({
          city: 'Test City',
          // Missing required dates
        })
        .expect(400);
    });

    it('should validate date format', () => {
      return request(app.getHttpServer())
        .get('/hotels/search')
        .query({
          city: 'Test City',
          checkInDate: 'invalid-date',
          checkOutDate: '2024-01-02',
          guests: 2,
        })
        .expect(400);
    });

    it('should validate checkout date after checkin date', () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      return request(app.getHttpServer())
        .get('/hotels/search')
        .query({
          city: 'Test City',
          checkInDate: today.toISOString().split('T')[0],
          checkOutDate: yesterday.toISOString().split('T')[0],
          guests: 2,
        })
        .expect(400);
    });
  });

  describe('/search/hotels/:id/availability (GET)', () => {
    it('should return hotel details with room availability', () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      return request(app.getHttpServer())
        .get(`/search/hotels/${testHotel.id}/availability`)
        .query({
          checkInDate: today.toISOString().split('T')[0],
          checkOutDate: tomorrow.toISOString().split('T')[0],
          guests: 2,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testHotel.id);
          expect(res.body.name).toBe('Test Hotel');
          expect(res.body.rooms).toHaveLength(1);
          expect(res.body.rooms[0].id).toBe(testRoom.id);
          expect(res.body.rooms[0].isAvailable).toBe(true);
          expect(res.body.rooms[0].availableCount).toBe(1); // Minimum across date range
        });
    });

    it('should return hotel details without availability check', () => {
      return request(app.getHttpServer())
        .get(`/search/hotels/${testHotel.id}/availability`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testHotel.id);
          expect(res.body.rooms).toHaveLength(1);
          expect(res.body.rooms[0].isAvailable).toBe(true);
          expect(res.body.rooms[0].availableCount).toBe(2); // Default quantity
        });
    });

    it('should return 404 for non-existent hotel', () => {
      return request(app.getHttpServer())
        .get('/search/hotels/non-existent-id/availability')
        .expect(404);
    });

    it('should return 404 for non-approved hotel', async () => {
      const draftHotel = await hotelRepository.save({
        name: 'Draft Hotel',
        slug: 'draft-hotel',
        hotelType: HotelType.HOTEL,
        status: HotelStatus.DRAFT,
        address: '456 Draft Street',
        city: 'Draft City',
        state: 'Draft State',
        pincode: '654321',
        phone: '0987654321',
        email: 'draft@test.com',
        startingPrice: 500,
        ownerId: testUser.id,
      });

      await request(app.getHttpServer())
        .get(`/search/hotels/${draftHotel.id}/availability`)
        .expect(404);

      await hotelRepository.delete(draftHotel.id);
    });
  });
});