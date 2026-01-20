import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmenityDefinition } from '../entities/amenity-definition.entity';
import { QualityReport } from '../entities/quality-report.entity';
import { InMemoryCacheService } from './in-memory-cache.service';
import { 
  CategorizedAmenities,
  AmenityCategory,
} from '../interfaces/enhanced-hotel.interface';

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}

export interface AmenityValidationRules {
  required: string[];
  optional: string[];
  conflicting: Array<{ amenity: string; conflicts: string[] }>;
  maxSelections: number;
  regionalRestrictions: string[];
}

export interface QualityScore {
  overall: number;
  imageQuality: number;
  contentCompleteness: number;
  policyClarity: number;
  breakdown: any;
}

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

@Injectable()
export class PerformanceCacheService {
  private stats = {
    hits: 0,
    misses: 0,
  };

  // Cache TTL configurations (in milliseconds)
  private readonly cacheTTL = {
    amenities: 3600000, // 1 hour - amenities don't change frequently
    amenityRules: 1800000, // 30 minutes - business rules may change
    qualityReports: 600000, // 10 minutes - quality reports can be regenerated
    qualityStandards: 7200000, // 2 hours - quality standards are relatively stable
    recommendations: 900000, // 15 minutes - recommendations can be updated
    mobileData: 300000, // 5 minutes - mobile data should be fresh
  };

  constructor(
    @InjectRepository(AmenityDefinition)
    private readonly amenityRepository: Repository<AmenityDefinition>,
    @InjectRepository(QualityReport)
    private readonly qualityReportRepository: Repository<QualityReport>,
    private readonly cacheService: InMemoryCacheService,
  ) {}

  /**
   * Get categorized amenities with caching
   */
  async getCategorizedAmenities(): Promise<CategorizedAmenities> {
    const cacheKey = 'categorized_amenities';
    
    // Try cache first
    const cached = await this.cacheService.get<CategorizedAmenities>(cacheKey);
    if (cached) {
      this.stats.hits++;
      return cached;
    }

    this.stats.misses++;

    // Fetch from database
    const amenities = await this.amenityRepository.find({
      order: { category: 'ASC', name: 'ASC' },
    });

    // Group by category
    const categorized: CategorizedAmenities = {
      propertyWide: amenities
        .filter(a => a.category === AmenityCategory.PROPERTY_WIDE)
        .map(a => a.id),
      roomSpecific: amenities
        .filter(a => a.category === AmenityCategory.ROOM_SPECIFIC)
        .map(a => a.id),
      business: amenities
        .filter(a => a.category === AmenityCategory.BUSINESS)
        .map(a => a.id),
      wellness: amenities
        .filter(a => a.category === AmenityCategory.WELLNESS)
        .map(a => a.id),
      dining: amenities
        .filter(a => a.category === AmenityCategory.DINING)
        .map(a => a.id),
      sustainability: amenities
        .filter(a => a.category === AmenityCategory.SUSTAINABILITY)
        .map(a => a.id),
      recreational: amenities
        .filter(a => a.category === AmenityCategory.RECREATIONAL)
        .map(a => a.id),
      connectivity: amenities
        .filter(a => a.category === AmenityCategory.CONNECTIVITY)
        .map(a => a.id),
    };

    // Cache the result
    await this.cacheService.set(cacheKey, categorized, this.cacheTTL.amenities);

    return categorized;
  }

  /**
   * Get amenity validation rules with caching
   */
  async getAmenityValidationRules(
    propertyType: string,
    region: string,
  ): Promise<AmenityValidationRules> {
    const cacheKey = `amenity_rules_${propertyType}_${region}`;
    
    // Try cache first
    const cached = await this.cacheService.get<AmenityValidationRules>(cacheKey);
    if (cached) {
      this.stats.hits++;
      return cached;
    }

    this.stats.misses++;

    // Generate validation rules based on property type and region
    const rules: AmenityValidationRules = {
      required: this.getRequiredAmenities(propertyType),
      optional: this.getOptionalAmenities(propertyType),
      conflicting: this.getConflictingAmenities(),
      maxSelections: this.getMaxSelections(propertyType),
      regionalRestrictions: this.getRegionalRestrictions(region),
    };

    // Cache the result
    await this.cacheService.set(cacheKey, rules, this.cacheTTL.amenityRules);

    return rules;
  }

  /**
   * Get quality report with caching
   */
  async getQualityReport(sessionId: string): Promise<QualityReport | null> {
    const cacheKey = `quality_report_${sessionId}`;
    
    // Try cache first
    const cached = await this.cacheService.get<QualityReport>(cacheKey);
    if (cached) {
      this.stats.hits++;
      return cached;
    }

    this.stats.misses++;

    // Fetch from database
    const report = await this.qualityReportRepository.findOne({
      where: { id: sessionId }, // Assuming sessionId maps to report id
      order: { createdAt: 'DESC' },
    });

    if (report) {
      // Cache the result
      await this.cacheService.set(cacheKey, report, this.cacheTTL.qualityReports);
    }

    return report;
  }

  /**
   * Cache quality score calculation
   */
  async cacheQualityScore(sessionId: string, qualityScore: QualityScore): Promise<void> {
    const cacheKey = `quality_score_${sessionId}`;
    await this.cacheService.set(cacheKey, qualityScore, this.cacheTTL.qualityReports);
  }

  /**
   * Get cached quality score
   */
  async getCachedQualityScore(sessionId: string): Promise<QualityScore | null> {
    const cacheKey = `quality_score_${sessionId}`;
    const cached = await this.cacheService.get<QualityScore>(cacheKey);
    
    if (cached) {
      this.stats.hits++;
      return cached;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Cache recommendations
   */
  async cacheRecommendations(sessionId: string, recommendations: Recommendation[]): Promise<void> {
    const cacheKey = `recommendations_${sessionId}`;
    await this.cacheService.set(cacheKey, recommendations, this.cacheTTL.recommendations);
  }

  /**
   * Get cached recommendations
   */
  async getCachedRecommendations(sessionId: string): Promise<Recommendation[] | null> {
    const cacheKey = `recommendations_${sessionId}`;
    const cached = await this.cacheService.get<Recommendation[]>(cacheKey);
    
    if (cached) {
      this.stats.hits++;
      return cached;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Cache mobile-optimized data
   */
  async cacheMobileData(key: string, data: any): Promise<void> {
    const cacheKey = `mobile_${key}`;
    await this.cacheService.set(cacheKey, data, this.cacheTTL.mobileData);
  }

  /**
   * Get cached mobile data
   */
  async getCachedMobileData<T>(key: string): Promise<T | null> {
    const cacheKey = `mobile_${key}`;
    const cached = await this.cacheService.get<T>(cacheKey);
    
    if (cached) {
      this.stats.hits++;
      return cached;
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Invalidate cache for specific patterns
   */
  async invalidateCache(pattern: string): Promise<void> {
    const keys = await this.cacheService.keys(`*${pattern}*`);
    for (const key of keys) {
      await this.cacheService.del(key);
    }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(): Promise<void> {
    // Pre-load categorized amenities
    await this.getCategorizedAmenities();

    // Pre-load common amenity rules
    const commonPropertyTypes = ['hotel', 'resort', 'boutique', 'business'];
    const commonRegions = ['north_america', 'europe', 'asia', 'global'];

    for (const propertyType of commonPropertyTypes) {
      for (const region of commonRegions) {
        await this.getAmenityValidationRules(propertyType, region);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    await this.cacheService.reset();
    this.resetStats();
  }

  // Private helper methods for amenity validation rules
  private getRequiredAmenities(propertyType: string): string[] {
    const baseRequired = ['wifi', 'parking'];
    
    switch (propertyType) {
      case 'business':
        return [...baseRequired, 'business_center', 'meeting_rooms'];
      case 'resort':
        return [...baseRequired, 'pool', 'restaurant'];
      case 'boutique':
        return [...baseRequired, 'concierge'];
      default:
        return baseRequired;
    }
  }

  private getOptionalAmenities(propertyType: string): string[] {
    const baseOptional = ['gym', 'spa', 'room_service', 'laundry'];
    
    switch (propertyType) {
      case 'business':
        return [...baseOptional, 'airport_shuttle', 'conference_facilities'];
      case 'resort':
        return [...baseOptional, 'beach_access', 'water_sports', 'kids_club'];
      case 'boutique':
        return [...baseOptional, 'art_gallery', 'wine_cellar', 'rooftop_bar'];
      default:
        return baseOptional;
    }
  }

  private getConflictingAmenities(): Array<{ amenity: string; conflicts: string[] }> {
    return [
      { amenity: 'smoking_rooms', conflicts: ['non_smoking_property'] },
      { amenity: 'pet_free', conflicts: ['pet_friendly'] },
      { amenity: 'adults_only', conflicts: ['kids_club', 'family_rooms'] },
    ];
  }

  private getMaxSelections(propertyType: string): number {
    switch (propertyType) {
      case 'resort':
        return 25; // Resorts typically have many amenities
      case 'business':
        return 20; // Business hotels have moderate amenities
      case 'boutique':
        return 15; // Boutique hotels are more selective
      default:
        return 18; // Standard hotels
    }
  }

  private getRegionalRestrictions(region: string): string[] {
    switch (region) {
      case 'middle_east':
        return ['alcohol_service']; // May be restricted in some areas
      case 'tropical':
        return ['heating']; // Not typically needed
      case 'cold_climate':
        return ['outdoor_pool']; // May be seasonal
      default:
        return [];
    }
  }
}

// Interface definitions for type safety
// Note: These would typically be in a separate interfaces file
// but are included here to avoid circular dependencies