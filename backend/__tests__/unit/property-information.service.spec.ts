import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { PropertyInformationService } from '../../src/modules/hotels/services/property-information.service';
import { EnhancedHotel } from '../../src/modules/hotels/entities/enhanced-hotel.entity';
import {
  PropertyType,
  OnboardingStatus,
  RichTextContent,
  LocationDetails,
  HotelPolicies,
  Attraction,
  TransportationOptions,
  AccessibilityFeatures,
  NeighborhoodInfo,
} from '../../src/modules/hotels/interfaces/enhanced-hotel.interface';

describe('PropertyInformationService - Property-Based Tests', () => {
  let service: PropertyInformationService;
  let repository: Repository<EnhancedHotel>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyInformationService,
        {
          provide: getRepositoryToken(EnhancedHotel),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PropertyInformationService>(PropertyInformationService);
    repository = module.get<Repository<EnhancedHotel>>(getRepositoryToken(EnhancedHotel));
  });

  // Property-based test generators
  const richTextContentArb = fc.record({
    content: fc.string({ minLength: 1, maxLength: 5000 }).filter(s => s.trim().length > 0),
    format: fc.constantFrom('markdown', 'html'),
    wordCount: fc.integer({ min: 1, max: 1000 }),
    readingTime: fc.integer({ min: 1, max: 50 }),
  });

  const attractionArb = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    type: fc.constantFrom('museum', 'park', 'restaurant', 'shopping', 'historical', 'beach'),
    distance: fc.float({ min: Math.fround(0.1), max: Math.fround(100) }).filter(n => !isNaN(n) && isFinite(n)),
    description: fc.option(fc.string({ maxLength: 200 })),
  });

  const transportationArb = fc.record({
    nearestAirport: fc.option(fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
      distance: fc.float({ min: Math.fround(1), max: Math.fround(200) }).filter(n => !isNaN(n) && isFinite(n)),
      code: fc.string({ minLength: 3, maxLength: 4 }),
    })),
    nearestRailway: fc.option(fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
      distance: fc.float({ min: Math.fround(0.5), max: Math.fround(50) }).filter(n => !isNaN(n) && isFinite(n)),
    })),
    publicTransport: fc.array(fc.constantFrom('bus', 'metro', 'taxi', 'auto-rickshaw'), { maxLength: 5 }),
    parkingAvailable: fc.boolean(),
    parkingType: fc.option(fc.constantFrom('free', 'paid', 'valet')),
  });

  const accessibilityArb = fc.record({
    wheelchairAccessible: fc.boolean(),
    elevatorAccess: fc.boolean(),
    brailleSignage: fc.boolean(),
    hearingAssistance: fc.boolean(),
    visualAssistance: fc.boolean(),
    accessibleRooms: fc.integer({ min: 0, max: 50 }),
    accessibleBathrooms: fc.boolean(),
  });

  const neighborhoodArb = fc.record({
    type: fc.constantFrom('business', 'residential', 'tourist', 'mixed'),
    safetyRating: fc.integer({ min: 1, max: 5 }),
    noiseLevel: fc.constantFrom('quiet', 'moderate', 'busy'),
    walkability: fc.integer({ min: 1, max: 5 }),
  });

  const locationDetailsArb = fc.record({
    nearbyAttractions: fc.array(attractionArb, { maxLength: 10 }),
    transportation: transportationArb,
    accessibility: accessibilityArb,
    neighborhood: neighborhoodArb,
  });

  const checkInPolicyArb = fc.record({
    standardTime: fc.constantFrom('14:00', '15:00', '16:00'),
    earliestTime: fc.option(fc.constantFrom('12:00', '13:00')),
    latestTime: fc.option(fc.constantFrom('22:00', '23:00', '00:00')),
    requirements: fc.array(fc.constantFrom('Valid ID', 'Credit card', 'Booking confirmation'), { minLength: 1, maxLength: 5 }),
    process: fc.string({ minLength: 10, maxLength: 200 }),
  });

  const checkOutPolicyArb = fc.record({
    standardTime: fc.constantFrom('10:00', '11:00', '12:00'),
    lateCheckoutAvailable: fc.boolean(),
    lateCheckoutFee: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(100) })),
    process: fc.string({ minLength: 10, maxLength: 200 }),
  });

  const cancellationPolicyArb = fc.record({
    type: fc.constantFrom('flexible', 'moderate', 'strict', 'super_strict'),
    freeUntilHours: fc.integer({ min: 0, max: 168 }),
    penaltyPercentage: fc.integer({ min: 0, max: 100 }),
    noShowPolicy: fc.string({ minLength: 10, maxLength: 200 }),
    details: fc.string({ minLength: 20, maxLength: 500 }),
  });

  const bookingPolicyArb = fc.record({
    advanceBookingDays: fc.integer({ min: 0, max: 365 }),
    minimumStay: fc.option(fc.integer({ min: 1, max: 30 })),
    maximumStay: fc.option(fc.integer({ min: 1, max: 365 })),
    instantBooking: fc.boolean(),
    requiresApproval: fc.boolean(),
    paymentTerms: fc.string({ minLength: 10, maxLength: 200 }),
  });

  const petPolicyArb = fc.record({
    allowed: fc.boolean(),
    fee: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(200) })),
    restrictions: fc.option(fc.array(fc.string({ maxLength: 100 }), { maxLength: 5 })),
    areas: fc.option(fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 })),
  });

  const smokingPolicyArb = fc.record({
    allowed: fc.boolean(),
    designatedAreas: fc.option(fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 })),
    penalty: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1000) })),
  });

  const hotelPoliciesArb = fc.record({
    checkIn: checkInPolicyArb,
    checkOut: checkOutPolicyArb,
    cancellation: cancellationPolicyArb,
    booking: bookingPolicyArb,
    pet: petPolicyArb,
    smoking: smokingPolicyArb,
  });

  const mockHotelArb = fc.record({
    id: fc.uuid(),
    basicInfo: fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      propertyType: fc.constantFrom(...Object.values(PropertyType)),
      totalRooms: fc.integer({ min: 1, max: 500 }),
    }),
    onboardingStatus: fc.constantFrom(...Object.values(OnboardingStatus)),
    propertyDescription: fc.option(richTextContentArb),
    locationDetails: fc.option(locationDetailsArb),
    policies: fc.option(hotelPoliciesArb),
  });

  /**
   * Property 6: Rich Text and Data Completeness
   * For any property information input, the system should support rich text formatting,
   * capture all required data components, and validate completeness against quality standards.
   * **Feature: enhanced-hotel-onboarding, Property 6: Rich Text and Data Completeness**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   */
  describe('Property 6: Rich Text and Data Completeness', () => {
    it('should support rich text formatting and validate completeness for any property information input', async () => {
      await fc.assert(
        fc.asyncProperty(
          mockHotelArb,
          richTextContentArb,
          locationDetailsArb,
          hotelPoliciesArb,
          async (mockHotel, richTextContent, locationDetails, policies) => {
            // Setup mock hotel
            const hotel = new EnhancedHotel();
            Object.assign(hotel, mockHotel);
            
            jest.spyOn(repository, 'findOne').mockResolvedValue(hotel);
            jest.spyOn(repository, 'save').mockResolvedValue(hotel);

            // Test rich text content support (Requirement 3.1)
            const contentToUse = richTextContent.content.trim() || 'Valid content';
            const updatedDescription = await service.updatePropertyDescription(hotel.id, {
              content: contentToUse,
              format: richTextContent.format,
            });

            // Rich text should preserve format and calculate metadata
            expect(updatedDescription.format).toBe(richTextContent.format);
            expect(updatedDescription.content).toBe(contentToUse);
            expect(updatedDescription.wordCount).toBeGreaterThan(0);
            expect(updatedDescription.readingTime).toBeGreaterThan(0);

            // Test location details capture (Requirement 3.2)
            const updatedLocation = await service.updateLocationDetails(hotel.id, locationDetails);
            
            // All location components should be captured
            expect(updatedLocation.nearbyAttractions).toBeDefined();
            expect(updatedLocation.transportation).toBeDefined();
            expect(updatedLocation.accessibility).toBeDefined();
            expect(updatedLocation.neighborhood).toBeDefined();

            // Test policy management (Requirement 3.3)
            const updatedPolicies = await service.updateHotelPolicies(hotel.id, policies);
            
            // All policy components should be captured
            expect(updatedPolicies.checkIn).toBeDefined();
            expect(updatedPolicies.checkOut).toBeDefined();
            expect(updatedPolicies.cancellation).toBeDefined();
            expect(updatedPolicies.booking).toBeDefined();
            expect(updatedPolicies.pet).toBeDefined();
            expect(updatedPolicies.smoking).toBeDefined();

            // Test completeness validation (Requirement 3.4)
            hotel.propertyDescription = updatedDescription;
            hotel.locationDetails = updatedLocation;
            hotel.policies = updatedPolicies;

            const validation = await service.validatePropertyInformation(hotel.id);
            
            // Validation should assess completeness
            expect(validation.completenessScore).toBeGreaterThanOrEqual(0);
            expect(validation.completenessScore).toBeLessThanOrEqual(100);
            expect(Array.isArray(validation.errors)).toBe(true);
            expect(Array.isArray(validation.warnings)).toBe(true);
            expect(typeof validation.isValid).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases in rich text content validation', async () => {
      await fc.assert(
        fc.asyncProperty(
          mockHotelArb,
          fc.record({
            content: fc.oneof(
              fc.constant(''), // Empty content
              fc.string({ minLength: 1, maxLength: 10 }), // Very short content
              fc.string({ minLength: 10000, maxLength: 15000 }), // Very long content
            ),
            format: fc.constantFrom('markdown', 'html'),
          }),
          async (mockHotel, descriptionData) => {
            const hotel = new EnhancedHotel();
            Object.assign(hotel, mockHotel);
            
            jest.spyOn(repository, 'findOne').mockResolvedValue(hotel);

            if (descriptionData.content === '' || descriptionData.content.length > 10000) {
              // Should throw BadRequestException for invalid content
              await expect(
                service.updatePropertyDescription(hotel.id, descriptionData)
              ).rejects.toThrow();
            } else {
              // Should handle valid content
              const result = await service.updatePropertyDescription(hotel.id, descriptionData);
              expect(result.content).toBe(descriptionData.content);
              expect(result.format).toBe(descriptionData.format);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 7: Customer-Friendly Presentation
   * For any property or business feature data, the display functions should format information
   * in scannable, customer-friendly formats appropriate for booking decisions.
   * **Feature: enhanced-hotel-onboarding, Property 7: Customer-Friendly Presentation**
   * **Validates: Requirements 3.5**
   */
  describe('Property 7: Customer-Friendly Presentation', () => {
    it('should format any property information in customer-friendly, scannable formats', async () => {
      await fc.assert(
        fc.property(
          fc.option(richTextContentArb),
          fc.option(locationDetailsArb),
          fc.option(hotelPoliciesArb),
          (propertyDescription, locationDetails, policies) => {
            const customerDisplay = service.formatForCustomerDisplay(
              propertyDescription,
              locationDetails,
              policies
            );

            // Description should be formatted for readability
            expect(typeof customerDisplay.description).toBe('string');
            
            // Location information should be scannable
            expect(Array.isArray(customerDisplay.location.attractions)).toBe(true);
            expect(Array.isArray(customerDisplay.location.transportation)).toBe(true);
            expect(Array.isArray(customerDisplay.location.accessibility)).toBe(true);

            // Policies should be customer-friendly
            expect(typeof customerDisplay.policies.checkIn).toBe('string');
            expect(typeof customerDisplay.policies.checkOut).toBe('string');
            expect(typeof customerDisplay.policies.cancellation).toBe('string');
            expect(Array.isArray(customerDisplay.policies.important)).toBe(true);

            // If location details exist, attractions should be formatted with distance and type
            if (locationDetails && locationDetails.nearbyAttractions.length > 0) {
              customerDisplay.location.attractions.forEach(attraction => {
                expect(attraction).toMatch(/.*\(\d+\.?\d*km\).*/); // Should include distance
              });
            }

            // If transportation exists, should include formatted transport options
            if (locationDetails && locationDetails.transportation) {
              if (locationDetails.transportation.nearestAirport) {
                expect(customerDisplay.location.transportation.some(t => t.includes('Airport:'))).toBe(true);
              }
              if (locationDetails.transportation.nearestRailway) {
                expect(customerDisplay.location.transportation.some(t => t.includes('Railway:'))).toBe(true);
              }
            }

            // If policies exist, check-in and check-out should include times
            if (policies) {
              if (policies.checkIn) {
                expect(customerDisplay.policies.checkIn).toMatch(/Check-in: \d{2}:\d{2}/);
              }
              if (policies.checkOut) {
                expect(customerDisplay.policies.checkOut).toMatch(/Check-out: \d{2}:\d{2}/);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null/undefined inputs gracefully in customer display formatting', async () => {
      await fc.assert(
        fc.property(
          fc.option(richTextContentArb, { nil: undefined }),
          fc.option(locationDetailsArb, { nil: undefined }),
          fc.option(hotelPoliciesArb, { nil: undefined }),
          (propertyDescription, locationDetails, policies) => {
            const customerDisplay = service.formatForCustomerDisplay(
              propertyDescription || null,
              locationDetails || null,
              policies || null
            );

            // Should never throw and always return valid structure
            expect(customerDisplay).toBeDefined();
            expect(typeof customerDisplay.description).toBe('string');
            expect(customerDisplay.location).toBeDefined();
            expect(customerDisplay.policies).toBeDefined();
            
            // Arrays should always be arrays, even if empty
            expect(Array.isArray(customerDisplay.location.attractions)).toBe(true);
            expect(Array.isArray(customerDisplay.location.transportation)).toBe(true);
            expect(Array.isArray(customerDisplay.location.accessibility)).toBe(true);
            expect(Array.isArray(customerDisplay.policies.important)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Unit tests for specific examples and edge cases
  describe('Unit Tests - Specific Examples', () => {
    it('should validate time format correctly', () => {
      const hotel = new EnhancedHotel();
      hotel.id = 'test-id';
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(hotel);

      // Valid time formats
      expect(() => service['isValidTimeFormat']('14:30')).not.toThrow();
      expect(() => service['isValidTimeFormat']('09:00')).not.toThrow();
      expect(() => service['isValidTimeFormat']('23:59')).not.toThrow();

      // Invalid time formats should be handled by validation
      expect(service['isValidTimeFormat']('25:00')).toBe(false);
      expect(service['isValidTimeFormat']('14:60')).toBe(false);
      expect(service['isValidTimeFormat']('invalid')).toBe(false);
    });

    it('should calculate word count and reading time correctly', () => {
      const content = 'This is a test content with exactly ten words here.';
      expect(service['calculateWordCount'](content)).toBe(10);
      expect(service['calculateReadingTime'](200)).toBe(1); // 200 words = 1 minute
      expect(service['calculateReadingTime'](400)).toBe(2); // 400 words = 2 minutes
    });

    it('should handle empty content gracefully', async () => {
      const hotel = new EnhancedHotel();
      hotel.id = 'test-id';
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(hotel);

      await expect(
        service.updatePropertyDescription('test-id', {
          content: '',
          format: 'markdown',
        })
      ).rejects.toThrow('Property description content cannot be empty');
    });

    it('should validate accessibility room count', async () => {
      const hotel = new EnhancedHotel();
      hotel.id = 'test-id';
      
      jest.spyOn(repository, 'findOne').mockResolvedValue(hotel);

      await expect(
        service.updateLocationDetails('test-id', {
          accessibility: {
            wheelchairAccessible: true,
            elevatorAccess: true,
            brailleSignage: false,
            hearingAssistance: false,
            visualAssistance: false,
            accessibleRooms: -1, // Invalid negative value
            accessibleBathrooms: true,
          },
        })
      ).rejects.toThrow('Number of accessible rooms cannot be negative');
    });
  });
});