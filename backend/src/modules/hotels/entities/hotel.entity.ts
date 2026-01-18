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
import { Room } from '../../rooms/entities/room.entity';

export enum HotelStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export enum HotelType {
  HOTEL = 'HOTEL',
  RESORT = 'RESORT',
  GUEST_HOUSE = 'GUEST_HOUSE',
  HOMESTAY = 'HOMESTAY',
  APARTMENT = 'APARTMENT',
}

@Entity('hotels')
@Index(['status'])
@Index(['city', 'status'])
@Index(['hotelType', 'city'])
export class Hotel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: HotelType,
    default: HotelType.HOTEL,
  })
  hotelType: HotelType;

  @Column({
    type: 'enum',
    enum: HotelStatus,
    default: HotelStatus.PENDING,
  })
  status: HotelStatus;

  // Location
  @Column({ type: 'varchar', length: 500 })
  address: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ type: 'varchar', length: 10 })
  pincode: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  // Contact
  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string;

  // Amenities
  @Column({ type: 'json', nullable: true })
  amenities: string[];

  @Column({ type: 'json', nullable: true })
  images: string[];

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  startingPrice: number;

  // Ratings
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  // Owner relationship
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'uuid' })
  ownerId: string;

  // Rooms relationship
  @OneToMany(() => Room, (room) => room.hotel)
  rooms: Room[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}