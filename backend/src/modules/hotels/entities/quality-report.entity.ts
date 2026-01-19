import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { EnhancedHotel } from './enhanced-hotel.entity';
import { QualityScoreBreakdown } from '../interfaces/enhanced-hotel.interface';

export interface MissingInformation {
  category: string;
  items: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface Recommendation {
  type: 'image' | 'content' | 'policy' | 'amenity';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionRequired: string;
  estimatedImpact: number; // score improvement estimate
}

@Entity('quality_reports')
@Index(['enhancedHotelId'])
@Index(['overallScore'])
export class QualityReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overallScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  imageQualityScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  contentCompletenessScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  policyClarityScore: number;

  @Column({ type: 'json', nullable: true })
  scoreBreakdown: QualityScoreBreakdown;

  @Column({ type: 'json', nullable: true })
  missingInformation: MissingInformation[];

  @Column({ type: 'json', nullable: true })
  recommendations: Recommendation[];

  @Column({ type: 'varchar', length: 100, default: 'SYSTEM' })
  generatedBy: string;

  // Enhanced hotel relationship
  @ManyToOne(() => EnhancedHotel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enhancedHotelId' })
  enhancedHotel: EnhancedHotel;

  @Column({ type: 'uuid' })
  enhancedHotelId: string;

  @CreateDateColumn()
  createdAt: Date;

  // Helper methods
  getScoreGrade(): string {
    if (this.overallScore >= 90) return 'A';
    if (this.overallScore >= 80) return 'B';
    if (this.overallScore >= 70) return 'C';
    if (this.overallScore >= 60) return 'D';
    return 'F';
  }

  getScoreColor(): string {
    if (this.overallScore >= 80) return 'green';
    if (this.overallScore >= 60) return 'yellow';
    return 'red';
  }

  getHighPriorityRecommendations(): Recommendation[] {
    return this.recommendations?.filter(rec => rec.priority === 'high') || [];
  }

  getMediumPriorityRecommendations(): Recommendation[] {
    return this.recommendations?.filter(rec => rec.priority === 'medium') || [];
  }

  getLowPriorityRecommendations(): Recommendation[] {
    return this.recommendations?.filter(rec => rec.priority === 'low') || [];
  }

  getCriticalMissingInformation(): MissingInformation[] {
    return this.missingInformation?.filter(info => info.priority === 'high') || [];
  }

  getTotalRecommendations(): number {
    return this.recommendations?.length || 0;
  }

  getEstimatedScoreImprovement(): number {
    if (!this.recommendations) return 0;
    return this.recommendations
      .filter(rec => rec.priority === 'high')
      .reduce((total, rec) => total + rec.estimatedImpact, 0);
  }

  isPassingGrade(): boolean {
    return this.overallScore >= 70;
  }

  needsImprovement(): boolean {
    return this.overallScore < 80;
  }

  hasImageIssues(): boolean {
    return this.imageQualityScore ? this.imageQualityScore < 70 : true;
  }

  hasContentIssues(): boolean {
    return this.contentCompletenessScore ? this.contentCompletenessScore < 70 : true;
  }

  hasPolicyIssues(): boolean {
    return this.policyClarityScore ? this.policyClarityScore < 70 : true;
  }
}