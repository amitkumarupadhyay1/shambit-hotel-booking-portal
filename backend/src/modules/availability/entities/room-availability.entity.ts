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
import { Room } from '../../rooms/entities/room.entity';

@Entity('room_availability')
@Index(['roomId', 'date'], { unique: true })
@Index(['date'])
export class RoomAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  roomId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'int', default: 0 })
  availableCount: number;

  @Column({ type: 'boolean', default: false })
  isBlocked: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  blockReason: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}