import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HotelPermissionGuard, RequireHotelPermission } from '../../auth/guards/hotel-permission.guard';
import { EncryptResponse, EncryptionInterceptor } from '../../auth/interceptors/encryption.interceptor';
import { OnboardingPermission } from '../../auth/enums/hotel-roles.enum';
import { OnboardingService } from '../services/onboarding.service';
import { EncryptionService } from '../../auth/services/encryption.service';

export class SecureOnboardingStepDto {
  sessionId: string;
  stepId: string;
  stepData: any;
}

/**
 * Secure onboarding controller with encryption and RBAC
 * Requirements: 10.1, 10.2 - Role-based access control and data encryption
 */
@Controller('secure-onboarding')
@UseGuards(JwtAuthGuard)
@UseInterceptors(EncryptionInterceptor)
export class SecureOnboardingController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Create secure onboarding session
   * Requirements: 10.1 - Role-based session creation
   */
  @Post('sessions')
  @UseGuards(HotelPermissionGuard)
  @RequireHotelPermission(OnboardingPermission.CREATE_SESSION)
  async createSecureSession(
    @Body() body: { hotelId: string },
    @Request() req
  ) {
    const session = await this.onboardingService.createOnboardingSession(
      body.hotelId,
      req.user.id,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    );

    return {
      success: true,
      sessionId: session.id,
      message: 'Secure onboarding session created',
    };
  }

  /**
   * Update onboarding step with encryption
   * Requirements: 10.1, 10.2 - Secure step updates with RBAC
   */
  @Post('steps')
  @UseGuards(HotelPermissionGuard)
  @EncryptResponse(['stepData'])
  async updateSecureStep(
    @Body() dto: SecureOnboardingStepDto,
    @Request() req
  ) {
    // Get session to determine hotel ID for permission check
    const session = await this.onboardingService.loadDraft(dto.sessionId);
    
    await this.onboardingService.updateOnboardingStep(
      dto.sessionId,
      dto.stepId,
      dto.stepData,
      req.user.id,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    );

    return {
      success: true,
      message: 'Onboarding step updated securely',
      stepId: dto.stepId,
    };
  }

  /**
   * Get encrypted session data
   * Requirements: 10.2 - Encrypted data retrieval
   */
  @Get('sessions/:sessionId/data')
  @UseGuards(HotelPermissionGuard)
  @RequireHotelPermission(OnboardingPermission.VIEW_SESSION)
  @EncryptResponse(['draftData'])
  async getSecureSessionData(@Param('sessionId') sessionId: string) {
    const draftData = await this.onboardingService.loadDraft(sessionId);

    return {
      success: true,
      sessionId,
      draftData,
      message: 'Session data retrieved securely',
    };
  }

  /**
   * Complete onboarding with full security
   * Requirements: 10.1, 10.2 - Secure completion with audit
   */
  @Post('sessions/:sessionId/complete')
  @UseGuards(HotelPermissionGuard)
  @RequireHotelPermission(OnboardingPermission.COMPLETE_SESSION)
  async completeSecureOnboarding(
    @Param('sessionId') sessionId: string,
    @Request() req
  ) {
    const result = await this.onboardingService.completeOnboarding(
      sessionId,
      req.user.id,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    );

    return {
      success: result.success,
      hotelId: result.hotelId,
      qualityScore: result.qualityScore,
      message: 'Onboarding completed securely',
    };
  }

  /**
   * Encrypt sensitive data manually
   * Requirements: 10.2 - Manual encryption for sensitive operations
   */
  @Post('encrypt')
  async encryptData(@Body() body: { data: string }) {
    const encrypted = this.encryptionService.encrypt(body.data);

    return {
      success: true,
      encrypted,
      message: 'Data encrypted successfully',
    };
  }

  /**
   * Decrypt sensitive data manually
   * Requirements: 10.2 - Manual decryption for sensitive operations
   */
  @Post('decrypt')
  async decryptData(@Body() body: { encryptedData: string; iv: string; tag: string }) {
    const decrypted = this.encryptionService.decrypt({
      encryptedData: body.encryptedData,
      iv: body.iv,
      tag: body.tag,
    });

    return {
      success: true,
      decrypted,
      message: 'Data decrypted successfully',
    };
  }
}