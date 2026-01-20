import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HotelRbacService } from '../services/hotel-rbac.service';
import { OnboardingPermission } from '../enums/hotel-roles.enum';

export const HOTEL_PERMISSION_KEY = 'hotel_permission';
export const HOTEL_ID_PARAM_KEY = 'hotel_id_param';

/**
 * Decorator to require specific hotel permission
 * Requirements: 10.1 - Permission enforcement for onboarding operations
 */
export const RequireHotelPermission = (
  permission: OnboardingPermission,
  hotelIdParam: string = 'hotelId'
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(HOTEL_PERMISSION_KEY, permission, descriptor.value);
    Reflect.defineMetadata(HOTEL_ID_PARAM_KEY, hotelIdParam, descriptor.value);
    return descriptor;
  };
};

/**
 * Guard to enforce hotel-specific permissions for onboarding operations
 * Requirements: 10.1 - Role-based access control for onboarding operations
 */
@Injectable()
export class HotelPermissionGuard implements CanActivate {
  private readonly logger = new Logger(HotelPermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly hotelRbacService: HotelRbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permission from decorator
    const requiredPermission = this.reflector.get<OnboardingPermission>(
      HOTEL_PERMISSION_KEY,
      context.getHandler(),
    );

    if (!requiredPermission) {
      // No permission required, allow access
      return true;
    }

    // Get hotel ID parameter name from decorator
    const hotelIdParam = this.reflector.get<string>(
      HOTEL_ID_PARAM_KEY,
      context.getHandler(),
    ) || 'hotelId';

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request for hotel permission check');
      return false;
    }

    // Extract hotel ID from request parameters, body, or query
    const hotelId = request.params[hotelIdParam] || 
                   request.body[hotelIdParam] || 
                   request.query[hotelIdParam];

    if (!hotelId) {
      this.logger.warn(`Hotel ID not found in request using parameter '${hotelIdParam}'`);
      return false;
    }

    try {
      // Check permission using RBAC service
      const hasPermission = await this.hotelRbacService.hasPermission({
        userId: user.id,
        hotelId,
        permission: requiredPermission,
      });

      if (!hasPermission) {
        this.logger.warn(
          `User ${user.id} denied access to hotel ${hotelId} for permission ${requiredPermission}`
        );
      }

      return hasPermission;
    } catch (error) {
      this.logger.error('Error checking hotel permission:', error);
      return false;
    }
  }
}