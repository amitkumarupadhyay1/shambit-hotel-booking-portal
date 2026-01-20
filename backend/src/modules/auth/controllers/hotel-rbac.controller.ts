import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { HotelPermissionGuard, RequireHotelPermission } from '../guards/hotel-permission.guard';
import { HotelRbacService, RoleAssignmentRequest } from '../services/hotel-rbac.service';
import { OnboardingAuditService, AuditLogQuery } from '../services/onboarding-audit.service';
import { HotelRole, OnboardingPermission } from '../enums/hotel-roles.enum';

export class AssignRoleDto {
  userId: string;
  hotelId: string;
  role: HotelRole;
  expiresAt?: Date;
}

export class AuditLogQueryDto {
  hotelId?: string;
  userId?: string;
  sessionId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Controller for hotel role-based access control and audit operations
 * Requirements: 10.1 - Role-based access control management
 * Requirements: 10.4 - Audit logging access and management
 */
@Controller('hotels/rbac')
@UseGuards(JwtAuthGuard)
export class HotelRbacController {
  constructor(
    private readonly hotelRbacService: HotelRbacService,
    private readonly auditService: OnboardingAuditService,
  ) {}

  /**
   * Get user's hotel roles
   * Requirements: 10.1 - Role visibility for users
   */
  @Get('my-roles')
  async getMyHotelRoles(@Request() req) {
    const roles = await this.hotelRbacService.getUserHotelRoles(req.user.id);
    return {
      roles: roles.map(role => ({
        id: role.id,
        hotelId: role.hotelId,
        role: role.role,
        roleDisplayName: role.getRoleDisplayName(),
        isActive: role.isActive,
        expiresAt: role.expiresAt,
        createdAt: role.createdAt,
        hotel: role.hotel ? {
          id: role.hotel.id,
          name: role.hotel.basicInfo?.name,
        } : null,
      })),
    };
  }

  /**
   * Get users with roles for a specific hotel
   * Requirements: 10.1 - Hotel user management visibility
   */
  @Get(':hotelId/users')
  @UseGuards(HotelPermissionGuard)
  @RequireHotelPermission(OnboardingPermission.VIEW_SESSION)
  async getHotelUsers(@Param('hotelId') hotelId: string) {
    const roles = await this.hotelRbacService.getHotelUsers(hotelId);
    return {
      users: roles.map(role => ({
        id: role.id,
        userId: role.userId,
        role: role.role,
        roleDisplayName: role.getRoleDisplayName(),
        isActive: role.isActive,
        expiresAt: role.expiresAt,
        createdAt: role.createdAt,
        user: role.user ? {
          id: role.user.id,
          name: role.user.name,
          email: role.user.email,
        } : null,
      })),
    };
  }

  /**
   * Assign hotel role to user
   * Requirements: 10.1 - Role assignment with proper authorization
   */
  @Post('assign-role')
  async assignHotelRole(@Body() dto: AssignRoleDto, @Request() req) {
    // Validate that the assigner can assign this role
    const canAssign = await this.hotelRbacService.canAssignRole(
      req.user.id,
      dto.hotelId,
      dto.role
    );

    if (!canAssign) {
      throw new ForbiddenException(
        `You do not have permission to assign ${dto.role} role for this hotel`
      );
    }

    const request: RoleAssignmentRequest = {
      userId: dto.userId,
      hotelId: dto.hotelId,
      role: dto.role,
      assignedBy: req.user.id,
      expiresAt: dto.expiresAt,
    };

    const assignedRole = await this.hotelRbacService.assignHotelRole(request);

    // Log the role assignment
    await this.auditService.logRoleAssigned(
      req.user.id,
      dto.userId,
      dto.hotelId,
      dto.role,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      }
    );

    return {
      success: true,
      role: {
        id: assignedRole.id,
        userId: assignedRole.userId,
        hotelId: assignedRole.hotelId,
        role: assignedRole.role,
        roleDisplayName: assignedRole.getRoleDisplayName(),
        expiresAt: assignedRole.expiresAt,
      },
      message: `Successfully assigned ${dto.role} role`,
    };
  }

  /**
   * Remove hotel role from user
   * Requirements: 10.1 - Role removal with proper authorization
   */
  @Delete(':hotelId/users/:userId/role')
  @UseGuards(HotelPermissionGuard)
  @RequireHotelPermission(OnboardingPermission.MANAGE_HOTEL_USERS)
  async removeHotelRole(
    @Param('hotelId') hotelId: string,
    @Param('userId') userId: string,
    @Request() req
  ) {
    await this.hotelRbacService.removeHotelRole(userId, hotelId);

    // Log the role removal
    await this.auditService.logAuditEvent({
      action: 'ROLE_REMOVED' as any,
      userId: req.user.id,
      hotelId,
      newData: { targetUserId: userId },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
      description: `Removed hotel role from user ${userId}`,
    });

    return {
      success: true,
      message: 'Hotel role removed successfully',
    };
  }

  /**
   * Get user permissions for a hotel
   * Requirements: 10.1 - Permission visibility
   */
  @Get(':hotelId/permissions')
  @UseGuards(HotelPermissionGuard)
  @RequireHotelPermission(OnboardingPermission.VIEW_SESSION)
  async getUserPermissions(
    @Param('hotelId') hotelId: string,
    @Query('userId') userId: string,
    @Request() req
  ) {
    const targetUserId = userId || req.user.id;
    const permissions = await this.hotelRbacService.getUserPermissions(targetUserId, hotelId);

    return {
      userId: targetUserId,
      hotelId,
      permissions,
    };
  }

  /**
   * Get audit logs for a hotel
   * Requirements: 10.4 - Audit log access with proper authorization
   */
  @Get(':hotelId/audit-logs')
  @UseGuards(HotelPermissionGuard)
  @RequireHotelPermission(OnboardingPermission.VIEW_AUDIT_LOGS)
  async getAuditLogs(
    @Param('hotelId') hotelId: string,
    @Query() query: AuditLogQueryDto
  ) {
    const auditQuery: AuditLogQuery = {
      hotelId,
      userId: query.userId,
      sessionId: query.sessionId,
      action: query.action as any,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit || 50,
      offset: query.offset || 0,
    };

    const result = await this.auditService.getAuditLogs(auditQuery);

    return {
      logs: result.logs.map(log => ({
        id: log.id,
        action: log.action,
        actionDescription: log.getActionDescription(),
        userId: log.userId,
        sessionId: log.sessionId,
        stepId: log.stepId,
        description: log.description,
        dataChangeSummary: log.getDataChangeSummary(),
        isSecurityEvent: log.isSecurityEvent(),
        createdAt: log.createdAt,
        user: log.user ? {
          id: log.user.id,
          name: log.user.name,
          email: log.user.email,
        } : null,
        metadata: log.metadata,
      })),
      total: result.total,
      pagination: {
        limit: auditQuery.limit,
        offset: auditQuery.offset,
        hasMore: result.total > (auditQuery.offset || 0) + result.logs.length,
      },
    };
  }

  /**
   * Get audit summary for a hotel
   * Requirements: 10.4 - Audit reporting and analysis
   */
  @Get(':hotelId/audit-summary')
  @UseGuards(HotelPermissionGuard)
  @RequireHotelPermission(OnboardingPermission.VIEW_AUDIT_LOGS)
  async getAuditSummary(
    @Param('hotelId') hotelId: string,
    @Query('days') days?: string
  ) {
    const daysNumber = days ? parseInt(days, 10) : 30;
    if (isNaN(daysNumber) || daysNumber < 1 || daysNumber > 365) {
      throw new BadRequestException('Days must be a number between 1 and 365');
    }

    const summary = await this.auditService.getAuditSummary(hotelId, daysNumber);

    return {
      period: `${daysNumber} days`,
      summary: {
        totalLogs: summary.totalLogs,
        securityEvents: summary.securityEvents,
        topActions: summary.topActions,
        topUsers: summary.topUsers,
      },
      recentActivity: summary.recentActivity.map(log => ({
        id: log.id,
        action: log.action,
        actionDescription: log.getActionDescription(),
        userId: log.userId,
        description: log.description,
        isSecurityEvent: log.isSecurityEvent(),
        createdAt: log.createdAt,
        user: log.user ? {
          name: log.user.name,
          email: log.user.email,
        } : null,
      })),
    };
  }

  /**
   * Get security events across all hotels (admin only)
   * Requirements: 10.4 - Security event monitoring
   */
  @Get('security-events')
  async getSecurityEvents(
    @Query('hotelId') hotelId?: string,
    @Query('days') days?: string,
    @Request() req = null
  ) {
    // This endpoint is for system admins or hotel owners
    if (hotelId) {
      // Check hotel-specific permissions
      const hasPermission = await this.hotelRbacService.hasPermission({
        userId: req.user.id,
        hotelId,
        permission: OnboardingPermission.VIEW_AUDIT_LOGS,
      });

      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions to view security events');
      }
    }

    const daysNumber = days ? parseInt(days, 10) : 7;
    const events = await this.auditService.getSecurityEvents(hotelId, daysNumber);

    return {
      period: `${daysNumber} days`,
      events: events.map(event => ({
        id: event.id,
        action: event.action,
        actionDescription: event.getActionDescription(),
        userId: event.userId,
        hotelId: event.hotelId,
        description: event.description,
        createdAt: event.createdAt,
        user: event.user ? {
          name: event.user.name,
          email: event.user.email,
        } : null,
        hotel: event.hotel ? {
          name: event.hotel.basicInfo?.name,
        } : null,
        metadata: event.metadata,
      })),
    };
  }
}