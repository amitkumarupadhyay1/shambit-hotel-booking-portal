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
import { User } from '../../users/entities/user.entity';
import { EnhancedRoom } from '../../rooms/entities/enhanced-room.entity';
import {
  PropertyType,
  OnboardingStatus,
  RichTextContent,
  HotelBasicInfo,
  LocationDetails,
  HotelPolicies,
  CategorizedAmenities,
  CategorizedImages,
  BusinessFeatures,
  QualityMetrics,
} from '../interfaces/enhanced-hotel.interface';

@Entity('enhanced_hotels')
@Index(['onboardingStatus'])
export class EnhancedHotel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Basic Information stored as JSON for flexibility
  @Column({ type: 'json' })
  basicInfo: HotelBasicInfo;

  // Rich property description
  @Column({ type: 'json', nullable: true })
  propertyDescription: RichTextContent;

  // Detailed location information
  @Column({ type: 'json', nullable: true })
  locationDetails: LocationDetails;

  // Comprehensive policies
  @Column({ type: 'json', nullable: true })
  policies: HotelPolicies;

  // Categorized amenities
  @Column({ type: 'json', nullable: true })
  amenities: CategorizedAmenities;

  // Categorized images with metadata
  @Column({ type: 'json', nullable: true })
  images: CategorizedImages;

  // Business traveler features
  @Column({ type: 'json', nullable: true })
  businessFeatures: BusinessFeatures;

  // Quality assurance metrics
  @Column({ type: 'json', nullable: true })
  qualityMetrics: QualityMetrics;

  // Onboarding status tracking
  @Column({
    type: 'enum',
    enum: OnboardingStatus,
    default: OnboardingStatus.NOT_STARTED,
  })
  onboardingStatus: OnboardingStatus;

  // Backward compatibility - reference to original hotel
  @Column({ type: 'uuid', nullable: true })
  originalHotelId: string;

  // Owner relationship
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'uuid' })
  ownerId: string;

  // Enhanced rooms relationship
  @OneToMany(() => EnhancedRoom, (room) => room.enhancedHotel)
  enhancedRooms: EnhancedRoom[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods for data access
  getPropertyType(): PropertyType {
    return this.basicInfo?.propertyType || PropertyType.HOTEL;
  }

  getOverallQualityScore(): number {
    return this.qualityMetrics?.overallScore || 0;
  }

  isOnboardingComplete(): boolean {
    return this.onboardingStatus === OnboardingStatus.COMPLETED;
  }

  getTotalAmenities(): number {
    if (!this.amenities) return 0;
    return Object.values(this.amenities).reduce((total, amenityList) => {
      return total + (Array.isArray(amenityList) ? amenityList.length : 0);
    }, 0);
  }

  getTotalImages(): number {
    if (!this.images) return 0;
    return Object.values(this.images).reduce((total, imageList) => {
      return total + (Array.isArray(imageList) ? imageList.length : 0);
    }, 0);
  }
}