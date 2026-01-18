import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_FLAG_KEY } from '../decorators/feature-flag.decorator';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredFeature) {
      return true; // No feature flag required
    }

    const isFeatureEnabled = this.isFeatureEnabled(requiredFeature);
    
    if (!isFeatureEnabled) {
      throw new ForbiddenException(`Feature '${requiredFeature}' is not available in current spiral level`);
    }

    return true;
  }

  private isFeatureEnabled(feature: string): boolean {
    const spiralLevel = parseInt(process.env.SPIRAL_LEVEL || '2');
    
    const featureMap = {
      'BOOKING_CREATION': 3,
      'PAYMENT_PROCESSING': 4,
      'REVIEWS_RATINGS': 5,
      'NOTIFICATIONS': 5,
      'ANALYTICS': 6,
    };

    const requiredLevel = featureMap[feature] || 2;
    return spiralLevel >= requiredLevel;
  }
}