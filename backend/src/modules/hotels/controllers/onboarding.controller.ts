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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { OnboardingService, StepData, OnboardingDraft } from '../services/onboarding.service';

export class CreateOnboardingSessionDto {
  hotelId: string;
}

export class UpdateStepDto {
  stepId: string;
  stepData: StepData;
}

export class SaveDraftDto {
  draftData: OnboardingDraft;
}

export class ValidateStepDto {
  stepId: string;
  data: StepData;
}

@Controller('hotels/onboarding')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OnboardingController {
  private readonly logger = new Logger(OnboardingController.name);

  constructor(private readonly onboardingService: OnboardingService) {}

  /**
   * Create a new onboarding session
   * Requirements: 6.1 - Mobile-first onboarding interface
   */
  @Post('sessions')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async createSession(@Body() createDto: CreateOnboardingSessionDto, @Request() req: any) {
    this.logger.log(`Creating onboarding session for hotel ${createDto.hotelId}`);
    
    const session = await this.onboardingService.createOnboardingSession(
      createDto.hotelId,
      req.user.id,
    );

    return {
      success: true,
      data: {
        sessionId: session.id,
        currentStep: session.currentStep,
        completedSteps: session.completedSteps,
        qualityScore: session.qualityScore,
        expiresAt: session.expiresAt,
      },
      message: 'Onboarding session created successfully',
    };
  }

  /**
   * Update onboarding step data
   * Requirements: 6.5 - Real-time validation
   */
  @Put('sessions/:sessionId/steps')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async updateStep(
    @Param('sessionId') sessionId: string,
    @Body() updateDto: UpdateStepDto,
    @Request() req: any,
  ) {
    this.logger.log(`Updating step ${updateDto.stepId} for session ${sessionId}`);

    await this.onboardingService.updateOnboardingStep(
      sessionId,
      updateDto.stepId,
      updateDto.stepData,
      req.user.id,
    );

    return {
      success: true,
      message: 'Step updated successfully',
    };
  }

  /**
   * Validate step data
   * Requirements: 6.5 - Real-time validation without form submission
   */
  @Post('validate-step')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async validateStep(@Body() validateDto: ValidateStepDto) {
    this.logger.log(`Validating step ${validateDto.stepId}`);

    const validationResult = await this.onboardingService.validateStepData(
      validateDto.stepId,
      validateDto.data,
    );

    return {
      success: true,
      data: validationResult,
      message: 'Validation completed',
    };
  }

  /**
   * Complete onboarding process
   * Requirements: 7.1 - Quality score calculation, 8.4 - System integration
   */
  @Post('sessions/:sessionId/complete')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async completeOnboarding(@Param('sessionId') sessionId: string, @Request() req: any) {
    this.logger.log(`Completing onboarding for session ${sessionId}`);

    const result = await this.onboardingService.completeOnboarding(sessionId, req.user.id);

    return {
      success: result.success,
      data: {
        sessionId: result.sessionId,
        hotelId: result.hotelId,
        qualityScore: result.qualityScore,
      },
      message: result.message,
    };
  }

  /**
   * Save draft data
   * Requirements: 6.4 - Offline draft saving and sync
   */
  @Put('sessions/:sessionId/draft')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async saveDraft(
    @Param('sessionId') sessionId: string,
    @Body() saveDto: SaveDraftDto,
  ) {
    this.logger.log(`Saving draft for session ${sessionId}`);

    await this.onboardingService.saveDraft(sessionId, saveDto.draftData);

    return {
      success: true,
      message: 'Draft saved successfully',
    };
  }

  /**
   * Load draft data
   * Requirements: 6.4 - Offline draft saving and sync
   */
  @Get('sessions/:sessionId/draft')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async loadDraft(@Param('sessionId') sessionId: string) {
    this.logger.log(`Loading draft for session ${sessionId}`);

    const draftData = await this.onboardingService.loadDraft(sessionId);

    return {
      success: true,
      data: draftData,
      message: 'Draft loaded successfully',
    };
  }

  /**
   * Mark step as completed
   * Requirements: 6.6 - Step completion and review functionality
   */
  @Post('sessions/:sessionId/steps/:stepId/complete')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async markStepCompleted(
    @Param('sessionId') sessionId: string,
    @Param('stepId') stepId: string,
  ) {
    this.logger.log(`Marking step ${stepId} as completed for session ${sessionId}`);

    await this.onboardingService.markStepCompleted(sessionId, stepId);

    return {
      success: true,
      message: 'Step marked as completed',
    };
  }

  /**
   * Get session progress
   * Requirements: 6.2 - Progress indicators and seamless transitions
   */
  @Get('sessions/:sessionId/progress')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async getSessionProgress(@Param('sessionId') sessionId: string) {
    this.logger.log(`Getting progress for session ${sessionId}`);

    const progress = await this.onboardingService.getSessionProgress(sessionId);

    return {
      success: true,
      data: progress,
      message: 'Progress retrieved successfully',
    };
  }

  /**
   * Get session details
   * Requirements: 6.6 - Review and edit previous steps
   */
  @Get('sessions/:sessionId')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async getSession(@Param('sessionId') sessionId: string) {
    this.logger.log(`Getting session details for ${sessionId}`);

    const progress = await this.onboardingService.getSessionProgress(sessionId);
    const draftData = await this.onboardingService.loadDraft(sessionId);

    return {
      success: true,
      data: {
        ...progress,
        draftData,
      },
      message: 'Session details retrieved successfully',
    };
  }

  /**
   * Health check endpoint for mobile apps
   * Requirements: 6.4 - Offline functionality detection
   */
  @Get('health')
  async healthCheck() {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
      message: 'Onboarding service is operational',
    };
  }
}