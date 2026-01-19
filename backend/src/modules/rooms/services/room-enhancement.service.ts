import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnhancedRoom } from '../entities/enhanced-room.entity';
import { EnhancedHotel } from '../../hotels/entities/enhanced-hotel.entity';
import { EntityType } from '../../hotels/entities/image-metadata.entity';
import { AmenityService } from '../../hotels/services/amenity.service';
import { ImageManagementService } from '../../hotels/services/image-management.service';
import { CreateEnhancedRoomDto } from '../dto/create-enhanced-room.dto';
import {
  EnhancedRoom as IEnhancedRoom,
  RoomBasicInfo,
  RoomAmenities,
  RoomLayout,
  RoomQualityMetrics,
  AmenityOverride,
  LayoutFeature,
  RoomDimensions,
} from '../interfaces/enhanced-room.interface';
import {
  RichTextContent,
  ProcessedImage,
  ImageCategory,
  CategorizedAmenities,
} from '../../hotels/interfaces/enhanced-hotel.interface';

export interface RoomContentValidationResult {
  isComplete: boolean;
  missingElements: string[];
  qualityScore: number;
  recommendations: string[];
}

export interface RoomLayoutCaptureData {
  dimensions: RoomDimensions;
  features: LayoutFeature[];
  floorPlan?: string;
  view: string;
  naturalLight: 'excellent' | 'good' | 'moderate' | 'limited';
}

@Injectable()
export class RoomEnhancementService {
  constructor(
    @InjectRepository(EnhancedRoom)
    private enhancedRoomRepository: Repository<EnhancedRoom>,
    @InjectRepository(EnhancedHotel)
    private enhancedHotelRepository: Repository<EnhancedHotel>,
    private amenityService: AmenityService,
    private imageManagementService: ImageManagementService,
  ) {}

  /**
   * Create enhanced room with detailed description and layout capture
   * Requirements: 4.1, 4.4 - Detailed room descriptions and layout capture
   */
  async createEnhancedRoom(
    createRoomDto: CreateEnhancedRoomDto,
    userId: string,
  ): Promise<EnhancedRoom> {
    // Verify hotel ownership
    const hotel = await this.enhancedHotelRepository.findOne({
      where: { id: createRoomDto.enhancedHotelId },
      relations: ['owner'],
    });

    if (!hotel) {
      throw new NotFoundException('Enhanced hotel not found');
    }

    if (hotel.ownerId !== userId) {
      throw new ForbiddenException('You can only add rooms to your own hotels');
    }

    // Process amenities with inheritance if provided
    let processedAmenities: RoomAmenities | undefined;
    if (createRoomDto.amenities) {
      processedAmenities = await this.processRoomAmenities(
        hotel.amenities,
        createRoomDto.amenities.specific || [],
        createRoomDto.amenities.overrides || [],
      );
    }

    // Calculate initial quality metrics
    const qualityMetrics = this.calculateRoomQualityMetrics({
      basicInfo: createRoomDto.basicInfo,
      description: createRoomDto.description,
      amenities: processedAmenities,
      images: createRoomDto.images || [],
      layout: createRoomDto.layout,
    });

    const enhancedRoom = this.enhancedRoomRepository.create({
      ...createRoomDto,
      amenities: processedAmenities,
      qualityMetrics,
    });

    return this.enhancedRoomRepository.save(enhancedRoom);
  }

  /**
   * Update room with enhanced information
   * Requirements: 4.1, 4.2, 4.3 - Room descriptions, amenities, and images
   */
  async updateEnhancedRoom(
    roomId: string,
    updateData: Partial<CreateEnhancedRoomDto>,
    userId: string,
  ): Promise<EnhancedRoom> {
    const room = await this.enhancedRoomRepository.findOne({
      where: { id: roomId },
      relations: ['enhancedHotel', 'enhancedHotel.owner'],
    });

    if (!room) {
      throw new NotFoundException('Enhanced room not found');
    }

    if (room.enhancedHotel.ownerId !== userId) {
      throw new ForbiddenException('You can only update rooms in your own hotels');
    }

    // Process amenities with inheritance if updated
    if (updateData.amenities) {
      const processedAmenities = await this.processRoomAmenities(
        room.enhancedHotel.amenities,
        updateData.amenities.specific || [],
        updateData.amenities.overrides || [],
      );
      updateData.amenities = processedAmenities;
    }

    // Update room data
    Object.assign(room, updateData);

    // Recalculate quality metrics
    room.qualityMetrics = this.calculateRoomQualityMetrics({
      basicInfo: room.basicInfo,
      description: room.description,
      amenities: room.amenities,
      images: room.images || [],
      layout: room.layout,
    });

    return this.enhancedRoomRepository.save(room);
  }

  /**
   * Capture detailed room layout information
   * Requirements: 4.4 - Room layout and spatial arrangements
   */
  async captureRoomLayout(
    roomId: string,
    layoutData: RoomLayoutCaptureData,
    userId: string,
  ): Promise<RoomLayout> {
    const room = await this.enhancedRoomRepository.findOne({
      where: { id: roomId },
      relations: ['enhancedHotel', 'enhancedHotel.owner'],
    });

    if (!room) {
      throw new NotFoundException('Enhanced room not found');
    }

    if (room.enhancedHotel.ownerId !== userId) {
      throw new ForbiddenException('You can only update rooms in your own hotels');
    }

    const roomLayout: RoomLayout = {
      dimensions: layoutData.dimensions,
      features: layoutData.features,
      floorPlan: layoutData.floorPlan,
      view: layoutData.view,
      naturalLight: layoutData.naturalLight,
      virtualTour: room.layout?.virtualTour, // Preserve existing virtual tour
    };

    room.layout = roomLayout;
    await this.enhancedRoomRepository.save(room);

    return roomLayout;
  }

  /**
   * Process room-specific amenity management with inheritance
   * Requirements: 4.2, 4.6 - Room-specific amenity management with inheritance
   */
  async processRoomAmenities(
    propertyAmenities: CategorizedAmenities | null,
    roomSpecificAmenities: string[],
    overrides: AmenityOverride[],
  ): Promise<RoomAmenities> {
    if (!propertyAmenities) {
      return {
        inherited: [],
        specific: roomSpecificAmenities,
        overrides,
      };
    }

    // Apply amenity inheritance logic
    const inheritanceResult = await this.amenityService.applyAmenityInheritance(
      propertyAmenities,
      roomSpecificAmenities,
      overrides,
    );

    return {
      inherited: inheritanceResult.inherited,
      specific: inheritanceResult.specific,
      overrides,
    };
  }

  /**
   * Manage room image categorization
   * Requirements: 4.3 - Room image categorization and management
   */
  async addRoomImages(
    roomId: string,
    images: Express.Multer.File[],
    categories: ImageCategory[],
    userId: string,
  ): Promise<ProcessedImage[]> {
    const room = await this.enhancedRoomRepository.findOne({
      where: { id: roomId },
      relations: ['enhancedHotel', 'enhancedHotel.owner'],
    });

    if (!room) {
      throw new NotFoundException('Enhanced room not found');
    }

    if (room.enhancedHotel.ownerId !== userId) {
      throw new ForbiddenException('You can only update rooms in your own hotels');
    }

    if (images.length !== categories.length) {
      throw new BadRequestException('Number of images must match number of categories');
    }

    const processedImages: ProcessedImage[] = [];

    for (let i = 0; i < images.length; i++) {
      const processedImage = await this.imageManagementService.uploadImage(
        images[i],
        categories[i],
        EntityType.ROOM,
        roomId,
        userId,
      );
      processedImages.push(processedImage);
    }

    // Add to existing room images
    const existingImages = room.images || [];
    room.images = [...existingImages, ...processedImages];

    // Update quality metrics
    room.qualityMetrics = this.calculateRoomQualityMetrics({
      basicInfo: room.basicInfo,
      description: room.description,
      amenities: room.amenities,
      images: room.images,
      layout: room.layout,
    });

    await this.enhancedRoomRepository.save(room);
    return processedImages;
  }

  /**
   * Remove room image
   * Requirements: 4.3 - Room image management
   */
  async removeRoomImage(
    roomId: string,
    imageId: string,
    userId: string,
  ): Promise<void> {
    const room = await this.enhancedRoomRepository.findOne({
      where: { id: roomId },
      relations: ['enhancedHotel', 'enhancedHotel.owner'],
    });

    if (!room) {
      throw new NotFoundException('Enhanced room not found');
    }

    if (room.enhancedHotel.ownerId !== userId) {
      throw new ForbiddenException('You can only update rooms in your own hotels');
    }

    // Remove image from room
    if (room.images) {
      room.images = room.images.filter(img => img.id !== imageId);
    }

    // Delete image from storage
    await this.imageManagementService.deleteImage(imageId);

    // Update quality metrics
    room.qualityMetrics = this.calculateRoomQualityMetrics({
      basicInfo: room.basicInfo,
      description: room.description,
      amenities: room.amenities,
      images: room.images || [],
      layout: room.layout,
    });

    await this.enhancedRoomRepository.save(room);
  }

  /**
   * Validate room content completeness
   * Requirements: 4.5 - Room content completeness validation
   */
  async validateRoomContent(roomId: string): Promise<RoomContentValidationResult> {
    const room = await this.enhancedRoomRepository.findOne({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('Enhanced room not found');
    }

    return this.performRoomContentValidation(room);
  }

  /**
   * Get rooms by hotel with filtering options
   */
  async getRoomsByHotel(
    hotelId: string,
    filters?: {
      roomType?: string;
      minQualityScore?: number;
      hasImages?: boolean;
      isComplete?: boolean;
    },
  ): Promise<EnhancedRoom[]> {
    let query = this.enhancedRoomRepository
      .createQueryBuilder('room')
      .where('room.enhancedHotelId = :hotelId', { hotelId });

    if (filters?.roomType) {
      query = query.andWhere("room.basicInfo->>'type' = :roomType", {
        roomType: filters.roomType,
      });
    }

    if (filters?.minQualityScore) {
      query = query.andWhere("CAST(room.qualityMetrics->>'overallScore' AS FLOAT) >= :minScore", {
        minScore: filters.minQualityScore,
      });
    }

    if (filters?.hasImages !== undefined) {
      if (filters.hasImages) {
        query = query.andWhere("JSON_LENGTH(room.images) > 0");
      } else {
        query = query.andWhere("(room.images IS NULL OR JSON_LENGTH(room.images) = 0)");
      }
    }

    const rooms = await query.getMany();

    if (filters?.isComplete !== undefined) {
      return rooms.filter(room => {
        const validation = this.performRoomContentValidation(room);
        return filters.isComplete ? validation.isComplete : !validation.isComplete;
      });
    }

    return rooms;
  }

  /**
   * Get room with full details
   */
  async getRoomWithDetails(roomId: string): Promise<EnhancedRoom> {
    const room = await this.enhancedRoomRepository.findOne({
      where: { id: roomId },
      relations: ['enhancedHotel'],
    });

    if (!room) {
      throw new NotFoundException('Enhanced room not found');
    }

    return room;
  }

  /**
   * Delete enhanced room
   */
  async deleteEnhancedRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.enhancedRoomRepository.findOne({
      where: { id: roomId },
      relations: ['enhancedHotel', 'enhancedHotel.owner'],
    });

    if (!room) {
      throw new NotFoundException('Enhanced room not found');
    }

    if (room.enhancedHotel.ownerId !== userId) {
      throw new ForbiddenException('You can only delete rooms from your own hotels');
    }

    // Delete associated images
    if (room.images) {
      for (const image of room.images) {
        await this.imageManagementService.deleteImage(image.id);
      }
    }

    await this.enhancedRoomRepository.remove(room);
  }

  // Private helper methods

  /**
   * Calculate room quality metrics
   */
  private calculateRoomQualityMetrics(roomData: {
    basicInfo: RoomBasicInfo;
    description?: RichTextContent;
    amenities?: RoomAmenities;
    images: ProcessedImage[];
    layout?: RoomLayout;
  }): RoomQualityMetrics {
    let imageQuality = 0;
    let descriptionQuality = 0;
    let amenityCompleteness = 0;

    // Image quality (40% weight)
    if (roomData.images.length > 0) {
      const avgImageQuality = roomData.images.reduce((sum, img) => {
        return sum + (img.qualityScore || 0);
      }, 0) / roomData.images.length;
      
      // Bonus for having multiple images
      const imageCountBonus = Math.min(roomData.images.length * 10, 30);
      imageQuality = Math.min(avgImageQuality + imageCountBonus, 100);
    }

    // Description quality (30% weight)
    if (roomData.description) {
      const wordCount = roomData.description.wordCount || 0;
      if (wordCount >= 50) {
        descriptionQuality = Math.min(wordCount / 2, 100); // 2 words = 1 point, max 100
      }
    }

    // Amenity completeness (30% weight)
    if (roomData.amenities) {
      const totalAmenities = 
        (roomData.amenities.inherited?.length || 0) +
        (roomData.amenities.specific?.length || 0);
      amenityCompleteness = Math.min(totalAmenities * 10, 100); // 10 points per amenity, max 100
    }

    const overallScore = Math.round(
      (imageQuality * 0.4) + 
      (descriptionQuality * 0.3) + 
      (amenityCompleteness * 0.3)
    );

    return {
      overallScore,
      imageQuality,
      descriptionQuality,
      amenityCompleteness,
      lastUpdated: new Date(),
      maintenanceScore: 100, // Default, would be updated by maintenance system
    };
  }

  /**
   * Perform room content validation
   */
  private performRoomContentValidation(room: EnhancedRoom): RoomContentValidationResult {
    const missingElements: string[] = [];
    const recommendations: string[] = [];

    // Check basic info completeness
    if (!room.basicInfo.name || room.basicInfo.name.trim().length < 3) {
      missingElements.push('Room name (minimum 3 characters)');
    }

    if (!room.basicInfo.capacity || room.basicInfo.capacity.maxOccupancy < 1) {
      missingElements.push('Room capacity information');
    }

    if (!room.basicInfo.size || room.basicInfo.size.area < 10) {
      missingElements.push('Room size information');
    }

    // Check description
    if (!room.description || !room.description.content || room.description.wordCount < 20) {
      missingElements.push('Room description (minimum 20 words)');
    }

    // Check images
    const imageCount = room.images?.length || 0;
    if (imageCount === 0) {
      missingElements.push('Room images (minimum 1 required)');
    } else if (imageCount < 3) {
      recommendations.push('Add more room images for better presentation (recommended: 3-5 images)');
    }

    // Check amenities
    const totalAmenities = 
      (room.amenities?.inherited?.length || 0) +
      (room.amenities?.specific?.length || 0);
    
    if (totalAmenities === 0) {
      missingElements.push('Room amenities');
    } else if (totalAmenities < 3) {
      recommendations.push('Consider adding more amenities to highlight room features');
    }

    // Check layout information
    if (!room.layout) {
      recommendations.push('Add room layout information for better guest understanding');
    } else {
      if (!room.layout.dimensions) {
        recommendations.push('Add room dimensions for better space understanding');
      }
      if (!room.layout.features || room.layout.features.length === 0) {
        recommendations.push('Add room features (windows, balcony, etc.) for better description');
      }
    }

    // Check pricing
    if (!room.pricing || room.pricing.basePrice <= 0) {
      missingElements.push('Room pricing information');
    }

    const qualityScore = room.qualityMetrics?.overallScore || 0;
    const isComplete = missingElements.length === 0 && qualityScore >= 60;

    return {
      isComplete,
      missingElements,
      qualityScore,
      recommendations,
    };
  }
}