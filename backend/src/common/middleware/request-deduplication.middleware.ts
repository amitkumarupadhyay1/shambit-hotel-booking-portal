import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RequestFingerprint {
  method: string;
  path: string;
  userId?: string;
  body?: string;
  query?: string;
}

interface CachedRequest {
  timestamp: number;
  fingerprint: string;
  count: number;
}

/**
 * Request Deduplication Middleware
 * Requirements: 7.1 - Implement request deduplication middleware (Requirement 4.1)
 * 
 * This middleware prevents duplicate requests by:
 * 1. Generating request fingerprints based on method, path, user, and content
 * 2. Tracking recent requests in memory cache
 * 3. Rejecting duplicate requests within configurable time window
 * 4. Providing proper error responses for duplicate requests
 * 5. Automatic cleanup of expired request tracking
 */
@Injectable()
export class RequestDeduplicationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestDeduplicationMiddleware.name);
  private readonly requestCache = new Map<string, CachedRequest>();
  private readonly DEDUPLICATION_WINDOW = 2000; // 2 seconds window (increased from 1 second)
  private readonly MAX_CACHE_SIZE = 10000; // Maximum cached requests
  private readonly CLEANUP_INTERVAL = 60000; // Cleanup every minute

  constructor() {
    // Start periodic cleanup
    setInterval(() => {
      this.cleanupExpiredRequests();
    }, this.CLEANUP_INTERVAL);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      // Skip deduplication for GET requests (they should be idempotent)
      if (req.method === 'GET') {
        return next();
      }

      // Skip deduplication for health checks and static assets
      if (this.shouldSkipDeduplication(req.path)) {
        return next();
      }

      const fingerprint = this.generateRequestFingerprint(req);
      const now = Date.now();
      const cached = this.requestCache.get(fingerprint);

      // Special handling for different types of requests
      const isOnboardingSessionCreation = req.path.includes('/integrated-onboarding/sessions') && req.method === 'POST';
      const isOnboardingDraftSave = req.path.includes('/integrated-onboarding/sessions') && 
                                   (req.path.includes('/draft') || req.path.includes('/steps/')) && 
                                   (req.method === 'PUT' || req.method === 'POST');
      
      let deduplicationWindow = this.DEDUPLICATION_WINDOW;
      
      if (isOnboardingSessionCreation) {
        deduplicationWindow = 5000; // 5 seconds for session creation
      } else if (isOnboardingDraftSave) {
        deduplicationWindow = 1000; // 1 second for draft saves (allow more frequent saves)
      }

      if (cached && (now - cached.timestamp) < deduplicationWindow) {
        // Duplicate request detected
        this.logger.warn(
          `Duplicate request detected: ${req.method} ${req.path} by user ${this.getUserId(req)}`,
          {
            fingerprint,
            originalTimestamp: cached.timestamp,
            duplicateCount: cached.count + 1,
            timeDiff: now - cached.timestamp,
            isOnboardingSession: isOnboardingSessionCreation,
            isOnboardingDraftSave: isOnboardingDraftSave,
          }
        );

        // Update duplicate count
        cached.count += 1;
        cached.timestamp = now;

        // Return 429 Too Many Requests
        res.status(429).json({
          statusCode: 429,
          message: 'Duplicate request detected. Please wait before retrying.',
          error: 'Too Many Requests',
          timestamp: new Date().toISOString(),
          path: req.path,
          retryAfter: Math.ceil(deduplicationWindow / 1000), // seconds
        });
        return;
      }

      // Store/update request fingerprint
      this.requestCache.set(fingerprint, {
        timestamp: now,
        fingerprint,
        count: cached ? cached.count : 1,
      });

      // Cleanup cache if it gets too large
      if (this.requestCache.size > this.MAX_CACHE_SIZE) {
        this.cleanupOldestRequests();
      }

      // Log successful request tracking
      this.logger.debug(
        `Request tracked: ${req.method} ${req.path} by user ${this.getUserId(req)}`,
        { 
          fingerprint, 
          isOnboardingSession: isOnboardingSessionCreation,
          isOnboardingDraftSave: isOnboardingDraftSave,
          deduplicationWindow 
        }
      );

      next();
    } catch (error) {
      this.logger.error('Request deduplication middleware error:', error);
      // Don't block requests on middleware errors
      next();
    }
  }

  /**
   * Generate unique fingerprint for request
   */
  private generateRequestFingerprint(req: Request): string {
    const requestData: RequestFingerprint = {
      method: req.method,
      path: this.normalizePath(req.path),
      userId: this.getUserId(req),
    };

    // Special handling for draft saves - don't include body content in fingerprint
    // This allows multiple saves with different content
    const isDraftSave = req.path.includes('/draft') && ['PUT', 'POST'].includes(req.method);
    
    // Include body for POST/PUT/PATCH requests (except draft saves)
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && !isDraftSave) {
      // Create a stable hash of the body content
      requestData.body = this.hashObject(req.body);
    }

    // Include query parameters for requests that have them
    if (Object.keys(req.query).length > 0) {
      requestData.query = this.hashObject(req.query);
    }

    // Create fingerprint from request data
    const fingerprintString = JSON.stringify(requestData);
    return this.createHash(fingerprintString);
  }

  /**
   * Normalize path to handle dynamic parameters
   */
  private normalizePath(path: string): string {
    // Replace UUIDs and numeric IDs with placeholders for better deduplication
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid')
      .replace(/\/\d+/g, '/:id');
  }

  /**
   * Extract user ID from request (from JWT token or session)
   */
  private getUserId(req: Request): string {
    // Try to get user ID from JWT token
    const user = (req as any).user;
    if (user && user.id) {
      return user.id;
    }

    // Fallback to IP address for unauthenticated requests
    return req.ip || 'anonymous';
  }

  /**
   * Create stable hash of object
   */
  private hashObject(obj: any): string {
    // Sort keys to ensure consistent hashing
    const sortedObj = this.sortObjectKeys(obj);
    const jsonString = JSON.stringify(sortedObj);
    return this.createHash(jsonString);
  }

  /**
   * Sort object keys recursively for consistent hashing
   */
  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }

    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: any = {};
    
    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    }

    return sortedObj;
  }

  /**
   * Create simple hash (using built-in crypto if available, fallback to simple hash)
   */
  private createHash(input: string): string {
    try {
      const crypto = require('crypto');
      return crypto.createHash('md5').update(input).digest('hex');
    } catch (error) {
      // Fallback to simple hash if crypto is not available
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    }
  }

  /**
   * Check if request should skip deduplication
   */
  private shouldSkipDeduplication(path: string): boolean {
    const skipPaths = [
      '/health',
      '/metrics',
      '/favicon.ico',
      '/robots.txt',
      '/static/',
      '/assets/',
    ];

    return skipPaths.some(skipPath => path.startsWith(skipPath));
  }

  /**
   * Clean up expired requests from cache
   */
  private cleanupExpiredRequests(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, cached] of this.requestCache.entries()) {
      if (now - cached.timestamp > this.DEDUPLICATION_WINDOW * 2) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.requestCache.delete(key);
    }

    if (expiredKeys.length > 0) {
      this.logger.debug(`Cleaned up ${expiredKeys.length} expired request fingerprints`);
    }
  }

  /**
   * Clean up oldest requests when cache is full
   */
  private cleanupOldestRequests(): void {
    const entries = Array.from(this.requestCache.entries());
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 20% of entries
    const removeCount = Math.floor(entries.length * 0.2);
    
    for (let i = 0; i < removeCount; i++) {
      this.requestCache.delete(entries[i][0]);
    }

    this.logger.debug(`Cleaned up ${removeCount} oldest request fingerprints due to cache size limit`);
  }

  /**
   * Get current cache statistics (for monitoring)
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    deduplicationWindow: number;
    recentDuplicates: number;
  } {
    const now = Date.now();
    let recentDuplicates = 0;

    for (const cached of this.requestCache.values()) {
      if (cached.count > 1 && (now - cached.timestamp) < this.DEDUPLICATION_WINDOW * 5) {
        recentDuplicates++;
      }
    }

    return {
      size: this.requestCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      deduplicationWindow: this.DEDUPLICATION_WINDOW,
      recentDuplicates,
    };
  }
}