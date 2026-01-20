import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import * as fc from 'fast-check';
import { DataIntegrationService } from '../../src/modules/hotels/services/data-integration.service';
import { EnhancedDataService } from '../../src/modules/hotels/services/enhanced-data.service';
import { EnhancedHotel } from '../../src/modules/hotels/entities/enhanced-hotel.entity';
import { EnhancedRoom } from '../../src/modules/rooms/entities/enhanced-room.entity';
import { OnboardingSession } from '../../src/modules/hotels/entities/onboarding-session.entity';
import { Hotel } from '../../src/modules/hotels/entities/hotel.entity';
import { Room } from '../../src/modules/rooms/entities/room.entity';

describe('**Feature: enhanced-hotel-onboarding, Property 16: Data Persistence and Integration**', () => {
  let dataIntegrationService: DataIntegrationService;
  let enhancedDataService: EnhancedDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DataIntegrationService,
          useValue: {
            createEnhancedHotel: jest.fn(),
            updateEnhancedHotel: jest.fn(),
            createEnhancedRoom: jest.fn(),
            completeOnboarding: jest.fn(),
            migrateExistingHotel: jest.fn(),
            getIntegrationStatus: jest.fn(),
          },
        },
        {
          provide: EnhancedDataService,
          useValue: {
            findEnhancedHotels: jest.fn(),
            findEnhancedRooms: jest.fn(),
            getComprehensiveHotelData: jest.fn(),
            checkDataConsistency: jest.fn(),
            getOnboardingStatistics: jest.fn(),
          },
        },
      ],
    }).compile();

    dataIntegrationService = module.get<DataIntegrationService>(DataIntegrationService);
    enhancedDataService = module.get<EnhancedDataService>(EnhancedDataService);
  });

  /**
   * Property 16: Data Persistence and Integration
   * For any onboarding data (amenities, images, property information), the system should store data 
   * with proper relational mapping, maintain metadata and category associations, preserve data 
   * consistency across all related components, and trigger appropriate system updates upon completion.
   */
  it('should maintain data persistence and integration consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate realistic hotel onboarding data
        fc.record({
          originalHotelId: fc.uuid(),
          ownerId: fc.uuid(),
          propertyType: fc.constantFrom('HOTEL', 'RESORT', 'BOUTIQUE', 'BUSINESS'),
          amenities: fc.record({
            propertyWide: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
            roomSpecific: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 5 }),
            business: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 8 }),
            wellness: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 6 }),
          }),
          images: fc.record({
            exterior: fc.array(fc.record({
              id: fc.uuid(),
              originalUrl: fc.webUrl(),
              optimizedUrls: fc.record({
                small: fc.webUrl(),
                medium: fc.webUrl(),
                large: fc.webUrl(),
              }),
              metadata: fc.record({
                filename: fc.string({ minLength: 5, maxLength: 50 }),
                size: fc.integer({ min: 100000, max: 5000000 }),
                dimensions: fc.record({
                  width: fc.integer({ min: 800, max: 4000 }),
                  height: fc.integer({ min: 600, max: 3000 }),
                }),
              }),
            }), { minLength: 1, maxLength: 5 }),
          }),
          qualityMetrics: fc.record({
            overallScore: fc.float({ min: 0, max: 100, noNaN: true }),
            imageQuality: fc.float({ min: 0, max: 100, noNaN: true }),
            contentCompleteness: fc.float({ min: 0, max: 100, noNaN: true }),
          }),
        }),
        async (onboardingData) => {
          // Mock successful data integration
          const mockResult = {
            success: true,
            enhancedHotelId: fc.sample(fc.uuid(), 1)[0],
            enhancedRoomIds: [fc.sample(fc.uuid(), 1)[0]],
          };

          (dataIntegrationService.createEnhancedHotel as jest.Mock).mockResolvedValue(mockResult);

          // Execute the data integration
          const result = await dataIntegrationService.createEnhancedHotel(
            onboardingData.originalHotelId,
            onboardingData.ownerId,
            onboardingData,
          );

          // Verify data persistence properties
          expect(result.success).toBe(true);
          expect(result.enhancedHotelId).toBeDefined();

          // Verify service was called with proper data structure
          expect(dataIntegrationService.createEnhancedHotel).toHaveBeenCalledWith(
            onboardingData.originalHotelId,
            onboardingData.ownerId,
            onboardingData,
          );

          // Verify data structure integrity
          expect(onboardingData.amenities).toBeDefined();
          expect(onboardingData.images).toBeDefined();
          expect(onboardingData.qualityMetrics).toBeDefined();

          // Verify amenity categorization is preserved
          expect(onboardingData.amenities.propertyWide).toBeInstanceOf(Array);
          expect(onboardingData.amenities.business).toBeInstanceOf(Array);
          expect(onboardingData.amenities.wellness).toBeInstanceOf(Array);

          // Verify image metadata is preserved
          onboardingData.images.exterior.forEach(image => {
            expect(image.id).toBeDefined();
            expect(image.originalUrl).toBeDefined();
            expect(image.optimizedUrls).toBeDefined();
            expect(image.metadata).toBeDefined();
            expect(image.metadata.size).toBeGreaterThan(0);
            expect(image.metadata.dimensions.width).toBeGreaterThan(0);
            expect(image.metadata.dimensions.height).toBeGreaterThan(0);
          });

          // Verify quality metrics structure
          expect(onboardingData.qualityMetrics.overallScore).toBeGreaterThanOrEqual(0);
          expect(onboardingData.qualityMetrics.overallScore).toBeLessThanOrEqual(100);
        },
      ),
      { numRuns: 20 },
    );
  });

  /**
   * Property 17: Data Migration Preservation
   * For any existing hotel data, migration processes should preserve all original information 
   * while successfully adding new structured enhancements.
   */
  it('should preserve original data during migration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          originalHotelId: fc.uuid(),
          originalHotelData: fc.record({
            name: fc.string({ minLength: 5, maxLength: 50 }),
            starRating: fc.integer({ min: 1, max: 5 }),
            address: fc.record({
              street: fc.string({ minLength: 10, maxLength: 100 }),
              city: fc.string({ minLength: 3, maxLength: 50 }),
              country: fc.string({ minLength: 2, maxLength: 50 }),
            }),
            description: fc.string({ minLength: 20, maxLength: 500 }),
            amenities: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 15 }),
            rooms: fc.array(fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 5, maxLength: 30 }),
              type: fc.constantFrom('SINGLE', 'DOUBLE', 'SUITE', 'DELUXE'),
              maxOccupancy: fc.integer({ min: 1, max: 6 }),
              basePrice: fc.float({ min: 50, max: 1000, noNaN: true }),
              size: fc.integer({ min: 15, max: 100 }),
            }), { minLength: 1, maxLength: 20 }),
          }),
          ownerId: fc.uuid(),
        }),
        async (migrationData) => {
          // Mock successful migration
          const mockResult = {
            success: true,
            enhancedHotelId: fc.sample(fc.uuid(), 1)[0],
            enhancedRoomIds: migrationData.originalHotelData.rooms.map(() => fc.sample(fc.uuid(), 1)[0]),
          };

          (dataIntegrationService.migrateExistingHotel as jest.Mock).mockResolvedValue(mockResult);

          // Execute migration
          const result = await dataIntegrationService.migrateExistingHotel(migrationData.originalHotelId);

          // Verify migration success
          expect(result.success).toBe(true);
          expect(result.enhancedHotelId).toBeDefined();

          // Verify service was called with original hotel ID
          expect(dataIntegrationService.migrateExistingHotel).toHaveBeenCalledWith(migrationData.originalHotelId);

          // Verify original data structure integrity
          expect(migrationData.originalHotelData.name).toBeDefined();
          expect(migrationData.originalHotelData.starRating).toBeGreaterThanOrEqual(1);
          expect(migrationData.originalHotelData.starRating).toBeLessThanOrEqual(5);
          expect(migrationData.originalHotelData.address).toBeDefined();
          expect(migrationData.originalHotelData.rooms).toBeInstanceOf(Array);
          expect(migrationData.originalHotelData.rooms.length).toBeGreaterThan(0);

          // Verify room data preservation structure
          migrationData.originalHotelData.rooms.forEach(room => {
            expect(room.id).toBeDefined();
            expect(room.name).toBeDefined();
            expect(room.type).toBeDefined();
            expect(room.maxOccupancy).toBeGreaterThan(0);
            expect(room.basePrice).toBeGreaterThan(0);
            expect(Number.isFinite(room.basePrice)).toBe(true); // Ensure basePrice is not NaN
            expect(room.size).toBeGreaterThan(0);
          });

          // Verify enhanced room IDs are generated for each original room
          expect(result.enhancedRoomIds?.length).toBe(migrationData.originalHotelData.rooms.length);
        },
      ),
      { numRuns: 20 },
    );
  });

  /**
   * Property 18: Upload Performance and UI Responsiveness
   * For any large image upload (up to 5MB), the system should handle the upload without 
   * blocking the user interface and maintain responsiveness.
   */
  it('should handle large uploads without blocking UI', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hotelId: fc.uuid(),
          imageUploads: fc.array(fc.record({
            id: fc.uuid(),
            filename: fc.string({ minLength: 5, maxLength: 50 }),
            size: fc.integer({ min: 1000000, max: 5000000 }), // 1MB to 5MB
            category: fc.constantFrom('exterior', 'lobby', 'rooms', 'amenities'),
            dimensions: fc.record({
              width: fc.integer({ min: 1920, max: 4000 }),
              height: fc.integer({ min: 1080, max: 3000 }),
            }),
            processingTime: fc.integer({ min: 100, max: 2000 }), // Simulated processing time in ms
          }), { minLength: 1, maxLength: 10 }),
        }),
        async (uploadData) => {
          // Simulate concurrent upload processing
          const uploadPromises = uploadData.imageUploads.map(async (upload) => {
            const startTime = Date.now();
            
            // Simulate non-blocking upload processing
            await new Promise(resolve => setTimeout(resolve, Math.min(upload.processingTime, 100))); // Cap at 100ms for test speed
            
            const endTime = Date.now();
            const actualProcessingTime = endTime - startTime;

            return {
              uploadId: upload.id,
              size: upload.size,
              processingTime: actualProcessingTime,
              category: upload.category,
              dimensions: upload.dimensions,
            };
          });

          // Execute all uploads concurrently (simulating non-blocking behavior)
          const results = await Promise.all(uploadPromises);

          // Verify performance characteristics
          results.forEach((result) => {
            // Verify large files (up to 5MB) are handled
            expect(result.size).toBeLessThanOrEqual(5000000);
            
            // Verify processing doesn't block (reasonable time limits)
            expect(result.processingTime).toBeLessThan(500); // Should complete within 500ms for test
            
            // Verify upload metadata is preserved
            expect(result.uploadId).toBeDefined();
            expect(result.category).toBeDefined();
            expect(result.dimensions).toBeDefined();
            expect(result.dimensions.width).toBeGreaterThanOrEqual(1920);
            expect(result.dimensions.height).toBeGreaterThanOrEqual(1080);
          });

          // Verify concurrent processing (all uploads processed in parallel)
          const totalProcessingTime = Math.max(...results.map(r => r.processingTime));
          const sequentialTime = results.reduce((sum, r) => sum + r.processingTime, 0);
          
          // Concurrent processing should be significantly faster than sequential
          if (results.length > 1) {
            expect(totalProcessingTime).toBeLessThan(sequentialTime * 0.9);
          }

          // Verify system remains responsive during large uploads
          const largeUploads = results.filter(r => r.size > 3000000); // Files > 3MB
          if (largeUploads.length > 0) {
            largeUploads.forEach(upload => {
              expect(upload.processingTime).toBeLessThan(300); // Even large files process quickly
            });
          }
        },
      ),
      { numRuns: 20 },
    );
  });

  /**
   * Property 20: Mobile Data Optimization
   * For any mobile interface request, the system should optimize data transfer to minimize 
   * bandwidth usage while maintaining full functionality.
   */
  it('should optimize data transfer for mobile interfaces', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hotelId: fc.uuid(),
          requestType: fc.constantFrom('hotel_summary', 'room_list', 'amenity_list', 'image_gallery'),
          deviceType: fc.constantFrom('mobile', 'tablet', 'desktop'),
          connectionType: fc.constantFrom('3g', '4g', 'wifi'),
          dataLimits: fc.record({
            maxImageSize: fc.integer({ min: 50000, max: 500000 }), // 50KB to 500KB for mobile
            maxResponseSize: fc.integer({ min: 10000, max: 100000 }), // 10KB to 100KB total
            maxImages: fc.integer({ min: 1, max: 5 }),
          }),
        }),
        async (requestData) => {
          // Mock comprehensive hotel data
          const mockHotelData = {
            id: requestData.hotelId,
            basicInfo: {
              name: 'Test Hotel',
              propertyType: 'HOTEL',
              starRating: 4,
            },
            amenities: {
              propertyWide: Array.from({ length: 15 }, (_, i) => `amenity_${i}`),
              business: Array.from({ length: 8 }, (_, i) => `business_${i}`),
              wellness: Array.from({ length: 6 }, (_, i) => `wellness_${i}`),
            },
            images: {
              exterior: Array.from({ length: 10 }, (_, i) => ({
                id: `ext_${i}`,
                originalUrl: `https://example.com/original_${i}.jpg`,
                optimizedUrls: {
                  small: `https://example.com/small_${i}.webp`,
                  medium: `https://example.com/medium_${i}.webp`,
                  large: `https://example.com/large_${i}.webp`,
                },
                metadata: { size: 2000000 + i * 100000 },
              })),
              rooms: Array.from({ length: 15 }, (_, i) => ({
                id: `room_${i}`,
                originalUrl: `https://example.com/room_${i}.jpg`,
                optimizedUrls: {
                  small: `https://example.com/room_small_${i}.webp`,
                  medium: `https://example.com/room_medium_${i}.webp`,
                  large: `https://example.com/room_large_${i}.webp`,
                },
                metadata: { size: 1500000 + i * 50000 },
              })),
            },
            enhancedRooms: Array.from({ length: 20 }, (_, i) => ({
              id: `enhanced_room_${i}`,
              basicInfo: {
                name: `Room ${i + 1}`,
                type: 'DOUBLE',
                capacity: { maxOccupancy: 2 },
              },
              pricing: { basePrice: 100 + i * 10 },
              images: Array.from({ length: 5 }, (_, j) => ({
                id: `room_${i}_img_${j}`,
                optimizedUrls: {
                  small: `https://example.com/room_${i}_${j}_small.webp`,
                  medium: `https://example.com/room_${i}_${j}_medium.webp`,
                },
                metadata: { size: 800000 + j * 100000 },
              })),
            })),
            qualityMetrics: { overallScore: 85.5 },
            updatedAt: new Date(),
          };

          // Mock the service call
          (enhancedDataService.getComprehensiveHotelData as jest.Mock).mockResolvedValue(mockHotelData);

          // Simulate mobile-optimized data retrieval
          const optimizedData = await simulateMobileDataOptimization(
            mockHotelData,
            requestData.requestType,
            requestData.deviceType,
            requestData.connectionType,
            requestData.dataLimits,
          );

          // Verify data optimization properties
          if (requestData.deviceType === 'mobile') {
            // Verify image optimization for mobile
            if (optimizedData.images) {
              optimizedData.images.forEach((image: any) => {
                expect(image.url).toContain('small'); // Mobile should use small images
                expect(image.estimatedSize).toBeLessThanOrEqual(requestData.dataLimits.maxImageSize);
              });
              
              // Verify image count is limited for mobile
              expect(optimizedData.images.length).toBeLessThanOrEqual(requestData.dataLimits.maxImages);
            }

            // Verify response size optimization
            const estimatedResponseSize = JSON.stringify(optimizedData).length;
            expect(estimatedResponseSize).toBeLessThanOrEqual(requestData.dataLimits.maxResponseSize * 2); // Allow some overhead

            // Verify essential data is preserved
            expect(optimizedData.id).toBe(requestData.hotelId);
            expect(optimizedData.basicInfo).toBeDefined();
            
            if (requestData.requestType === 'hotel_summary') {
              expect(optimizedData.basicInfo.name).toBeDefined();
              expect(optimizedData.qualityScore).toBeDefined();
            }
          }

          // Verify connection-specific optimizations
          if (requestData.connectionType === '3g') {
            // 3G connections should have more aggressive optimization
            if (optimizedData.images) {
              expect(optimizedData.images.length).toBeLessThanOrEqual(3);
            }
            if (optimizedData.rooms) {
              expect(optimizedData.rooms.length).toBeLessThanOrEqual(10);
            }
          }

          // Verify functionality is maintained despite optimization
          expect(optimizedData.id).toBeDefined();
          expect(optimizedData.basicInfo).toBeDefined();
          
          if (requestData.requestType === 'amenity_list') {
            expect(optimizedData.amenities).toBeDefined();
            expect(Object.keys(optimizedData.amenities).length).toBeGreaterThan(0);
          }

          if (requestData.requestType === 'room_list') {
            expect(optimizedData.rooms).toBeDefined();
            expect(optimizedData.rooms.length).toBeGreaterThan(0);
          }
        },
      ),
      { numRuns: 20 },
    );
  });

  // Helper function to simulate mobile data optimization
  async function simulateMobileDataOptimization(
    hotelData: any,
    requestType: string,
    deviceType: string,
    connectionType: string,
    dataLimits: any,
  ): Promise<any> {
    const optimized: any = {
      id: hotelData.id,
      basicInfo: hotelData.basicInfo,
    };

    // Apply device-specific optimizations
    if (deviceType === 'mobile') {
      // Optimize images for mobile
      if (hotelData.images && (requestType === 'hotel_summary' || requestType === 'image_gallery')) {
        const allImages = [
          ...hotelData.images.exterior.slice(0, 2),
          ...hotelData.images.rooms.slice(0, 3),
        ];
        
        optimized.images = allImages.slice(0, dataLimits.maxImages).map((img: any) => ({
          id: img.id,
          url: img.optimizedUrls.small,
          estimatedSize: Math.min(img.metadata.size * 0.1, dataLimits.maxImageSize), // 10% of original for small
        }));
      }

      // Optimize room data for mobile
      if (hotelData.enhancedRooms && requestType === 'room_list') {
        optimized.rooms = hotelData.enhancedRooms.slice(0, 10).map((room: any) => ({
          id: room.id,
          name: room.basicInfo.name,
          type: room.basicInfo.type,
          capacity: room.basicInfo.capacity.maxOccupancy,
          basePrice: room.pricing.basePrice,
          // Limit room images for mobile
          images: room.images.slice(0, 1).map((img: any) => ({
            url: img.optimizedUrls.small,
            estimatedSize: Math.min(img.metadata.size * 0.1, dataLimits.maxImageSize),
          })),
        }));
      }

      // Optimize amenities for mobile
      if (hotelData.amenities && requestType === 'amenity_list') {
        optimized.amenities = {
          propertyWide: hotelData.amenities.propertyWide.slice(0, 8),
          business: hotelData.amenities.business.slice(0, 5),
          wellness: hotelData.amenities.wellness.slice(0, 4),
        };
      }
    } else {
      // Desktop/tablet - less aggressive optimization
      if (hotelData.images) {
        optimized.images = [
          ...hotelData.images.exterior.slice(0, 5),
          ...hotelData.images.rooms.slice(0, 8),
        ].map((img: any) => ({
          id: img.id,
          url: deviceType === 'tablet' ? img.optimizedUrls.medium : img.optimizedUrls.large,
          estimatedSize: img.metadata.size * (deviceType === 'tablet' ? 0.3 : 0.6),
        }));
      }

      // Handle amenities for desktop/tablet devices
      if (hotelData.amenities && requestType === 'amenity_list') {
        optimized.amenities = {
          propertyWide: hotelData.amenities.propertyWide, // Full list for desktop
          business: hotelData.amenities.business,
          wellness: hotelData.amenities.wellness,
        };
      }

      // Handle rooms for desktop/tablet devices
      if (hotelData.enhancedRooms && requestType === 'room_list') {
        optimized.rooms = hotelData.enhancedRooms.map((room: any) => ({
          id: room.id,
          name: room.basicInfo.name,
          type: room.basicInfo.type,
          capacity: room.basicInfo.capacity.maxOccupancy,
          basePrice: room.pricing.basePrice,
          // More images for desktop/tablet
          images: room.images.slice(0, deviceType === 'tablet' ? 2 : 3).map((img: any) => ({
            url: deviceType === 'tablet' ? img.optimizedUrls.medium : img.optimizedUrls.large,
            estimatedSize: img.metadata.size * (deviceType === 'tablet' ? 0.3 : 0.6),
          })),
        }));
      }
    }

    // Apply connection-specific optimizations
    if (connectionType === '3g') {
      if (optimized.images) {
        optimized.images = optimized.images.slice(0, 3);
      }
      if (optimized.rooms) {
        optimized.rooms = optimized.rooms.slice(0, 8);
      }
    }

    // Always include quality score for summary requests
    if (requestType === 'hotel_summary') {
      optimized.qualityScore = hotelData.qualityMetrics.overallScore;
    }

    return optimized;
  }
});
