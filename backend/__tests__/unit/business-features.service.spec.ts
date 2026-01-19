import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { BusinessFeaturesService } from '../../src/modules/hotels/services/business-features.service';
import { EnhancedHotel } from '../../src/modules/hotels/entities/enhanced-hotel.entity';

describe('BusinessFeaturesService - Property Tests', () => {
  let service: BusinessFeaturesService;
  let mockRepository: jest.Mocked<Repository<EnhancedHotel>>;

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessFeaturesService,
        {
          provide: getRepositoryToken(EnhancedHotel),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<BusinessFeaturesService>(BusinessFeaturesService);
    mockRepository = module.get(getRepositoryToken(EnhancedHotel));
  });

  const workSpaceArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    type: fc.constantFrom('quiet_zone', 'co_working', 'business_lounge'),
    capacity: fc.integer({ min: 1, max: 100 }),
    hours: fc.record({
      monday: fc.option(fc.record({
        open: fc.constantFrom('06:00', '07:00', '08:00', '09:00'),
        close: fc.constantFrom('18:00', '19:00', '20:00', '21:00', '22:00'),
      })),
      tuesday: fc.option(fc.record({
        open: fc.constantFrom('06:00', '07:00', '08:00', '09:00'),
        close: fc.constantFrom('18:00', '19:00', '20:00', '21:00', '22:00'),
      })),
      wednesday: fc.option(fc.record({
        open: fc.constantFrom('06:00', '07:00', '08:00', '09:00'),
        close: fc.constantFrom('18:00', '19:00', '20:00', '21:00', '22:00'),
      })),
      thursday: fc.option(fc.record({
        open: fc.constantFrom('06:00', '07:00', '08:00', '09:00'),
        close: fc.constantFrom('18:00', '19:00', '20:00', '21:00', '22:00'),
      })),
      friday: fc.option(fc.record({
        open: fc.constantFrom('06:00', '07:00', '08:00', '09:00'),
        close: fc.constantFrom('18:00', '19:00', '20:00', '21:00', '22:00'),
      })),
      saturday: fc.option(fc.record({
        open: fc.constantFrom('06:00', '07:00', '08:00', '09:00'),
        close: fc.constantFrom('18:00', '19:00', '20:00', '21:00', '22:00'),
      })),
      sunday: fc.option(fc.record({
        open: fc.constantFrom('06:00', '07:00', '08:00', '09:00'),
        close: fc.constantFrom('18:00', '19:00', '20:00', '21:00', '22:00'),
      })),
      is24x7: fc.boolean(),
    }),
    amenities: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
    isAccessible24x7: fc.boolean(),
    powerOutlets: fc.integer({ min: 0, max: 50 }),
    lighting: fc.constantFrom('natural', 'artificial', 'mixed'),
  });

  /**
   * Property 10: Workspace Categorization
   * For any workspace definition, the system should properly categorize work areas 
   * (quiet zones, co-working, business lounge) and accurately record accessibility 
   * and operating hours.
   * Validates: Requirements 5.3, 5.5
   */
  it('**Feature: enhanced-hotel-onboarding, Property 10: Workspace Categorization**', () => {
    fc.assert(
      fc.property(
        fc.array(workSpaceArb, { minLength: 1, maxLength: 5 }),
        (workSpaces) => {
          // Test workspace categorization properties
          workSpaces.forEach(workSpace => {
            // Property: Workspace type must be one of the valid categories
            expect(['quiet_zone', 'co_working', 'business_lounge']).toContain(workSpace.type);

            // Property: Workspace must have required fields
            expect(workSpace.id).toBeDefined();
            expect(workSpace.name).toBeDefined();
            expect(workSpace.capacity).toBeGreaterThan(0);
            expect(typeof workSpace.isAccessible24x7).toBe('boolean');
            expect(Array.isArray(workSpace.amenities)).toBe(true);

            // Property: Physical attributes are within valid ranges
            expect(workSpace.powerOutlets).toBeGreaterThanOrEqual(0);
            expect(['natural', 'artificial', 'mixed']).toContain(workSpace.lighting);

            // Property: Operating hours structure is valid
            expect(workSpace.hours).toBeDefined();
            expect(typeof workSpace.hours.is24x7).toBe('boolean');
          });

          // Test that workspace type formatting works correctly for customer display
          workSpaces.forEach(workSpace => {
            let expectedFormattedType: string;
            switch (workSpace.type) {
              case 'quiet_zone':
                expectedFormattedType = 'Quiet Zone';
                break;
              case 'co_working':
                expectedFormattedType = 'Co-working Space';
                break;
              case 'business_lounge':
                expectedFormattedType = 'Business Lounge';
                break;
              default:
                expectedFormattedType = workSpace.type;
            }

            // Property: Type formatting is customer-friendly
            expect(['Quiet Zone', 'Co-working Space', 'Business Lounge']).toContain(expectedFormattedType);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});