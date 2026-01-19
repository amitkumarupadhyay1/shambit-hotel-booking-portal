import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { AuditModule } from '../../src/modules/audit/audit.module';
import { User } from '../../src/modules/users/entities/user.entity';
import { AuditLog } from '../../src/modules/audit/entities/audit-log.entity';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let refreshCookie: string;

  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test123!@#',
    phone: '+1234567890',
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
          entities: [User, AuditLog],
          synchronize: true, // Only for testing
          dropSchema: true, // Clean database for each test run
        }),
        AuthModule,
        UsersModule,
        AuditModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply same middleware as main app
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new customer successfully with BUYER role', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('message');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user.name).toBe(testUser.name);
          expect(res.body.user.roles).toContain('BUYER');
          expect(res.body.user).not.toHaveProperty('password');
          
          // Store token for later tests
          authToken = res.body.accessToken;
          
          // Check for refresh token cookie
          const cookies = res.headers['set-cookie'];
          expect(cookies).toBeDefined();
          if (Array.isArray(cookies)) {
            const refreshTokenCookie = cookies.find((cookie: string) => 
              cookie.startsWith('refreshToken=')
            );
            expect(refreshTokenCookie).toBeDefined();
            refreshCookie = refreshTokenCookie || '';
          }
        });
    });

    it('should register a hotel owner successfully with SELLER role', () => {
      const hotelOwner = {
        name: 'Hotel Owner',
        email: 'owner@example.com',
        password: 'Owner123!@#',
        phone: '+1234567891',
        role: 'SELLER',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(hotelOwner)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body.user.email).toBe(hotelOwner.email);
          expect(res.body.user.roles).toContain('SELLER');
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should reject registration with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should reject registration with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email');
        });
    });

    it('should reject registration with weak password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'test2@example.com',
          password: 'weak',
        })
        .expect(400)
        .expect((res) => {
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message.some((msg: string) => msg.includes('Password') || msg.includes('password'))).toBe(true);
        });
    });

    it('should reject registration with invalid name', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'test3@example.com',
          name: 'A', // Too short
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('message');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user).not.toHaveProperty('password');
          
          // Update token for later tests
          authToken = res.body.accessToken;
          
          // Check for refresh token cookie
          const cookies = res.headers['set-cookie'];
          expect(cookies).toBeDefined();
          if (Array.isArray(cookies)) {
            const refreshTokenCookie = cookies.find((cookie: string) => 
              cookie.startsWith('refreshToken=')
            );
            expect(refreshTokenCookie).toBeDefined();
            refreshCookie = refreshTokenCookie || '';
          }
        });
    });

    it('should reject login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid credentials');
        });
    });

    it('should reject login with non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);
    });

    it('should reject login with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: testUser.password,
        })
        .expect(400);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
          expect(res.body.name).toBe(testUser.name);
          expect(res.body).not.toHaveProperty('password');
          expect(res.body.roles).toContain('BUYER');
        });
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh token with valid refresh cookie', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', refreshCookie)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('refreshed');
          
          // Update token for later tests
          authToken = res.body.accessToken;
        });
    });

    it('should reject refresh without cookie', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Refresh token not found');
        });
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout successfully with valid token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toContain('Logout successful');
          
          // Check that refresh token cookie is cleared
          const cookies = res.headers['set-cookie'];
          if (cookies && Array.isArray(cookies)) {
            const refreshTokenCookie = cookies.find((cookie: string) =>
              cookie.startsWith('refreshToken=')
            );
            if (refreshTokenCookie) {
              expect(refreshTokenCookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
            }
          }
        });
    });

    it('should reject logout without token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(401);
    });
  });
});
