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
import { Hotel } from '../../hotels/entities/hotel.entity';
import { Booking } from '../../bookings/entities/booking.entity';

export enum RoomType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  DELUXE = 'DELUXE',
  SUITE = 'SUITE',
  FAMILY = 'FAMILY',
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_ORDER = 'OUT_OF_ORDER',
}

@Entity('rooms')
@Index(['hotelId'])
@Index(['roomType'])
@Index(['status'])
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // Changed from roomNumber to name for clarity

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.DOUBLE,
  })
  roomType: RoomType;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE,
  })
  status: RoomStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Capacity
  @Column({ type: 'int', default: 2 })
  maxOccupancy: number;

  @Column({ type: 'int', default: 1 })
  bedCount: number;

  @Column({ type: 'varchar', length: 50, default: 'Queen' })
  bedType: string;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weekendPrice: number;

  // Inventory
  @Column({ type: 'int', default: 1 })
  quantity: number;

  // Room features
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  roomSize: number; // in sq meters

  @Column({ type: 'json', nullable: true })
  amenities: string[];

  @Column({ type: 'json', nullable: true })
  images: string[];

  // Hotel relationship
  @ManyToOne(() => Hotel, (hotel) => hotel.rooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hotelId' })
  hotel: Hotel;

  @Column({ type: 'uuid' })
  hotelId: string;

  // Bookings relationship
  @OneToMany(() => Booking, (booking) => booking.room)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}