import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HotelsService } from './hotels.service';
import { HotelsController } from './hotels.controller';
import { Hotel } from './entities/hotel.entity';
import { AmenityDefinition } from './entities/amenity-definition.entity';
import { EnhancedHotel } from './entities/enhanced-hotel.entity';
import { OnboardingSession } from './entities/onboarding-session.entity';
import { ImageMetadata } from './entities/image-metadata.entity';
import { AmenityService } from './services/amenity.service';
import { ImageManagementService } from './services/image-management.service';
import { PropertyInformationService } from './services/property-information.service';
import { BusinessFeaturesService } from './services/business-features.service';
import { RoomEnhancementService } from './services/room-enhancement.service';
import { PropertyInformationController } from './controllers/property-information.controller';
import { BusinessFeaturesController } from './controllers/business-features.controller';
import { OnboardingController } from './controllers/onboarding.controller';
import { IntegratedOnboardingController } from './controllers/integrated-onboarding.controller';
import { QualityAssuranceController } from './controllers/quality-assurance.controller';
import { DataIntegrationController } from './controllers/data-integration.controller';
import { PerformanceController } from './controllers/performance.controller';
import { OnboardingService } from './services/onboarding.service';
import { QualityAssuranceService } from './services/quality-assurance.service';
import { DataIntegrationService } from './services/data-integration.service';
import { EnhancedDataService } from './services/enhanced-data.service';
import { PerformanceOptimizedImageService } from './services/performance-optimized-image.service';
import { PerformanceCacheService } from './services/performance-cache.service';
import { InMemoryCacheService } from './services/in-memory-cache.service';
import { MobileOptimizationService } from './services/mobile-optimization.service';
import { SystemIntegrationListener } from './listeners/system-integration.listener';
import { QualityReport } from './entities/quality-report.entity';
import { RoomsModule } from '../rooms/rooms.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/entities/user.entity';
import { EnhancedRoom } from '../rooms/entities/enhanced-room.entity';
import { Room } from '../rooms/entities/room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Hotel,
      AmenityDefinition,
      EnhancedHotel,
      OnboardingSession,
      ImageMetadata,
      QualityReport,
      User,
      EnhancedRoom,
      Room,
    ]),
    EventEmitterModule,
    RoomsModule,
    UsersModule,
    forwardRef(() => AuthModule), // Use forwardRef to avoid circular dependency
  ],
  controllers: [HotelsController, PropertyInformationController, BusinessFeaturesController, OnboardingController, IntegratedOnboardingController, QualityAssuranceController, DataIntegrationController, PerformanceController],
  providers: [HotelsService, AmenityService, ImageManagementService, PropertyInformationService, BusinessFeaturesService, RoomEnhancementService, OnboardingService, QualityAssuranceService, DataIntegrationService, EnhancedDataService, PerformanceOptimizedImageService, PerformanceCacheService, MobileOptimizationService, SystemIntegrationListener, InMemoryCacheService],
  exports: [HotelsService, AmenityService, ImageManagementService, PropertyInformationService, BusinessFeaturesService, RoomEnhancementService, OnboardingService, QualityAssuranceService, DataIntegrationService, EnhancedDataService, PerformanceOptimizedImageService, PerformanceCacheService, MobileOptimizationService],
})
export class HotelsModule { }