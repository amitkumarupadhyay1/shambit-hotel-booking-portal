import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';

// Import modules and entities
import { HotelsModule } from '../../src/modules/hotels/hotels.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { RoomsModule } from '../../src/modules/rooms/rooms.module';
import { EnhancedHotel } from '../../src/modules/hotels/entities/enhanced-hotel.entity';
import { OnboardingSession } from '../../src/modules/hotels/entities/onboarding-session.entity';
import { User, UserRole } from '../../src/modules/users/entities/user.entity';
import { EnhancedRoom } from '../../src/modules/rooms/entities/enhanced-room.entity';

// Import services for testing
import { IntegratedOnboardingController } from '../../src/modules/hotels/controllers/integrated-onboarding.controller';
import { OnboardingService } from '../../src/modules/hotels/services/onboarding.service';

describe('Integrated Onboarding Flow (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let onboardingService: OnboardingService;

  // Test data
  let testUser: User;
  let testHotel: EnhancedHotel;
  let authToken: string;
  let onboardingSessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
          synchronize: true,
          logging: false,
          // SQLite doesn't support enum types, so we need to handle them as strings
          dropSchema: true,
        }),
        HotelsModule,
        AuthModule,
        UsersModule,
        RoomsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    onboardingService = moduleFixture.get<OnboardingService>(OnboardingService);

    // Create test user
    testUser = await dataSource.getRepository(User).save({
      email: 'test@hotel.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'Owner',
      roles: [UserRole.SELLER],
      isActive: true,
      isEmailVerified: true,
    });

    // Generate auth token
    authToken = jwtService.sign({ 
      sub: testUser.id, 
      email: testUser.email, 
      role: testUser.roles[0] 
    });
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up data before each test
    await dataSource.getRepository(OnboardingSession).delete({});
    await dataSource.getRepository(EnhancedHotel).delete({});
    await dataSource.getRepository(EnhancedRoom).delete({});
  });

  describe('Complete End-to-End Onboarding Flow', () => {
    it('should complete full onboarding process with all steps', async () => {
      // Step 1: Create onboarding session
      const sessionResponse = await request(app.getHttpServer())
        .post('/hotels/integrated-onboarding/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceInfo: {
            type: 'mobile',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
            screenSize: { width: 375, height: 812 }
          }
        })
        .expect(201);

      expect(sessionResponse.body.success).toBe(true);
      expect(sessionResponse.body.data.sessionId).toBeDefined();
      expect(sessionResponse.body.data.hotelId).toBeDefined();
      expect(sessionResponse.body.data.mobileConfig).toBeDefined();

      onboardingSessionId = sessionResponse.body.data.sessionId;
      const hotelId = sessionResponse.body.data.hotelId;

      // Step 2: Complete amenities step
      const amenitiesData = {
        selectedAmenities: ['wifi', 'parking', 'restaurant', 'pool'],
        propertyType: 'HOTEL'
      };

      await request(app.getHttpServer())
        .put(`/hotels/integrated-onboarding/sessions/${onboardingSessionId}/steps/amenities`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(amenitiesData)
        .expect(200);

      // Step 3: Complete images step
      const imagesData = {
        images: [
          {
            id: 'img1',
            category: 'exterior',
            url: 'https://example.com/exterior.jpg',
            qualityScore: 85
          },
          {
            id: 'img2',
            category: 'lobby',
            url: 'https://example.com/lobby.jpg',
            qualityScore: 90
          }
        ]
      };

      await request(app.getHttpServer())
        .put(`/hotels/integrated-onboarding/sessions/${onboardingSessionId}/steps/images`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(imagesData)
        .expect(200);

      // Step 4: Complete property information step
      const propertyInfoData = {
        description: 'A beautiful hotel located in the heart of the city with modern amenities and excellent service.',
        policies: {
          checkIn: { time: '15:00', instructions: 'Check-in at front desk' },
          checkOut: { time: '11:00', instructions: 'Check-out at front desk' },
          cancellation: { policy: '24 hours before arrival', fee: 0 }
        },
        locationDetails: {
          nearbyAttractions: ['City Center', 'Shopping Mall'],
          transportation: ['Bus Stop 100m', 'Metro Station 500m'],
          accessibility: ['Wheelchair accessible', 'Elevator available']
        }
      };

      await request(app.getHttpServer())
        .put(`/hotels/integrated-onboarding/sessions/${onboardingSessionId}/steps/property-info`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(propertyInfoData)
        .expect(200);

      // Step 5: Complete rooms step
      const roomsData = {
        rooms: [
          {
            name: 'Deluxe Room',
            type: 'DELUXE',
            basePrice: 3000,
            maxOccupancy: 2,
            bedCount: 1,
            bedType: 'Queen',
            amenities: ['wifi', 'tv', 'ac'],
            images: [
              {
                id: 'room1',
                category: 'room',
                url: 'https://example.com/room1.jpg'
              }
            ]
          },
          {
            name: 'Suite Room',
            type: 'SUITE',
            basePrice: 5000,
            maxOccupancy: 4,
            bedCount: 2,
            bedType: 'King',
            amenities: ['wifi', 'tv', 'ac', 'minibar'],
            images: [
              {
                id: 'room2',
                category: 'room',
                url: 'https://example.com/room2.jpg'
              }
            ]
          }
        ]
      };

      await request(app.getHttpServer())
        .put(`/hotels/integrated-onboarding/sessions/${onboardingSessionId}/steps/rooms`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(roomsData)
        .expect(200);

      // Step 6: Complete business features step (optional)
      const businessFeaturesData = {
        meetingRooms: [
          {
            name: 'Conference Room A',
            capacity: 20,
            equipment: ['projector', 'whiteboard', 'wifi'],
            hourlyRate: 1000
          }
        ],
        connectivity: {
          wifiSpeed: '100 Mbps',
          coverage: ['All rooms', 'Common areas'],
          reliability: 'High'
        }
      };

      await request(app.getHttpServer())
        .put(`/hotels/integrated-onboarding/sessions/${onboardingSessionId}/steps/business-features`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(businessFeaturesData)
        .expect(200);

      // Step 7: Get session status to verify all steps completed
      const statusResponse = await request(app.getHttpServer())
        .get(`/hotels/integrated-onboarding/sessions/${onboardingSessionId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.session).toBeDefined();
      expect(statusResponse.body.data.qualityScore).toBeDefined();
      expect(statusResponse.body.data.qualityScore.overall).toBeGreaterThan(70);

      // Step 8: Complete onboarding
      const completionResponse = await request(app.getHttpServer())
        .post(`/hotels/integrated-onboarding/sessions/${onboardingSessionId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          finalReview: true,
          publishImmediately: true
        })
        .expect(200);

      expect(completionResponse.body.success).toBe(true);
      expect(completionResponse.body.data.hotelId).toBe(hotelId);
      expect(completionResponse.body.data.qualityScore).toBeGreaterThan(70);
      expect(completionResponse.body.data.integrationStatus).toBeDefined();
      expect(completionResponse.body.data.integrationStatus.searchIndex).toBe('completed');
      expect(completionResponse.body.data.integrationStatus.bookingEngine).toBe('completed');

      // Verify hotel was created and updated correctly
      const hotel = await dataSource.getRepository(EnhancedHotel).findOne({
        where: { id: hotelId },
        relations: ['rooms']
      });

      expect(hotel).toBeDefined();
      expect(hotel.amenities).toBeDefined();
      expect(hotel.propertyDescription).toBeDefined();
      expect(hotel.policies).toBeDefined();
      expect(hotel.locationDetails).toBeDefined();
      expect(hotel.businessFeatures).toBeDefined();
      expect(hotel.onboardingStatus).toBe('COMPLETED');
      expect(hotel.qualityMetrics.overallScore).toBeGreaterThan(70);
    });

    it('should handle validation errors during step updates', async () => {
      // Create session
      const sessionResponse = await request(app.getHttpServer())
        .post('/hotels/integrated-onboarding/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      const sessionId = sessionResponse.body.data.sessionId;

      // Try to submit invalid amenities data
      const invalidAmenitiesData = {
        selectedAmenities: [], // Empty array should trigger validation error
        propertyType: 'INVALID_TYPE'
      };

      const errorResponse = await request(app.getHttpServer())
        .put(`/hotels/integrated-onboarding/sessions/${sessionId}/steps/amenities`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidAmenitiesData)
        .expect(400);

      expect(errorResponse.body.success).toBe(false);
      expect(errorResponse.body.message).toContain('validation failed');
    });

    it('should support real-time validation without saving', async () => {
      // Create session
      const sessionResponse = await request(app.getHttpServer())
        .post('/hotels/integrated-onboarding/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      const sessionId = sessionResponse.body.data.sessionId;

      // Test validation endpoint
      const validationResponse = await request(app.getHttpServer())
        .post(`/hotels/integrated-onboarding/sessions/${sessionId}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          stepId: 'amenities',
          data: {
            selectedAmenities: ['wifi', 'parking'],
            propertyType: 'HOTEL'
          },
          validateDependencies: false
        })
        .expect(200);

      expect(validationResponse.body.success).toBe(true);
      expect(validationResponse.body.data.isValid).toBe(true);
      expect(validationResponse.body.data.errors).toHaveLength(0);
    });
  });

  describe('Mobile Offline/Online Transitions', () => {
    it('should handle offline draft saving and online sync', async () => {
      // Create session
      const sessionResponse = await request(app.getHttpServer())
        .post('/hotels/integrated-onboarding/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceInfo: { type: 'mobile' }
        })
        .expect(201);

      const sessionId = sessionResponse.body.data.sessionId;

      // Simulate offline draft saving
      const draftData = {
        amenities: {
          selectedAmenities: ['wifi', 'parking'],
          propertyType: 'HOTEL'
        },
        'property-info': {
          description: 'Draft description saved offline'
        }
      };

      // Save draft (simulating offline storage)
      await request(app.getHttpServer())
        .put(`/hotels/onboarding/sessions/${sessionId}/draft`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ draftData })
        .expect(200);

      // Load draft (simulating coming back online)
      const loadResponse = await request(app.getHttpServer())
        .get(`/hotels/onboarding/sessions/${sessionId}/draft`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(loadResponse.body.success).toBe(true);
      expect(loadResponse.body.data.amenities).toBeDefined();
      expect(loadResponse.body.data.amenities.selectedAmenities).toEqual(['wifi', 'parking']);
      expect(loadResponse.body.data['property-info'].description).toBe('Draft description saved offline');
    });

    it('should handle mobile-optimized configuration', async () => {
      const configResponse = await request(app.getHttpServer())
        .get('/hotels/integrated-onboarding/mobile-config')
        .set('Authorization', `Bearer ${authToken}`)
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .expect(200);

      expect(configResponse.body.success).toBe(true);
      expect(configResponse.body.data).toBeDefined();
      expect(configResponse.body.data.imageUpload).toBeDefined();
      expect(configResponse.body.data.validation).toBeDefined();
    });
  });

  describe('Concurrent User Scenarios', () => {
    it('should handle multiple users onboarding simultaneously', async () => {
      // Create second test user
      const testUser2 = await dataSource.getRepository(User).save({
        email: 'test2@hotel.com',
        password: 'hashedpassword',
        firstName: 'Test2',
        lastName: 'Owner2',
        roles: [UserRole.SELLER],
        isActive: true,
        isEmailVerified: true,
      });

      const authToken2 = jwtService.sign({ 
        sub: testUser2.id, 
        email: testUser2.email, 
        role: testUser2.roles[0] 
      });

      // Create sessions for both users
      const session1Promise = request(app.getHttpServer())
        .post('/hotels/integrated-onboarding/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      const session2Promise = request(app.getHttpServer())
        .post('/hotels/integrated-onboarding/sessions')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({});

      const [session1Response, session2Response] = await Promise.all([
        session1Promise,
        session2Promise
      ]);

      expect(session1Response.status).toBe(201);
      expect(session2Response.status).toBe(201);
      expect(session1Response.body.data.sessionId).not.toBe(session2Response.body.data.sessionId);
      expect(session1Response.body.data.hotelId).not.toBe(session2Response.body.data.hotelId);

      // Both users should be able to update their sessions independently
      const amenitiesData1 = {
        selectedAmenities: ['wifi', 'parking'],
        propertyType: 'HOTEL'
      };

      const amenitiesData2 = {
        selectedAmenities: ['wifi', 'pool', 'gym'],
        propertyType: 'RESORT'
      };

      const update1Promise = request(app.getHttpServer())
        .put(`/hotels/integrated-onboarding/sessions/${session1Response.body.data.sessionId}/steps/amenities`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(amenitiesData1);

      const update2Promise = request(app.getHttpServer())
        .put(`/hotels/integrated-onboarding/sessions/${session2Response.body.data.sessionId}/steps/amenities`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(amenitiesData2);

      const [update1Response, update2Response] = await Promise.all([
        update1Promise,
        update2Promise
      ]);

      expect(update1Response.status).toBe(200);
      expect(update2Response.status).toBe(200);
    });

    it('should prevent unauthorized access to other users sessions', async () => {
      // Create session with first user
      const sessionResponse = await request(app.getHttpServer())
        .post('/hotels/integrated-onboarding/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      const sessionId = sessionResponse.body.data.sessionId;

      // Create second user
      const testUser2 = await dataSource.getRepository(User).save({
        email: 'test2@hotel.com',
        password: 'hashedpassword',
        firstName: 'Test2',
        lastName: 'Owner2',
        roles: [UserRole.SELLER],
        isActive: true,
        isEmailVerified: true,
      });

      const authToken2 = jwtService.sign({ 
        sub: testUser2.id, 
        email: testUser2.email, 
        role: testUser2.roles[0] 
      });

      // Try to access first user's session with second user's token
      await request(app.getHttpServer())
        .get(`/hotels/integrated-onboarding/sessions/${sessionId}/status`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(403); // Should be forbidden
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across all system integrations', async () => {
      // Complete full onboarding
      const sessionResponse = await request(app.getHttpServer())
        .post('/hotels/integrated-onboarding/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      const sessionId = sessionResponse.body.data.sessionId;
      const hotelId = sessionResponse.body.data.hotelId;

      // Add minimal required data for completion
      const steps = [
        {
          stepId: 'amenities',
          data: { selectedAmenities: ['wifi'], propertyType: 'HOTEL' }
        },
        {
          stepId: 'images',
          data: { images: [{ id: 'img1', category: 'exterior', url: 'test.jpg' }] }
        },
        {
          stepId: 'property-info',
          data: { 
            description: 'Test hotel description with sufficient length to pass validation requirements.',
            policies: { checkIn: { time: '15:00' }, checkOut: { time: '11:00' } }
          }
        },
        {
          stepId: 'rooms',
          data: { 
            rooms: [{ 
              name: 'Test Room', 
              type: 'DOUBLE', 
              basePrice: 2000, 
              maxOccupancy: 2, 
              bedCount: 1, 
              bedType: 'Queen' 
            }] 
          }
        }
      ];

      // Complete all steps
      for (const step of steps) {
        await request(app.getHttpServer())
          .put(`/hotels/integrated-onboarding/sessions/${sessionId}/steps/${step.stepId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(step.data)
          .expect(200);
      }

      // Complete onboarding
      await request(app.getHttpServer())
        .post(`/hotels/integrated-onboarding/sessions/${sessionId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      // Verify data consistency across entities
      const hotel = await dataSource.getRepository(EnhancedHotel).findOne({
        where: { id: hotelId },
        relations: ['enhancedRooms']
      });

      expect(hotel).toBeDefined();
      expect(hotel.amenities).toBeDefined();
      expect(hotel.propertyDescription).toBeDefined();
      expect(hotel.policies).toBeDefined();
      expect(hotel.onboardingStatus).toBe('COMPLETED');
      expect(hotel.qualityMetrics).toBeDefined();
      expect(hotel.qualityMetrics.overallScore).toBeGreaterThan(0);

      // Verify enhanced rooms were created
      expect(hotel.enhancedRooms).toBeDefined();
      expect(hotel.enhancedRooms.length).toBe(1);
      expect(hotel.enhancedRooms[0].basicInfo?.name).toBe('Test Room');

      // Verify session was marked as completed
      const session = await dataSource.getRepository(OnboardingSession).findOne({
        where: { id: sessionId }
      });

      expect(session).toBeDefined();
      expect(session.sessionStatus).toBe('COMPLETED');
      expect(session.qualityScore).toBeGreaterThan(0);
    });

    it('should handle transaction rollback on completion failure', async () => {
      // Create session
      const sessionResponse = await request(app.getHttpServer())
        .post('/hotels/integrated-onboarding/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      const sessionId = sessionResponse.body.data.sessionId;

      // Add incomplete data that should cause completion to fail
      await request(app.getHttpServer())
        .put(`/hotels/integrated-onboarding/sessions/${sessionId}/steps/amenities`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ selectedAmenities: ['wifi'], propertyType: 'HOTEL' })
        .expect(200);

      // Try to complete with insufficient data
      await request(app.getHttpServer())
        .post(`/hotels/integrated-onboarding/sessions/${sessionId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400); // Should fail due to incomplete data

      // Verify session is still active and not marked as completed
      const session = await dataSource.getRepository(OnboardingSession).findOne({
        where: { id: sessionId }
      });

      expect(session).toBeDefined();
      expect(session.sessionStatus).toBe('ACTIVE'); // Should still be active
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent sessions efficiently', async () => {
      const concurrentSessions = 10;
      const sessionPromises = [];

      // Create multiple sessions concurrently
      for (let i = 0; i < concurrentSessions; i++) {
        sessionPromises.push(
          request(app.getHttpServer())
            .post('/hotels/integrated-onboarding/sessions')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              deviceInfo: { type: 'mobile' }
            })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(sessionPromises);
      const endTime = Date.now();

      // All sessions should be created successfully
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Should complete within reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);

      // All session IDs should be unique
      const sessionIds = responses.map(r => r.body.data.sessionId);
      const uniqueSessionIds = new Set(sessionIds);
      expect(uniqueSessionIds.size).toBe(concurrentSessions);
    });

    it('should maintain response times under load', async () => {
      // Create session
      const sessionResponse = await request(app.getHttpServer())
        .post('/hotels/integrated-onboarding/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(201);

      const sessionId = sessionResponse.body.data.sessionId;

      // Perform multiple step updates concurrently
      const updatePromises = [];
      const stepData = {
        selectedAmenities: ['wifi', 'parking'],
        propertyType: 'HOTEL'
      };

      for (let i = 0; i < 5; i++) {
        updatePromises.push(
          request(app.getHttpServer())
            .put(`/hotels/integrated-onboarding/sessions/${sessionId}/steps/amenities`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(stepData)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(updatePromises);
      const endTime = Date.now();

      // All updates should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within 2 seconds (requirement from spec)
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});