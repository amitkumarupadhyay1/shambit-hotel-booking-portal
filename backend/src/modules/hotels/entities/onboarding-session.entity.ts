import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EnhancedHotel } from './enhanced-hotel.entity';

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export interface OnboardingDraft {
  [stepKey: string]: any;
}

@Entity('onboarding_sessions')
@Index(['enhancedHotelId'])
@Index(['userId'])
@Index(['sessionStatus'])
export class OnboardingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 0 })
  currentStep: number;

  @Column({ type: 'json', default: [] })
  completedSteps: string[];

  @Column({ type: 'json', default: {} })
  draftData: OnboardingDraft;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.00 })
  qualityScore: number;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE,
  })
  sessionStatus: SessionStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt: Date;

  // Enhanced hotel relationship
  @ManyToOne(() => EnhancedHotel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enhancedHotelId' })
  enhancedHotel: EnhancedHotel;

  @Column({ type: 'uuid' })
  enhancedHotelId: string;

  // User relationship
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  isActive(): boolean {
    return this.sessionStatus === SessionStatus.ACTIVE && 
           (!this.expiresAt || this.expiresAt > new Date());
  }

  isExpired(): boolean {
    return this.expiresAt && this.expiresAt <= new Date();
  }

  getCompletionPercentage(): number {
    const totalSteps = 14; // Based on the task list
    return (this.completedSteps.length / totalSteps) * 100;
  }

  isStepCompleted(stepId: string): boolean {
    return this.completedSteps.includes(stepId);
  }

  addCompletedStep(stepId: string): void {
    if (!this.isStepCompleted(stepId)) {
      this.completedSteps.push(stepId);
    }
  }

  updateDraftData(stepKey: string, data: any): void {
    this.draftData[stepKey] = data;
  }

  getDraftData(stepKey: string): any {
    return this.draftData[stepKey];
  }

  markAsCompleted(): void {
    this.sessionStatus = SessionStatus.COMPLETED;
  }

  markAsAbandoned(): void {
    this.sessionStatus = SessionStatus.ABANDONED;
  }
}