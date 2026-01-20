import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PerformanceOptimizedImageService } from '../../src/modules/hotels/services/performance-optimized-image.service';
import { PerformanceCacheService } from '../../src/modules/hotels/services/performance-cache.service';
import { MobileOptimizationService } from '../../src/modules/hotels/services/mobile-optimization.service';
import { InMemoryCacheService } from '../../src/modules/hotels/services/in-memory-cache.service';
import { ImageMetadata } from '../../src/modules/hotels/entities/image-metadata.entity';
import { AmenityDefinition } from '../../src/modules/hotels/entities/amenity-definition.entity';
import { QualityReport } from '../../src/modules/hotels/entities/quality-report.entity';
import { EnhancedHotel } from '../../src/modules/hotels/entities/enhanced-hotel.entity';
import { EnhancedRoom } from '../../src/modules/rooms/entities/enhanced-room.entity';

describe('Performance Optimizations', () => {
  let imageService: PerformanceOptimizedImageService;
  let cacheService: PerformanceCacheService;
  let mobileService: MobileOptimizationService;
  let inMemoryCache: InMemoryCacheService;

  const mockImageRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockAmenityRepository = {
    find: jest.fn().mockResolvedValue([
      {
        id: 'wifi',
        name: 'WiFi',
        category: 'PROPERTY_WIDE',
      },
      {
        id: 'parking',
        name: 'Parking',
        category: 'PROPERTY_WIDE',
      },
    ]),
  };

  const mockQualityReportRepository = {
    findOne: jest.fn(),
  };

  const mockHotelRepository = {
    findOne: jest.fn(),
  };

  const mockRoomRepository = {
    find: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'UPLOAD_PATH':
          return './test-uploads';
        case 'BASE_URL':
          return 'http://localhost:3000';
        default:
          return undefined;
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceOptimizedImageService,
        PerformanceCacheService,
        MobileOptimizationService,
        InMemoryCacheService,
        {
          provide: getRepositoryToken(ImageMetadata),
          useValue: mockImageRepository,
        },
        {
          provide: getRepositoryToken(AmenityDefinition),
          useValue: mockAmenityRepository,
        },
        {
          provide: getRepositoryToken(QualityReport),
          useValue: mockQualityReportRepository,
        },
        {
          provide: getRepositoryToken(EnhancedHotel),
          useValue: mockHotelRepository,
        },
        {
          provide: getRepositoryToken(EnhancedRoom),
          useValue: mockRoomRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    imageService = module.get<PerformanceOptimizedImageService>(PerformanceOptimizedImageService);
    cacheService = module.get<PerformanceCacheService>(PerformanceCacheService);
    mobileService = module.get<MobileOptimizationService>(MobileOptimizationService);
    inMemoryCache = module.get<InMemoryCacheService>(InMemoryCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('InMemoryCacheService', () => {
    it('should store and retrieve cached data', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      await inMemoryCache.set(key, value, 60000); // 1 minute TTL
      const retrieved = await inMemoryCache.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for expired cache entries', async () => {
      const key = 'test-key-expired';
      const value = { data: 'test-value' };

      await inMemoryCache.set(key, value, 1); // 1ms TTL
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const retrieved = await inMemoryCache.get(key);
      expect(retrieved).toBeNull();
    });

    it('should support cache deletion', async () => {
      const key = 'test-key-delete';
      const value = { data: 'test-value' };

      await inMemoryCache.set(key, value);
      await inMemoryCache.del(key);
      
      const retrieved = await inMemoryCache.get(key);
      expect(retrieved).toBeNull();
    });

    it('should support pattern-based key retrieval', async () => {
      await inMemoryCache.set('user:1', { name: 'User 1' });
      await inMemoryCache.set('user:2', { name: 'User 2' });
      await inMemoryCache.set('product:1', { name: 'Product 1' });

      const userKeys = await inMemoryCache.keys('user:*');
      expect(userKeys).toHaveLength(2);
      expect(userKeys).toContain('user:1');
      expect(userKeys).toContain('user:2');
    });
  });

  describe('PerformanceCacheService', () => {
    it('should cache and retrieve amenity validation rules', async () => {
      const propertyType = 'hotel';
      const region = 'north_america';

      const rules = await cacheService.getAmenityValidationRules(propertyType, region);

      expect(rules).toBeDefined();
      expect(rules.required).toContain('wifi');
      expect(rules.required).toContain('parking');
      expect(typeof rules.maxSelections).toBe('number');
    });

    it('should track cache statistics', () => {
      const stats = cacheService.getCacheStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.hits).toBe('number');
      expect(typeof stats.misses).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
    });

    it('should cache quality scores', async () => {
      const sessionId = 'test-session-123';
      const qualityScore = {
        overall: 85,
        imageQuality: 90,
        contentCompleteness: 80,
        policyClarity: 85,
        breakdown: {},
      };

      await cacheService.cacheQualityScore(sessionId, qualityScore);
      const cached = await cacheService.getCachedQualityScore(sessionId);

      expect(cached).toEqual(qualityScore);
    });

    it('should get categorized amenities', async () => {
      const amenities = await cacheService.getCategorizedAmenities();

      expect(amenities).toBeDefined();
      expect(amenities.propertyWide).toBeDefined();
      expect(Array.isArray(amenities.propertyWide)).toBe(true);
    });
  });

  describe('MobileOptimizationService', () => {
    it('should return mobile onboarding steps with data size estimates', async () => {
      const steps = await mobileService.getMobileOnboardingSteps();

      expect(steps).toBeDefined();
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);

      const firstStep = steps[0];
      expect(firstStep).toHaveProperty('id');
      expect(firstStep).toHaveProperty('title');
      expect(firstStep).toHaveProperty('dataSize');
      expect(typeof firstStep.dataSize).toBe('number');
    });

    it('should optimize data transfer based on level', async () => {
      const testData = {
        description: 'A'.repeat(500),
        amenities: ['wifi', 'parking', 'pool', 'gym', 'spa'],
        images: [{ url: 'test1.jpg' }, { url: 'test2.jpg' }],
      };

      const optimized = await mobileService.optimizeDataTransfer(testData, 'high');

      expect(optimized).toBeDefined();
      expect(optimized.data).toBeDefined();
      expect(optimized.optimization).toBeDefined();
      expect(optimized.optimization.compressionRatio).toBeLessThan(1);
      expect(optimized.optimization.bandwidthSaved).toBeGreaterThan(0);
    });

    it('should provide progressive loading strategies', async () => {
      const strategy = await mobileService.getProgressiveLoadingStrategy('hotel', 'high');

      expect(strategy).toBeDefined();
      expect(strategy.immediate).toBeDefined();
      expect(strategy.deferred).toBeDefined();
      expect(strategy.lazy).toBeDefined();
      expect(Array.isArray(strategy.immediate)).toBe(true);
    });

    it('should estimate bandwidth usage accurately', () => {
      const dataSize = 5 * 1024 * 1024; // 5MB
      const estimate = mobileService.estimateBandwidthUsage('image_upload', dataSize);

      expect(estimate).toBeDefined();
      expect(typeof estimate.estimatedTime).toBe('number');
      expect(typeof estimate.dataUsage).toBe('number');
      expect(typeof estimate.recommendation).toBe('string');
      expect(estimate.dataUsage).toBeCloseTo(5, 1); // ~5MB
    });
  });

  describe('PerformanceOptimizedImageService', () => {
    it('should handle async image upload without blocking', async () => {
      const mockFile = {
        originalname: 'test-image.jpg',
        size: 1024 * 1024, // 1MB
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const result = await imageService.uploadImageAsync(
        mockFile,
        'EXTERIOR' as any,
        'HOTEL' as any,
        'test-hotel-id',
        'test-user-id'
      );

      expect(result).toBeDefined();
      expect(result.uploadId).toBeDefined();
      expect(typeof result.uploadId).toBe('string');
    });

    it('should reject files exceeding size limit', async () => {
      const mockFile = {
        originalname: 'large-image.jpg',
        size: 6 * 1024 * 1024, // 6MB (exceeds 5MB limit)
        buffer: Buffer.from('fake-large-image-data'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      await expect(
        imageService.uploadImageAsync(
          mockFile,
          'EXTERIOR' as any,
          'HOTEL' as any,
          'test-hotel-id',
          'test-user-id'
        )
      ).rejects.toThrow('File size exceeds maximum limit');
    });

    it('should track upload status', async () => {
      const uploadId = 'test-upload-123';
      
      // Initially, upload ID should not exist
      const initialStatus = await imageService.getUploadStatus(uploadId);
      expect(initialStatus).toBeNull();
    });

    it('should get mobile-optimized images', async () => {
      mockImageRepository.find.mockResolvedValue([
        {
          id: 'image-1',
          thumbnails: { small: 'thumb-small.jpg' },
          optimizedUrls: { mobile: 'mobile.jpg', small: 'small.jpg' },
          sizeBytes: 1024,
          dimensions: { width: 800, height: 600 },
          format: 'jpeg',
        },
      ]);

      const mobileImages = await imageService.getMobileOptimizedImages(
        'HOTEL' as any,
        'test-hotel-id'
      );

      expect(mobileImages).toBeDefined();
      expect(Array.isArray(mobileImages)).toBe(true);
      expect(mobileImages.length).toBe(1);
      expect(mobileImages[0]).toHaveProperty('thumbnailUrl');
      expect(mobileImages[0]).toHaveProperty('compressedUrl');
    });
  });

  describe('Integration Tests', () => {
    it('should demonstrate complete performance optimization workflow', async () => {
      // 1. Cache amenity data
      const amenities = await cacheService.getCategorizedAmenities();
      expect(amenities).toBeDefined();

      // 2. Get mobile optimization settings
      const steps = await mobileService.getMobileOnboardingSteps();
      expect(steps.length).toBeGreaterThan(0);

      // 3. Test data optimization
      const testData = { test: 'data' };
      const optimized = await mobileService.optimizeDataTransfer(testData, 'medium');
      expect(optimized.optimization.compressionRatio).toBeLessThan(1);

      // 4. Verify cache statistics
      const stats = cacheService.getCacheStats();
      expect(stats.misses).toBeGreaterThan(0); // Should have cache misses from above calls
    });
  });
});