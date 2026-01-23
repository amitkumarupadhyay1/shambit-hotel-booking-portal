import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { QualityAssuranceService, QualityAssessmentData } from '../../src/modules/hotels/services/quality-assurance.service';
import { QualityReport } from '../../src/modules/hotels/entities/quality-report.entity';
import { EnhancedHotel } from '../../src/modules/hotels/entities/enhanced-hotel.entity';
import {
  ProcessedImage,
  ImageCategory,
  CategorizedAmenities,
  HotelPolicies,
  RichTextContent,
  LocationDetails,
  BusinessFeatures,
  QualityMetrics,
  PropertyType,
  ImageMetadata,
  QualityCheckResult,
  ThumbnailSet,
} from '../../src/modules/hotels/interfaces/enhanced-hotel.interface';

describe('QualityAssuranceService', () => {
  let service: QualityAssuranceService;
  let qualityReportRepository: Repository<QualityReport>;
  let enhancedHotelRepository: Repository<EnhancedHotel>;

  // Fast-check arbitraries for property-based testing
  const processedImageArb = fc.record({
    id: fc.uuid(),
    originalUrl: fc.webUrl(),
    optimizedUrls: fc.record({
      small: fc.webUrl(),
      medium: fc.webUrl(),
      large: fc.webUrl(),
    }),
    thumbnails: fc.record({
      small: fc.webUrl(),
      medium: fc.webUrl(),
      large: fc.webUrl(),
    }) as fc.Arbitrary<ThumbnailSet>,
    metadata: fc.record({
      filename: fc.string({ minLength: 1, maxLength: 100 }),
      size: fc.integer({ min: 1000, max: 5000000 }),
      dimensions: fc.record({
        width: fc.integer({ min: 100, max: 4000 }),
        height: fc.integer({ min: 100, max: 4000 }),
      }),
      format: fc.constantFrom('jpeg', 'jpg', 'png', 'webp'),
      uploadedAt: fc.date(),
      uploadedBy: fc.uuid(),
      qualityChecks: fc.record({
        passed: fc.boolean(),
        score: fc.float({ min: Math.fround(0), max: Math.fround(100) }),
        issues: fc.array(fc.record({
          type: fc.constantFrom('resolution', 'blur', 'brightness', 'contrast', 'aspect_ratio'),
          severity: fc.constantFrom('low', 'medium', 'high'),
          description: fc.string({ minLength: 10, maxLength: 100 }),
          suggestedFix: fc.string({ minLength: 10, maxLength: 100 }),
        }), { maxLength: 5 }),
        recommendations: fc.array(fc.string({ maxLength: 100 }), { maxLength: 5 }),
      }) as fc.Arbitrary<QualityCheckResult>,
      tags: fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
    }) as fc.Arbitrary<ImageMetadata>,
    qualityScore: fc.integer({ min: 0, max: 100 }),
    category: fc.constantFrom(...Object.values(ImageCategory)),
  }) as fc.Arbitrary<ProcessedImage>;

  const richTextContentArb = fc.record({
    content: fc.string({ minLength: 10, maxLength: 1000 }),
    format: fc.constantFrom('markdown', 'html'),
    wordCount: fc.integer({ min: 5, max: 200 }),
    readingTime: fc.integer({ min: 1, max: 10 }),
  }) as fc.Arbitrary<RichTextContent>;

  const categorizedAmenitiesArb = fc.record({
    propertyWide: fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
    roomSpecific: fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
    business: fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
    wellness: fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
    dining: fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
    sustainability: fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
    recreational: fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
    connectivity: fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
  }) as fc.Arbitrary<CategorizedAmenities>;

  const hotelPoliciesArb = fc.record({
    checkIn: fc.record({
      standardTime: fc.string({ minLength: 5, maxLength: 5 }), // HH:MM format
      earliestTime: fc.option(fc.string({ minLength: 5, maxLength: 5 })),
      latestTime: fc.option(fc.string({ minLength: 5, maxLength: 5 })),
      requirements: fc.array(fc.string({ maxLength: 100 }), { maxLength: 5 }),
      process: fc.string({ minLength: 10, maxLength: 200 }),
    }),
    checkOut: fc.record({
      standardTime: fc.string({ minLength: 5, maxLength: 5 }),
      lateCheckoutAvailable: fc.boolean(),
      lateCheckoutFee: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1000) })),
      process: fc.string({ minLength: 10, maxLength: 200 }),
    }),
    cancellation: fc.record({
      type: fc.constantFrom('flexible', 'moderate', 'strict', 'super_strict'),
      freeUntilHours: fc.integer({ min: 0, max: 168 }),
      penaltyPercentage: fc.integer({ min: 0, max: 100 }),
      noShowPolicy: fc.string({ minLength: 10, maxLength: 200 }),
      details: fc.string({ minLength: 10, maxLength: 500 }),
    }),
    booking: fc.record({
      advanceBookingDays: fc.integer({ min: 0, max: 365 }),
      minimumStay: fc.option(fc.integer({ min: 1, max: 30 })),
      maximumStay: fc.option(fc.integer({ min: 1, max: 365 })),
      instantBooking: fc.boolean(),
      requiresApproval: fc.boolean(),
      paymentTerms: fc.string({ minLength: 10, maxLength: 200 }),
    }),
    pet: fc.record({
      allowed: fc.boolean(),
      fee: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(500) })),
      restrictions: fc.option(fc.array(fc.string({ maxLength: 100 }), { maxLength: 5 })),
      areas: fc.option(fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 })),
    }),
    smoking: fc.record({
      allowed: fc.boolean(),
      designatedAreas: fc.option(fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 })),
      penalty: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1000) })),
    }),
  }) as fc.Arbitrary<HotelPolicies>;

  const qualityAssessmentDataArb = fc.record({
    images: fc.option(fc.array(processedImageArb, { maxLength: 20 })),
    amenities: fc.option(categorizedAmenitiesArb),
    propertyDescription: fc.option(richTextContentArb),
    locationDetails: fc.option(fc.record({
      nearbyAttractions: fc.array(fc.record({
        name: fc.string({ minLength: 5, maxLength: 100 }),
        type: fc.string({ minLength: 5, maxLength: 50 }),
        distance: fc.float({ min: Math.fround(0.1), max: Math.fround(50) }),
        description: fc.option(fc.string({ maxLength: 200 })),
      }), { maxLength: 10 }),
      transportation: fc.record({
        nearestAirport: fc.option(fc.record({
          name: fc.string({ minLength: 5, maxLength: 100 }),
          distance: fc.float({ min: Math.fround(1), max: Math.fround(200) }),
          code: fc.string({ minLength: 3, maxLength: 4 }),
        })),
        nearestRailway: fc.option(fc.record({
          name: fc.string({ minLength: 5, maxLength: 100 }),
          distance: fc.float({ min: Math.fround(0.5), max: Math.fround(50) }),
        })),
        publicTransport: fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 }),
        parkingAvailable: fc.boolean(),
        parkingType: fc.option(fc.constantFrom('free', 'paid', 'valet')),
      }),
      accessibility: fc.record({
        wheelchairAccessible: fc.boolean(),
        elevatorAccess: fc.boolean(),
        brailleSignage: fc.boolean(),
        hearingAssistance: fc.boolean(),
        visualAssistance: fc.boolean(),
        accessibleRooms: fc.integer({ min: 0, max: 50 }),
        accessibleBathrooms: fc.boolean(),
      }),
      neighborhood: fc.record({
        type: fc.string({ minLength: 5, maxLength: 50 }),
        safetyRating: fc.integer({ min: 1, max: 5 }),
        noiseLevel: fc.constantFrom('quiet', 'moderate', 'busy'),
        walkability: fc.integer({ min: 1, max: 5 }),
      }),
    }) as fc.Arbitrary<LocationDetails>),
    policies: fc.option(hotelPoliciesArb),
    businessFeatures: fc.option(fc.record({
      meetingRooms: fc.array(fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 5, maxLength: 100 }),
        capacity: fc.integer({ min: 2, max: 500 }),
        equipment: fc.array(fc.record({
          name: fc.string({ minLength: 5, maxLength: 50 }),
          quantity: fc.integer({ min: 1, max: 20 }),
          specifications: fc.option(fc.string({ maxLength: 200 })),
        }), { maxLength: 10 }),
        bookingProcedure: fc.string({ minLength: 10, maxLength: 200 }),
        hourlyRate: fc.option(fc.float({ min: Math.fround(50), max: Math.fround(5000) })),
        images: fc.array(processedImageArb, { maxLength: 5 }),
      }), { maxLength: 10 }),
      businessCenter: fc.record({
        available: fc.boolean(),
        hours: fc.record({
          monday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          tuesday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          wednesday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          thursday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          friday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          saturday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          sunday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          is24x7: fc.boolean(),
        }),
        services: fc.array(fc.string({ maxLength: 100 }), { maxLength: 10 }),
        equipment: fc.array(fc.record({
          name: fc.string({ minLength: 5, maxLength: 50 }),
          quantity: fc.integer({ min: 1, max: 20 }),
          specifications: fc.option(fc.string({ maxLength: 200 })),
        }), { maxLength: 10 }),
        staffed: fc.boolean(),
      }),
      connectivity: fc.record({
        wifiSpeed: fc.record({
          download: fc.float({ min: Math.fround(1), max: Math.fround(1000) }),
          upload: fc.float({ min: Math.fround(1), max: Math.fround(100) }),
          latency: fc.float({ min: Math.fround(1), max: Math.fround(100) }),
        }),
        coverage: fc.array(fc.record({
          area: fc.string({ minLength: 5, maxLength: 50 }),
          signalStrength: fc.constantFrom('excellent', 'good', 'fair', 'poor'),
        }), { maxLength: 10 }),
        reliability: fc.record({
          uptime: fc.float({ min: Math.fround(90), max: Math.fround(100) }),
          averageSpeed: fc.record({
            download: fc.float({ min: Math.fround(1), max: Math.fround(1000) }),
            upload: fc.float({ min: Math.fround(1), max: Math.fround(100) }),
            latency: fc.float({ min: Math.fround(1), max: Math.fround(100) }),
          }),
          peakHourPerformance: fc.record({
            download: fc.float({ min: Math.fround(1), max: Math.fround(1000) }),
            upload: fc.float({ min: Math.fround(1), max: Math.fround(100) }),
            latency: fc.float({ min: Math.fround(1), max: Math.fround(100) }),
          }),
        }),
        businessGrade: fc.boolean(),
        wiredInternet: fc.boolean(),
        publicComputers: fc.integer({ min: 0, max: 20 }),
      }),
      workSpaces: fc.array(fc.record({
        id: fc.uuid(),
        name: fc.string({ minLength: 5, maxLength: 100 }),
        type: fc.constantFrom('quiet_zone', 'co_working', 'business_lounge'),
        capacity: fc.integer({ min: 1, max: 100 }),
        hours: fc.record({
          monday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          tuesday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          wednesday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          thursday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          friday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          saturday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          sunday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          is24x7: fc.boolean(),
        }),
        amenities: fc.array(fc.string({ maxLength: 50 }), { maxLength: 10 }),
        isAccessible24x7: fc.boolean(),
        powerOutlets: fc.integer({ min: 0, max: 50 }),
        lighting: fc.constantFrom('natural', 'artificial', 'mixed'),
      }), { maxLength: 10 }),
      services: fc.array(fc.record({
        name: fc.string({ minLength: 5, maxLength: 100 }),
        description: fc.string({ minLength: 10, maxLength: 200 }),
        available: fc.boolean(),
        fee: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1000) })),
        hours: fc.option(fc.record({
          monday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          tuesday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          wednesday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          thursday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          friday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          saturday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          sunday: fc.option(fc.record({ open: fc.string(), close: fc.string() })),
          is24x7: fc.boolean(),
        })),
      }), { maxLength: 10 }),
    }) as fc.Arbitrary<BusinessFeatures>),
    totalRooms: fc.option(fc.integer({ min: 1, max: 500 })),
  }) as fc.Arbitrary<QualityAssessmentData>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualityAssuranceService,
        {
          provide: getRepositoryToken(QualityReport),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EnhancedHotel),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QualityAssuranceService>(QualityAssuranceService);
    qualityReportRepository = module.get<Repository<QualityReport>>(getRepositoryToken(QualityReport));
    enhancedHotelRepository = module.get<Repository<EnhancedHotel>>(getRepositoryToken(EnhancedHotel));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Property 14: Quality Score Calculation', () => {
    /**
     * Feature: enhanced-hotel-onboarding, Property 14: Quality Score Calculation
     * For any onboarding data, the quality assurance engine should calculate completion scores 
     * using the specified weighted factors (image quality 40%, content completeness 40%, 
     * policy clarity 20%) and produce consistent, reproducible results.
     * Validates: Requirements 7.1
     */
    it('should calculate weighted quality scores with consistent results', async () => {
      await fc.assert(
        fc.asyncProperty(
          qualityAssessmentDataArb,
          async (assessmentData) => {
            // Calculate quality score
            const qualityMetrics = await service.calculateQualityScore(assessmentData);

            // Property: Should return valid quality metrics structure
            expect(qualityMetrics).toBeDefined();
            expect(typeof qualityMetrics.overallScore).toBe('number');
            expect(typeof qualityMetrics.imageQuality).toBe('number');
            expect(typeof qualityMetrics.contentCompleteness).toBe('number');
            expect(typeof qualityMetrics.policyClarity).toBe('number');
            expect(qualityMetrics.lastCalculated).toBeInstanceOf(Date);
            expect(qualityMetrics.breakdown).toBeDefined();

            // Property: Scores should be within valid range (0-100)
            expect(qualityMetrics.overallScore).toBeGreaterThanOrEqual(0);
            expect(qualityMetrics.overallScore).toBeLessThanOrEqual(100);
            expect(qualityMetrics.imageQuality).toBeGreaterThanOrEqual(0);
            expect(qualityMetrics.imageQuality).toBeLessThanOrEqual(100);
            expect(qualityMetrics.contentCompleteness).toBeGreaterThanOrEqual(0);
            expect(qualityMetrics.contentCompleteness).toBeLessThanOrEqual(100);
            expect(qualityMetrics.policyClarity).toBeGreaterThanOrEqual(0);
            expect(qualityMetrics.policyClarity).toBeLessThanOrEqual(100);

            // Property: Weighted calculation should be correct (40% + 40% + 20%)
            const expectedOverallScore = Math.round(
              (qualityMetrics.imageQuality * 0.4) +
              (qualityMetrics.contentCompleteness * 0.4) +
              (qualityMetrics.policyClarity * 0.2)
            );
            expect(qualityMetrics.overallScore).toBe(expectedOverallScore);

            // Property: Breakdown should match individual scores
            expect(qualityMetrics.breakdown.imageQuality.score).toBe(qualityMetrics.imageQuality);
            expect(qualityMetrics.breakdown.contentCompleteness.score).toBe(qualityMetrics.contentCompleteness);
            expect(qualityMetrics.breakdown.policyClarity.score).toBe(qualityMetrics.policyClarity);

            // Property: Weights should be correct
            expect(qualityMetrics.breakdown.imageQuality.weight).toBe(0.4);
            expect(qualityMetrics.breakdown.contentCompleteness.weight).toBe(0.4);
            expect(qualityMetrics.breakdown.policyClarity.weight).toBe(0.2);

            // Property: Consistent results for same input
            const secondCalculation = await service.calculateQualityScore(assessmentData);
            expect(secondCalculation.overallScore).toBe(qualityMetrics.overallScore);
            expect(secondCalculation.imageQuality).toBe(qualityMetrics.imageQuality);
            expect(secondCalculation.contentCompleteness).toBe(qualityMetrics.contentCompleteness);
            expect(secondCalculation.policyClarity).toBe(qualityMetrics.policyClarity);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 15: Missing Information Detection and Recommendations', () => {
    /**
     * Feature: enhanced-hotel-onboarding, Property 15: Missing Information Detection and Recommendations
     * For any incomplete onboarding data, the quality assurance engine should identify specific 
     * missing information, provide targeted alerts, flag substandard images, suggest improvements 
     * based on industry best practices, and generate comprehensive quality reports.
     * Validates: Requirements 7.2, 7.3, 7.4, 7.5
     */
    it('should identify missing information and provide targeted recommendations', async () => {
      await fc.assert(
        fc.asyncProperty(
          qualityAssessmentDataArb,
          async (assessmentData) => {
            // Identify missing information
            const missingInfo = await service.identifyMissingInformation(assessmentData);
            
            // Generate quality metrics for recommendations
            const qualityMetrics = await service.calculateQualityScore(assessmentData);
            const recommendations = await service.generateRecommendations(qualityMetrics, missingInfo);

            // Property: Should return array of missing information
            expect(Array.isArray(missingInfo)).toBe(true);
            
            // Property: Each missing information item should have required structure
            for (const missing of missingInfo) {
              expect(missing.category).toBeDefined();
              expect(typeof missing.category).toBe('string');
              expect(Array.isArray(missing.items)).toBe(true);
              expect(['high', 'medium', 'low']).toContain(missing.priority);
            }

            // Property: Should return array of recommendations
            expect(Array.isArray(recommendations)).toBe(true);

            // Property: Each recommendation should have required structure
            for (const recommendation of recommendations) {
              expect(['image', 'content', 'policy', 'amenity']).toContain(recommendation.type);
              expect(typeof recommendation.title).toBe('string');
              expect(typeof recommendation.description).toBe('string');
              expect(['high', 'medium', 'low']).toContain(recommendation.priority);
              expect(typeof recommendation.actionRequired).toBe('string');
              expect(typeof recommendation.estimatedImpact).toBe('number');
              expect(recommendation.estimatedImpact).toBeGreaterThanOrEqual(0);
            }

            // Property: High priority recommendations should come first
            for (let i = 0; i < recommendations.length - 1; i++) {
              const current = recommendations[i];
              const next = recommendations[i + 1];
              const priorityOrder = { high: 3, medium: 2, low: 1 };
              expect(priorityOrder[current.priority]).toBeGreaterThanOrEqual(priorityOrder[next.priority]);
            }

            // Property: Missing information should correlate with low quality scores
            if (missingInfo.some(info => info.priority === 'high')) {
              // At least one component should have a lower score
              const hasLowScore = qualityMetrics.imageQuality < 70 || 
                                qualityMetrics.contentCompleteness < 70 || 
                                qualityMetrics.policyClarity < 70;
              expect(hasLowScore).toBe(true);
            }

            // Property: Recommendations should be actionable
            for (const recommendation of recommendations) {
              expect(recommendation.actionRequired.length).toBeGreaterThan(10);
              expect(recommendation.title.length).toBeGreaterThan(5);
              expect(recommendation.description.length).toBeGreaterThan(10);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 19: Quality Report Performance', () => {
    /**
     * Feature: enhanced-hotel-onboarding, Property 19: Quality Report Performance
     * For any property complexity level, quality report generation should complete within 5 seconds.
     * Validates: Requirements 9.4
     */
    it('should generate quality reports within 5 seconds regardless of complexity', async () => {
      // Mock hotel data
      const mockHotel = {
        id: 'test-hotel-id',
        images: {
          exterior: [],
          lobby: [],
          rooms: [],
          amenities: [],
          dining: [],
          recreational: [],
          business: [],
          virtualTours: [],
        },
        amenities: {
          propertyWide: [],
          roomSpecific: [],
          business: [],
          wellness: [],
          dining: [],
          sustainability: [],
          recreational: [],
          connectivity: [],
        },
        propertyDescription: null,
        locationDetails: null,
        policies: null,
        businessFeatures: null,
        basicInfo: { totalRooms: 10 },
        qualityMetrics: null,
      };

      jest.spyOn(enhancedHotelRepository, 'findOne').mockResolvedValue(mockHotel as any);
      jest.spyOn(qualityReportRepository, 'save').mockImplementation(async (report) => report as any);
      jest.spyOn(enhancedHotelRepository, 'save').mockResolvedValue(mockHotel as any);

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            hotelId: fc.uuid(),
            complexity: fc.integer({ min: 1, max: 5 }), // Reduced complexity range
          }),
          async ({ hotelId, complexity }) => {
            // Adjust mock data based on complexity
            const complexImages = Array.from({ length: complexity * 2 }, (_, i) => ({
              id: `image-${i}`,
              qualityScore: Math.random() * 100,
              category: Object.values(ImageCategory)[i % Object.values(ImageCategory).length],
            }));
            
            mockHotel.images.exterior = complexImages.slice(0, complexity);
            mockHotel.images.rooms = complexImages.slice(complexity, complexity * 2);

            const startTime = Date.now();
            
            // Generate quality report
            const report = await service.createQualityReport(hotelId);
            
            const endTime = Date.now();
            const processingTime = endTime - startTime;

            // Property: Should complete within 5 seconds (5000ms)
            expect(processingTime).toBeLessThan(5000);

            // Property: Should return valid quality report
            expect(report).toBeDefined();
            expect(typeof report.overallScore).toBe('number');
            expect(report.overallScore).toBeGreaterThanOrEqual(0);
            expect(report.overallScore).toBeLessThanOrEqual(100);
            expect(Array.isArray(report.missingInformation)).toBe(true);
            expect(Array.isArray(report.recommendations)).toBe(true);
          }
        ),
        { numRuns: 20 } // Reduced runs for performance test
      );
    });
  });

  // Unit tests for specific examples and edge cases
  describe('Unit Tests - Specific Examples', () => {
    it('should handle empty assessment data correctly', async () => {
      const emptyData: QualityAssessmentData = {};
      
      const qualityMetrics = await service.calculateQualityScore(emptyData);
      
      expect(qualityMetrics.overallScore).toBe(0);
      expect(qualityMetrics.imageQuality).toBe(0);
      expect(qualityMetrics.contentCompleteness).toBe(0);
      expect(qualityMetrics.policyClarity).toBe(0);
    });

    it('should calculate perfect score for complete high-quality data', async () => {
      const perfectData: QualityAssessmentData = {
        images: [
          {
            id: 'img1',
            qualityScore: 95,
            category: ImageCategory.EXTERIOR,
            metadata: { dimensions: { width: 1920, height: 1080 } },
          } as ProcessedImage,
          {
            id: 'img2',
            qualityScore: 90,
            category: ImageCategory.LOBBY,
            metadata: { dimensions: { width: 1920, height: 1080 } },
          } as ProcessedImage,
          {
            id: 'img3',
            qualityScore: 88,
            category: ImageCategory.ROOMS,
            metadata: { dimensions: { width: 1920, height: 1080 } },
          } as ProcessedImage,
        ],
        amenities: {
          propertyWide: ['wifi', 'parking', 'pool'],
          roomSpecific: ['ac', 'tv', 'minibar'],
          business: ['meeting-room', 'business-center'],
          wellness: ['spa', 'gym'],
          dining: ['restaurant', 'room-service'],
          sustainability: ['solar-power', 'recycling'],
          recreational: ['pool', 'garden'],
          connectivity: ['high-speed-wifi'],
        },
        propertyDescription: {
          content: 'A luxurious hotel with modern amenities and excellent location near major attractions. Our property offers unique experiences with world-class facilities.',
          format: 'markdown',
          wordCount: 150,
          readingTime: 2,
        },
        policies: {
          checkIn: { standardTime: '15:00', requirements: [], process: 'Standard check-in process' },
          checkOut: { standardTime: '11:00', lateCheckoutAvailable: true, process: 'Standard check-out' },
          cancellation: { type: 'flexible', freeUntilHours: 24, penaltyPercentage: 0, noShowPolicy: 'Full charge', details: 'Flexible cancellation' },
          booking: { advanceBookingDays: 365, instantBooking: true, requiresApproval: false, paymentTerms: 'Pay at property' },
          pet: { allowed: true, fee: 50 },
          smoking: { allowed: false },
        } as HotelPolicies,
        totalRooms: 50,
      };

      const qualityMetrics = await service.calculateQualityScore(perfectData);
      
      expect(qualityMetrics.overallScore).toBeGreaterThan(80);
      expect(qualityMetrics.imageQuality).toBeGreaterThan(70);
      expect(qualityMetrics.contentCompleteness).toBeGreaterThan(70);
      expect(qualityMetrics.policyClarity).toBe(100);
    });

    it('should identify critical missing information', async () => {
      const incompleteData: QualityAssessmentData = {
        images: [], // No images
        // No amenities, policies, or description
      };

      const missingInfo = await service.identifyMissingInformation(incompleteData);
      
      expect(missingInfo.length).toBeGreaterThan(0);
      expect(missingInfo.some(info => info.priority === 'high')).toBe(true);
      expect(missingInfo.some(info => info.category === 'Images')).toBe(true);
    });
  });
});