import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { AmenityService } from '../../src/modules/hotels/services/amenity.service';
import { AmenityDefinition } from '../../src/modules/hotels/entities/amenity-definition.entity';
import {
  PropertyType,
  AmenityCategory,
  CategorizedAmenities,
  Amenity,
  AmenityRule,
} from '../../src/modules/hotels/interfaces/enhanced-hotel.interface';

describe('AmenityService', () => {
  let service: AmenityService;
  let repository: Repository<AmenityDefinition>;

  // Mock repository
  const mockRepository = {
    find: jest.fn(),
    findByIds: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AmenityService,
        {
          provide: getRepositoryToken(AmenityDefinition),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AmenityService>(AmenityService);
    repository = module.get<Repository<AmenityDefinition>>(getRepositoryToken(AmenityDefinition));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Property-Based Tests

  /**
   * **Feature: enhanced-hotel-onboarding, Property 1: Amenity Categorization and Display**
   * For any set of amenities with category assignments, the display function should group amenities 
   * by their assigned categories and include both visual icons and descriptive text for each amenity, 
   * with eco-friendly indicators displayed for amenities marked as sustainable.
   * **Validates: Requirements 1.1, 1.2, 1.3**
   */
  describe('Property 1: Amenity Categorization and Display', () => {
    it('should properly categorize amenities and include display information', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of amenity definitions with various categories
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              description: fc.option(fc.string({ maxLength: 200 })),
              icon: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
              category: fc.constantFrom(...Object.values(AmenityCategory)),
              isEcoFriendly: fc.boolean(),
              applicablePropertyTypes: fc.array(fc.constantFrom(...Object.values(PropertyType))),
              businessRules: fc.array(
                fc.record({
                  type: fc.constantFrom('requires', 'excludes', 'implies'),
                  amenityId: fc.uuid(),
                  condition: fc.option(fc.string()),
                })
              ),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (amenityDefinitions) => {
            // Setup mock to return our generated amenities
            mockRepository.find.mockResolvedValue(amenityDefinitions);

            // Test categorization
            const categorized = await service.getAmenitiesByCategory();

            // Property 1.1: Amenities should be organized by categories
            expect(categorized).toHaveProperty('propertyWide');
            expect(categorized).toHaveProperty('roomSpecific');
            expect(categorized).toHaveProperty('business');
            expect(categorized).toHaveProperty('wellness');
            expect(categorized).toHaveProperty('dining');
            expect(categorized).toHaveProperty('sustainability');
            expect(categorized).toHaveProperty('recreational');
            expect(categorized).toHaveProperty('connectivity');

            // Verify each amenity is in the correct category
            const allCategorizedIds = Object.values(categorized).flat();
            const originalIds = amenityDefinitions.map(a => a.id);
            expect(allCategorizedIds.sort()).toEqual(originalIds.sort());

            // Test detailed display information
            const withDetails = await service.getAmenitiesWithDetails();

            // Property 1.2 & 1.3: Should include visual icons, descriptions, and eco-friendly indicators
            for (const categoryAmenities of Object.values(withDetails)) {
              for (const amenity of categoryAmenities) {
                expect(amenity).toHaveProperty('id');
                expect(amenity).toHaveProperty('name');
                expect(amenity).toHaveProperty('description');
                expect(amenity).toHaveProperty('icon');
                expect(amenity).toHaveProperty('isEcoFriendly');
                expect(typeof amenity.isEcoFriendly).toBe('boolean');
                
                // Find original amenity to verify eco-friendly indicator
                const original = amenityDefinitions.find(a => a.id === amenity.id);
                if (original) {
                  expect(amenity.isEcoFriendly).toBe(original.isEcoFriendly);
                }
              }
            }

            // Verify category mapping is correct
            for (const amenityDef of amenityDefinitions) {
              const categoryKey = getCategoryKey(amenityDef.category);
              if (categoryKey && withDetails[categoryKey]) {
                const found = withDetails[categoryKey].find(a => a.id === amenityDef.id);
                expect(found).toBeDefined();
                expect(found?.category).toBe(amenityDef.category);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: enhanced-hotel-onboarding, Property 2: Amenity Validation and Storage**
   * For any amenity selection and property configuration, the validation system should enforce 
   * business rules based on property type and region, and successful selections should be stored 
   * with proper categorization and metadata preservation.
   * **Validates: Requirements 1.4, 1.5**
   */
  describe('Property 2: Amenity Validation and Storage', () => {
    it('should validate amenity selections according to business rules and property types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            propertyType: fc.constantFrom(...Object.values(PropertyType)),
            amenityDefinitions: fc.array(
              fc.record({
                id: fc.uuid(),
                name: fc.string({ minLength: 1, maxLength: 50 }),
                description: fc.option(fc.string()),
                icon: fc.option(fc.string()),
                category: fc.constantFrom(...Object.values(AmenityCategory)),
                isEcoFriendly: fc.boolean(),
                applicablePropertyTypes: fc.array(fc.constantFrom(...Object.values(PropertyType))),
                businessRules: fc.array(
                  fc.record({
                    type: fc.constantFrom('requires', 'excludes', 'implies'),
                    amenityId: fc.uuid(),
                    condition: fc.option(fc.string()),
                  })
                ),
              }),
              { minLength: 1, maxLength: 15 }
            ),
          }),
          async ({ propertyType, amenityDefinitions }) => {
            // Create a subset of amenity IDs to select
            const selectedAmenityIds = amenityDefinitions
              .slice(0, Math.min(5, amenityDefinitions.length))
              .map(a => a.id);

            // Setup mocks
            mockRepository.findByIds.mockResolvedValue(
              amenityDefinitions.filter(a => selectedAmenityIds.includes(a.id))
            );
            mockRepository.findOne.mockImplementation(({ where }) => {
              return Promise.resolve(amenityDefinitions.find(a => a.id === where.id));
            });

            // Test validation
            const validationResult = await service.validateAmenitySelection(
              selectedAmenityIds,
              propertyType
            );

            // Property 2.1: Validation result should have required structure
            expect(validationResult).toHaveProperty('isValid');
            expect(validationResult).toHaveProperty('errors');
            expect(validationResult).toHaveProperty('warnings');
            expect(typeof validationResult.isValid).toBe('boolean');
            expect(Array.isArray(validationResult.errors)).toBe(true);
            expect(Array.isArray(validationResult.warnings)).toBe(true);

            // Property 2.2: Property type compatibility should be enforced
            const selectedAmenities = amenityDefinitions.filter(a => selectedAmenityIds.includes(a.id));
            for (const amenity of selectedAmenities) {
              if (amenity.applicablePropertyTypes && 
                  amenity.applicablePropertyTypes.length > 0 && 
                  !amenity.applicablePropertyTypes.includes(propertyType)) {
                expect(validationResult.isValid).toBe(false);
                expect(validationResult.errors.some(error => 
                  error.includes(amenity.name) && error.includes(propertyType)
                )).toBe(true);
              }
            }

            // Property 2.3: Business rules should be applied
            for (const amenity of selectedAmenities) {
              if (amenity.businessRules) {
                for (const rule of amenity.businessRules) {
                  switch (rule.type) {
                    case 'requires':
                      if (!selectedAmenityIds.includes(rule.amenityId)) {
                        expect(validationResult.errors.some(error => 
                          error.includes('requires')
                        )).toBe(true);
                      }
                      break;
                    case 'excludes':
                      if (selectedAmenityIds.includes(rule.amenityId)) {
                        expect(validationResult.errors.some(error => 
                          error.includes('cannot be selected together')
                        )).toBe(true);
                      }
                      break;
                    case 'implies':
                      if (!selectedAmenityIds.includes(rule.amenityId)) {
                        expect(validationResult.warnings.some(warning => 
                          warning.includes('typically includes')
                        )).toBe(true);
                      }
                      break;
                  }
                }
              }
            }

            // Property 2.4: Empty selection should be handled gracefully
            const emptyValidation = await service.validateAmenitySelection([], propertyType);
            expect(emptyValidation.isValid).toBe(true);
            expect(emptyValidation.warnings).toContain('No amenities selected');

            // Property 2.5: Business rules should be retrievable and properly structured
            const businessRules = await service.getBusinessRules(propertyType);
            expect(businessRules).toHaveProperty('propertyType', propertyType);
            expect(businessRules).toHaveProperty('businessRules');
            expect(businessRules).toHaveProperty('maxAmenitiesPerCategory');
            expect(businessRules).toHaveProperty('requiredCategories');
            expect(Array.isArray(businessRules.businessRules)).toBe(true);
            expect(Array.isArray(businessRules.requiredCategories)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should properly handle amenity inheritance for room-level overrides', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            propertyAmenities: fc.record({
              propertyWide: fc.array(fc.uuid(), { maxLength: 5 }),
              roomSpecific: fc.array(fc.uuid(), { maxLength: 3 }),
              business: fc.array(fc.uuid(), { maxLength: 3 }),
              wellness: fc.array(fc.uuid(), { maxLength: 3 }),
              dining: fc.array(fc.uuid(), { maxLength: 3 }),
              sustainability: fc.array(fc.uuid(), { maxLength: 3 }),
              recreational: fc.array(fc.uuid(), { maxLength: 3 }),
              connectivity: fc.array(fc.uuid(), { maxLength: 3 }),
            }),
            roomSpecificAmenities: fc.array(fc.uuid(), { maxLength: 5 }),
            overrides: fc.array(
              fc.record({
                amenityId: fc.uuid(),
                action: fc.constantFrom('add', 'remove', 'modify'),
                value: fc.option(fc.anything()),
              }),
              { maxLength: 3 }
            ),
          }),
          async ({ propertyAmenities, roomSpecificAmenities, overrides }) => {
            // Test amenity inheritance
            const inheritanceResult = await service.applyAmenityInheritance(
              propertyAmenities,
              roomSpecificAmenities,
              overrides
            );

            // Property 2.6: Inheritance result should have proper structure
            expect(inheritanceResult).toHaveProperty('inherited');
            expect(inheritanceResult).toHaveProperty('specific');
            expect(inheritanceResult).toHaveProperty('final');
            expect(Array.isArray(inheritanceResult.inherited)).toBe(true);
            expect(Array.isArray(inheritanceResult.specific)).toBe(true);
            expect(Array.isArray(inheritanceResult.final)).toBe(true);

            // Property 2.7: Inherited amenities should come from inheritable categories
            const inheritableAmenities = [
              ...propertyAmenities.propertyWide,
              ...propertyAmenities.connectivity,
              ...propertyAmenities.sustainability,
            ];
            for (const inheritedId of inheritanceResult.inherited) {
              expect(inheritableAmenities).toContain(inheritedId);
            }

            // Property 2.8: Room-specific amenities should be preserved
            expect(inheritanceResult.specific).toEqual(roomSpecificAmenities);

            // Property 2.9: Overrides should be applied correctly
            for (const override of overrides) {
              switch (override.action) {
                case 'add':
                  expect(inheritanceResult.final).toContain(override.amenityId);
                  break;
                case 'remove':
                  expect(inheritanceResult.final).not.toContain(override.amenityId);
                  break;
                // 'modify' doesn't change the ID presence, just the properties
              }
            }

            // Property 2.10: Final amenities should include room-specific amenities
            for (const roomAmenityId of roomSpecificAmenities) {
              expect(inheritanceResult.final).toContain(roomAmenityId);
            }

            // Property 2.11: No duplicate amenities in final result
            const uniqueFinal = [...new Set(inheritanceResult.final)];
            expect(inheritanceResult.final.length).toBe(uniqueFinal.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit Tests for specific examples and edge cases

  describe('Unit Tests - Specific Examples', () => {
    it('should handle empty amenity list', async () => {
      mockRepository.find.mockResolvedValue([]);
      
      const categorized = await service.getAmenitiesByCategory();
      
      expect(categorized.propertyWide).toEqual([]);
      expect(categorized.roomSpecific).toEqual([]);
      expect(categorized.business).toEqual([]);
    });

    it('should validate invalid amenity IDs', async () => {
      const invalidIds = ['invalid-id-1', 'invalid-id-2'];
      mockRepository.findByIds.mockResolvedValue([]);
      
      const result = await service.validateAmenitySelection(invalidIds, PropertyType.HOTEL);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid amenity IDs: invalid-id-1, invalid-id-2');
    });

    it('should handle business rule conflicts correctly', async () => {
      const amenity1 = {
        id: 'amenity-1',
        name: 'Pool',
        businessRules: [{ type: 'excludes' as const, amenityId: 'amenity-2' }],
        applicablePropertyTypes: [PropertyType.HOTEL],
      };
      const amenity2 = {
        id: 'amenity-2',
        name: 'Spa',
        businessRules: [],
        applicablePropertyTypes: [PropertyType.HOTEL],
      };

      mockRepository.findByIds.mockResolvedValue([amenity1, amenity2]);
      mockRepository.findOne.mockImplementation(({ where }) => {
        if (where.id === 'amenity-2') return Promise.resolve(amenity2);
        return Promise.resolve(null);
      });

      const result = await service.validateAmenitySelection(
        ['amenity-1', 'amenity-2'],
        PropertyType.HOTEL
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('cannot be selected together'))).toBe(true);
    });
  });
});

// Helper function to map category enum to categorized amenities key
function getCategoryKey(category: AmenityCategory): string {
  const mapping: { [key in AmenityCategory]: string } = {
    [AmenityCategory.PROPERTY_WIDE]: 'propertyWide',
    [AmenityCategory.ROOM_SPECIFIC]: 'roomSpecific',
    [AmenityCategory.BUSINESS]: 'business',
    [AmenityCategory.WELLNESS]: 'wellness',
    [AmenityCategory.DINING]: 'dining',
    [AmenityCategory.SUSTAINABILITY]: 'sustainability',
    [AmenityCategory.RECREATIONAL]: 'recreational',
    [AmenityCategory.CONNECTIVITY]: 'connectivity',
  };
  return mapping[category];
}