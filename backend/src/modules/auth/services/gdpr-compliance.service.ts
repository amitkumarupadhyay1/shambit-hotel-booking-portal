import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OnboardingAuditService } from './onboarding-audit.service';
import { EncryptionService } from './encryption.service';
import { User } from '../../users/entities/user.entity';
import { EnhancedHotel } from '../../hotels/entities/enhanced-hotel.entity';
import { OnboardingSession } from '../../hotels/entities/onboarding-session.entity';
import { HotelUserRole } from '../entities/hotel-user-role.entity';
import { OnboardingAuditLog } from '../entities/onboarding-audit-log.entity';

export interface DataExportRequest {
  userId: string;
  requestedBy: string;
  includeAuditLogs: boolean;
  includeOnboardingData: boolean;
  includeHotelRoles: boolean;
  format: 'json' | 'csv';
}

export interface DataDeletionRequest {
  userId: string;
  requestedBy: string;
  reason: string;
  retainAuditLogs: boolean;
  confirmationToken: string;
}

export interface ConsentRecord {
  userId: string;
  consentType: 'data_processing' | 'marketing' | 'analytics' | 'cookies';
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriodDays: number;
  autoDelete: boolean;
  encryptionRequired: boolean;
}

/**
 * GDPR/CCPA compliance service for data protection
 * Requirements: 10.3 - GDPR/CCPA compliance measures
 */
@Injectable()
export class GdprComplianceService {
  private readonly logger = new Logger(GdprComplianceService.name);

  // Data retention policies
  private readonly retentionPolicies: DataRetentionPolicy[] = [
    {
      dataType: 'onboarding_sessions',
      retentionPeriodDays: 2555, // 7 years for business records
      autoDelete: false,
      encryptionRequired: true,
    },
    {
      dataType: 'audit_logs',
      retentionPeriodDays: 2555, // 7 years for compliance
      autoDelete: false,
      encryptionRequired: true,
    },
    {
      dataType: 'user_roles',
      retentionPeriodDays: 1095, // 3 years after role removal
      autoDelete: true,
      encryptionRequired: false,
    },
    {
      dataType: 'hotel_data',
      retentionPeriodDays: 3650, // 10 years for business records
      autoDelete: false,
      encryptionRequired: true,
    },
  ];

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EnhancedHotel)
    private readonly hotelRepository: Repository<EnhancedHotel>,
    @InjectRepository(OnboardingSession)
    private readonly sessionRepository: Repository<OnboardingSession>,
    @InjectRepository(HotelUserRole)
    private readonly roleRepository: Repository<HotelUserRole>,
    @InjectRepository(OnboardingAuditLog)
    private readonly auditLogRepository: Repository<OnboardingAuditLog>,
    private readonly dataSource: DataSource,
    private readonly auditService: OnboardingAuditService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Export user data for GDPR compliance
   * Requirements: 10.3 - Right to data portability
   */
  async exportUserData(request: DataExportRequest): Promise<{
    data: any;
    format: string;
    filename: string;
  }> {
    this.logger.log(`Exporting data for user ${request.userId} requested by ${request.requestedBy}`);

    const exportData: any = {
      exportInfo: {
        userId: request.userId,
        exportDate: new Date().toISOString(),
        requestedBy: request.requestedBy,
        format: request.format,
      },
      userData: {},
    };

    try {
      // Get user basic information
      const user = await this.userRepository.findOne({
        where: { id: request.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      exportData.userData.basicInfo = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
      };

      // Get hotel roles if requested
      if (request.includeHotelRoles) {
        const hotelRoles = await this.roleRepository.find({
          where: { userId: request.userId },
          relations: ['hotel'],
        });

        exportData.userData.hotelRoles = hotelRoles.map(role => ({
          id: role.id,
          hotelId: role.hotelId,
          hotelName: role.hotel?.basicInfo?.name,
          role: role.role,
          isActive: role.isActive,
          assignedBy: role.assignedBy,
          expiresAt: role.expiresAt,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        }));
      }

      // Get onboarding data if requested
      if (request.includeOnboardingData) {
        const sessions = await this.sessionRepository.find({
          where: { userId: request.userId },
          relations: ['enhancedHotel'],
        });

        exportData.userData.onboardingSessions = sessions.map(session => ({
          id: session.id,
          hotelId: session.enhancedHotelId,
          hotelName: session.enhancedHotel?.basicInfo?.name,
          currentStep: session.currentStep,
          completedSteps: session.completedSteps,
          qualityScore: session.qualityScore,
          sessionStatus: session.sessionStatus,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          expiresAt: session.expiresAt,
          // Note: draftData is not included for privacy reasons unless specifically requested
        }));
      }

      // Get audit logs if requested
      if (request.includeAuditLogs) {
        const auditLogs = await this.auditLogRepository.find({
          where: { userId: request.userId },
          order: { createdAt: 'DESC' },
          take: 1000, // Limit to last 1000 entries
        });

        exportData.userData.auditLogs = auditLogs.map(log => ({
          id: log.id,
          action: log.action,
          hotelId: log.hotelId,
          sessionId: log.sessionId,
          stepId: log.stepId,
          description: log.description,
          createdAt: log.createdAt,
          // Note: previousData and newData are not included for privacy reasons
        }));
      }

      // Log the export request
      await this.auditService.logAuditEvent({
        action: 'DATA_EXPORTED' as any,
        userId: request.requestedBy,
        hotelId: 'system', // System-level operation
        metadata: {
          exportedUserId: request.userId,
          includeAuditLogs: request.includeAuditLogs,
          includeOnboardingData: request.includeOnboardingData,
          includeHotelRoles: request.includeHotelRoles,
          format: request.format,
        },
        description: `Exported user data for GDPR compliance: ${request.userId}`,
      });

      const filename = `user_data_export_${request.userId}_${Date.now()}.${request.format}`;

      return {
        data: exportData,
        format: request.format,
        filename,
      };
    } catch (error) {
      this.logger.error(`Failed to export user data for ${request.userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user data for GDPR compliance (Right to be forgotten)
   * Requirements: 10.3 - Right to erasure
   */
  async deleteUserData(request: DataDeletionRequest): Promise<{
    success: boolean;
    deletedRecords: number;
    retainedRecords: number;
    message: string;
  }> {
    this.logger.log(`Deleting data for user ${request.userId} requested by ${request.requestedBy}`);

    // Verify confirmation token
    const expectedToken = this.encryptionService.createIntegrityHash(
      `delete_user_${request.userId}_${request.requestedBy}`
    );

    if (!this.encryptionService.verifyIntegrity(expectedToken, request.confirmationToken)) {
      throw new Error('Invalid confirmation token');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let deletedRecords = 0;
    let retainedRecords = 0;

    try {
      // Delete hotel roles (unless they need to be retained for legal reasons)
      const rolesToDelete = await queryRunner.manager.find(HotelUserRole, {
        where: { userId: request.userId },
      });

      for (const role of rolesToDelete) {
        await queryRunner.manager.remove(role);
        deletedRecords++;
      }

      // Handle onboarding sessions
      const sessionsToDelete = await queryRunner.manager.find(OnboardingSession, {
        where: { userId: request.userId },
      });

      for (const session of sessionsToDelete) {
        // Anonymize instead of delete if retention is required
        session.userId = 'anonymized';
        session.draftData = {}; // Clear personal data
        await queryRunner.manager.save(session);
        retainedRecords++;
      }

      // Handle audit logs
      if (!request.retainAuditLogs) {
        const auditLogsToDelete = await queryRunner.manager.find(OnboardingAuditLog, {
          where: { userId: request.userId },
        });

        for (const log of auditLogsToDelete) {
          // Anonymize instead of delete for compliance
          log.userId = 'anonymized';
          log.previousData = null;
          log.newData = null;
          log.metadata = { anonymized: true };
          await queryRunner.manager.save(log);
          retainedRecords++;
        }
      } else {
        const auditLogCount = await queryRunner.manager.count(OnboardingAuditLog, {
          where: { userId: request.userId },
        });
        retainedRecords += auditLogCount;
      }

      // Anonymize user record instead of deleting (for referential integrity)
      const user = await queryRunner.manager.findOne(User, {
        where: { id: request.userId },
      });

      if (user) {
        user.name = 'Deleted User';
        user.email = `deleted_${Date.now()}@anonymized.com`;
        user.phone = null;
        user.emailVerificationToken = null;
        user.passwordResetToken = null;
        user.password = 'anonymized';
        await queryRunner.manager.save(user);
        retainedRecords++;
      }

      await queryRunner.commitTransaction();

      // Log the deletion request
      await this.auditService.logAuditEvent({
        action: 'DATA_DELETED' as any,
        userId: request.requestedBy,
        hotelId: 'system',
        metadata: {
          deletedUserId: request.userId,
          reason: request.reason,
          deletedRecords,
          retainedRecords,
          retainAuditLogs: request.retainAuditLogs,
        },
        description: `Deleted user data for GDPR compliance: ${request.userId}`,
      });

      return {
        success: true,
        deletedRecords,
        retainedRecords,
        message: `Successfully processed data deletion request. ${deletedRecords} records deleted, ${retainedRecords} records anonymized/retained for compliance.`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to delete user data for ${request.userId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Record user consent for data processing
   * Requirements: 10.3 - Consent management
   */
  async recordConsent(consent: ConsentRecord): Promise<void> {
    this.logger.log(`Recording consent for user ${consent.userId}: ${consent.consentType} = ${consent.granted}`);

    // In a real implementation, this would be stored in a dedicated consent table
    await this.auditService.logAuditEvent({
      action: 'CONSENT_RECORDED' as any,
      userId: consent.userId,
      hotelId: 'system',
      newData: {
        consentType: consent.consentType,
        granted: consent.granted,
        timestamp: consent.timestamp,
      },
      metadata: {
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent,
      },
      description: `User consent recorded: ${consent.consentType} = ${consent.granted}`,
    });
  }

  /**
   * Get data retention policy for a specific data type
   * Requirements: 10.3 - Data retention management
   */
  getRetentionPolicy(dataType: string): DataRetentionPolicy | null {
    return this.retentionPolicies.find(policy => policy.dataType === dataType) || null;
  }

  /**
   * Check if data should be automatically deleted based on retention policy
   * Requirements: 10.3 - Automated data retention
   */
  async checkDataRetention(): Promise<{
    expiredRecords: number;
    deletedRecords: number;
    errors: string[];
  }> {
    this.logger.log('Checking data retention policies');

    let expiredRecords = 0;
    let deletedRecords = 0;
    const errors: string[] = [];

    try {
      for (const policy of this.retentionPolicies) {
        if (!policy.autoDelete) {
          continue;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

        switch (policy.dataType) {
          case 'user_roles':
            const expiredRoles = await this.roleRepository.find({
              where: {
                isActive: false,
                updatedAt: cutoffDate, // Less than cutoff date
              },
            });

            expiredRecords += expiredRoles.length;

            for (const role of expiredRoles) {
              try {
                await this.roleRepository.remove(role);
                deletedRecords++;
              } catch (error) {
                errors.push(`Failed to delete expired role ${role.id}: ${error.message}`);
              }
            }
            break;

          // Add other data types as needed
        }
      }

      this.logger.log(`Data retention check completed: ${expiredRecords} expired, ${deletedRecords} deleted, ${errors.length} errors`);

      return {
        expiredRecords,
        deletedRecords,
        errors,
      };
    } catch (error) {
      this.logger.error('Data retention check failed:', error);
      throw error;
    }
  }

  /**
   * Generate data processing report for compliance
   * Requirements: 10.3 - Compliance reporting
   */
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<{
    period: { start: Date; end: Date };
    dataExports: number;
    dataDeletions: number;
    consentRecords: number;
    retentionActions: number;
    securityEvents: number;
  }> {
    this.logger.log(`Generating compliance report from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    try {
      // Count data exports
      const dataExports = await this.auditLogRepository.count({
        where: {
          action: 'DATA_EXPORTED' as any,
          createdAt: Between(startDate, endDate),
        },
      });

      // Count data deletions
      const dataDeletions = await this.auditLogRepository.count({
        where: {
          action: 'DATA_DELETED' as any,
          createdAt: Between(startDate, endDate),
        },
      });

      // Count consent records
      const consentRecords = await this.auditLogRepository.count({
        where: {
          action: 'CONSENT_RECORDED' as any,
          createdAt: Between(startDate, endDate),
        },
      });

      // Count retention actions
      const retentionActions = await this.auditLogRepository.count({
        where: {
          action: 'DATA_RETENTION_APPLIED' as any,
          createdAt: Between(startDate, endDate),
        },
      });

      // Count security events
      const securityEvents = await this.auditLogRepository.count({
        where: {
          action: ['PERMISSION_DENIED', 'ROLE_ASSIGNED', 'ROLE_REMOVED'] as any,
          createdAt: Between(startDate, endDate),
        },
      });

      return {
        period: { start: startDate, end: endDate },
        dataExports,
        dataDeletions,
        consentRecords,
        retentionActions,
        securityEvents,
      };
    } catch (error) {
      this.logger.error('Failed to generate compliance report:', error);
      throw error;
    }
  }

  /**
   * Validate data processing lawfulness
   * Requirements: 10.3 - Lawful basis validation
   */
  async validateProcessingLawfulness(
    userId: string,
    processingPurpose: string
  ): Promise<{
    lawful: boolean;
    basis: string;
    consentRequired: boolean;
    consentGranted?: boolean;
  }> {
    // Define lawful bases for different processing purposes
    const lawfulBases = {
      'onboarding_data': {
        basis: 'contract',
        consentRequired: false,
        description: 'Processing necessary for contract performance',
      },
      'marketing': {
        basis: 'consent',
        consentRequired: true,
        description: 'Processing based on user consent',
      },
      'analytics': {
        basis: 'legitimate_interest',
        consentRequired: false,
        description: 'Processing for legitimate business interests',
      },
      'audit_logging': {
        basis: 'legal_obligation',
        consentRequired: false,
        description: 'Processing required by law',
      },
    };

    const basisInfo = lawfulBases[processingPurpose];
    if (!basisInfo) {
      return {
        lawful: false,
        basis: 'unknown',
        consentRequired: false,
      };
    }

    let consentGranted: boolean | undefined;

    if (basisInfo.consentRequired) {
      // Check if consent has been granted
      const consentLog = await this.auditLogRepository.findOne({
        where: {
          userId,
          action: 'CONSENT_RECORDED' as any,
          newData: { consentType: processingPurpose } as any,
        },
        order: { createdAt: 'DESC' },
      });

      consentGranted = consentLog?.newData?.granted === true;
    }

    return {
      lawful: !basisInfo.consentRequired || consentGranted === true,
      basis: basisInfo.basis,
      consentRequired: basisInfo.consentRequired,
      consentGranted,
    };
  }
}

// Import Between from typeorm for the compliance report method
import { Between } from 'typeorm';