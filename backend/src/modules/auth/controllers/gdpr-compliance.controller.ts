import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { GdprComplianceService, DataExportRequest, DataDeletionRequest, ConsentRecord } from '../services/gdpr-compliance.service';
import { EncryptResponse } from '../interceptors/encryption.interceptor';

export class DataExportDto {
  userId: string;
  includeAuditLogs: boolean = false;
  includeOnboardingData: boolean = true;
  includeHotelRoles: boolean = true;
  format: 'json' | 'csv' = 'json';
}

export class DataDeletionDto {
  userId: string;
  reason: string;
  retainAuditLogs: boolean = true;
  confirmationToken: string;
}

export class ConsentDto {
  userId: string;
  consentType: 'data_processing' | 'marketing' | 'analytics' | 'cookies';
  granted: boolean;
}

export class ComplianceReportDto {
  startDate: string;
  endDate: string;
}

/**
 * Controller for GDPR/CCPA compliance operations
 * Requirements: 10.3 - GDPR/CCPA compliance measures
 */
@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class GdprComplianceController {
  constructor(private readonly gdprService: GdprComplianceService) {}

  /**
   * Export user data for GDPR compliance
   * Requirements: 10.3 - Right to data portability
   */
  @Post('export-data')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @EncryptResponse(['data'])
  async exportUserData(@Body() dto: DataExportDto, @Request() req) {
    const request: DataExportRequest = {
      userId: dto.userId,
      requestedBy: req.user.id,
      includeAuditLogs: dto.includeAuditLogs,
      includeOnboardingData: dto.includeOnboardingData,
      includeHotelRoles: dto.includeHotelRoles,
      format: dto.format,
    };

    const result = await this.gdprService.exportUserData(request);

    return {
      success: true,
      filename: result.filename,
      format: result.format,
      data: result.data,
      message: 'User data exported successfully',
    };
  }

  /**
   * Export own data (user self-service)
   * Requirements: 10.3 - User self-service data export
   */
  @Post('export-my-data')
  @EncryptResponse(['data'])
  async exportMyData(@Body() dto: Omit<DataExportDto, 'userId'>, @Request() req) {
    const request: DataExportRequest = {
      userId: req.user.id,
      requestedBy: req.user.id,
      includeAuditLogs: dto.includeAuditLogs,
      includeOnboardingData: dto.includeOnboardingData,
      includeHotelRoles: dto.includeHotelRoles,
      format: dto.format,
    };

    const result = await this.gdprService.exportUserData(request);

    return {
      success: true,
      filename: result.filename,
      format: result.format,
      data: result.data,
      message: 'Your data has been exported successfully',
    };
  }

  /**
   * Delete user data for GDPR compliance
   * Requirements: 10.3 - Right to erasure
   */
  @Delete('delete-data')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteUserData(@Body() dto: DataDeletionDto, @Request() req) {
    const request: DataDeletionRequest = {
      userId: dto.userId,
      requestedBy: req.user.id,
      reason: dto.reason,
      retainAuditLogs: dto.retainAuditLogs,
      confirmationToken: dto.confirmationToken,
    };

    const result = await this.gdprService.deleteUserData(request);

    return {
      success: result.success,
      deletedRecords: result.deletedRecords,
      retainedRecords: result.retainedRecords,
      message: result.message,
    };
  }

  /**
   * Request account deletion (user self-service)
   * Requirements: 10.3 - User self-service account deletion
   */
  @Delete('delete-my-account')
  @HttpCode(HttpStatus.OK)
  async deleteMyAccount(
    @Body() dto: Omit<DataDeletionDto, 'userId'>,
    @Request() req
  ) {
    const request: DataDeletionRequest = {
      userId: req.user.id,
      requestedBy: req.user.id,
      reason: dto.reason,
      retainAuditLogs: dto.retainAuditLogs,
      confirmationToken: dto.confirmationToken,
    };

    const result = await this.gdprService.deleteUserData(request);

    return {
      success: result.success,
      deletedRecords: result.deletedRecords,
      retainedRecords: result.retainedRecords,
      message: result.message,
    };
  }

  /**
   * Record user consent
   * Requirements: 10.3 - Consent management
   */
  @Post('consent')
  async recordConsent(@Body() dto: ConsentDto, @Request() req) {
    // Users can only record consent for themselves unless they're admin
    if (dto.userId !== req.user.id && !req.user.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('You can only record consent for yourself');
    }

    const consent: ConsentRecord = {
      userId: dto.userId,
      consentType: dto.consentType,
      granted: dto.granted,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    };

    await this.gdprService.recordConsent(consent);

    return {
      success: true,
      message: `Consent for ${dto.consentType} has been ${dto.granted ? 'granted' : 'withdrawn'}`,
    };
  }

  /**
   * Get data retention policies
   * Requirements: 10.3 - Data retention transparency
   */
  @Get('retention-policies')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getRetentionPolicies() {
    // Return all retention policies (this would typically come from configuration)
    const policies = [
      {
        dataType: 'onboarding_sessions',
        retentionPeriodDays: 2555,
        description: '7 years retention for business records',
        autoDelete: false,
        encryptionRequired: true,
      },
      {
        dataType: 'audit_logs',
        retentionPeriodDays: 2555,
        description: '7 years retention for compliance',
        autoDelete: false,
        encryptionRequired: true,
      },
      {
        dataType: 'user_roles',
        retentionPeriodDays: 1095,
        description: '3 years after role removal',
        autoDelete: true,
        encryptionRequired: false,
      },
      {
        dataType: 'hotel_data',
        retentionPeriodDays: 3650,
        description: '10 years for business records',
        autoDelete: false,
        encryptionRequired: true,
      },
    ];

    return {
      policies,
      message: 'Data retention policies retrieved successfully',
    };
  }

  /**
   * Check data retention and cleanup expired data
   * Requirements: 10.3 - Automated data retention
   */
  @Post('retention-check')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async checkDataRetention(@Request() req) {
    const result = await this.gdprService.checkDataRetention();

    return {
      success: true,
      expiredRecords: result.expiredRecords,
      deletedRecords: result.deletedRecords,
      errors: result.errors,
      message: `Data retention check completed. ${result.deletedRecords} records deleted.`,
    };
  }

  /**
   * Generate compliance report
   * Requirements: 10.3 - Compliance reporting
   */
  @Post('report')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async generateComplianceReport(@Body() dto: ComplianceReportDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 format.');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const report = await this.gdprService.generateComplianceReport(startDate, endDate);

    return {
      success: true,
      report,
      message: 'Compliance report generated successfully',
    };
  }

  /**
   * Validate processing lawfulness
   * Requirements: 10.3 - Lawful basis validation
   */
  @Get('validate-processing/:userId/:purpose')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async validateProcessingLawfulness(
    @Param('userId') userId: string,
    @Param('purpose') purpose: string
  ) {
    const validation = await this.gdprService.validateProcessingLawfulness(userId, purpose);

    return {
      success: true,
      validation,
      message: `Processing lawfulness validated for ${purpose}`,
    };
  }

  /**
   * Get processing lawfulness for current user
   * Requirements: 10.3 - User transparency
   */
  @Get('my-processing/:purpose')
  async getMyProcessingLawfulness(
    @Param('purpose') purpose: string,
    @Request() req
  ) {
    const validation = await this.gdprService.validateProcessingLawfulness(req.user.id, purpose);

    return {
      success: true,
      validation,
      message: `Your data processing lawfulness for ${purpose}`,
    };
  }
}