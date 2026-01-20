import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HotelUserRole } from '../entities/hotel-user-role.entity';
import { HotelRole, OnboardingPermission, HOTEL_ROLE_PERMISSIONS } from '../enums/hotel-roles.enum';
import { User, UserRole } from '../../users/entities/user.entity';

export interface HotelPermissionContext {
  userId: string;
  hotelId: string;
  permission: OnboardingPermission;
}

export interface RoleAssignmentRequest {
  userId: string;
  hotelId: string;
  role: HotelRole;
  assignedBy: string;
  expiresAt?: Date;
}

/**
 * Hotel Role-Based Access Control Service
 * Requirements: 10.1 - Role-based permissions for onboarding operations
 */
@Injectable()
export class HotelRbacService {
  private readonly logger = new Logger(HotelRbacService.name);

  constructor(
    @InjectRepository(HotelUserRole)
    private readonly hotelUserRoleRepository: Repository<HotelUserRole>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Check if user has permission for hotel onboarding operation
   * Requirements: 10.1 - Permission enforcement for onboarding operations
   */
  async hasPermission(context: HotelPermissionContext): Promise<boolean> {
    this.logger.debug(`Checking permission ${context.permission} for user ${context.userId} on hotel ${context.hotelId}`);

    // Check if user is system admin (bypass hotel-specific permissions)
    const user = await this.userRepository.findOne({
      where: { id: context.userId },
    });

    if (user && user.roles.includes(UserRole.ADMIN)) {
      this.logger.debug(`User ${context.userId} is system admin, granting permission`);
      return true;
    }

    // Get user's hotel role
    const hotelRole = await this.getUserHotelRole(context.userId, context.hotelId);
    if (!hotelRole) {
      this.logger.debug(`User ${context.userId} has no role for hotel ${context.hotelId}`);
      return false;
    }

    // Check if role has the required permission
    const rolePermissions = HOTEL_ROLE_PERMISSIONS[hotelRole.role];
    const hasPermission = rolePermissions.includes(context.permission);

    this.logger.debug(`User ${context.userId} has role ${hotelRole.role}, permission ${context.permission}: ${hasPermission}`);
    return hasPermission;
  }

  /**
   * Enforce permission check and throw exception if denied
   * Requirements: 10.1 - Permission enforcement for onboarding operations
   */
  async enforcePermission(context: HotelPermissionContext): Promise<void> {
    const hasPermission = await this.hasPermission(context);
    if (!hasPermission) {
      throw new ForbiddenException(
        `User does not have permission ${context.permission} for hotel ${context.hotelId}`
      );
    }
  }

  /**
   * Get user's role for a specific hotel
   */
  async getUserHotelRole(userId: string, hotelId: string): Promise<HotelUserRole | null> {
    const role = await this.hotelUserRoleRepository.findOne({
      where: {
        userId,
        hotelId,
        isActive: true,
      },
    });

    // Check if role is still valid (not expired)
    if (role && !role.isValid()) {
      this.logger.debug(`Role for user ${userId} on hotel ${hotelId} has expired`);
      return null;
    }

    return role;
  }

  /**
   * Get all hotel roles for a user
   */
  async getUserHotelRoles(userId: string): Promise<HotelUserRole[]> {
    const roles = await this.hotelUserRoleRepository.find({
      where: {
        userId,
        isActive: true,
      },
      relations: ['hotel'],
    });

    // Filter out expired roles
    return roles.filter(role => role.isValid());
  }

  /**
   * Get all users with roles for a specific hotel
   */
  async getHotelUsers(hotelId: string): Promise<HotelUserRole[]> {
    const roles = await this.hotelUserRoleRepository.find({
      where: {
        hotelId,
        isActive: true,
      },
      relations: ['user'],
    });

    // Filter out expired roles
    return roles.filter(role => role.isValid());
  }

  /**
   * Assign hotel role to user
   * Requirements: 10.1 - User role management
   */
  async assignHotelRole(request: RoleAssignmentRequest): Promise<HotelUserRole> {
    this.logger.log(`Assigning role ${request.role} to user ${request.userId} for hotel ${request.hotelId}`);

    // Check if user already has a role for this hotel
    const existingRole = await this.hotelUserRoleRepository.findOne({
      where: {
        userId: request.userId,
        hotelId: request.hotelId,
      },
    });

    if (existingRole) {
      // Update existing role
      existingRole.role = request.role;
      existingRole.isActive = true;
      existingRole.assignedBy = request.assignedBy;
      existingRole.expiresAt = request.expiresAt || null;
      existingRole.updatedAt = new Date();

      return await this.hotelUserRoleRepository.save(existingRole);
    } else {
      // Create new role assignment
      const newRole = new HotelUserRole();
      newRole.userId = request.userId;
      newRole.hotelId = request.hotelId;
      newRole.role = request.role;
      newRole.assignedBy = request.assignedBy;
      newRole.expiresAt = request.expiresAt || null;

      return await this.hotelUserRoleRepository.save(newRole);
    }
  }

  /**
   * Remove hotel role from user
   * Requirements: 10.1 - User role management
   */
  async removeHotelRole(userId: string, hotelId: string): Promise<void> {
    this.logger.log(`Removing hotel role for user ${userId} from hotel ${hotelId}`);

    await this.hotelUserRoleRepository.update(
      { userId, hotelId },
      { isActive: false, updatedAt: new Date() }
    );
  }

  /**
   * Get permissions for a user's hotel role
   */
  async getUserPermissions(userId: string, hotelId: string): Promise<OnboardingPermission[]> {
    const role = await this.getUserHotelRole(userId, hotelId);
    if (!role) {
      return [];
    }

    return HOTEL_ROLE_PERMISSIONS[role.role] || [];
  }

  /**
   * Check if user can manage other users for a hotel (owner/manager privilege)
   */
  async canManageHotelUsers(userId: string, hotelId: string): Promise<boolean> {
    return await this.hasPermission({
      userId,
      hotelId,
      permission: OnboardingPermission.MANAGE_HOTEL_USERS,
    });
  }

  /**
   * Validate role assignment permissions
   * Only owners can assign owner roles, owners and managers can assign staff roles
   */
  async canAssignRole(assignerId: string, hotelId: string, targetRole: HotelRole): Promise<boolean> {
    const assignerRole = await this.getUserHotelRole(assignerId, hotelId);
    if (!assignerRole) {
      return false;
    }

    switch (targetRole) {
      case HotelRole.OWNER:
        // Only existing owners can assign owner roles
        return assignerRole.role === HotelRole.OWNER;
      
      case HotelRole.MANAGER:
        // Only owners can assign manager roles
        return assignerRole.role === HotelRole.OWNER;
      
      case HotelRole.STAFF:
        // Owners and managers can assign staff roles
        return [HotelRole.OWNER, HotelRole.MANAGER].includes(assignerRole.role);
      
      default:
        return false;
    }
  }
}