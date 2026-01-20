import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between } from 'typeorm';
import { OnboardingAuditLog, OnboardingAuditAction } from '../entities/onboarding-audit-log.entity';

export interface AuditLogRequest {
  action: OnboardingAuditAction;
  userId: string;
  hotelId: string;
  sessionId?: string;
  stepId?: string;
  previousData?: any;
  newData?: any;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    duration?: number;
    errorMessage?: string;
    [key: string]: any;
  };
  description?: string;
}

export interface AuditLogQuery {
  hotelId?: string;
  userId?: string;
  sessionId?: string;
  action?: OnboardingAuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogSummary {
  totalLogs: number;
  securityEvents: number;
  recentActivity: OnboardingAuditLog[];
  topActions: { action: OnboardingAuditAction; count: number }[];
  topUsers: { userId: string; count: number }[];
}

/**
 * Audit logging service for onboarding operations
 * Requirements: 10.4 - Comprehensive audit logging for all onboarding changes
 */
@Injectable()
export class OnboardingAuditService {
  private readonly logger = new Logger(OnboardingAuditService.name);

  constructor(
    @InjectRepository(OnboardingAuditLog)
    private readonly auditLogRepository: Repository<OnboardingAuditLog>,
  ) {}

  /**
   * Log an onboarding audit event
   * Requirements: 10.4 - Audit logging with user identification and timestamps
   */
  async logAuditEvent(request: AuditLogRequest): Promise<OnboardingAuditLog> {
    try {
      const auditLog = new OnboardingAuditLog();
      auditLog.action = request.action;
      auditLog.userId = request.userId;
      auditLog.hotelId = request.hotelId;
      auditLog.sessionId = request.sessionId || null;
      auditLog.stepId = request.stepId || null;
      auditLog.previousData = request.previousData || null;
      auditLog.newData = request.newData || null;
      auditLog.metadata = request.metadata || {};
      auditLog.description = request.description || null;

      const savedLog = await this.auditLogRepository.save(auditLog);
      
      this.logger.log(
        `Audit event logged: ${request.action} by user ${request.userId} for hotel ${request.hotelId}`
      );

      // Log security events with higher priority
      if (savedLog.isSecurityEvent()) {
        this.logger.warn(
          `Security audit event: ${request.action} by user ${request.userId} for hotel ${request.hotelId}`,
          { metadata: request.metadata }
        );
      }

      return savedLog;
    } catch (error) {
      this.logger.error('Failed to log audit event:', error, { request });
      throw error;
    }
  }

  /**
   * Get audit logs with filtering and pagination
   * Requirements: 10.4 - Audit log retrieval for compliance
   */
  async getAuditLogs(query: AuditLogQuery): Promise<{
    logs: OnboardingAuditLog[];
    total: number;
  }> {
    const findOptions: FindManyOptions<OnboardingAuditLog> = {
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: query.limit || 50,
      skip: query.offset || 0,
    };

    const whereConditions: any = {};

    if (query.hotelId) {
      whereConditions.hotelId = query.hotelId;
    }

    if (query.userId) {
      whereConditions.userId = query.userId;
    }

    if (query.sessionId) {
      whereConditions.sessionId = query.sessionId;
    }

    if (query.action) {
      whereConditions.action = query.action;
    }

    if (query.startDate && query.endDate) {
      whereConditions.createdAt = Between(query.startDate, query.endDate);
    } else if (query.startDate) {
      whereConditions.createdAt = Between(query.startDate, new Date());
    }

    findOptions.where = whereConditions;

    const [logs, total] = await this.auditLogRepository.findAndCount(findOptions);

    return { logs, total };
  }

  /**
   * Get audit log summary for a hotel
   * Requirements: 10.4 - Audit reporting and analysis
   */
  async getAuditSummary(hotelId: string, days: number = 30): Promise<AuditLogSummary> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.auditLogRepository.find({
      where: {
        hotelId,
        createdAt: Between(startDate, new Date()),
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const securityEvents = logs.filter(log => log.isSecurityEvent()).length;
    const recentActivity = logs.slice(0, 10);

    // Count actions
    const actionCounts = new Map<OnboardingAuditAction, number>();
    const userCounts = new Map<string, number>();

    for (const log of logs) {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
      userCounts.set(log.userId, (userCounts.get(log.userId) || 0) + 1);
    }

    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topUsers = Array.from(userCounts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalLogs: logs.length,
      securityEvents,
      recentActivity,
      topActions,
      topUsers,
    };
  }

  /**
   * Get security-related audit events
   * Requirements: 10.4 - Security event monitoring
   */
  async getSecurityEvents(hotelId?: string, days: number = 7): Promise<OnboardingAuditLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const whereConditions: any = {
      action: [
        OnboardingAuditAction.ROLE_ASSIGNED,
        OnboardingAuditAction.ROLE_REMOVED,
        OnboardingAuditAction.PERMISSION_DENIED,
        OnboardingAuditAction.DATA_EXPORTED,
      ],
      createdAt: Between(startDate, new Date()),
    };

    if (hotelId) {
      whereConditions.hotelId = hotelId;
    }

    return await this.auditLogRepository.find({
      where: whereConditions,
      relations: ['user', 'hotel'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Log session creation
   */
  async logSessionCreated(
    userId: string,
    hotelId: string,
    sessionId: string,
    metadata?: any
  ): Promise<void> {
    await this.logAuditEvent({
      action: OnboardingAuditAction.SESSION_CREATED,
      userId,
      hotelId,
      sessionId,
      metadata,
      description: 'New onboarding session created',
    });
  }

  /**
   * Log step update
   */
  async logStepUpdated(
    userId: string,
    hotelId: string,
    sessionId: string,
    stepId: string,
    previousData: any,
    newData: any,
    metadata?: any
  ): Promise<void> {
    await this.logAuditEvent({
      action: OnboardingAuditAction.STEP_UPDATED,
      userId,
      hotelId,
      sessionId,
      stepId,
      previousData,
      newData,
      metadata,
      description: `Updated onboarding step: ${stepId}`,
    });
  }

  /**
   * Log session completion
   */
  async logSessionCompleted(
    userId: string,
    hotelId: string,
    sessionId: string,
    qualityScore: number,
    metadata?: any
  ): Promise<void> {
    await this.logAuditEvent({
      action: OnboardingAuditAction.SESSION_COMPLETED,
      userId,
      hotelId,
      sessionId,
      newData: { qualityScore },
      metadata,
      description: `Onboarding session completed with quality score: ${qualityScore}`,
    });
  }

  /**
   * Log role assignment
   */
  async logRoleAssigned(
    assignerId: string,
    targetUserId: string,
    hotelId: string,
    role: string,
    metadata?: any
  ): Promise<void> {
    await this.logAuditEvent({
      action: OnboardingAuditAction.ROLE_ASSIGNED,
      userId: assignerId,
      hotelId,
      newData: { targetUserId, role },
      metadata,
      description: `Assigned role ${role} to user ${targetUserId}`,
    });
  }

  /**
   * Log permission denial
   */
  async logPermissionDenied(
    userId: string,
    hotelId: string,
    permission: string,
    metadata?: any
  ): Promise<void> {
    await this.logAuditEvent({
      action: OnboardingAuditAction.PERMISSION_DENIED,
      userId,
      hotelId,
      metadata: { ...metadata, deniedPermission: permission },
      description: `Permission denied: ${permission}`,
    });
  }

  /**
   * Export audit logs for compliance
   * Requirements: 10.4 - Audit log export for compliance reporting
   */
  async exportAuditLogs(
    hotelId: string,
    startDate: Date,
    endDate: Date,
    requestedBy: string
  ): Promise<OnboardingAuditLog[]> {
    // Log the export request
    await this.logAuditEvent({
      action: OnboardingAuditAction.DATA_EXPORTED,
      userId: requestedBy,
      hotelId,
      metadata: { startDate, endDate, exportType: 'audit_logs' },
      description: `Exported audit logs from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    });

    return await this.auditLogRepository.find({
      where: {
        hotelId,
        createdAt: Between(startDate, endDate),
      },
      relations: ['user', 'hotel', 'session'],
      order: { createdAt: 'ASC' },
    });
  }
}