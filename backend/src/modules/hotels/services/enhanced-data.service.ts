import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { EnhancedHotel } from '../entities/enhanced-hotel.entity';
import { EnhancedRoom } from '../../rooms/entities/enhanced-room.entity';
import { OnboardingSession } from '../entities/onboarding-session.entity';
import { OnboardingStatus } from '../interfaces/enhanced-hotel.interface';

export interface EnhancedHotelQuery {
  ownerId?: string;
  onboardingStatus?: string;
  propertyType?: string;
  qualityScoreMin?: number;
  hasBusinessFeatures?: boolean;
  limit?: number;
  offset?: number;
}

export interface EnhancedRoomQuery {
  enhancedHotelId?: string;
  roomType?: string;
  minCapacity?: number;
  maxPrice?: number;
  hasVirtualTour?: boolean;
  limit?: number;
  offset?: number;
}

export interface DataConsistencyReport {
  hotelId: string;
  issues: DataConsistencyIssue[];
  warnings: DataConsistencyWarning[];
  recommendations: string[];
}

export interface DataConsistencyIssue {
  type: 'missing_data' | 'invalid_reference' | 'data_mismatch';
  field: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DataConsistencyWarning {
  type: 'incomplete_data' | 'outdated_data' | 'performance_concern';
  field: string;
  description: string;
}

@Injectable()
export class EnhancedDataService {
  private readonly logger = new Logger(EnhancedDataService.name);

  constructor(
    @InjectRepository(EnhancedHotel)
    private enhancedHotelRepository: Repository<EnhancedHotel>,
    @InjectRepository(EnhancedRoom)
    private enhancedRoomRepository: Repository<EnhancedRoom>,
    @InjectRepository(OnboardingSession)
    private onboardingSessionRepository: Repository<OnboardingSession>,
  ) {}

  /**
   * Find enhanced hotels with advanced filtering
   */
  async findEnhancedHotels(query: EnhancedHotelQuery): Promise<{
    hotels: EnhancedHotel[];
    total: number;
  }> {
    try {
      const whereConditions: FindOptionsWhere<EnhancedHotel> = {};
      
      if (query.ownerId) {
        whereConditions.ownerId = query.ownerId;
      }
      
      if (query.onboardingStatus) {
        whereConditions.onboardingStatus = query.onboardingStatus as any;
      }

      const findOptions: FindManyOptions<EnhancedHotel> = {
        where: whereConditions,
        relations: ['enhancedRooms', 'owner'],
        take: query.limit || 50,
        skip: query.offset || 0,
        order: { updatedAt: 'DESC' },
      };

      const [hotels, total] = await this.enhancedHotelRepository.findAndCount(findOptions);

      // Apply additional filters that can't be done at DB level
      let filteredHotels = hotels;

      if (query.propertyType) {
        filteredHotels = filteredHotels.filter(hotel => 
          hotel.getPropertyType() === query.propertyType
        );
      }

      if (query.qualityScoreMin !== undefined) {
        filteredHotels = filteredHotels.filter(hotel => 
          hotel.getOverallQualityScore() >= query.qualityScoreMin!
        );
      }

      if (query.hasBusinessFeatures !== undefined) {
        filteredHotels = filteredHotels.filter(hotel => 
          !!hotel.businessFeatures === query.hasBusinessFeatures
        );
      }

      return {
        hotels: filteredHotels,
        total: filteredHotels.length,
      };
    } catch (error) {
      this.logger.error(`Failed to find enhanced hotels: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find enhanced rooms with advanced filtering
   */
  async findEnhancedRooms(query: EnhancedRoomQuery): Promise<{
    rooms: EnhancedRoom[];
    total: number;
  }> {
    try {
      const whereConditions: FindOptionsWhere<EnhancedRoom> = {};
      
      if (query.enhancedHotelId) {
        whereConditions.enhancedHotelId = query.enhancedHotelId;
      }

      const findOptions: FindManyOptions<EnhancedRoom> = {
        where: whereConditions,
        relations: ['enhancedHotel'],
        take: query.limit || 50,
        skip: query.offset || 0,
        order: { updatedAt: 'DESC' },
      };

      const [rooms, total] = await this.enhancedRoomRepository.findAndCount(findOptions);

      // Apply additional filters
      let filteredRooms = rooms;

      if (query.roomType) {
        filteredRooms = filteredRooms.filter(room => 
          room.getRoomType() === query.roomType
        );
      }

      if (query.minCapacity !== undefined) {
        filteredRooms = filteredRooms.filter(room => 
          room.getMaxOccupancy() >= query.minCapacity!
        );
      }

      if (query.maxPrice !== undefined) {
        filteredRooms = filteredRooms.filter(room => 
          room.getBasePrice() <= query.maxPrice!
        );
      }

      if (query.hasVirtualTour !== undefined) {
        filteredRooms = filteredRooms.filter(room => 
          room.hasVirtualTour() === query.hasVirtualTour
        );
      }

      return {
        rooms: filteredRooms,
        total: filteredRooms.length,
      };
    } catch (error) {
      this.logger.error(`Failed to find enhanced rooms: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get comprehensive hotel data with all relations
   */
  async getComprehensiveHotelData(enhancedHotelId: string): Promise<EnhancedHotel | null> {
    try {
      return await this.enhancedHotelRepository.findOne({
        where: { id: enhancedHotelId },
        relations: [
          'enhancedRooms',
          'owner',
        ],
      });
    } catch (error) {
      this.logger.error(`Failed to get comprehensive hotel data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check data consistency across related entities
   */
  async checkDataConsistency(enhancedHotelId: string): Promise<DataConsistencyReport> {
    try {
      const hotel = await this.getComprehensiveHotelData(enhancedHotelId);
      
      if (!hotel) {
        throw new Error(`Enhanced hotel with ID ${enhancedHotelId} not found`);
      }

      const issues: DataConsistencyIssue[] = [];
      const warnings: DataConsistencyWarning[] = [];
      const recommendations: string[] = [];

      // Check basic information completeness
      if (!hotel.basicInfo?.name) {
        issues.push({
          type: 'missing_data',
          field: 'basicInfo.name',
          description: 'Hotel name is missing',
          severity: 'high',
        });
      }

      if (!hotel.basicInfo?.address) {
        issues.push({
          type: 'missing_data',
          field: 'basicInfo.address',
          description: 'Hotel address is missing',
          severity: 'high',
        });
      }

      // Check amenities consistency
      if (hotel.amenities) {
        const totalAmenities = hotel.getTotalAmenities();
        if (totalAmenities === 0) {
          warnings.push({
            type: 'incomplete_data',
            field: 'amenities',
            description: 'No amenities defined for the hotel',
          });
          recommendations.push('Add amenities to improve property appeal');
        }
      }

      // Check image consistency
      if (hotel.images) {
        const totalImages = hotel.getTotalImages();
        if (totalImages === 0) {
          warnings.push({
            type: 'incomplete_data',
            field: 'images',
            description: 'No images uploaded for the hotel',
          });
          recommendations.push('Upload high-quality images to showcase the property');
        } else if (totalImages < 5) {
          warnings.push({
            type: 'incomplete_data',
            field: 'images',
            description: 'Limited number of images uploaded',
          });
          recommendations.push('Upload more images for better visual representation');
        }
      }

      // Check room consistency
      if (hotel.enhancedRooms) {
        for (const room of hotel.enhancedRooms) {
          // Check room amenity inheritance
          if (room.amenities?.inherited && hotel.amenities) {
            const hotelAmenities = this.getInheritableAmenities(hotel.amenities);
            const inheritedAmenities = room.amenities.inherited;
            
            const missingInheritance = hotelAmenities.filter(
              amenity => !inheritedAmenities.includes(amenity)
            );
            
            if (missingInheritance.length > 0) {
              issues.push({
                type: 'data_mismatch',
                field: `room.${room.id}.amenities.inherited`,
                description: `Room missing inherited amenities: ${missingInheritance.join(', ')}`,
                severity: 'medium',
              });
            }
          }

          // Check room pricing
          if (!room.pricing?.basePrice || room.pricing.basePrice <= 0) {
            issues.push({
              type: 'missing_data',
              field: `room.${room.id}.pricing.basePrice`,
              description: 'Room base price is missing or invalid',
              severity: 'high',
            });
          }

          // Check room images
          if (!room.images || room.images.length === 0) {
            warnings.push({
              type: 'incomplete_data',
              field: `room.${room.id}.images`,
              description: `Room ${room.basicInfo?.name || room.id} has no images`,
            });
          }
        }
      } else {
        warnings.push({
          type: 'incomplete_data',
          field: 'enhancedRooms',
          description: 'No rooms defined for the hotel',
        });
        recommendations.push('Add room configurations to enable bookings');
      }

      // Check quality metrics
      const qualityScore = hotel.getOverallQualityScore();
      if (qualityScore < 50) {
        warnings.push({
          type: 'performance_concern',
          field: 'qualityMetrics.overallScore',
          description: 'Low quality score may affect search ranking',
        });
        recommendations.push('Improve content completeness and image quality to boost ranking');
      }

      // Check onboarding status consistency
      if (hotel.onboardingStatus === 'COMPLETED' && issues.length > 0) {
        issues.push({
          type: 'data_mismatch',
          field: 'onboardingStatus',
          description: 'Hotel marked as completed but has data issues',
          severity: 'medium',
        });
      }

      return {
        hotelId: enhancedHotelId,
        issues,
        warnings,
        recommendations,
      };
    } catch (error) {
      this.logger.error(`Failed to check data consistency: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get onboarding statistics
   */
  async getOnboardingStatistics(): Promise<{
    totalHotels: number;
    completedOnboarding: number;
    inProgress: number;
    notStarted: number;
    averageQualityScore: number;
    averageCompletionTime: number;
  }> {
    try {
      const totalHotels = await this.enhancedHotelRepository.count();
      
      const completedOnboarding = await this.enhancedHotelRepository.count({
        where: { onboardingStatus: OnboardingStatus.COMPLETED },
      });
      
      const inProgress = await this.enhancedHotelRepository.count({
        where: { onboardingStatus: OnboardingStatus.IN_PROGRESS },
      });
      
      const notStarted = await this.enhancedHotelRepository.count({
        where: { onboardingStatus: OnboardingStatus.NOT_STARTED },
      });

      // Calculate average quality score
      const qualityScoreResult = await this.enhancedHotelRepository
        .createQueryBuilder('hotel')
        .select('AVG(CAST(hotel.qualityMetrics->>\'overallScore\' AS DECIMAL))', 'avgScore')
        .where('hotel.qualityMetrics IS NOT NULL')
        .getRawOne();

      const averageQualityScore = parseFloat(qualityScoreResult?.avgScore || '0');

      // Calculate average completion time (simplified)
      const completionTimeResult = await this.enhancedHotelRepository
        .createQueryBuilder('hotel')
        .select('AVG(EXTRACT(EPOCH FROM (hotel.updatedAt - hotel.createdAt)) / 86400)', 'avgDays')
        .where('hotel.onboardingStatus = :status', { status: 'COMPLETED' })
        .getRawOne();

      const averageCompletionTime = parseFloat(completionTimeResult?.avgDays || '0');

      return {
        totalHotels,
        completedOnboarding,
        inProgress,
        notStarted,
        averageQualityScore,
        averageCompletionTime,
      };
    } catch (error) {
      this.logger.error(`Failed to get onboarding statistics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Bulk update hotel data
   */
  async bulkUpdateHotels(
    hotelIds: string[],
    updateData: Partial<EnhancedHotel>,
  ): Promise<{ updated: number; failed: string[] }> {
    try {
      const failed: string[] = [];
      let updated = 0;

      for (const hotelId of hotelIds) {
        try {
          await this.enhancedHotelRepository.update(hotelId, {
            ...updateData,
            updatedAt: new Date(),
          });
          updated++;
        } catch (error) {
          this.logger.warn(`Failed to update hotel ${hotelId}: ${error.message}`);
          failed.push(hotelId);
        }
      }

      this.logger.log(`Bulk update completed: ${updated} updated, ${failed.length} failed`);

      return { updated, failed };
    } catch (error) {
      this.logger.error(`Failed to perform bulk update: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get hotels requiring attention
   */
  async getHotelsRequiringAttention(): Promise<{
    lowQualityScore: EnhancedHotel[];
    incompleteOnboarding: EnhancedHotel[];
    missingImages: EnhancedHotel[];
    dataInconsistencies: EnhancedHotel[];
  }> {
    try {
      // Hotels with low quality scores
      const lowQualityScore = await this.enhancedHotelRepository
        .createQueryBuilder('hotel')
        .where('CAST(hotel.qualityMetrics->>\'overallScore\' AS DECIMAL) < :minScore', { minScore: 50 })
        .getMany();

      // Hotels with incomplete onboarding
      const incompleteOnboarding = await this.enhancedHotelRepository.find({
        where: { onboardingStatus: OnboardingStatus.IN_PROGRESS },
        relations: ['enhancedRooms'],
      });

      // Hotels with missing images
      const missingImages = await this.enhancedHotelRepository
        .createQueryBuilder('hotel')
        .where('hotel.images IS NULL OR hotel.images = \'{}\'')
        .getMany();

      // Hotels with potential data inconsistencies (simplified check)
      const dataInconsistencies = await this.enhancedHotelRepository
        .createQueryBuilder('hotel')
        .leftJoin('hotel.enhancedRooms', 'room')
        .where('hotel.onboardingStatus = :status', { status: 'COMPLETED' })
        .andWhere('room.id IS NULL')
        .getMany();

      return {
        lowQualityScore,
        incompleteOnboarding,
        missingImages,
        dataInconsistencies,
      };
    } catch (error) {
      this.logger.error(`Failed to get hotels requiring attention: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Extract inheritable amenities from hotel amenities
   */
  private getInheritableAmenities(hotelAmenities: any): string[] {
    if (!hotelAmenities) return [];

    const inheritableCategories = ['propertyWide', 'wellness', 'dining', 'business'];
    const inherited: string[] = [];

    for (const category of inheritableCategories) {
      if (hotelAmenities[category] && Array.isArray(hotelAmenities[category])) {
        inherited.push(...hotelAmenities[category]);
      }
    }

    return inherited;
  }
}