import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { AuditModule } from '../../src/modules/audit/audit.module';
import { User, UserRole } from '../../src/modules/users/entities/user.entity';
import { AuditLog } from '../../src/modules/audit/entities/audit-log.entity';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let buyerToken: string;
  let adminToken: string;
  let buyerUserId: string;
  let adminUserId: string;

  const buyerUser = {
    name: 'Buyer User',
    email: 'buyer@example.com',
    password: 'Test123!@#',
  };

  const adminUser = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin123!@#',
    roles: [UserRole.ADMIN],
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
          synchronize: true,
          dropSchema: true,
        }),
        AuthModule,
        UsersModule,
        AuditModule,
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

    // Create test users
    const buyerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(buyerUser);
    
    buyerToken = buyerResponse.body.accessToken;
    buyerUserId = buyerResponse.body.user.id;

    const adminResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(adminUser);
    
    adminToken = adminResponse.body.accessToken;
    adminUserId = adminResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users/me (GET)', () => {
    it('should get own profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(buyerUser.email);
          expect(res.body.name).toBe(buyerUser.name);
          expect(res.body).not.toHaveProperty('password');
          expect(res.body.roles).toContain('BUYER');
        });
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .expect(401);
    });
  });

  describe('/users/me (PATCH)', () => {
    it('should update own profile', () => {
      const updateData = {
        name: 'Updated Buyer Name',
        phone: '+1987654321',
      };

      return request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(updateData.name);
          expect(res.body.phone).toBe(updateData.phone);
          expect(res.body.email).toBe(buyerUser.email); // Should not change
        });
    });

    it('should reject invalid phone number', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ phone: 'invalid-phone' })
        .expect(400);
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .send({ name: 'New Name' })
        .expect(401);
    });
  });

  describe('/users (GET) - Admin only', () => {
    it('should get all users with admin token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2); // At least buyer and admin
          
          // Check that passwords are not included
          res.body.forEach((user: any) => {
            expect(user).not.toHaveProperty('password');
          });
        });
    });

    it('should reject non-admin user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(401);
    });
  });

  describe('/users/:id (GET) - Admin only', () => {
    it('should get specific user with admin token', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${buyerUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(buyerUserId);
          expect(res.body.email).toBe(buyerUser.email);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should reject non-admin user', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${adminUserId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);
    });
  });

  describe('/users/:id (PATCH) - Admin only', () => {
    it('should update user with admin token', () => {
      const updateData = {
        name: 'Admin Updated Name',
        status: 'SUSPENDED',
      };

      return request(app.getHttpServer())
        .patch(`/api/v1/users/${buyerUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(updateData.name);
          expect(res.body.status).toBe(updateData.status);
        });
    });

    it('should reject non-admin user', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/users/${adminUserId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ name: 'Hacker Name' })
        .expect(403);
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/users/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Name' })
        .expect(404);
    });
  });

  describe('/users (POST) - Admin only', () => {
    it('should create user with admin token', () => {
      const newUser = {
        name: 'Created User',
        email: 'created@example.com',
        password: 'Created123!@#',
        roles: [UserRole.SELLER],
      };

      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe(newUser.name);
          expect(res.body.email).toBe(newUser.email);
          expect(res.body.roles).toContain('SELLER');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should reject duplicate email', () => {
      const duplicateUser = {
        name: 'Duplicate User',
        email: buyerUser.email, // Already exists
        password: 'Duplicate123!@#',
      };

      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateUser)
        .expect(409);
    });

    it('should reject non-admin user', () => {
      const newUser = {
        name: 'Unauthorized User',
        email: 'unauthorized@example.com',
        password: 'Unauthorized123!@#',
      };

      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(newUser)
        .expect(403);
    });
  });

  describe('/users/:id (DELETE) - Admin only', () => {
    let userToDeleteId: string;

    beforeAll(async () => {
      // Create a user to delete
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'User To Delete',
          email: 'delete@example.com',
          password: 'Delete123!@#',
        });
      
      userToDeleteId = response.body.id;
    });

    it('should delete user with admin token', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/users/${userToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should return 404 for already deleted user', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/users/${userToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should reject non-admin user', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/users/${adminUserId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);
    });
  });
});