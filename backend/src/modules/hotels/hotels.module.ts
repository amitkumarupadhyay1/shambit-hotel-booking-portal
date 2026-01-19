import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { PropertyInformationController } from './controllers/property-information.controller';
import { BusinessFeaturesController } from './controllers/business-features.controller';
import { OnboardingController } from './controllers/onboarding.controller';
import { QualityAssuranceController } from './controllers/quality-assurance.controller';
import { OnboardingService } from './services/onboarding.service';
import { QualityAssuranceService } from './services/quality-assurance.service';
import { QualityReport } from './entities/quality-report.entity';
import { RoomsModule } from '../rooms/rooms.module'; // Added this import
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity'; // Added User entity import

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Hotel,
      AmenityDefinition,
      EnhancedHotel,
      OnboardingSession,
      ImageMetadata,
      QualityReport,
      User, // Added User entity for OnboardingService
    ]),
    RoomsModule, // Added RoomsModule to imports
    UsersModule, // Added UsersModule for user repository access
  ],
  controllers: [HotelsController, PropertyInformationController, BusinessFeaturesController, OnboardingController, QualityAssuranceController],
  providers: [HotelsService, AmenityService, ImageManagementService, PropertyInformationService, BusinessFeaturesService, OnboardingService, QualityAssuranceService],
  exports: [HotelsService, AmenityService, ImageManagementService, PropertyInformationService, BusinessFeaturesService, OnboardingService, QualityAssuranceService],
})
export class HotelsModule { }