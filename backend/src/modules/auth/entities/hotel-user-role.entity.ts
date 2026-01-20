import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EnhancedHotel } from '../../hotels/entities/enhanced-hotel.entity';
import { HotelRole } from '../enums/hotel-roles.enum';

/**
 * Hotel-specific user roles for enhanced access control
 * Requirements: 10.1 - Role-based permissions for hotel onboarding operations
 */
@Entity('hotel_user_roles')
@Index(['userId', 'hotelId'], { unique: true })
export class HotelUserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  hotelId: string;

  @Column({
    type: 'enum',
    enum: HotelRole,
  })
  role: HotelRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  assignedBy: string; // User ID who assigned this role

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => EnhancedHotel, { eager: false })
  @JoinColumn({ name: 'hotelId' })
  hotel: EnhancedHotel;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'assignedBy' })
  assignedByUser: User;

  /**
   * Check if the role assignment is currently valid
   */
  isValid(): boolean {
    if (!this.isActive) {
      return false;
    }

    if (this.expiresAt && this.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(): string {
    switch (this.role) {
      case HotelRole.OWNER:
        return 'Hotel Owner';
      case HotelRole.MANAGER:
        return 'Hotel Manager';
      case HotelRole.STAFF:
        return 'Hotel Staff';
      default:
        return 'Unknown Role';
    }
  }
}