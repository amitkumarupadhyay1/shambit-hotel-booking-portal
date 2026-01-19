import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { EnhancedHotel } from '../../hotels/entities/enhanced-hotel.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import {
  RoomBasicInfo,
  RoomAmenities,
  RoomLayout,
  RoomPricing,
  RoomAvailability,
  RoomServices,
  RoomQualityMetrics,
} from '../interfaces/enhanced-room.interface';
import { RichTextContent, ProcessedImage } from '../../hotels/interfaces/enhanced-hotel.interface';

@Entity('enhanced_rooms')
@Index(['enhancedHotelId'])
export class EnhancedRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Basic room information
  @Column({ type: 'json' })
  basicInfo: RoomBasicInfo;

  // Rich room description
  @Column({ type: 'json', nullable: true })
  description: RichTextContent;

  // Room amenities with inheritance support
  @Column({ type: 'json', nullable: true })
  amenities: RoomAmenities;

  // Room-specific images
  @Column({ type: 'json', nullable: true })
  images: ProcessedImage[];

  // Room layout and features
  @Column({ type: 'json', nullable: true })
  layout: RoomLayout;

  // Pricing information
  @Column({ type: 'json', nullable: true })
  pricing: RoomPricing;

  // Availability rules and restrictions
  @Column({ type: 'json', nullable: true })
  availability: RoomAvailability;

  // Room services
  @Column({ type: 'json', nullable: true })
  services: RoomServices;

  // Quality metrics
  @Column({ type: 'json', nullable: true })
  qualityMetrics: RoomQualityMetrics;

  // Backward compatibility - reference to original room
  @Column({ type: 'uuid', nullable: true })
  originalRoomId: string;

  // Enhanced hotel relationship
  @ManyToOne(() => EnhancedHotel, (hotel) => hotel.enhancedRooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enhancedHotelId' })
  enhancedHotel: EnhancedHotel;

  @Column({ type: 'uuid' })
  enhancedHotelId: string;

  // Bookings relationship (maintains compatibility)
  @OneToMany(() => Booking, (booking) => booking.room)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods for data access
  getRoomType(): string {
    return this.basicInfo?.type || 'DOUBLE';
  }

  getMaxOccupancy(): number {
    return this.basicInfo?.capacity?.maxOccupancy || 2;
  }

  getBasePrice(): number {
    return this.pricing?.basePrice || 0;
  }

  getTotalAmenities(): number {
    if (!this.amenities) return 0;
    const inherited = this.amenities.inherited?.length || 0;
    const specific = this.amenities.specific?.length || 0;
    return inherited + specific;
  }

  getImageCount(): number {
    return this.images?.length || 0;
  }

  getQualityScore(): number {
    return this.qualityMetrics?.overallScore || 0;
  }

  isAvailable(): boolean {
    return this.availability?.isActive || false;
  }

  getRoomSize(): number {
    return this.basicInfo?.size?.area || 0;
  }

  hasVirtualTour(): boolean {
    return !!this.layout?.virtualTour;
  }
}