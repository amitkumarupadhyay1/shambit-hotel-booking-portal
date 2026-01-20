import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnhancedHotel } from '../entities/enhanced-hotel.entity';
import { EnhancedRoom } from '../../rooms/entities/enhanced-room.entity';
import { ImageMetadata, EntityType } from '../entities/image-metadata.entity';
import { ImageCategory } from '../interfaces/enhanced-hotel.interface';
import { PerformanceCacheService } from './performance-cache.service';

export interface MobileOptimizedHotel {
  id: string;
  name: string;
  description: string; // Truncated for mobile
  location: {
    city: string;
    country: string;
  };
  amenities: string[]; // Top 5 amenities only
  images: {
    thumbnail: string;
    compressed: string;
  };
  qualityScore: number;
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface MobileOptimizedRoom {
  id: string;
  name: string;
  description: string; // Truncated
  amenities: string[]; // Top 3 room amenities
  images: {
    thumbnail: string;
    compressed: string;
  };
  capacity: number;
  size?: number;
}

export interface MobileOnboardingStep {
  id: string;
  title: string;
  description: string; // Shortened for mobile
  isRequired: boolean;
  estimatedTime: number; // in minutes
  dataSize: number; // estimated data transfer in KB
}

export interface DataTransferOptimization {
  compressionRatio: number;
  originalSize: number;
  optimizedSize: number;
  bandwidthSaved: number;
}

@Injectable()
export class MobileOptimizationService {
  private readonly maxDescriptionLength = 150; // Characters for mobile descriptions
  private readonly maxAmenitiesCount = 5; // Maximum amenities to show on mobile
  private readonly maxRoomAmenitiesCount = 3; // Maximum room amenities for mobile

  constructor(
    @InjectRepository(EnhancedHotel)
    private readonly hotelRepository: Repository<EnhancedHotel>,
    @InjectRepository(EnhancedRoom)
    private readonly roomRepository: Repository<EnhancedRoom>,
    @InjectRepository(ImageMetadata)
    private readonly imageRepository: Repository<ImageMetadata>,
    private readonly cacheService: PerformanceCacheService,
  ) {}

  /**
   * Get mobile-optimized hotel data with minimal bandwidth usage
   */
  async getMobileOptimizedHotel(hotelId: string): Promise<MobileOptimizedHotel | null> {
    const cacheKey = `mobile_hotel_${hotelId}`;
    
    // Check cache first
    const cached = await this.cacheService.getCachedMobileData<MobileOptimizedHotel>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch hotel data
    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      relations: ['qualityMetrics'],
    });

    if (!hotel) {
      return null;
    }

    // Get primary image (thumbnail)
    const primaryImage = await this.imageRepository.findOne({
      where: { 
        entityType: EntityType.HOTEL, 
        entityId: hotelId,
        category: ImageCategory.EXTERIOR 
      },
      order: { qualityScore: 'DESC' },
    });

    // Create mobile-optimized version
    const mobileHotel: MobileOptimizedHotel = {
      id: hotel.id,
      name: hotel.basicInfo?.name || 'Unknown Hotel',
      description: this.truncateDescription(
        typeof hotel.propertyDescription === 'string' 
          ? hotel.propertyDescription 
          : hotel.propertyDescription?.content || ''
      ),
      location: {
        city: hotel.basicInfo?.address?.city || 'Unknown',
        country: hotel.basicInfo?.address?.country || 'Unknown',
      },
      amenities: this.selectTopAmenities(
        Object.values(hotel.amenities || {}).flat() || [], 
        this.maxAmenitiesCount
      ),
      images: {
        thumbnail: primaryImage?.thumbnails?.small || '',
        compressed: primaryImage?.optimizedUrls?.mobile || primaryImage?.optimizedUrls?.small || '',
      },
      qualityScore: hotel.qualityMetrics?.overallScore || 0,
    };

    // Cache the optimized data
    await this.cacheService.cacheMobileData(cacheKey, mobileHotel);

    return mobileHotel;
  }

  /**
   * Get mobile-optimized room data
   */
  async getMobileOptimizedRooms(hotelId: string): Promise<MobileOptimizedRoom[]> {
    const cacheKey = `mobile_rooms_${hotelId}`;
    
    // Check cache first
    const cached = await this.cacheService.getCachedMobileData<MobileOptimizedRoom[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch room data
    const rooms = await this.roomRepository.find({
      where: { enhancedHotelId: hotelId },
      order: { createdAt: 'ASC' },
    });

    const mobileRooms: MobileOptimizedRoom[] = [];

    for (const room of rooms) {
      // Get primary room image
      const primaryImage = await this.imageRepository.findOne({
        where: { 
          entityType: EntityType.ROOM, 
          entityId: room.id,
        },
        order: { qualityScore: 'DESC' },
      });

      mobileRooms.push({
        id: room.id,
        name: room.basicInfo?.name || 'Unknown Room',
        description: this.truncateDescription(
          typeof room.description === 'string' 
            ? room.description 
            : room.description?.content || ''
        ),
        amenities: this.selectTopAmenities(
          room.amenities?.specific || [], 
          this.maxRoomAmenitiesCount
        ),
        images: {
          thumbnail: primaryImage?.thumbnails?.small || '',
          compressed: primaryImage?.optimizedUrls?.mobile || primaryImage?.optimizedUrls?.small || '',
        },
        capacity: room.basicInfo?.capacity?.maxOccupancy || 2,
        size: room.basicInfo?.size?.area,
      });
    }

    // Cache the optimized data
    await this.cacheService.cacheMobileData(cacheKey, mobileRooms);

    return mobileRooms;
  }

  /**
   * Get mobile-optimized onboarding steps with data size estimates
   */
  async getMobileOnboardingSteps(): Promise<MobileOnboardingStep[]> {
    const cacheKey = 'mobile_onboarding_steps';
    
    // Check cache first
    const cached = await this.cacheService.getCachedMobileData<MobileOnboardingStep[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const steps: MobileOnboardingStep[] = [
      {
        id: 'basic_info',
        title: 'Basic Information',
        description: 'Hotel name, type, and contact details',
        isRequired: true,
        estimatedTime: 3,
        dataSize: 2, // KB
      },
      {
        id: 'amenities',
        title: 'Amenities',
        description: 'Select your hotel amenities',
        isRequired: true,
        estimatedTime: 5,
        dataSize: 15, // KB (includes amenity icons)
      },
      {
        id: 'images',
        title: 'Photos',
        description: 'Upload hotel and room photos',
        isRequired: true,
        estimatedTime: 10,
        dataSize: 50, // KB (thumbnails and upload interface)
      },
      {
        id: 'rooms',
        title: 'Room Setup',
        description: 'Configure your rooms',
        isRequired: true,
        estimatedTime: 8,
        dataSize: 25, // KB
      },
      {
        id: 'policies',
        title: 'Policies',
        description: 'Check-in, cancellation, and booking policies',
        isRequired: true,
        estimatedTime: 4,
        dataSize: 5, // KB
      },
      {
        id: 'business_features',
        title: 'Business Features',
        description: 'Meeting rooms and business amenities',
        isRequired: false,
        estimatedTime: 6,
        dataSize: 20, // KB
      },
      {
        id: 'review',
        title: 'Review & Submit',
        description: 'Review your information',
        isRequired: true,
        estimatedTime: 3,
        dataSize: 10, // KB
      },
    ];

    // Cache the steps
    await this.cacheService.cacheMobileData(cacheKey, steps);

    return steps;
  }

  /**
   * Optimize data transfer by compressing and selecting essential data
   */
  async optimizeDataTransfer<T>(
    data: T,
    optimizationLevel: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<{ data: T; optimization: DataTransferOptimization }> {
    const originalSize = this.calculateDataSize(data);
    let optimizedData = data;
    let compressionRatio = 1;

    switch (optimizationLevel) {
      case 'high':
        // Aggressive optimization for slow connections
        optimizedData = this.applyHighOptimization(data);
        compressionRatio = 0.3; // 70% reduction
        break;
      case 'medium':
        // Balanced optimization
        optimizedData = this.applyMediumOptimization(data);
        compressionRatio = 0.5; // 50% reduction
        break;
      case 'low':
        // Light optimization
        optimizedData = this.applyLightOptimization(data);
        compressionRatio = 0.8; // 20% reduction
        break;
    }

    const optimizedSize = originalSize * compressionRatio;
    const bandwidthSaved = originalSize - optimizedSize;

    return {
      data: optimizedData,
      optimization: {
        compressionRatio,
        originalSize,
        optimizedSize,
        bandwidthSaved,
      },
    };
  }

  /**
   * Get progressive loading strategy for mobile
   */
  async getProgressiveLoadingStrategy(
    contentType: 'hotel' | 'rooms' | 'amenities' | 'images',
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<{
    immediate: any[];
    deferred: any[];
    lazy: any[];
  }> {
    const cacheKey = `progressive_loading_${contentType}_${priority}`;
    
    const cached = await this.cacheService.getCachedMobileData<{
      immediate: any[];
      deferred: any[];
      lazy: any[];
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    let strategy: {
      immediate: any[];
      deferred: any[];
      lazy: any[];
    };

    switch (contentType) {
      case 'hotel':
        strategy = {
          immediate: ['name', 'location', 'primaryImage', 'qualityScore'],
          deferred: ['description', 'topAmenities', 'priceRange'],
          lazy: ['fullAmenities', 'policies', 'detailedImages'],
        };
        break;
      case 'rooms':
        strategy = {
          immediate: ['name', 'capacity', 'primaryImage'],
          deferred: ['description', 'topAmenities', 'size'],
          lazy: ['fullAmenities', 'allImages', 'layout'],
        };
        break;
      case 'amenities':
        strategy = {
          immediate: ['categories', 'topAmenities'],
          deferred: ['amenityDetails', 'icons'],
          lazy: ['descriptions', 'businessRules'],
        };
        break;
      case 'images':
        strategy = {
          immediate: ['thumbnails'],
          deferred: ['compressedImages'],
          lazy: ['fullResolutionImages'],
        };
        break;
      default:
        strategy = {
          immediate: [],
          deferred: [],
          lazy: [],
        };
    }

    // Cache the strategy
    await this.cacheService.cacheMobileData(cacheKey, strategy);

    return strategy;
  }

  /**
   * Get optimized configuration for mobile devices
   */
  async getOptimizedConfig(deviceType?: string): Promise<{
    maxImageSize: number;
    compressionLevel: number;
    batchSize: number;
    cacheStrategy: string;
    loadingStrategy: string;
  }> {
    const baseConfig = {
      maxImageSize: 1024 * 1024, // 1MB
      compressionLevel: 0.8,
      batchSize: 5,
      cacheStrategy: 'aggressive',
      loadingStrategy: 'progressive',
    };

    // Adjust based on device type
    if (deviceType === 'mobile') {
      return {
        ...baseConfig,
        maxImageSize: 512 * 1024, // 512KB for mobile
        compressionLevel: 0.6,
        batchSize: 3,
      };
    }

    return baseConfig;
  }

  /**
   * Estimate bandwidth usage for mobile operations
   */
  estimateBandwidthUsage(operation: string, dataSize: number): {
    estimatedTime: number; // seconds
    dataUsage: number; // MB
    recommendation: string;
  } {
    // Assume average mobile connection speed of 5 Mbps
    const avgMobileSpeed = 5 * 1024 * 1024 / 8; // 5 Mbps in bytes per second
    const estimatedTime = dataSize / avgMobileSpeed;
    const dataUsage = dataSize / (1024 * 1024); // Convert to MB

    let recommendation = '';
    if (dataUsage > 10) {
      recommendation = 'Consider using WiFi for this operation';
    } else if (dataUsage > 5) {
      recommendation = 'This operation may use significant mobile data';
    } else {
      recommendation = 'Safe for mobile data usage';
    }

    return {
      estimatedTime,
      dataUsage,
      recommendation,
    };
  }

  // Private helper methods
  private truncateDescription(description: string): string {
    if (description.length <= this.maxDescriptionLength) {
      return description;
    }
    return description.substring(0, this.maxDescriptionLength - 3) + '...';
  }

  private selectTopAmenities(amenities: any[], maxCount: number): string[] {
    // Sort by importance/popularity and take top N
    const priorityAmenities = ['wifi', 'parking', 'pool', 'gym', 'restaurant', 'spa', 'business_center'];
    
    const sorted = amenities.sort((a, b) => {
      const aIndex = priorityAmenities.indexOf(a.id || a);
      const bIndex = priorityAmenities.indexOf(b.id || b);
      
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return sorted.slice(0, maxCount).map(a => a.id || a);
  }

  private calculateDataSize(data: any): number {
    // Rough estimation of JSON data size in bytes
    return JSON.stringify(data).length;
  }

  private applyHighOptimization<T>(data: T): T {
    // Remove non-essential fields, compress strings, etc.
    // This is a simplified implementation
    return JSON.parse(JSON.stringify(data, (_, value) => {
      if (typeof value === 'string' && value.length > 100) {
        return value.substring(0, 100) + '...';
      }
      return value;
    }));
  }

  private applyMediumOptimization<T>(data: T): T {
    // Moderate optimization
    return JSON.parse(JSON.stringify(data, (_, value) => {
      if (typeof value === 'string' && value.length > 200) {
        return value.substring(0, 200) + '...';
      }
      return value;
    }));
  }

  private applyLightOptimization<T>(data: T): T {
    // Light optimization - mainly remove null/undefined values
    return JSON.parse(JSON.stringify(data, (_, value) => {
      if (value === null || value === undefined) {
        return undefined;
      }
      return value;
    }));
  }
}