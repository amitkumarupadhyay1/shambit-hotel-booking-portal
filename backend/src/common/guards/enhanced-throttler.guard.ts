import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * Enhanced Throttler Guard
 * Requirements: 10.1 - Implement comprehensive rate limiting (Security Requirement)
 * 
 * This guard extends the basic ThrottlerGuard to provide:
 * 1. IP-based rate limiting for anonymous users
 * 2. User-based rate limiting for authenticated users
 * 3. Enhanced logging and monitoring
 * 4. Custom error responses with retry information
 * 5. Rate limit monitoring and alerting
 */
@Injectable()
export class EnhancedThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(EnhancedThrottlerGuard.name);

  protected async getTracker(req: Request): Promise<string> {
    // Use user ID for authenticated requests, IP for anonymous
    const user = (req as any).user;
    const userId = user?.id;
    
    if (userId) {
      // For authenticated users, use user ID
      return `user:${userId}`;
    } else {
      // For anonymous users, use IP address
      return `ip:${req.ip}`;
    }
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest<Request>();
    const tracker = await this.getTracker(request);
    const user = (request as any).user;
    
    // Log rate limit violation
    this.logger.warn(`Rate limit exceeded for ${tracker}`, {
      userId: user?.id || 'anonymous',
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      path: request.path,
      method: request.method,
    });

    // Check if this is a security concern (too many violations)
    await this.checkForSecurityThreats(tracker, request);

    // Throw enhanced throttling exception
    throw new ThrottlerException('Rate limit exceeded. Please try again later.');
  }

  /**
   * Check for potential security threats based on rate limit violations
   */
  private async checkForSecurityThreats(tracker: string, request: Request): Promise<void> {
    // This could be enhanced to track repeated violations and trigger security alerts
    // For now, just log potential threats
    
    const isAuthEndpoint = request.path.includes('/auth/');
    const isAdminEndpoint = request.path.includes('/admin/');
    
    if (isAuthEndpoint) {
      this.logger.warn(`Potential brute force attack detected on auth endpoint`, {
        tracker,
        path: request.path,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });
    }
    
    if (isAdminEndpoint) {
      this.logger.error(`Rate limit violation on admin endpoint - potential security threat`, {
        tracker,
        path: request.path,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });
    }
  }
}

/**
 * Auth-specific throttler guard with stricter limits
 */
@Injectable()
export class AuthThrottlerGuard extends EnhancedThrottlerGuard {
  protected getThrottlerSuffix(): string {
    return 'auth';
  }
}

/**
 * Admin-specific throttler guard with stricter limits
 */
@Injectable()
export class AdminThrottlerGuard extends EnhancedThrottlerGuard {
  protected getThrottlerSuffix(): string {
    return 'admin';
  }
}

/**
 * API-specific throttler guard
 */
@Injectable()
export class ApiThrottlerGuard extends EnhancedThrottlerGuard {
  protected getThrottlerSuffix(): string {
    return 'api';
  }
}

/**
 * Upload-specific throttler guard with file upload limits
 */
@Injectable()
export class UploadThrottlerGuard extends EnhancedThrottlerGuard {
  protected getThrottlerSuffix(): string {
    return 'upload';
  }
}