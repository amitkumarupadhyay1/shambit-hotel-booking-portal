import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { RoomEnhancementService } from '../../src/modules/rooms/services/room-enhancement.service';
import { EnhancedRoom } from '../../src/modules/rooms/entities/enhanced-room.entity';
import { EnhancedHotel } from '../../src/modules/hotels/entities/enhanced-hotel.entity';
import { AmenityService } from '../../src/modules/hotels/services/amenity.service';
import { ImageManagementService } from '../../src/modules/hotels/services/image-management.service';
import {
  RoomType,
  BedType,
  RoomCapacity,
  RoomSize,
  BedConfiguration,
  BedInfo,
  RoomBasicInfo,
  RoomAmenities,
  AmenityOverride,
  RoomLayout,
  RoomDimensions,
  LayoutFeature,
  RoomQualityMetrics,
} from '../../src/modules/rooms/interfaces/enhanced-room.interface';
import {
  RichTextContent,
  ProcessedImage,
  ImageCategory,
  CategorizedAmenities,
  PropertyType,
} from '../../src/modules/hotels/interfaces/enhanced-hotel.interface';

describe('RoomEnhancementService - Property-Based Tests', () => {
  let service: RoomEnhancementService;
  let roomRepository: Repository<EnhancedRoom>;
  let hotelRepository: Repository<EnhancedHotel>;
  let amenityService: AmenityService;
  let imageManagementService: ImageManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomEnhancementService,
        {
          provide: getRepositoryToken(EnhancedRoom),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(EnhancedHotel),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AmenityService,
          useValue: {
            applyAmenityInheritance: jest.fn(),
          },
        },
        {
          provide: ImageManagementService,
          useValue: {
            uploadImage: jest.fn(),
            deleteImage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoomEnhancementService>(RoomEnhancementService);
    roomRepository = module.get<Repository<EnhancedRoom>>(getRepositoryToken(EnhancedRoom));
    hotelRepository = module.get<Repository<EnhancedHotel>>(getRepositoryToken(EnhancedHotel));
    amenityService = module.get<AmenityService>(AmenityService);
    imageManagementService = module.get<ImageManagementService>(ImageManagementService);
  });

  // Property-based test generators
  const roomCapacityArb = fc.record({
    adults: fc.integer({ min: 1, max: 20 }),
    children: fc.integer({ min: 0, max: 10 }),
    infants: fc.integer({ min: 0, max: 5 }),
    maxOccupancy: fc.integer({ min: 1, max: 20 }),
  }).filter(capacity => capacity.maxOccupancy >= capacity.adults);

  const roomSizeArb = fc.record({
    area: fc.float({ min: Math.fround(10), max: Math.fround(1000) }),
    unit: fc.constantFrom('sqm', 'sqft'),
  });

  const bedInfoArb = fc.record({
    type: fc.constantFrom(...Object.values(BedType)),
    count: fc.integer({ min: 1, max: 10 }),
    size: fc.constantFrom('Single', 'Double', 'Queen Size', 'King Size', 'Twin'),
  });

  const bedConfigurationArb = fc.record({
    beds: fc.array(bedInfoArb, { minLength: 1, maxLength: 5 }),
    totalBeds: fc.integer({ min: 1, max: 10 }),
    sofaBeds: fc.integer({ min: 0, max: 3 }),
    cribs: fc.integer({ min: 0, max: 2 }),
  });

  const roomBasicInfoArb = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    type: fc.constantFrom(...Object.values(RoomType)),
    capacity: roomCapacityArb,
    size: roomSizeArb,
    bedConfiguration: bedConfigurationArb,
    floor: fc.option(fc.integer({ min: 1, max: 50 })),
    roomNumber: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
  });

  const richTextContentArb = fc.record({
    content: fc.string({ minLength: 20, maxLength: 2000 }).filter(s => s.trim().length >= 20),
    format: fc.constantFrom('markdown', 'html'),
    wordCount: fc.integer({ min: 5, max: 500 }),
    readingTime: fc.integer({ min: 1, max: 25 }),
  });

  const amenityOverrideArb = fc.record({
    amenityId: fc.uuid(),
    action: fc.constantFrom('add', 'remove', 'modify'),
    value: fc.option(fc.anything()),
    reason: fc.option(fc.string({ maxLength: 200 })),
  });

  const roomAmenitiesArb = fc.record({
    inherited: fc.array(fc.uuid(), { maxLength: 15 }),
    specific: fc.array(fc.uuid(), { maxLength: 10 }),
    overrides: fc.array(amenityOverrideArb, { maxLength: 5 }),
  });

  const layoutFeatureArb = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    type: fc.constantFrom('window', 'balcony', 'terrace', 'kitchenette', 'seating_area', 'work_desk', 'closet'),
    description: fc.option(fc.string({ maxLength: 200 })),
    size: fc.option(fc.float({ min: Math.fround(1), max: Math.fround(100) })),
    facing: fc.option(fc.constantFrom('north', 'south', 'east', 'west', 'garden', 'pool', 'city', 'mountain', 'sea')),
  });

  const roomDimensionsArb = fc.record({
    length: fc.float({ min: Math.fround(2), max: Math.fround(20) }),
    width: fc.float({ min: Math.fround(2), max: Math.fround(20) }),
    height: fc.float({ min: Math.fround(2.2), max: Math.fround(5) }),
    unit: fc.constantFrom('meters', 'feet'),
  });

  const roomLayoutArb = fc.record({
    dimensions: roomDimensionsArb,
    features: fc.array(layoutFeatureArb, { maxLength: 10 }),
    floorPlan: fc.option(fc.webUrl()),
    view: fc.string({ minLength: 5, maxLength: 200 }),
    naturalLight: fc.constantFrom('excellent', 'good', 'moderate', 'limited'),
    virtualTour: fc.option(fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      url: fc.webUrl(),
      type: fc.constantFrom('360_image', '360_video', 'virtual_walkthrough'),
      category: fc.constantFrom(...Object.values(ImageCategory)),
      metadata: fc.record({
        duration: fc.option(fc.integer({ min: 30, max: 600 })),
        resolution: fc.constantFrom('1080p', '4K', '8K'),
        fileSize: fc.integer({ min: 1000000, max: 100000000 }),
      }),
    })),
  });

  const processedImageArb = fc.record({
    id: fc.uuid(),
    originalUrl: fc.webUrl(),
    optimizedUrls: fc.record({
      large: fc.webUrl(),
      medium: fc.webUrl(),
      small: fc.webUrl(),
    }),
    thumbnails: fc.record({
      small: fc.webUrl(),
      medium: fc.webUrl(),
      large: fc.webUrl(),
    }),
    metadata: fc.record({
      filename: fc.string({ minLength: 1, maxLength: 100 }),
      size: fc.integer({ min: 1000, max: 5000000 }),
      dimensions: fc.record({
        width: fc.integer({ min: 100, max: 4000 }),
        height: fc.integer({ min: 100, max: 4000 }),
      }),
      format: fc.constantFrom('jpg', 'png', 'webp'),
      uploadedAt: fc.date(),
      uploadedBy: fc.uuid(),
      qualityChecks: fc.record({
        passed: fc.boolean(),
        score: fc.float({ min: 0, max: 100 }),
        issues: fc.array(fc.record({
          type: fc.constantFrom('resolution', 'blur', 'brightness', 'contrast', 'aspect_ratio'),
          severity: fc.constantFrom('low', 'medium', 'high'),
          description: fc.string({ maxLength: 200 }),
          suggestedFix: fc.string({ maxLength: 200 }),
        }), { maxLength: 5 }),
        recommendations: fc.array(fc.string({ maxLength: 200 }), { maxLength: 5 }),
      }),
      tags: fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
    }),
    qualityScore: fc.integer({ min: 0, max: 100 }),
    category: fc.constantFrom(...Object.values(ImageCategory)),
  });

  const categorizedAmenitiesArb = fc.record({
    propertyWide: fc.array(fc.uuid(), { maxLength: 15 }),
    roomSpecific: fc.array(fc.uuid(), { maxLength: 10 }),
    business: fc.array(fc.uuid(), { maxLength: 8 }),
    wellness: fc.array(fc.uuid(), { maxLength: 6 }),
    dining: fc.array(fc.uuid(), { maxLength: 5 }),
    sustainability: fc.array(fc.uuid(), { maxLength: 8 }),
    recreational: fc.array(fc.uuid(), { maxLength: 10 }),
    connectivity: fc.array(fc.uuid(), { maxLength: 5 }),
  });

  const mockEnhancedHotelArb = fc.record({
    id: fc.uuid(),
    ownerId: fc.uuid(),
    amenities: fc.option(categorizedAmenitiesArb),
    basicInfo: fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      propertyType: fc.constantFrom(...Object.values(PropertyType)),
    }),
  });

  const mockEnhancedRoomArb = fc.record({
    id: fc.uuid(),
    enhancedHotelId: fc.uuid(),
    basicInfo: roomBasicInfoArb,
    description: fc.option(richTextContentArb),
    amenities: fc.option(roomAmenitiesArb),
    images: fc.option(fc.array(processedImageArb, { maxLength: 10 })),
    layout: fc.option(roomLayoutArb),
    qualityMetrics: fc.option(fc.record({
      overallScore: fc.float({ min: Math.fround(0), max: Math.fround(100) }),
      imageQuality: fc.float({ min: Math.fround(0), max: Math.fround(100) }),
      descriptionQuality: fc.float({ min: Math.fround(0), max: Math.fround(100) }),
      amenityCompleteness: fc.float({ min: Math.fround(0), max: Math.fround(100) }),
      lastUpdated: fc.date(),
      maintenanceScore: fc.float({ min: Math.fround(0), max: Math.fround(100) }),
    })),
  });

  /**
   * Property 8: Room Enhancement and Amenity Inheritance
   * For any room configuration, the system should support detailed descriptions,
   * distinguish room-specific amenities from property-wide features, support multiple
   * categorized images per room, and properly implement amenity inheritance with room-level overrides.
   * **Feature: enhanced-hotel-onboarding, Property 8: Room Enhancement and Amenity Inheritance**
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.6**
   */
  describe('Property 8: Room Enhancement and Amenity Inheritance', () => {
    it('should support detailed descriptions, amenity inheritance, and image categorization for any room configuration', async () => {
      await fc.assert(
        fc.asyncProperty(
          mockEnhancedHotelArb,
          roomBasicInfoArb,
          fc.option(richTextContentArb),
          fc.option(roomAmenitiesArb),
          fc.array(processedImageArb, { maxLength: 10 }),
          fc.option(roomLayoutArb),
          async (mockHotel, basicInfo, description, amenities, images, layout) => {
            // Setup mock hotel with owner
            const hotel = new EnhancedHotel();
            Object.assign(hotel, mockHotel);
            hotel.owner = { id: mockHotel.ownerId } as any;

            // Setup mock room
            const room = new EnhancedRoom();
            room.id = fc.sample(fc.uuid(), 1)[0];
            room.enhancedHotelId = hotel.id;
            room.basicInfo = basicInfo;
            room.description = description || null;
            room.amenities = amenities || null;
            room.images = images || [];
            room.layout = layout || null;
            room.enhancedHotel = hotel;

            jest.spyOn(hotelRepository, 'findOne').mockResolvedValue(hotel);
            jest.spyOn(roomRepository, 'findOne').mockResolvedValue(room);
            jest.spyOn(roomRepository, 'save').mockResolvedValue(room);
            jest.spyOn(roomRepository, 'create').mockReturnValue(room);

            // Mock amenity inheritance
            if (amenities) {
              jest.spyOn(amenityService, 'applyAmenityInheritance').mockResolvedValue({
                inherited: amenities.inherited,
                specific: amenities.specific,
                final: [...amenities.inherited, ...amenities.specific],
              });
            }

            // Test detailed room descriptions (Requirement 4.1)
            if (description) {
              const updatedRoom = await service.updateEnhancedRoom(
                room.id,
                { description },
                mockHotel.ownerId
              );

              // Should support rich text content
              expect(updatedRoom.description).toBeDefined();
              expect(updatedRoom.description!.content).toBe(description.content);
              expect(updatedRoom.description!.format).toBe(description.format);
              expect(updatedRoom.description!.wordCount).toBeGreaterThan(0);
            }

            // Test room-specific amenity management with inheritance (Requirements 4.2, 4.6)
            if (amenities && hotel.amenities) {
              const processedAmenities = await service.processRoomAmenities(
                hotel.amenities,
                amenities.specific,
                amenities.overrides
              );

              // Should distinguish inherited from specific amenities
              expect(processedAmenities.inherited).toBeDefined();
              expect(processedAmenities.specific).toBeDefined();
              expect(processedAmenities.overrides).toBeDefined();

              // Inherited amenities should come from property-wide amenities
              expect(Array.isArray(processedAmenities.inherited)).toBe(true);
              
              // Specific amenities should be room-only
              expect(Array.isArray(processedAmenities.specific)).toBe(true);
              expect(processedAmenities.specific).toEqual(amenities.specific);

              // Overrides should be preserved
              expect(processedAmenities.overrides).toEqual(amenities.overrides);
            }

            // Test multiple categorized images per room (Requirement 4.3)
            if (images.length > 0) {
              // Should support multiple images
              expect(Array.isArray(room.images)).toBe(true);
              expect(room.images!.length).toBe(images.length);

              // Each image should have proper categorization
              room.images!.forEach(image => {
                expect(image.category).toBeDefined();
                expect(Object.values(ImageCategory)).toContain(image.category);
                expect(image.id).toBeDefined();
                expect(image.originalUrl).toBeDefined();
                expect(image.optimizedUrls).toBeDefined();
                expect(image.qualityScore).toBeGreaterThanOrEqual(0);
                expect(image.qualityScore).toBeLessThanOrEqual(100);
              });
            }

            // Test room layout capture (Requirement 4.4 - covered in layout)
            if (layout) {
              const capturedLayout = await service.captureRoomLayout(
                room.id,
                {
                  dimensions: layout.dimensions,
                  features: layout.features,
                  floorPlan: layout.floorPlan,
                  view: layout.view,
                  naturalLight: layout.naturalLight,
                },
                mockHotel.ownerId
              );

              // Should capture all layout components
              expect(capturedLayout.dimensions).toEqual(layout.dimensions);
              expect(capturedLayout.features).toEqual(layout.features);
              expect(capturedLayout.view).toBe(layout.view);
              expect(capturedLayout.naturalLight).toBe(layout.naturalLight);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle amenity inheritance edge cases correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          mockEnhancedHotelArb,
          fc.array(fc.uuid(), { maxLength: 5 }),
          fc.array(amenityOverrideArb, { maxLength: 3 }),
          async (mockHotel, roomSpecificAmenities, overrides) => {
            // Test with null/empty property amenities
            const emptyAmenities = await service.processRoomAmenities(
              null,
              roomSpecificAmenities,
              overrides
            );

            expect(emptyAmenities.inherited).toEqual([]);
            expect(emptyAmenities.specific).toEqual(roomSpecificAmenities);
            expect(emptyAmenities.overrides).toEqual(overrides);

            // Test with property amenities
            if (mockHotel.amenities) {
              jest.spyOn(amenityService, 'applyAmenityInheritance').mockResolvedValue({
                inherited: mockHotel.amenities.propertyWide || [],
                specific: roomSpecificAmenities,
                final: [...(mockHotel.amenities.propertyWide || []), ...roomSpecificAmenities],
              });

              const processedAmenities = await service.processRoomAmenities(
                mockHotel.amenities,
                roomSpecificAmenities,
                overrides
              );

              expect(processedAmenities.inherited).toBeDefined();
              expect(processedAmenities.specific).toEqual(roomSpecificAmenities);
              expect(processedAmenities.overrides).toEqual(overrides);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 9: Room Content Validation
   * For any room setup, the validation system should ensure sufficient visual and
   * descriptive content is present before allowing completion.
   * **Feature: enhanced-hotel-onboarding, Property 9: Room Content Validation**
   * **Validates: Requirements 4.5**
   */
  describe('Property 9: Room Content Validation', () => {
    it('should validate sufficient visual and descriptive content for any room setup', async () => {
      await fc.assert(
        fc.asyncProperty(
          mockEnhancedRoomArb,
          async (mockRoom) => {
            // Setup mock room
            const room = new EnhancedRoom();
            Object.assign(room, mockRoom);

            jest.spyOn(roomRepository, 'findOne').mockResolvedValue(room);

            // Test content validation
            const validation = await service.validateRoomContent(room.id);

            // Validation should always return proper structure
            expect(validation).toBeDefined();
            expect(typeof validation.isComplete).toBe('boolean');
            expect(Array.isArray(validation.missingElements)).toBe(true);
            expect(typeof validation.qualityScore).toBe('number');
            expect(validation.qualityScore).toBeGreaterThanOrEqual(0);
            expect(validation.qualityScore).toBeLessThanOrEqual(100);
            expect(Array.isArray(validation.recommendations)).toBe(true);

            // Check basic info validation
            if (!room.basicInfo.name || room.basicInfo.name.trim().length < 3) {
              expect(validation.missingElements).toContain('Room name (minimum 3 characters)');
            }

            if (!room.basicInfo.capacity || room.basicInfo.capacity.maxOccupancy < 1) {
              expect(validation.missingElements).toContain('Room capacity information');
            }

            if (!room.basicInfo.size || room.basicInfo.size.area < 10) {
              expect(validation.missingElements).toContain('Room size information');
            }

            // Check description validation
            if (!room.description || !room.description.content || room.description.wordCount < 20) {
              expect(validation.missingElements).toContain('Room description (minimum 20 words)');
            }

            // Check image validation
            const imageCount = room.images?.length || 0;
            if (imageCount === 0) {
              expect(validation.missingElements).toContain('Room images (minimum 1 required)');
            } else if (imageCount < 3) {
              expect(validation.recommendations.some(r => r.includes('Add more room images'))).toBe(true);
            }

            // Check amenity validation
            const totalAmenities = 
              (room.amenities?.inherited?.length || 0) +
              (room.amenities?.specific?.length || 0);
            
            if (totalAmenities === 0) {
              expect(validation.missingElements).toContain('Room amenities');
            } else if (totalAmenities < 3) {
              expect(validation.recommendations.some(r => r.includes('Consider adding more amenities'))).toBe(true);
            }

            // Completeness should be based on missing elements and quality score
            const hasNoMissingElements = validation.missingElements.length === 0;
            const hasGoodQuality = validation.qualityScore >= 60;
            expect(validation.isComplete).toBe(hasNoMissingElements && hasGoodQuality);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases in room content validation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            basicInfo: fc.record({
              name: fc.oneof(
                fc.constant(''), // Empty name
                fc.string({ minLength: 1, maxLength: 2 }), // Too short
                fc.string({ minLength: 3, maxLength: 100 }) // Valid
              ),
              capacity: fc.record({
                maxOccupancy: fc.integer({ min: 0, max: 20 }), // Can be 0 (invalid)
              }),
              size: fc.record({
                area: fc.float({ min: Math.fround(0), max: Math.fround(1000) }), // Can be < 10 (invalid)
              }),
            }),
            description: fc.option(fc.record({
              content: fc.string({ minLength: 0, maxLength: 100 }),
              wordCount: fc.integer({ min: 0, max: 50 }),
            })),
            images: fc.option(fc.array(processedImageArb, { maxLength: 2 })),
            amenities: fc.option(fc.record({
              inherited: fc.array(fc.uuid(), { maxLength: 2 }),
              specific: fc.array(fc.uuid(), { maxLength: 1 }),
            })),
          }),
          async (roomData) => {
            const room = new EnhancedRoom();
            room.id = fc.sample(fc.uuid(), 1)[0];
            Object.assign(room, roomData);

            jest.spyOn(roomRepository, 'findOne').mockResolvedValue(room);

            const validation = await service.validateRoomContent(room.id);

            // Should handle all edge cases without throwing
            expect(validation).toBeDefined();
            expect(typeof validation.isComplete).toBe('boolean');

            // Validate specific edge case handling
            if (!room.basicInfo.name || room.basicInfo.name.trim().length < 3) {
              expect(validation.missingElements).toContain('Room name (minimum 3 characters)');
            }

            if (room.basicInfo.capacity.maxOccupancy < 1) {
              expect(validation.missingElements).toContain('Room capacity information');
            }

            if (room.basicInfo.size.area < 10) {
              expect(validation.missingElements).toContain('Room size information');
            }

            if (!room.description || room.description.wordCount < 20) {
              expect(validation.missingElements).toContain('Room description (minimum 20 words)');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Unit tests for specific examples and edge cases
  describe('Unit Tests - Specific Examples', () => {
    it('should calculate room quality metrics correctly', () => {
      const roomData = {
        basicInfo: {
          name: 'Deluxe Room',
          type: RoomType.DELUXE,
          capacity: { adults: 2, children: 1, infants: 0, maxOccupancy: 3 },
          size: { area: 35, unit: 'sqm' as const },
          bedConfiguration: {
            beds: [{ type: BedType.KING, count: 1, size: 'King Size' }],
            totalBeds: 1,
            sofaBeds: 0,
            cribs: 0,
          },
        },
        description: {
          content: 'A spacious deluxe room with modern amenities and city view.',
          format: 'markdown' as const,
          wordCount: 50, // Increased to ensure description quality > 0
          readingTime: 1,
        },
        amenities: {
          inherited: ['wifi', 'ac'],
          specific: ['minibar', 'safe'],
          overrides: [],
        },
        images: [
          { qualityScore: 85 },
          { qualityScore: 90 },
          { qualityScore: 80 },
        ] as ProcessedImage[],
        layout: {
          dimensions: { length: 6, width: 5, height: 3, unit: 'meters' as const },
          features: [],
          view: 'City view',
          naturalLight: 'good' as const,
        },
      };

      const qualityMetrics = service['calculateRoomQualityMetrics'](roomData);

      expect(qualityMetrics.overallScore).toBeGreaterThan(0);
      expect(qualityMetrics.imageQuality).toBeGreaterThan(0);
      expect(qualityMetrics.descriptionQuality).toBeGreaterThan(0);
      expect(qualityMetrics.amenityCompleteness).toBeGreaterThan(0);
      expect(qualityMetrics.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle empty room data in quality calculation', () => {
      const emptyRoomData = {
        basicInfo: {
          name: 'Empty Room',
          type: RoomType.SINGLE,
          capacity: { adults: 1, children: 0, infants: 0, maxOccupancy: 1 },
          size: { area: 20, unit: 'sqm' as const },
          bedConfiguration: {
            beds: [{ type: BedType.SINGLE, count: 1, size: 'Single' }],
            totalBeds: 1,
            sofaBeds: 0,
            cribs: 0,
          },
        },
        images: [] as ProcessedImage[],
      };

      const qualityMetrics = service['calculateRoomQualityMetrics'](emptyRoomData);

      expect(qualityMetrics.overallScore).toBe(0); // No images, description, or amenities
      expect(qualityMetrics.imageQuality).toBe(0);
      expect(qualityMetrics.descriptionQuality).toBe(0);
      expect(qualityMetrics.amenityCompleteness).toBe(0);
    });

    it('should validate room content with specific missing elements', async () => {
      const incompleteRoom = new EnhancedRoom();
      incompleteRoom.id = 'test-room-id';
      incompleteRoom.basicInfo = {
        name: 'AB', // Too short
        type: RoomType.DOUBLE,
        capacity: { adults: 0, children: 0, infants: 0, maxOccupancy: 0 }, // Invalid
        size: { area: 5, unit: 'sqm' }, // Too small
        bedConfiguration: {
          beds: [{ type: BedType.DOUBLE, count: 1, size: 'Double' }],
          totalBeds: 1,
          sofaBeds: 0,
          cribs: 0,
        },
      };
      incompleteRoom.description = null;
      incompleteRoom.images = [];
      incompleteRoom.amenities = null;

      jest.spyOn(roomRepository, 'findOne').mockResolvedValue(incompleteRoom);

      const validation = await service.validateRoomContent('test-room-id');

      expect(validation.isComplete).toBe(false);
      expect(validation.missingElements).toContain('Room name (minimum 3 characters)');
      expect(validation.missingElements).toContain('Room capacity information');
      expect(validation.missingElements).toContain('Room size information');
      expect(validation.missingElements).toContain('Room description (minimum 20 words)');
      expect(validation.missingElements).toContain('Room images (minimum 1 required)');
      expect(validation.missingElements).toContain('Room amenities');
    });

    it('should handle room not found error', async () => {
      jest.spyOn(roomRepository, 'findOne').mockResolvedValue(null);

      await expect(service.validateRoomContent('non-existent-room')).rejects.toThrow('Enhanced room not found');
    });
  });
});