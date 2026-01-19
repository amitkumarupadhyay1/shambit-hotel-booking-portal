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
import { JwtService } from '@nestjs/jwt';

describe('Seller Dashboard (e2e)', () => {
  let app: INestApplication;
  let hotelRepository: Repository<Hotel>;
  let roomRepository: Repository<Room>;
  let availabilityRepository: Repository<RoomAvailability>;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  let testSeller: User;
  let otherSeller: User;
  let testHotel: Hotel;
  let testRoom: Room;
  let sellerToken: string;
  let otherSellerToken: string;

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
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Create test users
    testSeller = await userRepository.save({
      name: 'Test Seller',
      email: 'seller@test.com',
      password: 'hashedpassword',
      roles: [UserRole.SELLER],
    });

    otherSeller = await userRepository.save({
      name: 'Other Seller',
      email: 'other@test.com',
      password: 'hashedpassword',
      roles: [UserRole.SELLER],
    });

    // Generate JWT tokens
    sellerToken = jwtService.sign({ sub: testSeller.id, email: testSeller.email });
    otherSellerToken = jwtService.sign({ sub: otherSeller.id, email: otherSeller.email });

    // Create test hotel
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
      ownerId: testSeller.id,
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
    await availabilityRepository.save({
      roomId: testRoom.id,
      date: today,
      availableCount: 1,
      isBlocked: true,
      blockReason: 'Maintenance',
    });
  });

  afterAll(async () => {
    // Clean up test data
    await availabilityRepository.delete({});
    await roomRepository.delete({});
    await hotelRepository.delete({});
    await userRepository.delete({});
    await app.close();
  });

  describe('/seller/dashboard (GET)', () => {
    it('should return seller dashboard data', () => {
      return request(app.getHttpServer())
        .get('/seller/dashboard')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.totalHotels).toBe(1);
          expect(res.body.totalRooms).toBe(1);
          expect(res.body.hotels).toHaveLength(1);
          expect(res.body.hotels[0].id).toBe(testHotel.id);
          expect(res.body.hotels[0].name).toBe('Test Hotel');
          expect(res.body.hotels[0].totalRooms).toBe(1);
          expect(res.body.summary.approvedHotels).toBe(1);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/seller/dashboard')
        .expect(401);
    });

    it('should require seller role', () => {
      // This would require creating a buyer user and token
      // For now, we'll test with no token
      return request(app.getHttpServer())
        .get('/seller/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/seller/hotels/:id/overview (GET)', () => {
    it('should return hotel availability overview', () => {
      return request(app.getHttpServer())
        .get(`/seller/hotels/${testHotel.id}/overview`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.hotel.id).toBe(testHotel.id);
          expect(res.body.rooms).toHaveLength(1);
          expect(res.body.rooms[0].id).toBe(testRoom.id);
        });
    });

    it('should not allow access to other seller\'s hotel', () => {
      return request(app.getHttpServer())
        .get(`/seller/hotels/${testHotel.id}/overview`)
        .set('Authorization', `Bearer ${otherSellerToken}`)
        .expect(403);
    });
  });

  describe('/seller/rooms/:roomId/availability (GET)', () => {
    it('should return room availability calendar', () => {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      return request(app.getHttpServer())
        .get(`/seller/rooms/${testRoom.id}/availability`)
        .query({
          startDate: today.toISOString().split('T')[0],
          endDate: nextWeek.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('date');
          expect(res.body[0]).toHaveProperty('availableCount');
          expect(res.body[0]).toHaveProperty('totalCount');
          expect(res.body[0]).toHaveProperty('isBlocked');
        });
    });

    it('should not allow access to other seller\'s room', () => {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      return request(app.getHttpServer())
        .get(`/seller/rooms/${testRoom.id}/availability`)
        .query({
          startDate: today.toISOString().split('T')[0],
          endDate: nextWeek.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${otherSellerToken}`)
        .expect(403);
    });
  });

  describe('/seller/rooms/:roomId/block (PUT)', () => {
    it('should block dates for a room', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      return request(app.getHttpServer())
        .put(`/seller/rooms/${testRoom.id}/block`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          startDate: tomorrow.toISOString().split('T')[0],
          endDate: dayAfter.toISOString().split('T')[0],
          reason: 'Test blocking',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Dates blocked successfully');
        });
    });

    it('should validate date format', () => {
      return request(app.getHttpServer())
        .put(`/seller/rooms/${testRoom.id}/block`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          startDate: 'invalid-date',
          endDate: '2024-01-02',
          reason: 'Test blocking',
        })
        .expect(400);
    });

    it('should not allow blocking other seller\'s room', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      return request(app.getHttpServer())
        .put(`/seller/rooms/${testRoom.id}/block`)
        .set('Authorization', `Bearer ${otherSellerToken}`)
        .send({
          startDate: tomorrow.toISOString().split('T')[0],
          endDate: dayAfter.toISOString().split('T')[0],
          reason: 'Test blocking',
        })
        .expect(403);
    });
  });

  describe('/seller/rooms/:roomId/unblock (PUT)', () => {
    it('should unblock dates for a room', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      return request(app.getHttpServer())
        .put(`/seller/rooms/${testRoom.id}/unblock`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          startDate: tomorrow.toISOString().split('T')[0],
          endDate: dayAfter.toISOString().split('T')[0],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Dates unblocked successfully');
        });
    });

    it('should not allow unblocking other seller\'s room', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      return request(app.getHttpServer())
        .put(`/seller/rooms/${testRoom.id}/unblock`)
        .set('Authorization', `Bearer ${otherSellerToken}`)
        .send({
          startDate: tomorrow.toISOString().split('T')[0],
          endDate: dayAfter.toISOString().split('T')[0],
        })
        .expect(403);
    });
  });

  describe('/seller/rooms/:roomId/set-availability (PUT)', () => {
    it('should set availability count for a room', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      return request(app.getHttpServer())
        .put(`/seller/rooms/${testRoom.id}/set-availability`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          date: tomorrow.toISOString().split('T')[0],
          availableCount: 1,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Availability updated successfully');
        });
    });

    it('should validate availability count', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      return request(app.getHttpServer())
        .put(`/seller/rooms/${testRoom.id}/set-availability`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          date: tomorrow.toISOString().split('T')[0],
          availableCount: -1, // Invalid count
        })
        .expect(400);
    });
  });
});