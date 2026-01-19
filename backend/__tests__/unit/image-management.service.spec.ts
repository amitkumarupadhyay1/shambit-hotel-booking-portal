import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import { ImageManagementService } from '../../src/modules/hotels/services/image-management.service';
import { ImageMetadata, EntityType } from '../../src/modules/hotels/entities/image-metadata.entity';
import { ImageCategory } from '../../src/modules/hotels/interfaces/enhanced-hotel.interface';

// Mock fs operations
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  unlink: jest.fn(),
}));

describe('ImageManagementService - Property-Based Tests', () => {
  let service: ImageManagementService;
  let repository: Repository<ImageMetadata>;

  const mockRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    // Mock fs operations
    (fs.access as jest.Mock).mockResolvedValue(undefined);
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageManagementService,
        {
          provide: getRepositoryToken(ImageMetadata),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ImageManagementService>(ImageManagementService);
    repository = module.get<Repository<ImageMetadata>>(getRepositoryToken(ImageMetadata));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create test image buffers
  const createTestImageBuffer = async (width: number, height: number, format: 'jpeg' | 'png' | 'webp' = 'jpeg'): Promise<Buffer> => {
    return await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    })
    .jpeg()
    .toBuffer();
  };

  // Generators for property-based testing
  const imageFormatArb = fc.constantFrom('jpeg', 'png', 'webp');
  const imageCategoryArb = fc.constantFrom(...Object.values(ImageCategory));
  const entityTypeArb = fc.constantFrom(...Object.values(EntityType));
  const dimensionsArb = fc.record({
    width: fc.integer({ min: 100, max: 4000 }),
    height: fc.integer({ min: 100, max: 4000 }),
  });

  const fileArb = fc.record({
    originalname: fc.string({ minLength: 5, maxLength: 30 })
      .filter(s => /^[a-zA-Z0-9_-]+$/.test(s)) // Only alphanumeric, underscore, and dash
      .map(s => `${s}.jpg`),
    mimetype: fc.constant('image/jpeg'),
    size: fc.integer({ min: 1000, max: 5 * 1024 * 1024 }), // 1KB to 5MB
  });

  describe('Property 3: Image Processing and Optimization', () => {
    /**
     * Feature: enhanced-hotel-onboarding, Property 3: Image Processing and Optimization
     * For any uploaded image, the system should categorize it by type, generate multiple 
     * optimized variants for different device types, and maintain all resolution variants 
     * with proper metadata associations.
     * Validates: Requirements 2.1, 2.2, 2.6
     */
    it('should categorize images by type and generate optimized variants with metadata', async () => {
      await fc.assert(
        fc.asyncProperty(
          fileArb,
          imageCategoryArb,
          entityTypeArb,
          fc.uuid(),
          fc.uuid(),
          async (file, category, entityType, entityId, uploadedBy) => {
            // Create a test image buffer
            const imageBuffer = await createTestImageBuffer(1920, 1080);
            const mockFile = {
              ...file,
              buffer: imageBuffer,
            } as Express.Multer.File;

            // Mock repository save to return a saved entity
            const mockSavedMetadata = {
              id: 'test-id',
              filename: file.originalname,
              originalUrl: 'http://localhost:3000/uploads/original/test.jpg',
              optimizedUrls: {
                large: 'http://localhost:3000/uploads/optimized/test_large.webp',
                medium: 'http://localhost:3000/uploads/optimized/test_medium.webp',
                small: 'http://localhost:3000/uploads/optimized/test_small.webp',
              },
              thumbnails: {
                small: 'http://localhost:3000/uploads/thumbnails/test_150.webp',
                medium: 'http://localhost:3000/uploads/thumbnails/test_300.webp',
                large: 'http://localhost:3000/uploads/thumbnails/test_600.webp',
              },
              sizeBytes: file.size,
              dimensions: { width: 1920, height: 1080 },
              format: 'jpeg',
              category,
              qualityChecks: { passed: true, score: 85, issues: [], recommendations: [] },
              qualityScore: 85,
              entityType,
              entityId,
              uploadedBy,
              tags: [],
              createdAt: new Date(),
            };

            mockRepository.save.mockResolvedValue(mockSavedMetadata);

            try {
              const result = await service.uploadImage(mockFile, category, entityType, entityId, uploadedBy);

              // Property: Image should be categorized by type
              expect(result.category).toBe(category);

              // Property: Should generate multiple optimized variants
              expect(result.optimizedUrls).toBeDefined();
              expect(result.optimizedUrls.large).toContain('large');
              expect(result.optimizedUrls.medium).toContain('medium');
              expect(result.optimizedUrls.small).toContain('small');

              // Property: Should maintain metadata associations
              expect(result.metadata).toBeDefined();
              expect(result.metadata.filename).toBe(file.originalname);
              expect(result.metadata.size).toBe(file.size);
              expect(result.metadata.uploadedBy).toBe(uploadedBy);

              // Property: Should generate thumbnails
              expect(result.thumbnails).toBeDefined();
              expect(result.thumbnails.small).toBeDefined();
              expect(result.thumbnails.medium).toBeDefined();
              expect(result.thumbnails.large).toBeDefined();

              // Property: Should have quality score
              expect(result.qualityScore).toBeGreaterThanOrEqual(0);
              expect(result.qualityScore).toBeLessThanOrEqual(100);
            } catch (error) {
              // Allow file size errors for large files
              if (file.size > 5 * 1024 * 1024) {
                expect(error.message).toContain('File size exceeds maximum limit');
              } else {
                throw error;
              }
            }
          }
        ),
        { numRuns: 10 } // Reduced runs due to image processing overhead
      );
    }, 30000); // 30 second timeout
  });

  describe('Property 4: Image Quality Validation', () => {
    /**
     * Feature: enhanced-hotel-onboarding, Property 4: Image Quality Validation
     * For any image submitted for quality checking, the validation system should enforce 
     * measurable standards (resolution, aspect ratio, blur, brightness, contrast) and 
     * provide specific feedback with actionable recommendations when standards are not met.
     * Validates: Requirements 2.3, 2.4
     */
    it('should enforce measurable quality standards and provide specific feedback', async () => {
      await fc.assert(
        fc.asyncProperty(
          dimensionsArb,
          fc.integer({ min: 50, max: 255 }), // brightness proxy
          async (dimensions, brightness) => {
            // Create test image with specific properties
            const imageBuffer = await sharp({
              create: {
                width: dimensions.width,
                height: dimensions.height,
                channels: 3,
                background: { r: brightness, g: brightness, b: brightness }
              }
            })
            .jpeg()
            .toBuffer();

            const result = await service.validateImageQuality(imageBuffer);

            // Property: Should always return a quality check result
            expect(result).toBeDefined();
            expect(result.passed).toBeDefined();
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
            expect(Array.isArray(result.issues)).toBe(true);
            expect(Array.isArray(result.recommendations)).toBe(true);

            // Property: Should enforce resolution standards
            if (dimensions.width < 1920 || dimensions.height < 1080) {
              const hasResolutionIssue = result.issues.some(issue => issue.type === 'resolution');
              expect(hasResolutionIssue).toBe(true);
            }

            // Property: Should provide specific feedback for each issue
            result.issues.forEach(issue => {
              expect(issue.type).toBeDefined();
              expect(issue.severity).toMatch(/^(low|medium|high)$/);
              expect(issue.description).toBeDefined();
              expect(issue.suggestedFix).toBeDefined();
              expect(issue.description.length).toBeGreaterThan(0);
              expect(issue.suggestedFix.length).toBeGreaterThan(0);
            });

            // Property: Should provide actionable recommendations
            expect(result.recommendations.length).toBeGreaterThan(0);
            result.recommendations.forEach(recommendation => {
              expect(typeof recommendation).toBe('string');
              expect(recommendation.length).toBeGreaterThan(0);
            });

            // Property: Quality score should reflect issues
            if (result.issues.some(issue => issue.severity === 'high')) {
              expect(result.passed).toBe(false);
            }
          }
        ),
        { numRuns: 15 }
      );
    }, 30000); // 30 second timeout
  });

  describe('Property 5: Virtual Tour Integration', () => {
    /**
     * Feature: enhanced-hotel-onboarding, Property 5: Virtual Tour Integration
     * For any virtual tour data, the system should properly handle and display 
     * 360-degree content with appropriate integration into the image management system.
     * Validates: Requirements 2.5
     */
    it('should properly handle virtual tour data with 360-degree content integration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }), // name
          fc.webUrl(), // url
          fc.constantFrom('360_image', '360_video', 'virtual_walkthrough'), // type
          imageCategoryArb,
          entityTypeArb,
          fc.uuid(),
          fc.record({
            duration: fc.option(fc.integer({ min: 10, max: 600 })), // 10 seconds to 10 minutes
            resolution: fc.constantFrom('1920x1080', '2560x1440', '3840x2160'),
            fileSize: fc.integer({ min: 1024, max: 100 * 1024 * 1024 }), // 1KB to 100MB
          }),
          async (name, url, type, category, entityType, entityId, metadata) => {
            const result = await service.createVirtualTour(
              name,
              url,
              type,
              category,
              entityType,
              entityId,
              metadata
            );

            // Property: Should properly handle virtual tour data
            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.name).toBe(name);
            expect(result.url).toBe(url);
            expect(result.type).toBe(type);
            expect(result.category).toBe(category);

            // Property: Should maintain metadata associations
            expect(result.metadata).toBeDefined();
            expect(result.metadata.resolution).toBe(metadata.resolution);
            expect(result.metadata.fileSize).toBe(metadata.fileSize);
            
            if (metadata.duration !== null) {
              expect(result.metadata.duration).toBe(metadata.duration);
            }

            // Property: Should integrate with image management system categories
            expect(Object.values(ImageCategory)).toContain(result.category);

            // Property: Should support different 360-degree content types
            expect(['360_image', '360_video', 'virtual_walkthrough']).toContain(result.type);

            // Property: Should generate unique identifiers
            expect(result.id).toMatch(/^vt_\d+$/);
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  describe('Image Retrieval and Management', () => {
    it('should retrieve images by entity and category correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          entityTypeArb,
          fc.uuid(),
          imageCategoryArb,
          fc.array(fc.record({
            id: fc.uuid(),
            category: imageCategoryArb,
            entityType: entityTypeArb,
            entityId: fc.uuid(),
          }), { minLength: 1, maxLength: 10 }),
          async (entityType, entityId, category, mockImages) => {
            // Filter images that match our criteria
            const matchingImages = mockImages.filter(
              img => img.entityType === entityType && img.entityId === entityId && img.category === category
            );

            const mockMetadataList = matchingImages.map(img => ({
              id: img.id,
              originalUrl: `http://localhost:3000/uploads/original/${img.id}.jpg`,
              optimizedUrls: {
                large: `http://localhost:3000/uploads/optimized/${img.id}_large.webp`,
                medium: `http://localhost:3000/uploads/optimized/${img.id}_medium.webp`,
                small: `http://localhost:3000/uploads/optimized/${img.id}_small.webp`,
              },
              thumbnails: {
                small: `http://localhost:3000/uploads/thumbnails/${img.id}_150.webp`,
                medium: `http://localhost:3000/uploads/thumbnails/${img.id}_300.webp`,
                large: `http://localhost:3000/uploads/thumbnails/${img.id}_600.webp`,
              },
              filename: `${img.id}.jpg`,
              sizeBytes: 1024000,
              dimensions: { width: 1920, height: 1080 },
              format: 'jpeg',
              category: img.category,
              qualityChecks: { passed: true, score: 85, issues: [], recommendations: [] },
              qualityScore: 85,
              entityType: img.entityType,
              entityId: img.entityId,
              uploadedBy: 'test-user',
              tags: [],
              createdAt: new Date(),
            }));

            mockRepository.find.mockResolvedValue(mockMetadataList);

            const result = await service.getImagesByCategory(entityType, entityId, category);

            // Property: Should return only images matching the criteria
            expect(result).toHaveLength(matchingImages.length);
            
            result.forEach(image => {
              expect(image.category).toBe(category);
              expect(image.id).toBeDefined();
              expect(image.originalUrl).toBeDefined();
              expect(image.optimizedUrls).toBeDefined();
              expect(image.thumbnails).toBeDefined();
              expect(image.metadata).toBeDefined();
            });
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  describe('Quality Standards', () => {
    it('should maintain consistent quality standards', async () => {
      const standards = await service.getQualityStandards();

      // Property: Quality standards should be well-defined
      expect(standards).toBeDefined();
      expect(standards.minResolution).toBeDefined();
      expect(standards.minResolution.width).toBeGreaterThan(0);
      expect(standards.minResolution.height).toBeGreaterThan(0);
      expect(standards.acceptableAspectRatios).toBeDefined();
      expect(Array.isArray(standards.acceptableAspectRatios)).toBe(true);
      expect(standards.blurThreshold).toBeGreaterThan(0);
      expect(standards.brightnessRange).toBeDefined();
      expect(standards.contrastRange).toBeDefined();
      expect(standards.maxFileSize).toBeGreaterThan(0);

      // Property: Aspect ratios should be reasonable
      standards.acceptableAspectRatios.forEach(ratio => {
        expect(ratio).toBeGreaterThan(0);
        expect(ratio).toBeLessThan(10); // Reasonable upper bound
      });

      // Property: Brightness and contrast ranges should be valid
      expect(standards.brightnessRange.min).toBeLessThan(standards.brightnessRange.max);
      expect(standards.contrastRange.min).toBeLessThan(standards.contrastRange.max);
    });
  });
});