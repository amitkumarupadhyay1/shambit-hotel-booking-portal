import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnhancedHotel } from '../entities/enhanced-hotel.entity';
import { EnhancedRoom } from '../../rooms/entities/enhanced-room.entity';

export interface HotelDataUpdateEvent {
  type: 'hotel_created' | 'hotel_updated' | 'room_created' | 'room_updated' | 'onboarding_completed';
  entityId: string;
  data: any;
  timestamp: Date;
}

export interface SearchIndexUpdateEvent {
  hotelId: string;
  data?: any;
}

export interface BookingAvailabilityUpdateEvent {
  roomId: string;
  data: any;
}

export interface AnalyticsUpdateEvent {
  hotelId: string;
  timestamp: Date;
}

@Injectable()
export class SystemIntegrationListener {
  private readonly logger = new Logger(SystemIntegrationListener.name);

  constructor(
    @InjectRepository(EnhancedHotel)
    private enhancedHotelRepository: Repository<EnhancedHotel>,
    @InjectRepository(EnhancedRoom)
    private enhancedRoomRepository: Repository<EnhancedRoom>,
  ) {}

  /**
   * Handle search index updates
   */
  @OnEvent('search.index.update')
  async handleSearchIndexUpdate(event: SearchIndexUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Updating search index for hotel: ${event.hotelId}`);

      const enhancedHotel = await this.enhancedHotelRepository.findOne({
        where: { id: event.hotelId },
        relations: ['enhancedRooms'],
      });

      if (!enhancedHotel) {
        this.logger.warn(`Enhanced hotel not found for search update: ${event.hotelId}`);
        return;
      }

      // Prepare search document
      const searchDocument = {
        id: enhancedHotel.id,
        name: enhancedHotel.basicInfo?.name,
        propertyType: enhancedHotel.getPropertyType(),
        location: enhancedHotel.locationDetails,
        amenities: this.flattenAmenities(enhancedHotel.amenities),
        businessFeatures: enhancedHotel.businessFeatures,
        qualityScore: enhancedHotel.getOverallQualityScore(),
        totalRooms: enhancedHotel.enhancedRooms?.length || 0,
        images: this.extractSearchableImages(enhancedHotel.images),
        policies: enhancedHotel.policies,
        isActive: enhancedHotel.isOnboardingComplete(),
        lastUpdated: enhancedHotel.updatedAt,
      };

      // In a real implementation, this would call the search service
      // For now, we'll log the update
      this.logger.log(`Search document prepared for hotel ${event.hotelId}:`, {
        name: searchDocument.name,
        amenityCount: searchDocument.amenities.length,
        qualityScore: searchDocument.qualityScore,
      });

      // TODO: Integrate with actual search service (Elasticsearch, Algolia, etc.)
      // await this.searchService.updateHotelDocument(searchDocument);

    } catch (error) {
      this.logger.error(`Failed to update search index: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle full search index updates (for completed onboarding)
   */
  @OnEvent('search.index.full_update')
  async handleFullSearchIndexUpdate(event: SearchIndexUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Performing full search index update for hotel: ${event.hotelId}`);

      const enhancedHotel = await this.enhancedHotelRepository.findOne({
        where: { id: event.hotelId },
        relations: ['enhancedRooms'],
      });

      if (!enhancedHotel) {
        this.logger.warn(`Enhanced hotel not found for full search update: ${event.hotelId}`);
        return;
      }

      // Prepare comprehensive search document
      const fullSearchDocument = {
        id: enhancedHotel.id,
        name: enhancedHotel.basicInfo?.name,
        description: enhancedHotel.propertyDescription?.content,
        propertyType: enhancedHotel.getPropertyType(),
        location: enhancedHotel.locationDetails,
        amenities: this.flattenAmenities(enhancedHotel.amenities),
        businessFeatures: enhancedHotel.businessFeatures,
        policies: enhancedHotel.policies,
        qualityScore: enhancedHotel.getOverallQualityScore(),
        images: this.extractSearchableImages(enhancedHotel.images),
        rooms: enhancedHotel.enhancedRooms?.map(room => ({
          id: room.id,
          name: room.basicInfo?.name,
          type: room.getRoomType(),
          capacity: room.getMaxOccupancy(),
          basePrice: room.getBasePrice(),
          amenities: this.flattenRoomAmenities(room.amenities),
          size: room.getRoomSize(),
          hasVirtualTour: room.hasVirtualTour(),
        })) || [],
        isActive: true,
        lastUpdated: enhancedHotel.updatedAt,
      };

      this.logger.log(`Full search document prepared for hotel ${event.hotelId}:`, {
        name: fullSearchDocument.name,
        roomCount: fullSearchDocument.rooms.length,
        totalAmenities: fullSearchDocument.amenities.length,
      });

      // TODO: Integrate with actual search service
      // await this.searchService.updateFullHotelDocument(fullSearchDocument);

    } catch (error) {
      this.logger.error(`Failed to perform full search index update: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle booking availability updates
   */
  @OnEvent('booking.availability.update')
  async handleBookingAvailabilityUpdate(event: BookingAvailabilityUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Updating booking availability for room: ${event.roomId}`);

      const enhancedRoom = await this.enhancedRoomRepository.findOne({
        where: { id: event.roomId },
        relations: ['enhancedHotel'],
      });

      if (!enhancedRoom) {
        this.logger.warn(`Enhanced room not found for availability update: ${event.roomId}`);
        return;
      }

      // Prepare availability update
      const availabilityUpdate = {
        roomId: enhancedRoom.id,
        hotelId: enhancedRoom.enhancedHotelId,
        isActive: enhancedRoom.isAvailable(),
        basePrice: enhancedRoom.getBasePrice(),
        capacity: enhancedRoom.getMaxOccupancy(),
        amenities: this.flattenRoomAmenities(enhancedRoom.amenities),
        policies: enhancedRoom.availability,
        lastUpdated: enhancedRoom.updatedAt,
      };

      this.logger.log(`Availability update prepared for room ${event.roomId}:`, {
        isActive: availabilityUpdate.isActive,
        basePrice: availabilityUpdate.basePrice,
      });

      // TODO: Integrate with actual booking service
      // await this.bookingService.updateRoomAvailability(availabilityUpdate);

    } catch (error) {
      this.logger.error(`Failed to update booking availability: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle hotel activation for booking system
   */
  @OnEvent('booking.hotel.activated')
  async handleHotelActivation(event: { hotelId: string }): Promise<void> {
    try {
      this.logger.log(`Activating hotel in booking system: ${event.hotelId}`);

      const enhancedHotel = await this.enhancedHotelRepository.findOne({
        where: { id: event.hotelId },
        relations: ['enhancedRooms'],
      });

      if (!enhancedHotel) {
        this.logger.warn(`Enhanced hotel not found for activation: ${event.hotelId}`);
        return;
      }

      // Prepare hotel activation data
      const activationData = {
        hotelId: enhancedHotel.id,
        name: enhancedHotel.basicInfo?.name,
        policies: enhancedHotel.policies,
        rooms: enhancedHotel.enhancedRooms?.map(room => ({
          id: room.id,
          name: room.basicInfo?.name,
          type: room.getRoomType(),
          capacity: room.getMaxOccupancy(),
          basePrice: room.getBasePrice(),
          availability: room.availability,
        })) || [],
        activatedAt: new Date(),
      };

      this.logger.log(`Hotel activation data prepared for ${event.hotelId}:`, {
        name: activationData.name,
        roomCount: activationData.rooms.length,
      });

      // TODO: Integrate with actual booking service
      // await this.bookingService.activateHotel(activationData);

    } catch (error) {
      this.logger.error(`Failed to activate hotel in booking system: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle analytics updates
   */
  @OnEvent('analytics.hotel.updated')
  async handleAnalyticsHotelUpdate(event: AnalyticsUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Updating analytics for hotel: ${event.hotelId}`);

      const enhancedHotel = await this.enhancedHotelRepository.findOne({
        where: { id: event.hotelId },
        relations: ['enhancedRooms'],
      });

      if (!enhancedHotel) {
        this.logger.warn(`Enhanced hotel not found for analytics update: ${event.hotelId}`);
        return;
      }

      // Prepare analytics data
      const analyticsData = {
        hotelId: enhancedHotel.id,
        propertyType: enhancedHotel.getPropertyType(),
        qualityScore: enhancedHotel.getOverallQualityScore(),
        amenityCount: enhancedHotel.getTotalAmenities(),
        imageCount: enhancedHotel.getTotalImages(),
        roomCount: enhancedHotel.enhancedRooms?.length || 0,
        onboardingStatus: enhancedHotel.onboardingStatus,
        lastUpdated: event.timestamp,
      };

      this.logger.log(`Analytics data prepared for hotel ${event.hotelId}:`, analyticsData);

      // TODO: Integrate with actual analytics service
      // await this.analyticsService.updateHotelMetrics(analyticsData);

    } catch (error) {
      this.logger.error(`Failed to update analytics: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle onboarding completion analytics
   */
  @OnEvent('analytics.onboarding.completed')
  async handleOnboardingCompletionAnalytics(event: AnalyticsUpdateEvent): Promise<void> {
    try {
      this.logger.log(`Recording onboarding completion for hotel: ${event.hotelId}`);

      const enhancedHotel = await this.enhancedHotelRepository.findOne({
        where: { id: event.hotelId },
        relations: ['enhancedRooms'],
      });

      if (!enhancedHotel) {
        this.logger.warn(`Enhanced hotel not found for onboarding analytics: ${event.hotelId}`);
        return;
      }

      // Prepare onboarding completion metrics
      const completionMetrics = {
        hotelId: enhancedHotel.id,
        completedAt: event.timestamp,
        finalQualityScore: enhancedHotel.getOverallQualityScore(),
        totalAmenities: enhancedHotel.getTotalAmenities(),
        totalImages: enhancedHotel.getTotalImages(),
        totalRooms: enhancedHotel.enhancedRooms?.length || 0,
        propertyType: enhancedHotel.getPropertyType(),
        onboardingDuration: this.calculateOnboardingDuration(enhancedHotel),
      };

      this.logger.log(`Onboarding completion metrics for hotel ${event.hotelId}:`, completionMetrics);

      // TODO: Integrate with actual analytics service
      // await this.analyticsService.recordOnboardingCompletion(completionMetrics);

    } catch (error) {
      this.logger.error(`Failed to record onboarding completion analytics: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle seller dashboard refresh
   */
  @OnEvent('seller.dashboard.refresh')
  async handleSellerDashboardRefresh(event: { hotelId: string }): Promise<void> {
    try {
      this.logger.log(`Refreshing seller dashboard for hotel: ${event.hotelId}`);

      const enhancedHotel = await this.enhancedHotelRepository.findOne({
        where: { id: event.hotelId },
        relations: ['enhancedRooms', 'owner'],
      });

      if (!enhancedHotel) {
        this.logger.warn(`Enhanced hotel not found for dashboard refresh: ${event.hotelId}`);
        return;
      }

      // Prepare dashboard data
      const dashboardData = {
        hotelId: enhancedHotel.id,
        name: enhancedHotel.basicInfo?.name,
        qualityScore: enhancedHotel.getOverallQualityScore(),
        onboardingStatus: enhancedHotel.onboardingStatus,
        totalRooms: enhancedHotel.enhancedRooms?.length || 0,
        totalAmenities: enhancedHotel.getTotalAmenities(),
        totalImages: enhancedHotel.getTotalImages(),
        lastUpdated: enhancedHotel.updatedAt,
        ownerId: enhancedHotel.ownerId,
      };

      this.logger.log(`Dashboard data prepared for hotel ${event.hotelId}:`, dashboardData);

      // TODO: Integrate with actual seller dashboard service
      // await this.sellerDashboardService.refreshHotelData(dashboardData);

    } catch (error) {
      this.logger.error(`Failed to refresh seller dashboard: ${error.message}`, error.stack);
    }
  }

  /**
   * Flatten amenities for search indexing
   */
  private flattenAmenities(amenities: any): string[] {
    if (!amenities) return [];

    const flattened: string[] = [];
    Object.values(amenities).forEach(amenityList => {
      if (Array.isArray(amenityList)) {
        flattened.push(...amenityList);
      }
    });

    return flattened;
  }

  /**
   * Flatten room amenities for search indexing
   */
  private flattenRoomAmenities(roomAmenities: any): string[] {
    if (!roomAmenities) return [];

    const flattened: string[] = [];
    if (roomAmenities.inherited) flattened.push(...roomAmenities.inherited);
    if (roomAmenities.specific) flattened.push(...roomAmenities.specific);

    return flattened;
  }

  /**
   * Extract searchable image data
   */
  private extractSearchableImages(images: any): any[] {
    if (!images) return [];

    const searchableImages: any[] = [];
    Object.entries(images).forEach(([category, imageList]) => {
      if (Array.isArray(imageList)) {
        imageList.forEach(image => {
          searchableImages.push({
            category,
            url: image.optimizedUrls?.medium || image.originalUrl,
            alt: image.metadata?.alt || '',
          });
        });
      }
    });

    return searchableImages;
  }

  /**
   * Calculate onboarding duration
   */
  private calculateOnboardingDuration(enhancedHotel: EnhancedHotel): number {
    const now = new Date();
    const created = enhancedHotel.createdAt;
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)); // Days
  }
}