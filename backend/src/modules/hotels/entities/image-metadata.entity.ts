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
import { ImageCategory, QualityCheckResult, ThumbnailSet } from '../interfaces/enhanced-hotel.interface';

export enum EntityType {
  HOTEL = 'HOTEL',
  ROOM = 'ROOM',
}

@Entity('image_metadata')
@Index(['entityType', 'entityId'])
@Index(['category'])
@Index(['qualityScore'])
@Index(['uploadedBy'])
export class ImageMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  filename: string;

  @Column({ type: 'varchar', length: 1000 })
  originalUrl: string;

  @Column({ type: 'json', nullable: true })
  optimizedUrls: { [size: string]: string };

  @Column({ type: 'json', nullable: true })
  thumbnails: ThumbnailSet;

  @Column({ type: 'int', nullable: true })
  sizeBytes: number;

  @Column({ type: 'json', nullable: true })
  dimensions: { width: number; height: number };

  @Column({ type: 'varchar', length: 20, nullable: true })
  format: string;

  @Column({
    type: 'enum',
    enum: ImageCategory,
    nullable: true,
  })
  category: ImageCategory;

  @Column({ type: 'json', nullable: true })
  qualityChecks: QualityCheckResult;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  qualityScore: number;

  @Column({ type: 'json', default: [] })
  tags: string[];

  @Column({
    type: 'enum',
    enum: EntityType,
    nullable: true,
  })
  entityType: EntityType;

  @Column({ type: 'uuid', nullable: true })
  entityId: string;

  // Uploader relationship
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploadedBy' })
  uploader: User;

  @Column({ type: 'uuid', nullable: true })
  uploadedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  getFileSize(): string {
    if (!this.sizeBytes) return 'Unknown';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.sizeBytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  getAspectRatio(): number | null {
    if (!this.dimensions) return null;
    return this.dimensions.width / this.dimensions.height;
  }

  isHighQuality(): boolean {
    return this.qualityScore ? this.qualityScore >= 80 : false;
  }

  hasQualityIssues(): boolean {
    return this.qualityChecks ? !this.qualityChecks.passed : false;
  }

  getQualityIssues(): string[] {
    if (!this.qualityChecks || !this.qualityChecks.issues) return [];
    return this.qualityChecks.issues.map(issue => issue.description);
  }

  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }
}