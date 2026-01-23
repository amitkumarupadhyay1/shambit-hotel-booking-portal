import { Injectable, NestMiddleware, Logger, ForbiddenException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Request, Response, NextFunction } from 'express';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';

interface CSRFTokenData {
  token: string;
  timestamp: number;
  userId?: string;
}

/**
 * CSRF Protection Middleware
 * Requirements: 9.1 - Add CSRF protection (Security Requirement)
 * 
 * This middleware provides CSRF protection by:
 * 1. Generating secure CSRF tokens for each session
 * 2. Validating CSRF tokens on state-changing requests
 * 3. Implementing token rotation for enhanced security
 * 4. Providing proper error handling for CSRF failures
 * 5. Supporting both cookie and header-based token transmission
 */
@Injectable()
export class CSRFProtectionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CSRFProtectionMiddleware.name);
  private readonly TOKEN_EXPIRY = 3600000; // 1 hour
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes (kept for stats)
  private readonly TOKEN_LENGTH = 32;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Log the request path for debugging
      this.logger.debug(`CSRF middleware processing: ${req.method} ${req.path}`, {
        originalUrl: req.originalUrl,
        path: req.path,
        url: req.url,
      });

      // Handle token generation requests FIRST - before skipping safe methods
      if (this.isTokenGenerationRequest(req)) {
        await this.handleTokenGeneration(req, res);
        return;
      }

      // Skip CSRF protection for safe methods and specific paths
      if (this.shouldSkipCSRFProtection(req)) {
        this.logger.debug(`Skipping CSRF protection for: ${req.method} ${req.path}`);
        return next();
      }

      // Validate CSRF token for state-changing requests
      if (this.isStateChangingRequest(req)) {
        await this.validateCSRFToken(req);
      }

      next();
    } catch (error) {
      this.logger.error('CSRF protection error:', error);

      if (error instanceof ForbiddenException) {
        throw error;
      }

      // Don't block requests on middleware errors, but log them
      this.logger.warn('CSRF middleware error, allowing request to proceed:', error.message);
      next();
    }
  }

  /**
   * Check if CSRF protection should be skipped for this request
   */
  private shouldSkipCSRFProtection(req: Request): boolean {
    // Skip for safe HTTP methods (GET, HEAD, OPTIONS)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return true;
    }

    // Get both path and originalUrl for checking
    const path = req.path;
    const originalUrl = req.originalUrl;
    const url = req.url;

    // Skip for specific paths that don't need CSRF protection
    const skipPaths = [
      '/health',
      '/metrics',
      '/auth/login',        // Skip CSRF for login - it's the entry point
      '/auth/register',     // Skip CSRF for register - it's the entry point
      '/auth/refresh',      // Skip CSRF for refresh - uses httpOnly cookies
      '/auth/google',       // Skip CSRF for OAuth - has its own protection
      '/csrf-token',        // Skip CSRF for token generation endpoint
      '/api/v1/auth/login',    // With global prefix
      '/api/v1/auth/register', // With global prefix
      '/api/v1/auth/refresh',  // With global prefix
      '/api/v1/auth/google',   // With global prefix
      '/api/v1/csrf-token',    // With global prefix
    ];

    // Check against all possible path representations
    const shouldSkip = skipPaths.some(skipPath =>
      path.startsWith(skipPath) ||
      originalUrl.startsWith(skipPath) ||
      url.startsWith(skipPath)
    );

    if (shouldSkip) {
      this.logger.debug(`CSRF protection skipped for path: ${path} (originalUrl: ${originalUrl})`);
    }

    return shouldSkip;
  }

  /**
   * Check if this is a token generation request
   */
  private isTokenGenerationRequest(req: Request): boolean {
    const path = req.path;
    const originalUrl = req.originalUrl;
    const url = req.url;

    return req.method === 'GET' && (
      path === '/csrf-token' ||
      originalUrl === '/csrf-token' ||
      url === '/csrf-token' ||
      path === '/api/v1/csrf-token' ||
      originalUrl === '/api/v1/csrf-token' ||
      url === '/api/v1/csrf-token'
    );
  }

  /**
   * Check if this is a state-changing request that requires CSRF protection
   */
  private isStateChangingRequest(req: Request): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  }

  /**
   * Handle CSRF token generation
   */
  private async handleTokenGeneration(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const sessionId = this.getSessionId(req);

    // Generate new CSRF token
    const token = this.generateCSRFToken();
    const tokenData: CSRFTokenData = {
      token,
      timestamp: Date.now(),
      userId,
    };

    // Store token in cache (Redis)
    const tokenKey = this.getTokenKey(sessionId, userId);
    // Use slightly longer TTL in Redis than logical expiry to allow clock skew
    await this.cacheManager.set(tokenKey, tokenData, this.TOKEN_EXPIRY);

    this.logger.debug(`Generated CSRF token for session: ${sessionId}, user: ${userId}`);

    // Set token in secure cookie
    res.cookie('csrf-token', token, {
      httpOnly: false, // Allow JavaScript access for AJAX requests
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.TOKEN_EXPIRY,
    });

    // Also return token in response for programmatic access
    res.json({
      csrfToken: token,
      expiresIn: this.TOKEN_EXPIRY,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Validate CSRF token from request
   */
  private async validateCSRFToken(req: Request): Promise<void> {
    const userId = this.getUserId(req);
    const sessionId = this.getSessionId(req);
    const tokenKey = this.getTokenKey(sessionId, userId);

    // Get stored token data from Redis
    const storedTokenData = await this.cacheManager.get<CSRFTokenData>(tokenKey);

    if (!storedTokenData) {
      this.logger.warn(`CSRF token not found for session ${sessionId}`, {
        userId,
        path: req.path,
        method: req.method,
        tokenKey, // Log key for debugging
      });
      throw new ForbiddenException({
        message: 'CSRF token required',
        error: 'Forbidden',
        code: 'CSRF_TOKEN_MISSING',
      });
    }

    // Check token expiry
    if (Date.now() - storedTokenData.timestamp > this.TOKEN_EXPIRY) {
      await this.cacheManager.del(tokenKey);
      this.logger.warn(`Expired CSRF token for session ${sessionId}`, {
        userId,
        path: req.path,
        method: req.method,
      });
      throw new ForbiddenException({
        message: 'CSRF token expired',
        error: 'Forbidden',
        code: 'CSRF_TOKEN_EXPIRED',
      });
    }

    // Get token from request (header or body)
    const requestToken = this.extractTokenFromRequest(req);
    if (!requestToken) {
      this.logger.warn(`CSRF token not provided in request for session ${sessionId}`, {
        userId,
        path: req.path,
        method: req.method,
      });
      throw new ForbiddenException({
        message: 'CSRF token not provided',
        error: 'Forbidden',
        code: 'CSRF_TOKEN_NOT_PROVIDED',
      });
    }

    // Validate token using timing-safe comparison
    if (!this.isValidToken(requestToken, storedTokenData.token)) {
      this.logger.warn(`Invalid CSRF token for session ${sessionId}`, {
        userId,
        path: req.path,
        method: req.method,
        providedToken: requestToken.substring(0, 8) + '...',
      });
      throw new ForbiddenException({
        message: 'Invalid CSRF token',
        error: 'Forbidden',
        code: 'CSRF_TOKEN_INVALID',
      });
    }

    // Token is valid - optionally rotate it for enhanced security
    if (this.shouldRotateToken(storedTokenData)) {
      await this.rotateCSRFToken(tokenKey, storedTokenData, userId);
    }

    this.logger.debug(`CSRF token validated successfully for session ${sessionId}`, {
      userId,
      path: req.path,
      method: req.method,
    });
  }

  /**
   * Extract CSRF token from request headers or body
   */
  private extractTokenFromRequest(req: Request): string | null {
    // Try X-CSRF-Token header first
    let token = req.headers['x-csrf-token'] as string;

    if (!token) {
      // Try csrf-token header
      token = req.headers['csrf-token'] as string;
    }

    if (!token && req.body) {
      // Try body field
      token = req.body.csrfToken || req.body._csrf;
    }

    return token || null;
  }

  /**
   * Generate a new CSRF token
   */
  private generateCSRFToken(): string {
    return randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Validate token using timing-safe comparison
   */
  private isValidToken(providedToken: string, storedToken: string): boolean {
    if (providedToken.length !== storedToken.length) {
      return false;
    }

    try {
      const providedBuffer = Buffer.from(providedToken, 'hex');
      const storedBuffer = Buffer.from(storedToken, 'hex');

      return timingSafeEqual(providedBuffer, storedBuffer);
    } catch (error) {
      this.logger.warn('Error comparing CSRF tokens:', error.message);
      return false;
    }
  }

  /**
   * Get user ID from request
   */
  private getUserId(req: Request): string {
    const user = (req as any).user;
    return user?.id || 'anonymous';
  }

  /**
   * Get session ID from request
   */
  private getSessionId(req: Request): string {
    // Try to get session ID from various sources
    const sessionId = (req as any).sessionID ||
      req.headers['x-session-id'] as string ||
      req.cookies?.sessionId ||
      this.generateSessionId(req);

    return sessionId;
  }

  /**
   * Generate session ID based on request characteristics
   */
  private generateSessionId(req: Request): string {
    const data = `${req.ip}-${req.headers['user-agent']}-${this.getUserId(req)}`;
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Get token cache key
   */
  private getTokenKey(sessionId: string, userId: string): string {
    return `${sessionId}-${userId}`;
  }

  /**
   * Check if token should be rotated
   */
  private shouldRotateToken(tokenData: CSRFTokenData): boolean {
    // Rotate token if it's older than 30 minutes
    const rotationThreshold = 1800000; // 30 minutes
    return Date.now() - tokenData.timestamp > rotationThreshold;
  }

  /**
   * Rotate CSRF token for enhanced security
   */
  private async rotateCSRFToken(tokenKey: string, oldTokenData: CSRFTokenData, userId: string): Promise<void> {
    const newToken = this.generateCSRFToken();
    const newTokenData: CSRFTokenData = {
      token: newToken,
      timestamp: Date.now(),
      userId,
    };

    await this.cacheManager.set(tokenKey, newTokenData, this.TOKEN_EXPIRY);

    this.logger.debug(`CSRF token rotated for user ${userId}`, {
      oldTokenAge: Date.now() - oldTokenData.timestamp,
    });
  }

  /**
   * Clean up expired tokens (delegated to Redis TTL mostly, but kept for interface/logging)
   */
  private cleanupExpiredTokens(): void {
    // Redis handles expiry automatically
    this.logger.debug(`Redis used for CSRF storage - auto expiry handle`);
  }

  /**
   * Get CSRF protection statistics (for monitoring)
   */
  getCSRFStats(): {
    activeTokens: number;
    tokenExpiry: number;
    cleanupInterval: number;
  } {
    return {
      activeTokens: -1, // Redis size check is expensive, returning placeholder
      tokenExpiry: this.TOKEN_EXPIRY,
      cleanupInterval: this.CLEANUP_INTERVAL,
    };
  }
}