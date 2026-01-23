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
// Enhanced onboarding entities
import { EnhancedHotel } from '../modules/hotels/entities/enhanced-hotel.entity';
import { EnhancedRoom } from '../modules/rooms/entities/enhanced-room.entity';
import { AmenityDefinition } from '../modules/hotels/entities/amenity-definition.entity';
import { OnboardingSession } from '../modules/hotels/entities/onboarding-session.entity';
import { ImageMetadata } from '../modules/hotels/entities/image-metadata.entity';
import { QualityReport } from '../modules/hotels/entities/quality-report.entity';
// Auth entities
import { HotelUserRole } from '../modules/auth/entities/hotel-user-role.entity';
import { OnboardingAuditLog } from '../modules/auth/entities/onboarding-audit-log.entity';

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
      entities: [
        User, 
        AuditLog, 
        Hotel, 
        Room, 
        Booking, 
        RoomAvailability,
        // Enhanced onboarding entities
        EnhancedHotel,
        EnhancedRoom,
        AmenityDefinition,
        OnboardingSession,
        ImageMetadata,
        QualityReport,
        // Auth entities
        HotelUserRole,
        OnboardingAuditLog,
      ],
      synchronize: true, // Temporarily enable to create missing tables
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
  entities: [
    User, 
    AuditLog, 
    Hotel, 
    Room, 
    Booking, 
    RoomAvailability,
    // Enhanced onboarding entities
    EnhancedHotel,
    EnhancedRoom,
    AmenityDefinition,
    OnboardingSession,
    ImageMetadata,
    QualityReport,
    // Auth entities
    HotelUserRole,
    OnboardingAuditLog,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;