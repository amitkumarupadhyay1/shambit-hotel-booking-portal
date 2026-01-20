import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { DatabaseConfig } from './config/database.config';
import { cacheConfig } from './config/cache.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AuditModule } from './modules/audit/audit.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { AdminHotelsModule } from './modules/admin-hotels/admin-hotels.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { SearchModule } from './modules/search/search.module';
import { SellerDashboardModule } from './modules/seller-dashboard/seller-dashboard.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // Cache
    CacheModule.registerAsync(cacheConfig),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    AuditModule,
    HotelsModule,
    RoomsModule,
    BookingsModule,
    AdminHotelsModule,
    AvailabilityModule,
    SearchModule,
    SellerDashboardModule,
  ],
})
export class AppModule { }