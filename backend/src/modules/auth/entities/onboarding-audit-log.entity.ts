import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EnhancedHotel } from '../../hotels/entities/enhanced-hotel.entity';
import { OnboardingSession } from '../../hotels/entities/onboarding-session.entity';

export enum OnboardingAuditAction {
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_UPDATED = 'SESSION_UPDATED',
  SESSION_COMPLETED = 'SESSION_COMPLETED',
  SESSION_DELETED = 'SESSION_DELETED',
  STEP_UPDATED = 'STEP_UPDATED',
  STEP_COMPLETED = 'STEP_COMPLETED',
  DRAFT_SAVED = 'DRAFT_SAVED',
  QUALITY_REPORT_GENERATED = 'QUALITY_REPORT_GENERATED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REMOVED = 'ROLE_REMOVED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  HOTEL_DATA_UPDATED = 'HOTEL_DATA_UPDATED',
}

/**
 * Audit log for all onboarding-related operations
 * Requirements: 10.4 - Audit logging for all onboarding changes
 */
@Entity('onboarding_audit_logs')
@Index(['hotelId', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
export class OnboardingAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: OnboardingAuditAction,
  })
  action: OnboardingAuditAction;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  hotelId: string;

  @Column({ type: 'uuid', nullable: true })
  sessionId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  stepId: string;

  @Column({ type: 'jsonb', nullable: true })
  previousData: any;

  @Column({ type: 'jsonb', nullable: true })
  newData: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    duration?: number;
    errorMessage?: string;
    [key: string]: any;
  };

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => EnhancedHotel, { eager: false })
  @JoinColumn({ name: 'hotelId' })
  hotel: EnhancedHotel;

  @ManyToOne(() => OnboardingSession, { eager: false })
  @JoinColumn({ name: 'sessionId' })
  session: OnboardingSession;

  /**
   * Get human-readable action description
   */
  getActionDescription(): string {
    switch (this.action) {
      case OnboardingAuditAction.SESSION_CREATED:
        return 'Created onboarding session';
      case OnboardingAuditAction.SESSION_UPDATED:
        return 'Updated onboarding session';
      case OnboardingAuditAction.SESSION_COMPLETED:
        return 'Completed onboarding session';
      case OnboardingAuditAction.SESSION_DELETED:
        return 'Deleted onboarding session';
      case OnboardingAuditAction.STEP_UPDATED:
        return `Updated step: ${this.stepId}`;
      case OnboardingAuditAction.STEP_COMPLETED:
        return `Completed step: ${this.stepId}`;
      case OnboardingAuditAction.DRAFT_SAVED:
        return 'Saved draft data';
      case OnboardingAuditAction.QUALITY_REPORT_GENERATED:
        return 'Generated quality report';
      case OnboardingAuditAction.ROLE_ASSIGNED:
        return 'Assigned hotel role';
      case OnboardingAuditAction.ROLE_REMOVED:
        return 'Removed hotel role';
      case OnboardingAuditAction.PERMISSION_DENIED:
        return 'Permission denied';
      case OnboardingAuditAction.DATA_EXPORTED:
        return 'Exported onboarding data';
      case OnboardingAuditAction.HOTEL_DATA_UPDATED:
        return 'Updated hotel data from onboarding';
      default:
        return 'Unknown action';
    }
  }

  /**
   * Check if this is a security-related audit event
   */
  isSecurityEvent(): boolean {
    return [
      OnboardingAuditAction.ROLE_ASSIGNED,
      OnboardingAuditAction.ROLE_REMOVED,
      OnboardingAuditAction.PERMISSION_DENIED,
      OnboardingAuditAction.DATA_EXPORTED,
    ].includes(this.action);
  }

  /**
   * Get data change summary
   */
  getDataChangeSummary(): string {
    if (!this.previousData && !this.newData) {
      return 'No data changes';
    }

    if (!this.previousData) {
      return 'Data created';
    }

    if (!this.newData) {
      return 'Data deleted';
    }

    // Count changed fields
    const previousKeys = Object.keys(this.previousData);
    const newKeys = Object.keys(this.newData);
    const allKeys = new Set([...previousKeys, ...newKeys]);
    
    let changedFields = 0;
    for (const key of allKeys) {
      if (JSON.stringify(this.previousData[key]) !== JSON.stringify(this.newData[key])) {
        changedFields++;
      }
    }

    return `${changedFields} field(s) changed`;
  }
}