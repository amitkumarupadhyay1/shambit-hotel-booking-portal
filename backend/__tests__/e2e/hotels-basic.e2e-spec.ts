import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { AuditModule } from '../../src/modules/audit/audit.module';
import { HotelsModule } from '../../src/modules/hotels/hotels.module';
import { User } from '../../src/modules/users/entities/user.entity';
import { AuditLog } from '../../src/modules/audit/entities/audit-log.entity';
import { Hotel } from '../../src/modules/hotels/entities/hotel.entity';
import { Room } from '../../src/modules/rooms/entities/room.entity';
import { Booking } from '../../src/modules/bookings/entities/booking.entity';

describe('Hotels Basic (e2e)', () => {
  let app: INestApplication;
  let ownerToken: string;

  const testOwner = {
    name: 'Hotel Owner',
    email: 'owner@example.com',
    password: 'Owner123!@#',
    role: 'SELLER',
  };

  const testHotel = {
    name: 'Test Hotel Ayodhya',
    description: 'A beautiful test hotel in Ayodhya',
    hotelType: 'HOTEL',
    address: '123 Ram Janmabhoomi Road, Ayodhya',
    city: 'Ayodhya',
    state: 'Uttar Pradesh',
    pincode: '224123',
    phone: '+919876543210',
    email: 'hotel@example.com',
    amenities: ['WiFi', 'Parking', 'Restaurant', 'AC'],
    startingPrice: 2500,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT) || 5432,
          username: process.env.DATABASE_USERNAME || 'postgres',
          password: process.env.DATABASE_PASSWORD || 'Aryan21@!',
          database: process.env.DATABASE_NAME || 'shambit_test_db',
          entities: [User, AuditLog, Hotel, Room, Booking],
          synchronize: true,
          dropSchema: true,
        }),
        AuthModule,
        UsersModule,
        AuditModule,
        HotelsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api/v1');

    await app.init();

    // Register hotel owner
    const ownerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testOwner);
    ownerToken = ownerResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/hotels (POST)', () => {
    it('should create a hotel successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/hotels')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(testHotel)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(testHotel.name);
          expect(res.body.city).toBe(testHotel.city);
          expect(res.body.status).toBe('PENDING');
          expect(res.body).toHaveProperty('ownerId');
        });
    });

    it('should reject hotel creation without auth', () => {
      return request(app.getHttpServer())
        .post('/api/v1/hotels')
        .send(testHotel)
        .expect(401);
    });
  });

  describe('/hotels (GET)', () => {
    it('should return empty array for approved hotels', () => {
      return request(app.getHttpServer())
        .get('/api/v1/hotels')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // Should be empty since hotel is in PENDING status
          expect(res.body.length).toBe(0);
        });
    });
  });

  describe('/hotels/my-hotels (GET)', () => {
    it('should return owner hotels', () => {
      return request(app.getHttpServer())
        .get('/api/v1/hotels/my-hotels')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].name).toBe(testHotel.name);
        });
    });

    it('should reject request without auth', () => {
      return request(app.getHttpServer())
        .get('/api/v1/hotels/my-hotels')
        .expect(401);
    });
  });

  describe('/hotels (GET) - Search', () => {
    it('should search hotels by location', () => {
      return request(app.getHttpServer())
        .get('/api/v1/hotels?city=Ayodhya')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // Should be empty since hotel is in PENDING status
          expect(res.body.length).toBe(0);
        });
    });
  });
});
