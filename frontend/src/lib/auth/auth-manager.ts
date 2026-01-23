/**
 * AuthManager - Singleton pattern for auth state management
 * 
 * This class addresses race conditions by:
 * 1. Implementing singleton pattern to prevent multiple simultaneous auth checks
 * 2. Request deduplication for auth operations
 * 3. Promise caching for in-flight requests
 * 4. Centralized auth state management
 * 
 * Features:
 * - Single auth check per session
 * - Request deduplication prevents API spam
 * - Promise caching for concurrent requests
 * - Automatic cleanup of completed requests
 */

import { User } from '@/types/auth';
import { secureTokenManager } from './secure-token-manager';
import apiClient from '../api/client';

interface AuthCheckResult {
  user: User | null;
  isAuthenticated: boolean;
}

export class AuthManager {
  private static instance: AuthManager;
  private authPromise: Promise<AuthCheckResult> | null = null;
  private isChecking = false;
  private lastAuthCheck = 0;
  private lastUser: User | null = null; // Cache the last successful user
  private readonly AUTH_CACHE_DURATION = 30000; // 30 seconds

  private constructor() {
    console.log('🔐 AuthManager initialized');
  }

  /**
   * Get singleton instance of AuthManager
   */
  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  /**
   * Check authentication status with request deduplication
   * Returns cached result if recent check was performed
   */
  public async checkAuth(): Promise<AuthCheckResult> {
    const now = Date.now();
    
    // If auth check is already in progress, return the existing promise
    if (this.isChecking && this.authPromise) {
      console.log('🔐 Auth check already in progress, waiting for result...');
      return this.authPromise;
    }

    // Return cached result if recent check was performed AND we have a valid token
    if (now - this.lastAuthCheck < this.AUTH_CACHE_DURATION) {
      const hasToken = secureTokenManager.hasValidToken();
      if (hasToken) {
        console.log('🔐 Using cached auth result');
        // FIX: Only cache successful authentication results, not failures
        if (this.lastUser) {
          return { user: this.lastUser, isAuthenticated: true };
        } else {
          // Token exists but no cached user - this means login happened recently
          // Force a fresh auth check to get the user data
          console.log('🔐 Token exists but no cached user, forcing fresh check');
          this.lastAuthCheck = 0; // Reset cache to force fresh check
          return this.checkAuth(); // Recursive call will perform fresh check
        }
      } else {
        console.log('🔐 No valid token, clearing cache');
        this.lastAuthCheck = 0; // Clear cache if no valid token
      }
    }

    // Start new auth check
    this.isChecking = true;
    this.authPromise = this.performAuthCheck();

    try {
      const result = await this.authPromise;
      this.lastAuthCheck = now;
      this.lastUser = result.user; // Cache the user for future cached responses
      return result;
    } finally {
      // Clean up state
      this.isChecking = false;
      this.authPromise = null;
    }
  }

  /**
   * Perform the actual authentication check
   */
  private async performAuthCheck(): Promise<AuthCheckResult> {
    try {
      console.log('🔐 Performing auth check...');

      // First check if we have a valid token
      const token = secureTokenManager.getToken();
      if (!token) {
        console.log('🔐 No valid token found');
        return { user: null, isAuthenticated: false };
      }

      // Make API call to verify token and get user data
      const response = await apiClient.get('/auth/me');
      const user = response.data;

      console.log('✅ Auth check successful:', user.email);
      return { user, isAuthenticated: true };

    } catch (error: any) {
      console.log('❌ Auth check failed:', error.response?.status, error.response?.data);
      
      // Clear token if auth check fails
      secureTokenManager.clearToken();
      
      return { user: null, isAuthenticated: false };
    }
  }

  /**
   * Force refresh of auth state (bypasses cache)
   */
  public async forceRefresh(): Promise<AuthCheckResult> {
    console.log('🔐 Forcing auth refresh...');
    this.lastAuthCheck = 0; // Reset cache
    return this.checkAuth();
  }

  /**
   * Clear auth state and tokens
   */
  public logout(): void {
    console.log('🔐 AuthManager logout');
    secureTokenManager.clearToken();
    this.lastAuthCheck = 0;
    this.lastUser = null; // Clear cached user
    this.isChecking = false;
    this.authPromise = null;
  }

  /**
   * Clear auth cache (MANDATORY for login flow)
   * This prevents cached failures from blocking post-login auth checks
   */
  public clearCache(): void {
    console.log('🔐 AuthManager cache cleared');
    this.lastAuthCheck = 0;
    this.lastUser = null;
    this.isChecking = false;
    this.authPromise = null;
  }

  /**
   * Check if currently performing auth check
   */
  public isAuthCheckInProgress(): boolean {
    return this.isChecking;
  }

  /**
   * Get token info from SecureTokenManager
   */
  public getTokenInfo() {
    return secureTokenManager.getTokenInfo();
  }

  /**
   * Check if user has valid token
   */
  public hasValidToken(): boolean {
    return secureTokenManager.hasValidToken();
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance();
