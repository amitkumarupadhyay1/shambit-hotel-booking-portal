import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { AmenityCategory, PropertyType, AmenityRule } from '../interfaces/enhanced-hotel.interface';

@Entity('amenity_definitions')
@Unique(['name', 'category'])
@Index(['category'])
@Index(['isEcoFriendly'])
export class AmenityDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon: string;

  @Column({
    type: 'enum',
    enum: AmenityCategory,
  })
  category: AmenityCategory;

  @Column({ type: 'boolean', default: false })
  isEcoFriendly: boolean;

  @Column({ type: 'json', nullable: true })
  applicablePropertyTypes: PropertyType[];

  @Column({ type: 'json', nullable: true })
  businessRules: AmenityRule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  isApplicableToPropertyType(propertyType: PropertyType): boolean {
    return this.applicablePropertyTypes?.includes(propertyType) || false;
  }

  hasBusinessRules(): boolean {
    return this.businessRules && this.businessRules.length > 0;
  }

  getBusinessRulesByType(type: 'requires' | 'excludes' | 'implies'): AmenityRule[] {
    return this.businessRules?.filter(rule => rule.type === type) || [];
  }
}