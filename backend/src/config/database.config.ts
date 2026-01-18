import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';
import { Hotel } from '../modules/hotels/entities/hotel.entity';
import { Room } from '../modules/rooms/entities/room.entity';
import { Booking } from '../modules/bookings/entities/booking.entity';
import { RoomAvailability } from '../modules/availability/entities/room-availability.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DATABASE_HOST', 'localhost'),
      port: this.configService.get('DATABASE_PORT', 5432),
      username: this.configService.get('DATABASE_USERNAME'),
      password: this.configService.get('DATABASE_PASSWORD'),
      database: this.configService.get('DATABASE_NAME'),
      entities: [User, AuditLog, Hotel, Room, Booking, RoomAvailability],
      synchronize: this.configService.get('NODE_ENV') === 'development',
      logging: false, // Disable SQL logging to reduce console noise
      ssl: this.configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
    };
  }
}

// For TypeORM CLI
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [User, AuditLog, Hotel, Room, Booking, RoomAvailability],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;