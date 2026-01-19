import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmenityDefinition } from '../entities/amenity-definition.entity';
import {
  PropertyType,
  AmenityCategory,
  CategorizedAmenities,
  Amenity,
  AmenityRule,
} from '../interfaces/enhanced-hotel.interface';

export interface AmenityValidationRules {
  propertyType: PropertyType;
  region?: string;
  maxAmenitiesPerCategory?: { [key in AmenityCategory]?: number };
  requiredCategories?: AmenityCategory[];
  businessRules: AmenityRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class AmenityService {
  constructor(
    @InjectRepository(AmenityDefinition)
    private amenityDefinitionRepository: Repository<AmenityDefinition>,
  ) {}

  /**
   * Get all amenities organized by category
   * Requirements: 1.1 - Display amenities organized by categories
   */
  async getAmenitiesByCategory(): Promise<CategorizedAmenities> {
    const amenities = await this.amenityDefinitionRepository.find({
      order: { category: 'ASC', name: 'ASC' },
    });

    const categorized: CategorizedAmenities = {
      propertyWide: [],
      roomSpecific: [],
      business: [],
      wellness: [],
      dining: [],
      sustainability: [],
      recreational: [],
      connectivity: [],
    };

    amenities.forEach((amenity) => {
      switch (amenity.category) {
        case AmenityCategory.PROPERTY_WIDE:
          categorized.propertyWide.push(amenity.id);
          break;
        case AmenityCategory.ROOM_SPECIFIC:
          categorized.roomSpecific.push(amenity.id);
          break;
        case AmenityCategory.BUSINESS:
          categorized.business.push(amenity.id);
          break;
        case AmenityCategory.WELLNESS:
          categorized.wellness.push(amenity.id);
          break;
        case AmenityCategory.DINING:
          categorized.dining.push(amenity.id);
          break;
        case AmenityCategory.SUSTAINABILITY:
          categorized.sustainability.push(amenity.id);
          break;
        case AmenityCategory.RECREATIONAL:
          categorized.recreational.push(amenity.id);
          break;
        case AmenityCategory.CONNECTIVITY:
          categorized.connectivity.push(amenity.id);
          break;
      }
    });

    return categorized;
  }

  /**
   * Get amenities with full details for display
   * Requirements: 1.2, 1.3 - Show visual icons, descriptions, and eco-friendly indicators
   */
  async getAmenitiesWithDetails(): Promise<{ [category: string]: Amenity[] }> {
    const amenities = await this.amenityDefinitionRepository.find({
      order: { category: 'ASC', name: 'ASC' },
    });

    const categorizedWithDetails: { [category: string]: Amenity[] } = {};

    amenities.forEach((amenityDef) => {
      const category = amenityDef.category.toLowerCase();
      if (!categorizedWithDetails[category]) {
        categorizedWithDetails[category] = [];
      }

      categorizedWithDetails[category].push({
        id: amenityDef.id,
        name: amenityDef.name,
        description: amenityDef.description || '',
        icon: amenityDef.icon || '',
        isEcoFriendly: amenityDef.isEcoFriendly,
        category: amenityDef.category,
        applicablePropertyTypes: amenityDef.applicablePropertyTypes || [],
        businessRules: amenityDef.businessRules || [],
      });
    });

    return categorizedWithDetails;
  }

  /**
   * Validate amenity selection using business rules
   * Requirements: 1.4 - Validate selections using configurable business rules
   */
  async validateAmenitySelection(
    amenityIds: string[],
    propertyType: PropertyType,
    region?: string,
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!amenityIds || amenityIds.length === 0) {
      result.warnings.push('No amenities selected');
      return result;
    }

    // Get amenity definitions for validation
    const amenities = await this.amenityDefinitionRepository.findByIds(amenityIds);
    
    if (amenities.length !== amenityIds.length) {
      const foundIds = amenities.map(a => a.id);
      const missingIds = amenityIds.filter(id => !foundIds.includes(id));
      result.errors.push(`Invalid amenity IDs: ${missingIds.join(', ')}`);
      result.isValid = false;
    }

    // Validate property type compatibility
    for (const amenity of amenities) {
      if (amenity.applicablePropertyTypes && 
          amenity.applicablePropertyTypes.length > 0 && 
          !amenity.applicablePropertyTypes.includes(propertyType)) {
        result.errors.push(
          `Amenity "${amenity.name}" is not applicable to ${propertyType} properties`
        );
        result.isValid = false;
      }
    }

    // Apply business rules validation
    const businessRulesResult = await this.validateBusinessRules(amenities, amenityIds);
    result.errors.push(...businessRulesResult.errors);
    result.warnings.push(...businessRulesResult.warnings);
    
    if (businessRulesResult.errors.length > 0) {
      result.isValid = false;
    }

    return result;
  }

  /**
   * Get business rules for a specific property type and region
   * Requirements: 1.4 - Centrally managed, configurable business rules
   */
  async getBusinessRules(propertyType: PropertyType, region?: string): Promise<AmenityValidationRules> {
    // Get all amenities to extract business rules
    const amenities = await this.amenityDefinitionRepository.find();
    
    const allBusinessRules: AmenityRule[] = [];
    amenities.forEach(amenity => {
      if (amenity.businessRules) {
        allBusinessRules.push(...amenity.businessRules);
      }
    });

    // Define property-type specific rules
    const rules: AmenityValidationRules = {
      propertyType,
      region,
      maxAmenitiesPerCategory: this.getMaxAmenitiesPerCategory(propertyType),
      requiredCategories: this.getRequiredCategories(propertyType),
      businessRules: allBusinessRules,
    };

    return rules;
  }

  /**
   * Apply amenity inheritance logic for room-level overrides
   * Requirements: 4.2, 4.6 - Room-specific amenity management with inheritance
   */
  async applyAmenityInheritance(
    propertyAmenities: CategorizedAmenities,
    roomSpecificAmenities: string[],
    overrides: { amenityId: string; action: 'add' | 'remove' | 'modify'; value?: any }[],
  ): Promise<{ inherited: string[]; specific: string[]; final: string[] }> {
    // Start with property-wide amenities that can be inherited by rooms
    const inheritableCategories = [
      AmenityCategory.PROPERTY_WIDE,
      AmenityCategory.CONNECTIVITY,
      AmenityCategory.SUSTAINABILITY,
    ];

    let inherited: string[] = [];
    
    // Collect inheritable amenities
    for (const category of inheritableCategories) {
      const categoryKey = this.getCategoryKey(category);
      if (propertyAmenities[categoryKey]) {
        inherited.push(...propertyAmenities[categoryKey]);
      }
    }

    // Apply overrides
    let final = [...inherited];
    
    for (const override of overrides) {
      switch (override.action) {
        case 'add':
          if (!final.includes(override.amenityId)) {
            final.push(override.amenityId);
          }
          break;
        case 'remove':
          final = final.filter(id => id !== override.amenityId);
          break;
        case 'modify':
          // For modify, we keep the amenity but with modified properties
          // This would be handled at the presentation layer
          break;
      }
    }

    // Add room-specific amenities
    final.push(...roomSpecificAmenities.filter(id => !final.includes(id)));

    return {
      inherited,
      specific: roomSpecificAmenities,
      final,
    };
  }

  /**
   * Update amenity business rules (admin function)
   * Requirements: 1.4 - Configurable business rules
   */
  async updateAmenityRules(amenityId: string, rules: AmenityRule[]): Promise<void> {
    const amenity = await this.amenityDefinitionRepository.findOne({
      where: { id: amenityId },
    });

    if (!amenity) {
      throw new BadRequestException(`Amenity with ID ${amenityId} not found`);
    }

    amenity.businessRules = rules;
    await this.amenityDefinitionRepository.save(amenity);
  }

  /**
   * Seed initial amenity definitions
   */
  async seedAmenityDefinitions(): Promise<void> {
    const existingCount = await this.amenityDefinitionRepository.count();
    if (existingCount > 0) {
      return; // Already seeded
    }

    const amenityDefinitions = this.getDefaultAmenityDefinitions();
    await this.amenityDefinitionRepository.save(amenityDefinitions);
  }

  // Private helper methods

  private async validateBusinessRules(
    amenities: AmenityDefinition[],
    selectedIds: string[],
  ): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const amenity of amenities) {
      if (!amenity.businessRules) continue;

      for (const rule of amenity.businessRules) {
        switch (rule.type) {
          case 'requires':
            if (selectedIds.includes(amenity.id) && !selectedIds.includes(rule.amenityId)) {
              const requiredAmenity = await this.amenityDefinitionRepository.findOne({
                where: { id: rule.amenityId },
              });
              errors.push(
                `"${amenity.name}" requires "${requiredAmenity?.name || rule.amenityId}" to be selected`
              );
            }
            break;
          case 'excludes':
            if (selectedIds.includes(amenity.id) && selectedIds.includes(rule.amenityId)) {
              const excludedAmenity = await this.amenityDefinitionRepository.findOne({
                where: { id: rule.amenityId },
              });
              errors.push(
                `"${amenity.name}" cannot be selected together with "${excludedAmenity?.name || rule.amenityId}"`
              );
            }
            break;
          case 'implies':
            if (selectedIds.includes(amenity.id) && !selectedIds.includes(rule.amenityId)) {
              const impliedAmenity = await this.amenityDefinitionRepository.findOne({
                where: { id: rule.amenityId },
              });
              warnings.push(
                `"${amenity.name}" typically includes "${impliedAmenity?.name || rule.amenityId}". Consider adding it.`
              );
            }
            break;
        }
      }
    }

    return { errors, warnings };
  }

  private getMaxAmenitiesPerCategory(propertyType: PropertyType): { [key in AmenityCategory]?: number } {
    // Define limits based on property type
    const baseLimits = {
      [AmenityCategory.PROPERTY_WIDE]: 15,
      [AmenityCategory.ROOM_SPECIFIC]: 10,
      [AmenityCategory.BUSINESS]: 8,
      [AmenityCategory.WELLNESS]: 6,
      [AmenityCategory.DINING]: 5,
      [AmenityCategory.SUSTAINABILITY]: 8,
      [AmenityCategory.RECREATIONAL]: 10,
      [AmenityCategory.CONNECTIVITY]: 5,
    };

    // Adjust limits based on property type
    switch (propertyType) {
      case PropertyType.LUXURY_HOTEL:
      case PropertyType.RESORT:
        return Object.fromEntries(
          Object.entries(baseLimits).map(([key, value]) => [key, Math.floor(value * 1.5)])
        ) as { [key in AmenityCategory]?: number };
      case PropertyType.BUSINESS_HOTEL:
        return {
          ...baseLimits,
          [AmenityCategory.BUSINESS]: baseLimits[AmenityCategory.BUSINESS] * 2,
          [AmenityCategory.CONNECTIVITY]: baseLimits[AmenityCategory.CONNECTIVITY] * 2,
        };
      case PropertyType.GUEST_HOUSE:
      case PropertyType.HOMESTAY:
        return Object.fromEntries(
          Object.entries(baseLimits).map(([key, value]) => [key, Math.floor(value * 0.7)])
        ) as { [key in AmenityCategory]?: number };
      default:
        return baseLimits;
    }
  }

  private getRequiredCategories(propertyType: PropertyType): AmenityCategory[] {
    const baseRequired = [AmenityCategory.PROPERTY_WIDE];

    switch (propertyType) {
      case PropertyType.BUSINESS_HOTEL:
        return [...baseRequired, AmenityCategory.BUSINESS, AmenityCategory.CONNECTIVITY];
      case PropertyType.RESORT:
        return [...baseRequired, AmenityCategory.RECREATIONAL, AmenityCategory.WELLNESS];
      case PropertyType.LUXURY_HOTEL:
        return [...baseRequired, AmenityCategory.WELLNESS, AmenityCategory.DINING];
      default:
        return baseRequired;
    }
  }

  private getCategoryKey(category: AmenityCategory): keyof CategorizedAmenities {
    const mapping: { [key in AmenityCategory]: keyof CategorizedAmenities } = {
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

  private getDefaultAmenityDefinitions(): Partial<AmenityDefinition>[] {
    return [
      // Property-wide amenities
      {
        name: 'Free WiFi',
        description: 'Complimentary wireless internet access throughout the property',
        icon: 'wifi',
        category: AmenityCategory.PROPERTY_WIDE,
        isEcoFriendly: false,
        applicablePropertyTypes: Object.values(PropertyType),
        businessRules: [],
      },
      {
        name: '24/7 Front Desk',
        description: 'Round-the-clock reception and guest services',
        icon: 'reception',
        category: AmenityCategory.PROPERTY_WIDE,
        isEcoFriendly: false,
        applicablePropertyTypes: [PropertyType.HOTEL, PropertyType.BUSINESS_HOTEL, PropertyType.LUXURY_HOTEL],
        businessRules: [],
      },
      {
        name: 'Parking',
        description: 'On-site parking facilities for guests',
        icon: 'parking',
        category: AmenityCategory.PROPERTY_WIDE,
        isEcoFriendly: false,
        applicablePropertyTypes: Object.values(PropertyType),
        businessRules: [],
      },
      // Room-specific amenities
      {
        name: 'Air Conditioning',
        description: 'Climate control system in guest rooms',
        icon: 'ac',
        category: AmenityCategory.ROOM_SPECIFIC,
        isEcoFriendly: false,
        applicablePropertyTypes: Object.values(PropertyType),
        businessRules: [],
      },
      {
        name: 'Mini Bar',
        description: 'In-room refrigerated mini bar with beverages and snacks',
        icon: 'minibar',
        category: AmenityCategory.ROOM_SPECIFIC,
        isEcoFriendly: false,
        applicablePropertyTypes: [PropertyType.HOTEL, PropertyType.LUXURY_HOTEL, PropertyType.BUSINESS_HOTEL],
        businessRules: [],
      },
      // Business amenities
      {
        name: 'Business Center',
        description: 'Dedicated business facilities with computers and printing services',
        icon: 'business',
        category: AmenityCategory.BUSINESS,
        isEcoFriendly: false,
        applicablePropertyTypes: [PropertyType.BUSINESS_HOTEL, PropertyType.HOTEL, PropertyType.LUXURY_HOTEL],
        businessRules: [],
      },
      {
        name: 'Meeting Rooms',
        description: 'Professional meeting and conference facilities',
        icon: 'meeting',
        category: AmenityCategory.BUSINESS,
        isEcoFriendly: false,
        applicablePropertyTypes: [PropertyType.BUSINESS_HOTEL, PropertyType.HOTEL, PropertyType.LUXURY_HOTEL],
        businessRules: [
          { type: 'implies', amenityId: 'business-center-id', condition: 'Large properties typically have both' }
        ],
      },
      // Wellness amenities
      {
        name: 'Swimming Pool',
        description: 'Outdoor or indoor swimming pool facility',
        icon: 'pool',
        category: AmenityCategory.WELLNESS,
        isEcoFriendly: false,
        applicablePropertyTypes: [PropertyType.RESORT, PropertyType.LUXURY_HOTEL, PropertyType.HOTEL],
        businessRules: [],
      },
      {
        name: 'Spa Services',
        description: 'Professional spa and wellness treatments',
        icon: 'spa',
        category: AmenityCategory.WELLNESS,
        isEcoFriendly: false,
        applicablePropertyTypes: [PropertyType.RESORT, PropertyType.LUXURY_HOTEL],
        businessRules: [],
      },
      // Sustainability amenities
      {
        name: 'Solar Power',
        description: 'Renewable energy from solar panels',
        icon: 'solar',
        category: AmenityCategory.SUSTAINABILITY,
        isEcoFriendly: true,
        applicablePropertyTypes: Object.values(PropertyType),
        businessRules: [],
      },
      {
        name: 'Recycling Program',
        description: 'Comprehensive waste recycling and reduction program',
        icon: 'recycle',
        category: AmenityCategory.SUSTAINABILITY,
        isEcoFriendly: true,
        applicablePropertyTypes: Object.values(PropertyType),
        businessRules: [],
      },
    ];
  }
}