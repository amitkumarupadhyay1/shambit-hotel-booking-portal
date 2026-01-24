/**
 * AuthManager - Simplified API operations manager
 * 
 * Responsibilities:
 * 1. API calls for auth operations
 * 2. Token management via SecureTokenManager
 * 3. Request deduplication
 * 
 * State management is handled by Zustand store
 */

import { User } from '@/types/auth';
import { secureTokenManager } from './secure-token-manager';
import apiClient from '../api/client';
import { useAuthStore } from '../store/auth-store';

interface AuthCheckResult {
  user: User | null;
  isAuthenticated: boolean;
}

export class AuthManager {
  private static instance: AuthManager;
  private authPromise: Promise<AuthCheckResult> | null = null;
  private isChecking = false;

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
   * Updates Zustand store directly
   */
  public async checkAuth(): Promise<AuthCheckResult> {
    const store = useAuthStore.getState();
    
    // If auth check is already in progress, return the existing promise
    if (this.isChecking && this.authPromise) {
      console.log('🔐 Auth check already in progress, waiting for result...');
      return this.authPromise;
    }

    // Return cached result if recent check was performed AND we have a valid token
    if (store.isTokenValid() && store.user) {
      console.log('🔐 Using cached auth result from store');
      return { user: store.user, isAuthenticated: true };
    }

    // Start new auth check
    this.isChecking = true;
    store.setLoading(true);
    this.authPromise = this.performAuthCheck();

    try {
      const result = await this.authPromise;
      
      // Update store with result
      store.setUser(result.user);
      
      return result;
    } finally {
      // Clean up state
      this.isChecking = false;
      this.authPromise = null;
      store.setLoading(false);
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
    const store = useAuthStore.getState();
    store.setInitialized(false); // Reset cache
    return this.checkAuth();
  }

  /**
   * Clear auth state and tokens
   */
  public logout(): void {
    console.log('🔐 AuthManager logout');
    secureTokenManager.clearToken();
    
    // Update store
    const store = useAuthStore.getState();
    store.logout();
    
    // Clear internal state
    this.isChecking = false;
    this.authPromise = null;
  }

  /**
   * Clear auth cache (MANDATORY for login flow)
   */
  public clearCache(): void {
    console.log('🔐 AuthManager cache cleared');
    const store = useAuthStore.getState();
    store.setInitialized(false);
    
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
