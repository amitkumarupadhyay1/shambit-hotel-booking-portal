import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import * as fc from 'fast-check';

// Import modules and entities
import { HotelsModule } from '../../src/modules/hotels/hotels.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { RoomsModule } from '../../src/modules/rooms/rooms.module';
import { User, UserRole } from '../../src/modules/users/entities/user.entity';
import { OnboardingSession } from '../../src/modules/hotels/entities/onboarding-session.entity';

// Property-based test generators
const amenityGenerator = fc.array(
  fc.constantFrom('wifi', 'parking', 'pool', 'gym', 'restaurant', 'spa', 'bar', 'laundry'),
  { minLength: 1, maxLength: 8 }
);

const propertyTypeGenerator = fc.constantFrom('HOTEL', 'RESORT', 'GUEST_HOUSE', 'APARTMENT');

const imageGenerator = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom('exterior', 'lobby', 'rooms', 'amenities', 'dining'),
  url: fc.webUrl(),
  qualityScore: fc.integer({ min: 0, max: 100 })
});

const roomGenerator = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  type: fc.constantFrom('SINGLE', 'DOUBLE', 'DELUXE', 'SUITE', 'FAMILY'),
  basePrice: fc.integer({ min: 100, max: 50000 }),
  maxOccupancy: fc.integer({ min: 1, max: 10 }),
  bedCount: fc.integer({ min: 1, max: 5 }),
  bedType: fc.constantFrom('Single', 'Double', 'Queen', 'King'),
  amenities: fc.array(fc.string(), { maxLength: 10 })
});

const propertyDescriptionGenerator = fc.string({ minLength: 50, maxLength: 2000 });

const businessFeaturesGenerator = fc.record({
  meetingRooms: fc.array(fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    capacity: fc.integer({ min: 2, max: 100 }),
    equipment: fc.array(fc.string(), { maxLength: 10 }),
    hourlyRate: fc.integer({ min: 100, max: 10000 })
  }), { maxLength: 5 }),
  connectivity: fc.record({
    wifiSpeed: fc.string(),
    coverage: fc.array(fc.string(), { maxLength: 5 }),
    reliability: fc.constantFrom('Low', 'Medium', 'High')
  })
});

describe('Integrated Onboarding Flow - Property-Based Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let testUser: User;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
          synchronize: true,
          logging: false,
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

    // Create test user
    testUser = await dataSource.getRepository(User).save({
      email: 'test@hotel.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'Owner',
      role: UserRole.SELLER,
      isActive: true,
      isEmailVerified: true,
    });

    authToken = jwtService.sign({ 
      sub: testUser.id, 
      email: testUser.email, 
      roles: [testUser.roles[0]] 
    });
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up data before each test
    await dataSource.getRepository(OnboardingSession).delete({});
  });

  /**
   * **Feature: enhanced-hotel-onboarding, Property 23: Idempotent Step Updates**
   * 
   * For any onboarding step update submitted multiple times with identical data, 
   * the system should produce the same persisted state without duplication or side effects.
   * 
   * **Validates: Requirements 6.4, 8.3** (supports offline sync and data consistency)
   */
  describe('Property 23: Idempotent Step Updates', () => {
    it('should handle identical step updates idempotently', async () => {
      await fc.assert(
        fc.asyncProperty(
          amenityGenerator,
          propertyTypeGenerator,
          fc.integer({ min: 2, max: 5 }), // Number of identical updates
          async (selectedAmenities, propertyType, updateCount) => {
            // Create session
            const sessionResponse = await request(app.getHttpServer())
              .post('/hotels/integrated-onboarding/sessions')
              .set('Authorization', `Bearer ${authToken}`)
              .send({});

            expect(sessionResponse.status).toBe(201);
            const sessionId = sessionResponse.body.data.sessionId;

            const stepData = { selectedAmenities, propertyType };

            // Perform identical updates multiple times
            const updatePromises = Array(updateCount).fill(null).map(() =>
              request(app.getHttpServer())
                .put(`/hotels/integrated-onboarding/sessions/${sessionId}/steps/amenities`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(stepData)
            );

            const responses = await Promise.all(updatePromises);

            // All updates should succeed
            responses.forEach(response => {
              expect(response.status).toBe(200);
            });

            // Verify final state is consistent
            const finalDraft = await request(app.getHttpServer())
              .get(`/hotels/onboarding/sessions/${sessionId}/draft`)
              .set('Authorization', `Bearer ${authToken}`);

            expect(finalDraft.status).toBe(200);
            expect(finalDraft.body.data.amenities.selectedAmenities).toEqual(
              expect.arrayContaining(selectedAmenities)
            );

            // Verify no duplicates in stored amenities
            const storedAmenities = finalDraft.body.data.amenities.selectedAmenities;
            const uniqueAmenities = [...new Set(storedAmenities)];
            expect(storedAmenities).toEqual(uniqueAmenities);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle concurrent identical updates without race conditions', async () => {
      await fc.assert(
        fc.asyncProperty(
          imageGenerator,
          fc.integer({ min: 3, max: 8 }), // Number of concurrent updates
          async (imageData, concurrentCount) => {
            // Create session
            const sessionResponse = await request(app.getHttpServer())
              .post('/hotels/integrated-onboarding/sessions')
              .set('Authorization', `Bearer ${authToken}`)
              .send({});

            const sessionId = sessionResponse.body.data.sessionId;
            const stepData = { images: [imageData] };

            // Perform concurrent identical updates
            const updatePromises = Array(concurrentCount).fill(null).map(() =>
              request(app.getHttpServer())
                .put(`/hotels/integrated-onboarding/sessions/${sessionId}/steps/images`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(stepData)
            );

            const responses = await Promise.all(updatePromises);

            // All updates should succeed
            responses.forEach(response => {
              expect(response.status).toBe(200);
            });

            // Verify no duplicate images in final state
            const finalDraft = await request(app.getHttpServer())
              .get(`/hotels/onboarding/sessions/${sessionId}/draft`)
              .set('Authorization', `Bearer ${authToken}`);

            const storedImages = finalDraft.body.data.images?.images || [];
            const imageIds = storedImages.map((img: any) => img.id);
            const uniqueImageIds = [...new Set(imageIds)];
            
            expect(imageIds).toEqual(uniqueImageIds);
            expect(storedImages.length).toBe(1); // Should only have one image despite multiple updates
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * **Feature: enhanced-hotel-onboarding, Property 16: Data Persistence and Integration**
   * 
   * For any onboarding data (amenities, images, property information), the system should 
   * store data with proper relational mapping, maintain metadata and category associations, 
   * preserve data consistency across all related components, and trigger appropriate system 
   * updates upon completion.
   * 
   * **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
   */
  describe('Property 16: Data Persistence and Integration', () => {
    it('should persist all onboarding data with proper relational mapping', async () => {
      await fc.assert(
        fc.asyncProperty(
          amenityGenerator,
          propertyTypeGenerator,
          fc.array(imageGenerator, { minLength: 1, maxLength: 5 }),
          propertyDescriptionGenerator,
          fc.array(roomGenerator, { minLength: 1, maxLength: 3 }),
          async (amenities, propertyType, images, description, rooms) => {
            // Create session
            const sessionResponse = await request(app.getHttpServer())
              .post('/hotels/integrated-onboarding/sessions')
              .set('Authorization', `Bearer ${authToken}`)
              .send({});

            const sessionId = sessionResponse.body.data.sessionId;
            const hotelId = sessionResponse.body.data.hotelId;

            // Complete all required steps
            const steps = [
              {
                stepId: 'amenities',
                data: { selectedAmenities: amenities, propertyType }
              },
              {
                stepId: 'images',
                data: { images }
              },
              {
                stepId: 'property-info',
                data: { 
                  description,
                  policies: { 
                    checkIn: { time: '15:00' }, 
                    checkOut: { time: '11:00' } 
                  }
                }
              },
              {
                stepId: 'rooms',
                data: { rooms }
              }
            ];

            // Update all steps
            for (const step of steps) {
              const response = await request(app.getHttpServer())
                .put(`/hotels/integrated-onboarding/sessions/${sessionId}/steps/${step.stepId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(step.data);

              expect(response.status).toBe(200);
            }

            // Complete onboarding
            const completionResponse = await request(app.getHttpServer())
              .post(`/hotels/integrated-onboarding/sessions/${sessionId}/complete`)
              .set('Authorization', `Bearer ${authToken}`)
              .send({});

            expect(completionResponse.status).toBe(200);

            // Verify data persistence and relationships
            const hotel = await dataSource.query(
              'SELECT * FROM enhanced_hotel WHERE id = ?',
              [hotelId]
            );

            expect(hotel).toHaveLength(1);
            expect(hotel[0].onboardingStatus).toBe('COMPLETED');

            // Verify amenities are stored
            if (hotel[0].amenities) {
              const storedAmenities = JSON.parse(hotel[0].amenities);
              expect(storedAmenities).toBeDefined();
            }

            // Verify property description is stored
            if (hotel[0].propertyDescription) {
              const storedDescription = JSON.parse(hotel[0].propertyDescription);
              expect(storedDescription.content).toBe(description);
            }

            // Verify rooms are created with proper relationships
            const hotelRooms = await dataSource.query(
              'SELECT * FROM enhanced_room WHERE hotelId = ?',
              [hotelId]
            );

            expect(hotelRooms.length).toBe(rooms.length);
            hotelRooms.forEach((room: any, index: number) => {
              expect(room.name).toBe(rooms[index].name);
              expect(room.hotelId).toBe(hotelId);
            });
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should maintain data consistency across concurrent operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(amenityGenerator, { minLength: 2, maxLength: 4 }),
          async (amenityArrays) => {
            // Create multiple sessions concurrently
            const sessionPromises = amenityArrays.map(() =>
              request(app.getHttpServer())
                .post('/hotels/integrated-onboarding/sessions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({})
            );

            const sessionResponses = await Promise.all(sessionPromises);
            const sessions = sessionResponses.map(r => r.body.data);

            // Update each session with different amenities concurrently
            const updatePromises = sessions.map((session, index) =>
              request(app.getHttpServer())
                .put(`/hotels/integrated-onboarding/sessions/${session.sessionId}/steps/amenities`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                  selectedAmenities: amenityArrays[index],
                  propertyType: 'HOTEL'
                })
            );

            const updateResponses = await Promise.all(updatePromises);

            // All updates should succeed
            updateResponses.forEach(response => {
              expect(response.status).toBe(200);
            });

            // Verify each session maintains its own data
            const draftPromises = sessions.map(session =>
              request(app.getHttpServer())
                .get(`/hotels/onboarding/sessions/${session.sessionId}/draft`)
                .set('Authorization', `Bearer ${authToken}`)
            );

            const draftResponses = await Promise.all(draftPromises);

            draftResponses.forEach((response, index) => {
              expect(response.status).toBe(200);
              const storedAmenities = response.body.data.amenities?.selectedAmenities || [];
              expect(storedAmenities).toEqual(expect.arrayContaining(amenityArrays[index]));
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * **Feature: enhanced-hotel-onboarding, Property 14: Quality Score Calculation**
   * 
   * For any onboarding data, the quality assurance engine should calculate completion scores 
   * using the specified weighted factors (image quality 40%, content completeness 40%, 
   * policy clarity 20%) and produce consistent, reproducible results.
   * 
   * **Validates: Requirements 7.1**
   */
  describe('Property 14: Quality Score Calculation', () => {
    it('should calculate consistent quality scores for identical data', async () => {
      await fc.assert(
        fc.asyncProperty(
          amenityGenerator,
          fc.array(imageGenerator, { minLength: 1, maxLength: 10 }),
          propertyDescriptionGenerator,
          fc.array(roomGenerator, { minLength: 1, maxLength: 5 }),
          businessFeaturesGenerator,
          fc.integer({ min: 2, max: 5 }), // Number of times to calculate
          async (amenities, images, description, rooms, businessFeatures, calculateCount) => {
            // Create session
            const sessionResponse = await request(app.getHttpServer())
              .post('/hotels/integrated-onboarding/sessions')
              .set('Authorization', `Bearer ${authToken}`)
              .send({});

            const sessionId = sessionResponse.body.data.sessionId;

            // Complete all steps with the same data
            const steps = [
              { stepId: 'amenities', data: { selectedAmenities: amenities, propertyType: 'HOTEL' } },
              { stepId: 'images', data: { images } },
              { 
                stepId: 'property-info', 
                data: { 
                  description,
                  policies: { 
                    checkIn: { time: '15:00', instructions: 'Front desk check-in' },
                    checkOut: { time: '11:00', instructions: 'Front desk check-out' },
                    cancellation: { policy: '24 hours notice', fee: 0 }
                  }
                }
              },
              { stepId: 'rooms', data: { rooms } },
              { stepId: 'business-features', data: businessFeatures }
            ];

            for (const step of steps) {
              await request(app.getHttpServer())
                .put(`/hotels/integrated-onboarding/sessions/${sessionId}/steps/${step.stepId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(step.data);
            }

            // Calculate quality score multiple times
            const qualityScores: number[] = [];
            for (let i = 0; i < calculateCount; i++) {
              const statusResponse = await request(app.getHttpServer())
                .get(`/hotels/integrated-onboarding/sessions/${sessionId}/status`)
                .set('Authorization', `Bearer ${authToken}`);

              expect(statusResponse.status).toBe(200);
              qualityScores.push(statusResponse.body.data.qualityScore.overall);
            }

            // All quality scores should be identical
            const firstScore = qualityScores[0];
            qualityScores.forEach(score => {
              expect(score).toBe(firstScore);
            });

            // Quality score should be within valid range
            expect(firstScore).toBeGreaterThanOrEqual(0);
            expect(firstScore).toBeLessThanOrEqual(100);

            // Quality score should reflect the weighted factors
            // More complete data should result in higher scores
            if (images.length >= 5 && description.length >= 200 && rooms.length >= 2) {
              expect(firstScore).toBeGreaterThan(60);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should produce higher scores for more complete data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            minimal: fc.record({
              amenities: fc.array(fc.string(), { minLength: 1, maxLength: 2 }),
              images: fc.array(imageGenerator, { minLength: 1, maxLength: 2 }),
              description: fc.string({ minLength: 50, maxLength: 100 }),
              rooms: fc.array(roomGenerator, { minLength: 1, maxLength: 1 })
            }),
            comprehensive: fc.record({
              amenities: fc.array(fc.string(), { minLength: 5, maxLength: 8 }),
              images: fc.array(imageGenerator, { minLength: 8, maxLength: 15 }),
              description: fc.string({ minLength: 500, maxLength: 1500 }),
              rooms: fc.array(roomGenerator, { minLength: 3, maxLength: 5 })
            })
          }),
          async ({ minimal, comprehensive }) => {
            // Test minimal data
            const minimalSessionResponse = await request(app.getHttpServer())
              .post('/hotels/integrated-onboarding/sessions')
              .set('Authorization', `Bearer ${authToken}`)
              .send({});

            const minimalSessionId = minimalSessionResponse.body.data.sessionId;

            const minimalSteps = [
              { stepId: 'amenities', data: { selectedAmenities: minimal.amenities, propertyType: 'HOTEL' } },
              { stepId: 'images', data: { images: minimal.images } },
              { 
                stepId: 'property-info', 
                data: { 
                  description: minimal.description,
                  policies: { checkIn: { time: '15:00' }, checkOut: { time: '11:00' } }
                }
              },
              { stepId: 'rooms', data: { rooms: minimal.rooms } }
            ];

            for (const step of minimalSteps) {
              await request(app.getHttpServer())
                .put(`/hotels/integrated-onboarding/sessions/${minimalSessionId}/steps/${step.stepId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(step.data);
            }

            // Test comprehensive data
            const comprehensiveSessionResponse = await request(app.getHttpServer())
              .post('/hotels/integrated-onboarding/sessions')
              .set('Authorization', `Bearer ${authToken}`)
              .send({});

            const comprehensiveSessionId = comprehensiveSessionResponse.body.data.sessionId;

            const comprehensiveSteps = [
              { stepId: 'amenities', data: { selectedAmenities: comprehensive.amenities, propertyType: 'HOTEL' } },
              { stepId: 'images', data: { images: comprehensive.images } },
              { 
                stepId: 'property-info', 
                data: { 
                  description: comprehensive.description,
                  policies: { 
                    checkIn: { time: '15:00', instructions: 'Detailed check-in process' },
                    checkOut: { time: '11:00', instructions: 'Detailed check-out process' },
                    cancellation: { policy: 'Flexible cancellation policy', fee: 0 }
                  },
                  locationDetails: {
                    nearbyAttractions: ['Museum', 'Park', 'Shopping Center'],
                    transportation: ['Bus', 'Metro', 'Taxi'],
                    accessibility: ['Wheelchair accessible', 'Elevator']
                  }
                }
              },
              { stepId: 'rooms', data: { rooms: comprehensive.rooms } }
            ];

            for (const step of comprehensiveSteps) {
              await request(app.getHttpServer())
                .put(`/hotels/integrated-onboarding/sessions/${comprehensiveSessionId}/steps/${step.stepId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(step.data);
            }

            // Get quality scores
            const minimalStatus = await request(app.getHttpServer())
              .get(`/hotels/integrated-onboarding/sessions/${minimalSessionId}/status`)
              .set('Authorization', `Bearer ${authToken}`);

            const comprehensiveStatus = await request(app.getHttpServer())
              .get(`/hotels/integrated-onboarding/sessions/${comprehensiveSessionId}/status`)
              .set('Authorization', `Bearer ${authToken}`);

            const minimalScore = minimalStatus.body.data.qualityScore.overall;
            const comprehensiveScore = comprehensiveStatus.body.data.qualityScore.overall;

            // Comprehensive data should have higher quality score
            expect(comprehensiveScore).toBeGreaterThan(minimalScore);
            
            // Both scores should be valid
            expect(minimalScore).toBeGreaterThanOrEqual(0);
            expect(minimalScore).toBeLessThanOrEqual(100);
            expect(comprehensiveScore).toBeGreaterThanOrEqual(0);
            expect(comprehensiveScore).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  /**
   * **Feature: enhanced-hotel-onboarding, Property 13: Real-Time Validation**
   * 
   * For any user input, the validation system should provide immediate feedback 
   * without requiring form submission.
   * 
   * **Validates: Requirements 6.5**
   */
  describe('Property 13: Real-Time Validation', () => {
    it('should provide immediate validation feedback for any input', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Valid amenity data
            fc.record({
              stepId: fc.constant('amenities'),
              data: fc.record({
                selectedAmenities: amenityGenerator,
                propertyType: propertyTypeGenerator
              }),
              expectedValid: fc.constant(true)
            }),
            // Invalid amenity data
            fc.record({
              stepId: fc.constant('amenities'),
              data: fc.record({
                selectedAmenities: fc.constant([]), // Empty array should be invalid
                propertyType: fc.constant('INVALID_TYPE')
              }),
              expectedValid: fc.constant(false)
            }),
            // Valid room data
            fc.record({
              stepId: fc.constant('rooms'),
              data: fc.record({
                rooms: fc.array(roomGenerator, { minLength: 1, maxLength: 3 })
              }),
              expectedValid: fc.constant(true)
            }),
            // Invalid room data
            fc.record({
              stepId: fc.constant('rooms'),
              data: fc.record({
                rooms: fc.constant([]) // Empty rooms array should be invalid
              }),
              expectedValid: fc.constant(false)
            })
          ),
          async ({ stepId, data, expectedValid }) => {
            // Create session
            const sessionResponse = await request(app.getHttpServer())
              .post('/hotels/integrated-onboarding/sessions')
              .set('Authorization', `Bearer ${authToken}`)
              .send({});

            const sessionId = sessionResponse.body.data.sessionId;

            // Test real-time validation
            const validationResponse = await request(app.getHttpServer())
              .post(`/hotels/integrated-onboarding/sessions/${sessionId}/validate`)
              .set('Authorization', `Bearer ${authToken}`)
              .send({
                stepId,
                data,
                validateDependencies: false
              });

            expect(validationResponse.status).toBe(200);
            expect(validationResponse.body.success).toBe(true);
            expect(validationResponse.body.data.isValid).toBe(expectedValid);

            if (!expectedValid) {
              expect(validationResponse.body.data.errors.length).toBeGreaterThan(0);
            } else {
              expect(validationResponse.body.data.errors.length).toBe(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});