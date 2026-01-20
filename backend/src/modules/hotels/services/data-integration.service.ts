import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { EnhancedHotel } from '../entities/enhanced-hotel.entity';
import { EnhancedRoom } from '../../rooms/entities/enhanced-room.entity';
import { OnboardingSession } from '../entities/onboarding-session.entity';
import { Hotel } from '../entities/hotel.entity';
import { Room } from '../../rooms/entities/room.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BedType } from '../../rooms/interfaces/enhanced-room.interface';

export interface DataIntegrationResult {
  success: boolean;
  enhancedHotelId?: string;
  enhancedRoomIds?: string[];
  errors?: string[];
  warnings?: string[];
}

export interface SystemUpdateTrigger {
  type: 'hotel_created' | 'hotel_updated' | 'room_created' | 'room_updated' | 'onboarding_completed';
  entityId: string;
  data: any;
  timestamp: Date;
}

@Injectable()
export class DataIntegrationService {
  private readonly logger = new Logger(DataIntegrationService.name);

  constructor(
    @InjectRepository(EnhancedHotel)
    private enhancedHotelRepository: Repository<EnhancedHotel>,
    @InjectRepository(EnhancedRoom)
    private enhancedRoomRepository: Repository<EnhancedRoom>,
    @InjectRepository(OnboardingSession)
    private onboardingSessionRepository: Repository<OnboardingSession>,
    @InjectRepository(Hotel)
    private hotelRepository: Repository<Hotel>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private dataSource: DataSource,
    // private eventEmitter: EventEmitter2, // Temporarily disabled
  ) {}

  /**
   * Create enhanced hotel with proper relational mapping
   */
  async createEnhancedHotel(
    originalHotelId: string,
    ownerId: string,
    onboardingData: any,
  ): Promise<DataIntegrationResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify original hotel exists
      const originalHotel = await queryRunner.manager.findOne(Hotel, {
        where: { id: originalHotelId },
        relations: ['rooms'],
      });

      if (!originalHotel) {
        throw new Error(`Original hotel with ID ${originalHotelId} not found`);
      }

      // Create enhanced hotel entity
      const enhancedHotel = queryRunner.manager.create(EnhancedHotel, {
        originalHotelId,
        ownerId,
        basicInfo: {
          name: originalHotel.name,
          propertyType: onboardingData.propertyType || 'HOTEL',
          starRating: 3, // Default star rating since original doesn't have it
          contactInfo: {
            phone: originalHotel.phone,
            email: originalHotel.email,
            website: originalHotel.website,
          },
          address: {
            street: originalHotel.address,
            city: originalHotel.city,
            state: originalHotel.state,
            pincode: originalHotel.pincode,
            latitude: originalHotel.latitude,
            longitude: originalHotel.longitude,
          },
        },
        propertyDescription: onboardingData.propertyDescription,
        locationDetails: onboardingData.locationDetails,
        policies: onboardingData.policies,
        amenities: onboardingData.amenities,
        images: onboardingData.images,
        businessFeatures: onboardingData.businessFeatures,
        qualityMetrics: onboardingData.qualityMetrics,
        onboardingStatus: onboardingData.onboardingStatus || 'IN_PROGRESS',
      });

      const savedEnhancedHotel = await queryRunner.manager.save(enhancedHotel);

      // Create enhanced rooms for existing rooms
      const enhancedRoomIds: string[] = [];
      if (originalHotel.rooms && originalHotel.rooms.length > 0) {
        for (const originalRoom of originalHotel.rooms) {
          const enhancedRoom = new EnhancedRoom();
          enhancedRoom.originalRoomId = originalRoom.id;
          enhancedRoom.enhancedHotelId = savedEnhancedHotel.id;
          enhancedRoom.basicInfo = {
            name: originalRoom.name,
            type: originalRoom.roomType,
            capacity: {
              maxOccupancy: originalRoom.maxOccupancy || 2,
              adults: originalRoom.maxOccupancy || 2,
              children: 1, // Default value
              infants: 1, // Default value
            },
            size: {
              area: originalRoom.roomSize || 25,
              unit: 'sqm',
            },
            bedConfiguration: {
              beds: [{ type: (originalRoom.bedType as BedType) || BedType.DOUBLE, count: originalRoom.bedCount || 1, size: 'Standard' }],
              totalBeds: originalRoom.bedCount || 1,
              sofaBeds: 0,
              cribs: 0,
            },
          };
          enhancedRoom.pricing = {
            basePrice: originalRoom.basePrice || 100,
            currency: 'USD',
            seasonalPricing: [],
            taxesIncluded: false,
          };
          enhancedRoom.availability = {
            isActive: true,
            availabilityRules: [],
            blackoutDates: [],
            minimumStay: 1,
            maximumStay: 30,
            advanceBookingDays: 0,
          };

          const savedEnhancedRoom = await queryRunner.manager.save(enhancedRoom);
          enhancedRoomIds.push(savedEnhancedRoom.id);
        }
      }

      await queryRunner.commitTransaction();

      // Trigger system updates
      await this.triggerSystemUpdates({
        type: 'hotel_created',
        entityId: savedEnhancedHotel.id,
        data: savedEnhancedHotel,
        timestamp: new Date(),
      });

      this.logger.log(`Enhanced hotel created successfully: ${savedEnhancedHotel.id}`);

      return {
        success: true,
        enhancedHotelId: savedEnhancedHotel.id,
        enhancedRoomIds,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create enhanced hotel: ${error.message}`, error.stack);
      return {
        success: false,
        errors: [error.message],
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update enhanced hotel with data consistency maintenance
   */
  async updateEnhancedHotel(
    enhancedHotelId: string,
    updateData: Partial<EnhancedHotel>,
  ): Promise<DataIntegrationResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const enhancedHotel = await queryRunner.manager.findOne(EnhancedHotel, {
        where: { id: enhancedHotelId },
        relations: ['enhancedRooms'],
      });

      if (!enhancedHotel) {
        throw new Error(`Enhanced hotel with ID ${enhancedHotelId} not found`);
      }

      // Update enhanced hotel
      await queryRunner.manager.update(EnhancedHotel, enhancedHotelId, {
        ...updateData,
        updatedAt: new Date(),
      });

      // Maintain data consistency across related entities
      if (updateData.amenities) {
        await this.propagateAmenityChanges(queryRunner, enhancedHotel, updateData.amenities);
      }

      if (updateData.policies) {
        await this.propagatePolicyChanges(queryRunner, enhancedHotel, updateData.policies);
      }

      await queryRunner.commitTransaction();

      // Trigger system updates
      await this.triggerSystemUpdates({
        type: 'hotel_updated',
        entityId: enhancedHotelId,
        data: updateData,
        timestamp: new Date(),
      });

      this.logger.log(`Enhanced hotel updated successfully: ${enhancedHotelId}`);

      return {
        success: true,
        enhancedHotelId,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update enhanced hotel: ${error.message}`, error.stack);
      return {
        success: false,
        errors: [error.message],
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create enhanced room with proper inheritance
   */
  async createEnhancedRoom(
    enhancedHotelId: string,
    roomData: any,
    originalRoomId?: string,
  ): Promise<DataIntegrationResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const enhancedHotel = await queryRunner.manager.findOne(EnhancedHotel, {
        where: { id: enhancedHotelId },
      });

      if (!enhancedHotel) {
        throw new Error(`Enhanced hotel with ID ${enhancedHotelId} not found`);
      }

      // Implement amenity inheritance
      const inheritedAmenities = this.getInheritedAmenities(enhancedHotel.amenities);
      const roomAmenities = {
        inherited: inheritedAmenities,
        specific: roomData.amenities?.specific || [],
        overrides: roomData.amenities?.overrides || [],
      };

      const enhancedRoom = queryRunner.manager.create(EnhancedRoom, {
        originalRoomId,
        enhancedHotelId,
        basicInfo: roomData.basicInfo,
        description: roomData.description,
        amenities: roomAmenities,
        images: roomData.images || [],
        layout: roomData.layout,
        pricing: roomData.pricing,
        availability: roomData.availability,
        services: roomData.services,
        qualityMetrics: roomData.qualityMetrics,
      });

      const savedEnhancedRoom = await queryRunner.manager.save(enhancedRoom);

      await queryRunner.commitTransaction();

      // Trigger system updates
      await this.triggerSystemUpdates({
        type: 'room_created',
        entityId: savedEnhancedRoom.id,
        data: savedEnhancedRoom,
        timestamp: new Date(),
      });

      this.logger.log(`Enhanced room created successfully: ${savedEnhancedRoom.id}`);

      return {
        success: true,
        enhancedRoomIds: [savedEnhancedRoom.id],
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create enhanced room: ${error.message}`, error.stack);
      return {
        success: false,
        errors: [error.message],
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Complete onboarding with full system integration
   */
  async completeOnboarding(sessionId: string): Promise<DataIntegrationResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const session = await queryRunner.manager.findOne(OnboardingSession, {
        where: { id: sessionId },
        relations: ['enhancedHotel', 'enhancedHotel.enhancedRooms'],
      });

      if (!session) {
        throw new Error(`Onboarding session with ID ${sessionId} not found`);
      }

      // Update enhanced hotel status
      await queryRunner.manager.update(EnhancedHotel, session.enhancedHotelId, {
        onboardingStatus: 'COMPLETED' as any,
        updatedAt: new Date(),
      });

      // Mark session as completed
      await queryRunner.manager.update(OnboardingSession, sessionId, {
        sessionStatus: 'COMPLETED' as any,
        updatedAt: new Date(),
      });

      await queryRunner.commitTransaction();

      // Trigger comprehensive system updates
      await this.triggerSystemUpdates({
        type: 'onboarding_completed',
        entityId: session.enhancedHotelId,
        data: session.enhancedHotel,
        timestamp: new Date(),
      });

      this.logger.log(`Onboarding completed successfully for hotel: ${session.enhancedHotelId}`);

      return {
        success: true,
        enhancedHotelId: session.enhancedHotelId,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to complete onboarding: ${error.message}`, error.stack);
      return {
        success: false,
        errors: [error.message],
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Migrate existing hotel data to enhanced format
   */
  async migrateExistingHotel(originalHotelId: string): Promise<DataIntegrationResult> {
    try {
      const originalHotel = await this.hotelRepository.findOne({
        where: { id: originalHotelId },
        relations: ['rooms', 'owner'],
      });

      if (!originalHotel) {
        throw new Error(`Original hotel with ID ${originalHotelId} not found`);
      }

      // Check if already migrated
      const existingEnhanced = await this.enhancedHotelRepository.findOne({
        where: { originalHotelId },
      });

      if (existingEnhanced) {
        return {
          success: true,
          enhancedHotelId: existingEnhanced.id,
          warnings: ['Hotel already migrated'],
        };
      }

      // Create enhanced version with preserved data
      const migrationData = {
        propertyType: 'HOTEL',
        basicInfo: {
          name: originalHotel.name,
          propertyType: 'HOTEL',
          starRating: 3, // Default star rating
          contactInfo: {
            phone: originalHotel.phone,
            email: originalHotel.email,
            website: originalHotel.website,
          },
          address: {
            street: originalHotel.address,
            city: originalHotel.city,
            state: originalHotel.state,
            pincode: originalHotel.pincode,
            latitude: originalHotel.latitude,
            longitude: originalHotel.longitude,
          },
        },
        onboardingStatus: 'NOT_STARTED',
      };

      return await this.createEnhancedHotel(
        originalHotelId,
        originalHotel.owner?.id || originalHotel.ownerId,
        migrationData,
      );
    } catch (error) {
      this.logger.error(`Failed to migrate hotel: ${error.message}`, error.stack);
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Trigger updates to integrated systems
   */
  private async triggerSystemUpdates(trigger: SystemUpdateTrigger): Promise<void> {
    try {
      // Emit events for different system components - temporarily disabled
      // this.eventEmitter.emit('hotel.data.updated', trigger);
      
      // Specific triggers for different systems
      switch (trigger.type) {
        case 'hotel_created':
        case 'hotel_updated':
          // this.eventEmitter.emit('search.index.update', {
          //   hotelId: trigger.entityId,
          //   data: trigger.data,
          // });
          // this.eventEmitter.emit('analytics.hotel.updated', {
          //   hotelId: trigger.entityId,
          //   timestamp: trigger.timestamp,
          // });
          break;

        case 'room_created':
        case 'room_updated':
          // this.eventEmitter.emit('booking.availability.update', {
          //   roomId: trigger.entityId,
          //   data: trigger.data,
          // });
          break;

        case 'onboarding_completed':
          // this.eventEmitter.emit('search.index.full_update', {
          //   hotelId: trigger.entityId,
          // });
          // this.eventEmitter.emit('booking.hotel.activated', {
          //   hotelId: trigger.entityId,
          // });
          // this.eventEmitter.emit('analytics.onboarding.completed', {
          //   hotelId: trigger.entityId,
          //   timestamp: trigger.timestamp,
          // });
          // this.eventEmitter.emit('seller.dashboard.refresh', {
          //   hotelId: trigger.entityId,
          // });
          break;
      }

      this.logger.log(`System updates triggered for ${trigger.type}: ${trigger.entityId}`);
    } catch (error) {
      this.logger.error(`Failed to trigger system updates: ${error.message}`, error.stack);
    }
  }

  /**
   * Propagate amenity changes to related rooms
   */
  private async propagateAmenityChanges(
    queryRunner: QueryRunner,
    enhancedHotel: EnhancedHotel,
    newAmenities: any,
  ): Promise<void> {
    if (!enhancedHotel.enhancedRooms) return;

    const inheritedAmenities = this.getInheritedAmenities(newAmenities);

    for (const room of enhancedHotel.enhancedRooms) {
      const updatedRoomAmenities = {
        ...room.amenities,
        inherited: inheritedAmenities,
      };

      await queryRunner.manager.update(EnhancedRoom, room.id, {
        amenities: updatedRoomAmenities,
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Propagate policy changes to related rooms
   */
  private async propagatePolicyChanges(
    queryRunner: QueryRunner,
    enhancedHotel: EnhancedHotel,
    newPolicies: any,
  ): Promise<void> {
    // Update room availability based on hotel policies
    if (newPolicies.checkIn || newPolicies.checkOut) {
      for (const room of enhancedHotel.enhancedRooms || []) {
        const updatedAvailability = {
          ...room.availability,
          checkInTime: newPolicies.checkIn?.time,
          checkOutTime: newPolicies.checkOut?.time,
        };

        await queryRunner.manager.update(EnhancedRoom, room.id, {
          availability: updatedAvailability,
          updatedAt: new Date(),
        });
      }
    }
  }

  /**
   * Extract amenities that should be inherited by rooms
   */
  private getInheritedAmenities(hotelAmenities: any): string[] {
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

  /**
   * Create a hotel placeholder for onboarding
   */
  async createHotelPlaceholder(ownerId: string): Promise<Hotel> {
    try {
      const placeholder = this.hotelRepository.create({
        name: 'New Hotel',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        ownerId,
        status: 'DRAFT' as any,
      });

      return await this.hotelRepository.save(placeholder);
    } catch (error) {
      this.logger.error(`Failed to create hotel placeholder: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Trigger system integrations after onboarding completion
   */
  async triggerSystemIntegrations(hotelId: string, data: any): Promise<void> {
    try {
      await this.triggerSystemUpdates({
        type: 'onboarding_completed',
        entityId: hotelId,
        data,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to trigger system integrations: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get integration status for a hotel
   */
  async getIntegrationStatus(enhancedHotelId: string): Promise<{
    isIntegrated: boolean;
    lastUpdated: Date;
    systemsUpdated: string[];
    pendingUpdates: string[];
  }> {
    try {
      const enhancedHotel = await this.enhancedHotelRepository.findOne({
        where: { id: enhancedHotelId },
      });

      if (!enhancedHotel) {
        throw new Error(`Enhanced hotel with ID ${enhancedHotelId} not found`);
      }

      return {
        isIntegrated: enhancedHotel.isOnboardingComplete(),
        lastUpdated: enhancedHotel.updatedAt,
        systemsUpdated: enhancedHotel.isOnboardingComplete() 
          ? ['search', 'booking', 'analytics', 'seller-dashboard']
          : [],
        pendingUpdates: enhancedHotel.isOnboardingComplete() 
          ? []
          : ['search', 'booking', 'analytics'],
      };
    } catch (error) {
      this.logger.error(`Failed to get integration status: ${error.message}`, error.stack);
      throw error;
    }
  }
}