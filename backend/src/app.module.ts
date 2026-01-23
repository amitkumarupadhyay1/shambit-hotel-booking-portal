import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseConfig } from './config/database.config';
import { cacheConfig } from './config/cache.config';
import { rateLimitConfig } from './config/rate-limit.config';
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
import { RequestDeduplicationMiddleware } from './common/middleware/request-deduplication.middleware';
import { CSRFProtectionMiddleware } from './common/middleware/csrf-protection.middleware';
import { CsrfController } from './common/controllers/csrf.controller';
import { EnhancedThrottlerGuard } from './common/guards/enhanced-throttler.guard';

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

    // Enhanced rate limiting with multiple configurations
    ThrottlerModule.forRoot(rateLimitConfig),

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
  controllers: [CsrfController],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: EnhancedThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply CSRF protection middleware first
    consumer
      .apply(CSRFProtectionMiddleware)
      .exclude('/health', '/metrics')
      .forRoutes('*');

    // Apply request deduplication middleware after CSRF
    consumer
      .apply(RequestDeduplicationMiddleware)
      .exclude('/health', '/metrics')
      .forRoutes('*');
  }
}