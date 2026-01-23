import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

/**
 * Enhanced Rate Limiting Configuration
 * Requirements: 10.1 - Implement comprehensive rate limiting (Security Requirement)
 * 
 * This configuration provides:
 * 1. IP-based rate limiting for general requests
 * 2. User-based rate limiting for authenticated requests
 * 3. Endpoint-specific rate limits
 * 4. Proper rate limit responses and monitoring
 * 5. Automated alerting for rate limit violations
 */

export interface RateLimitConfig {
  // General rate limits
  global: {
    ttl: number;
    limit: number;
  };
  
  // Authentication endpoints
  auth: {
    ttl: number;
    limit: number;
  };
  
  // API endpoints
  api: {
    ttl: number;
    limit: number;
  };
  
  // Admin endpoints
  admin: {
    ttl: number;
    limit: number;
  };
  
  // File upload endpoints
  upload: {
    ttl: number;
    limit: number;
  };
}

@Injectable()
export class RateLimitConfigService {
  private readonly config: RateLimitConfig;

  constructor() {
    this.config = {
      global: {
        ttl: 60000, // 1 minute
        limit: parseInt(process.env.RATE_LIMIT_GLOBAL || '200'), // Increased from 100 to 200 requests per minute
      },
      auth: {
        ttl: 900000, // 15 minutes
        limit: parseInt(process.env.RATE_LIMIT_AUTH || '10'), // 10 auth attempts per 15 minutes
      },
      api: {
        ttl: 60000, // 1 minute
        limit: parseInt(process.env.RATE_LIMIT_API || '120'), // Increased from 60 to 120 API calls per minute
      },
      admin: {
        ttl: 60000, // 1 minute
        limit: parseInt(process.env.RATE_LIMIT_ADMIN || '30'), // 30 admin calls per minute
      },
      upload: {
        ttl: 300000, // 5 minutes
        limit: parseInt(process.env.RATE_LIMIT_UPLOAD || '20'), // 20 uploads per 5 minutes
      },
    };
  }

  getGlobalConfig(): ThrottlerModuleOptions {
    return [
      {
        name: 'global',
        ttl: this.config.global.ttl,
        limit: this.config.global.limit,
      },
    ];
  }

  getAuthConfig(): { ttl: number; limit: number } {
    return this.config.auth;
  }

  getApiConfig(): { ttl: number; limit: number } {
    return this.config.api;
  }

  getAdminConfig(): { ttl: number; limit: number } {
    return this.config.admin;
  }

  getUploadConfig(): { ttl: number; limit: number } {
    return this.config.upload;
  }

  getAllConfigs(): RateLimitConfig {
    return { ...this.config };
  }
}

// Export default configuration for ThrottlerModule
export const rateLimitConfig: ThrottlerModuleOptions = [
  {
    name: 'global',
    ttl: 60000, // 1 minute
    limit: parseInt(process.env.RATE_LIMIT_GLOBAL || '200'), // Increased from 100 to 200
  },
  {
    name: 'auth',
    ttl: 900000, // 15 minutes
    limit: parseInt(process.env.RATE_LIMIT_AUTH || '10'),
  },
  {
    name: 'api',
    ttl: 60000, // 1 minute
    limit: parseInt(process.env.RATE_LIMIT_API || '120'), // Increased from 60 to 120
  },
  {
    name: 'admin',
    ttl: 60000, // 1 minute
    limit: parseInt(process.env.RATE_LIMIT_ADMIN || '30'),
  },
  {
    name: 'upload',
    ttl: 300000, // 5 minutes
    limit: parseInt(process.env.RATE_LIMIT_UPLOAD || '20'),
  },
];