import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

// Import all services
import { OnboardingService, StepData, OnboardingDraft } from '../services/onboarding.service';
import { AmenityService } from '../services/amenity.service';
import { ImageManagementService } from '../services/image-management.service';
import { PropertyInformationService } from '../services/property-information.service';
import { RoomEnhancementService } from '../services/room-enhancement.service';
import { EntityType } from '../entities/image-metadata.entity';
import { BusinessFeaturesService } from '../services/business-features.service';
import { QualityAssuranceService } from '../services/quality-assurance.service';
import { DataIntegrationService } from '../services/data-integration.service';
import { MobileOptimizationService } from '../services/mobile-optimization.service';

// DTOs for integrated flow
export class CreateIntegratedSessionDto {
  hotelId?: string; // Optional for new hotels
  deviceInfo?: {
    type: 'mobile' | 'tablet' | 'desktop';
    userAgent: string;
    screenSize: { width: number; height: number };
  };
}

export class CompleteIntegratedOnboardingDto {
  finalReview?: boolean;
  publishImmediately?: boolean;
}

export class ValidateIntegratedStepDto {
  stepId: string;
  data: StepData;
  validateDependencies?: boolean;
}

@Controller('hotels/integrated-onboarding')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegratedOnboardingController {
  private readonly logger = new Logger(IntegratedOnboardingController.name);

  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly amenityService: AmenityService,
    private readonly imageManagementService: ImageManagementService,
    private readonly propertyInfoService: PropertyInformationService,
    private readonly roomEnhancementService: RoomEnhancementService,
    private readonly businessFeaturesService: BusinessFeaturesService,
    private readonly qualityAssuranceService: QualityAssuranceService,
    private readonly dataIntegrationService: DataIntegrationService,
    private readonly mobileOptimizationService: MobileOptimizationService,
  ) {}

  /**
   * Create integrated onboarding session with mobile optimization
   * Requirements: 6.1, 6.4 - Mobile-first onboarding with offline support
   */
  @Post('sessions')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async createIntegratedSession(
    @Body() createDto: CreateIntegratedSessionDto,
    @Request() req: any,
  ) {
    this.logger.log(`Creating integrated onboarding session for user ${req.user.id}`);

    try {
      // Create or get hotel ID
      let hotelId = createDto.hotelId;
      if (!hotelId) {
        // Create new hotel placeholder
        const newHotel = await this.dataIntegrationService.createHotelPlaceholder(req.user.id);
        hotelId = newHotel.id;
      }

      // Create onboarding session
      const session = await this.onboardingService.createOnboardingSession(
        hotelId,
        req.user.id,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      );

      // Get initial data for mobile optimization
      const mobileConfig = await this.mobileOptimizationService.getOptimizedConfig(
        createDto.deviceInfo?.type || 'mobile',
      );

      // Get amenity categories for first step
      const amenityCategories = await this.amenityService.getAmenitiesByCategory();

      return {
        success: true,
        data: {
          sessionId: session.id,
          hotelId,
          currentStep: session.currentStep,
          completedSteps: session.completedSteps,
          qualityScore: session.qualityScore,
          expiresAt: session.expiresAt,
          mobileConfig,
          initialData: {
            amenityCategories,
            maxImageSize: mobileConfig.maxImageSize,
            compressionLevel: mobileConfig.compressionLevel,
          },
        },
        message: 'Integrated onboarding session created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create integrated session:', error);
      throw new BadRequestException('Failed to create onboarding session');
    }
  }

  /**
   * Update step with integrated validation and processing
   * Requirements: 6.5 - Real-time validation, 8.3 - Data consistency
   */
  @Put('sessions/:sessionId/steps/:stepId')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async updateIntegratedStep(
    @Param('sessionId') sessionId: string,
    @Param('stepId') stepId: string,
    @Body() stepData: StepData,
    @Request() req: any,
  ) {
    this.logger.log(`Updating integrated step ${stepId} for session ${sessionId}`);

    try {
      // Process step data through appropriate service
      let processedData: StepData;

      switch (stepId) {
        case 'amenities':
          processedData = await this.processAmenityStep(stepData, req.user.id);
          break;
        case 'images':
          processedData = await this.processImageStep(stepData, sessionId);
          break;
        case 'property-info':
          processedData = await this.processPropertyInfoStep(stepData, sessionId);
          break;
        case 'rooms':
          processedData = await this.processRoomStep(stepData, sessionId);
          break;
        case 'business-features':
          processedData = await this.processBusinessFeaturesStep(stepData, sessionId);
          break;
        default:
          processedData = stepData;
      }

      // Update onboarding session
      await this.onboardingService.updateOnboardingStep(
        sessionId,
        stepId,
        processedData,
        req.user.id,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      );

      // Calculate updated quality score
      const session = await this.onboardingService.getSessionProgress(sessionId);
      const qualityScore = await this.qualityAssuranceService.calculateQualityScore({
        images: processedData.images,
        amenities: processedData.amenities,
        propertyDescription: processedData.propertyDescription,
        locationDetails: processedData.locationDetails,
        policies: processedData.policies,
        businessFeatures: processedData.businessFeatures,
      });

      return {
        success: true,
        data: {
          stepId,
          qualityScore: qualityScore.overallScore,
          progress: session,
          recommendations: qualityScore.breakdown,
        },
        message: 'Step updated successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to update step ${stepId}:`, error);
      throw new BadRequestException(`Failed to update ${stepId} step`);
    }
  }

  /**
   * Validate step with cross-step dependencies
   * Requirements: 6.5 - Real-time validation without form submission
   */
  @Post('sessions/:sessionId/validate')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async validateIntegratedStep(
    @Param('sessionId') sessionId: string,
    @Body() validateDto: ValidateIntegratedStepDto,
  ) {
    this.logger.log(`Validating integrated step ${validateDto.stepId} for session ${sessionId}`);

    try {
      // Get current session data for dependency validation
      const draftData = await this.onboardingService.loadDraft(sessionId);

      // Perform step-specific validation
      let validationResult = await this.onboardingService.validateStepData(
        validateDto.stepId,
        validateDto.data,
      );

      // Perform cross-step dependency validation if requested
      if (validateDto.validateDependencies) {
        const dependencyValidation = await this.validateStepDependencies(
          validateDto.stepId,
          validateDto.data,
          draftData,
        );
        
        validationResult = {
          ...validationResult,
          warnings: [...validationResult.warnings, ...dependencyValidation.warnings],
          errors: [...validationResult.errors, ...dependencyValidation.errors],
        };
        validationResult.isValid = validationResult.isValid && dependencyValidation.isValid;
      }

      return {
        success: true,
        data: validationResult,
        message: 'Validation completed',
      };
    } catch (error) {
      this.logger.error(`Failed to validate step ${validateDto.stepId}:`, error);
      throw new BadRequestException('Validation failed');
    }
  }

  /**
   * Complete integrated onboarding with full system integration
   * Requirements: 7.1 - Quality score calculation, 8.4 - System integration
   */
  @Post('sessions/:sessionId/complete')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async completeIntegratedOnboarding(
    @Param('sessionId') sessionId: string,
    @Body() completeDto: CompleteIntegratedOnboardingDto,
    @Request() req: any,
  ) {
    this.logger.log(`Completing integrated onboarding for session ${sessionId}`);

    try {
      // Complete onboarding through main service
      const result = await this.onboardingService.completeOnboarding(
        sessionId,
        req.user.id,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      );

      if (!result.success) {
        throw new BadRequestException(result.message);
      }

      // Trigger system integrations
      await this.dataIntegrationService.triggerSystemIntegrations(result.hotelId, {
        searchIndex: true,
        bookingEngine: true,
        analytics: true,
        partnerDashboard: true,
      });

      // Generate final quality report
      const qualityReport = await this.qualityAssuranceService.createQualityReport(sessionId);

      // Send completion notifications
      await this.sendCompletionNotifications(result.hotelId, req.user.id, qualityReport);

      return {
        success: true,
        data: {
          sessionId: result.sessionId,
          hotelId: result.hotelId,
          qualityScore: result.qualityScore,
          qualityReport,
          integrationStatus: {
            searchIndex: 'completed',
            bookingEngine: 'completed',
            analytics: 'completed',
            partnerDashboard: 'completed',
          },
        },
        message: 'Onboarding completed successfully with full system integration',
      };
    } catch (error) {
      this.logger.error(`Failed to complete integrated onboarding:`, error);
      throw new BadRequestException('Failed to complete onboarding');
    }
  }

  /**
   * Get comprehensive session status with all integrations
   * Requirements: 6.2 - Progress indicators, 7.5 - Quality reporting
   */
  @Get('sessions/:sessionId/status')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async getIntegratedSessionStatus(@Param('sessionId') sessionId: string) {
    this.logger.log(`Getting integrated session status for ${sessionId}`);

    try {
      const session = await this.onboardingService.getSessionProgress(sessionId);
      const draftData = await this.onboardingService.loadDraft(sessionId);
      
      // Get quality assessment
      const qualityScore = await this.qualityAssuranceService.calculateQualityScore({
        images: (draftData.images as any) || [],
        amenities: (draftData.amenities as any) || {},
        propertyDescription: (draftData.propertyDescription as any) || null,
        locationDetails: (draftData.locationDetails as any) || null,
        policies: (draftData.policies as any) || null,
        businessFeatures: (draftData.businessFeatures as any) || null,
      });

      // Get missing information alerts
      const missingInfo = await this.qualityAssuranceService.identifyMissingInformation(draftData);

      // Get recommendations
      const recommendations = await this.qualityAssuranceService.generateRecommendations(qualityScore, missingInfo);

      return {
        success: true,
        data: {
          session,
          draftData,
          qualityScore,
          missingInfo,
          recommendations,
          stepValidation: await this.getStepValidationStatus(sessionId, draftData),
        },
        message: 'Session status retrieved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to get session status:`, error);
      throw new NotFoundException('Session not found');
    }
  }

  /**
   * Get mobile-optimized configuration
   * Requirements: 6.1 - Mobile-first interface, 9.5 - Mobile data optimization
   */
  @Get('mobile-config')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async getMobileConfig(@Request() req: any) {
    const deviceType = this.detectDeviceType(req.headers['user-agent']);
    const config = await this.mobileOptimizationService.getOptimizedConfig(deviceType);

    return {
      success: true,
      data: config,
      message: 'Mobile configuration retrieved',
    };
  }

  // Private helper methods

  private async processAmenityStep(stepData: StepData, userId: string): Promise<StepData> {
    // Validate amenity selection against business rules
    const validationResult = await this.amenityService.validateAmenitySelection(
      stepData.selectedAmenities || [],
      stepData.propertyType || 'HOTEL',
    );

    if (!validationResult.isValid) {
      throw new BadRequestException(`Amenity validation failed: ${validationResult.errors.join(', ')}`);
    }

    return {
      ...stepData,
      amenities: stepData.selectedAmenities || [],
      validationWarnings: validationResult.warnings,
    };
  }

  private async processImageStep(stepData: StepData, sessionId: string): Promise<StepData> {
    const processedImages = [];

    for (const image of stepData.images || []) {
      if (image.file) {
        // Process uploaded image
        const processedImage = await this.imageManagementService.uploadImage(
          image.file,
          image.category || 'EXTERIOR',
          EntityType.HOTEL,
          sessionId, // Using sessionId as entityId
          stepData.userId || 'temp',
        );
        processedImages.push(processedImage);
      } else if (image.id) {
        // Reference to existing image
        processedImages.push(image);
      }
    }

    return {
      ...stepData,
      images: processedImages,
    };
  }

  private async processPropertyInfoStep(stepData: StepData, sessionId: string): Promise<StepData> {
    // Process rich text content
    if (stepData.description) {
      const processedDescription = await this.propertyInfoService.updatePropertyDescription(
        sessionId, // Using sessionId as hotelId for now
        {
          content: stepData.description,
          format: 'markdown',
        },
      );
      stepData.description = processedDescription;
    }

    // Validate and process location details
    if (stepData.locationDetails) {
      stepData.locationDetails = await this.propertyInfoService.updateLocationDetails(
        sessionId, // Using sessionId as hotelId for now
        stepData.locationDetails,
      );
    }

    return stepData;
  }

  private async processRoomStep(stepData: StepData, sessionId: string): Promise<StepData> {
    const processedRooms = [];

    for (const room of stepData.rooms || []) {
      const processedRoom = await this.roomEnhancementService.processRoomConfiguration(room);
      processedRooms.push(processedRoom);
    }

    return {
      ...stepData,
      rooms: processedRooms,
      roomValidationReport: await this.roomEnhancementService.validateRoomConfiguration(processedRooms),
    };
  }

  private async processBusinessFeaturesStep(stepData: StepData, sessionId: string): Promise<StepData> {
    if (stepData.meetingRooms) {
      // Process meeting rooms using existing business features service
      const businessFeatures = await this.businessFeaturesService.updateBusinessFeatures(
        sessionId, // Using sessionId as hotelId
        { meetingRooms: stepData.meetingRooms },
      );
      stepData.meetingRooms = businessFeatures.meetingRooms;
    }

    if (stepData.connectivity) {
      // Update connectivity details using business features service
      const businessFeatures = await this.businessFeaturesService.updateBusinessFeatures(
        sessionId, // Using sessionId as hotelId
        { connectivity: stepData.connectivity },
      );
      stepData.connectivity = businessFeatures.connectivity;
    }

    return stepData;
  }

  private async validateStepDependencies(
    stepId: string,
    stepData: StepData,
    allDraftData: OnboardingDraft,
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const result = { isValid: true, errors: [], warnings: [] };

    switch (stepId) {
      case 'rooms':
        // Validate room amenities against property amenities
        if (allDraftData.amenities && stepData.rooms) {
          const propertyAmenities = allDraftData.amenities.selectedAmenities || [];
          for (const room of stepData.rooms) {
            if (room.amenities) {
              const invalidAmenities = room.amenities.filter(
                (amenity: string) => !propertyAmenities.includes(amenity),
              );
              if (invalidAmenities.length > 0) {
                result.warnings.push(
                  `Room "${room.name}" has amenities not available at property level: ${invalidAmenities.join(', ')}`,
                );
              }
            }
          }
        }
        break;

      case 'business-features':
        // Validate business features against property type
        if (allDraftData['property-info'] && stepData.meetingRooms) {
          const propertyType = allDraftData['property-info'].propertyType;
          if (propertyType === 'GUEST_HOUSE' && stepData.meetingRooms.length > 0) {
            result.warnings.push('Meeting rooms are uncommon for guest houses');
          }
        }
        break;
    }

    return result;
  }

  private async getStepValidationStatus(
    sessionId: string,
    draftData: OnboardingDraft,
  ): Promise<Record<string, any>> {
    const validationStatus: Record<string, any> = {};

    for (const stepId of Object.keys(draftData)) {
      try {
        validationStatus[stepId] = await this.onboardingService.validateStepData(
          stepId,
          draftData[stepId],
        );
      } catch (error) {
        validationStatus[stepId] = {
          isValid: false,
          errors: ['Validation failed'],
          warnings: [],
        };
      }
    }

    return validationStatus;
  }

  private detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
    if (!userAgent) return 'desktop';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') && !ua.includes('tablet')) return 'mobile';
    if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
    return 'desktop';
  }

  private async sendCompletionNotifications(
    hotelId: string,
    userId: string,
    qualityReport: any,
  ): Promise<void> {
    // Implementation would send notifications to:
    // - Hotel owner/manager
    // - Admin team for review
    // - Integration systems
    this.logger.log(`Sending completion notifications for hotel ${hotelId}`);
  }
}