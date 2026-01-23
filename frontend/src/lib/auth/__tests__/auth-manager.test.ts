/**
 * Unit tests for AuthManager
 * Tests singleton pattern, request deduplication, and auth state management
 */

import { AuthManager } from '../auth-manager';
import apiClient from '../../api/client';

// Mock dependencies
jest.mock('../../api/client');
jest.mock('../secure-token-manager', () => ({
  secureTokenManager: {
    getToken: jest.fn(),
    hasValidToken: jest.fn(),
    clearToken: jest.fn(),
    getTokenInfo: jest.fn()
  }
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Import the mocked secureTokenManager after mocking
const { secureTokenManager: mockSecureTokenManager } = require('../secure-token-manager');

describe('AuthManager', () => {
  let authManager: AuthManager;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the AuthManager singleton for each test
    (AuthManager as any).instance = undefined;
    authManager = AuthManager.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AuthManager.getInstance();
      const instance2 = AuthManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Authentication Check', () => {
    it('should return unauthenticated when no token exists', async () => {
      mockSecureTokenManager.getToken.mockReturnValue(null);

      const result = await authManager.checkAuth();

      expect(result).toEqual({
        user: null,
        isAuthenticated: false
      });
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('should make API call when valid token exists', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['USER']
      };

      mockSecureTokenManager.getToken.mockReturnValue('valid-token');
      mockApiClient.get.mockResolvedValue({ data: mockUser });

      const result = await authManager.checkAuth();

      expect(result).toEqual({
        user: mockUser,
        isAuthenticated: true
      });
      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/me');
    });

    it('should clear token and return unauthenticated on API error', async () => {
      mockSecureTokenManager.getToken.mockReturnValue('invalid-token');
      mockApiClient.get.mockRejectedValue(new Error('Unauthorized'));

      const result = await authManager.checkAuth();

      expect(result).toEqual({
        user: null,
        isAuthenticated: false
      });
      expect(mockSecureTokenManager.clearToken).toHaveBeenCalled();
    });
  });

  describe('Request Deduplication', () => {
    it('should not make multiple simultaneous API calls', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['USER']
      };

      mockSecureTokenManager.getToken.mockReturnValue('valid-token');
      
      // Mock API call with delay to simulate concurrent requests
      mockApiClient.get.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: mockUser }), 100)
        )
      );

      // Make multiple concurrent auth checks
      const promises = [
        authManager.checkAuth(),
        authManager.checkAuth(),
        authManager.checkAuth()
      ];

      const results = await Promise.all(promises);

      // All should return the same result
      results.forEach(result => {
        expect(result).toEqual({
          user: mockUser,
          isAuthenticated: true
        });
      });

      // But API should only be called once
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);
    });

    it('should indicate when auth check is in progress', async () => {
      mockSecureTokenManager.getToken.mockReturnValue('valid-token');
      mockApiClient.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      // Start auth check
      const authPromise = authManager.checkAuth();
      
      // Check if in progress
      expect(authManager.isAuthCheckInProgress()).toBe(true);

      // Wait for completion
      await authPromise;

      // Should no longer be in progress
      expect(authManager.isAuthCheckInProgress()).toBe(false);
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should use cached result for recent auth checks', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['USER']
      };

      mockSecureTokenManager.getToken.mockReturnValue('valid-token');
      mockSecureTokenManager.hasValidToken.mockReturnValue(true);
      mockApiClient.get.mockResolvedValue({ data: mockUser });

      // First auth check
      await authManager.checkAuth();
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);

      // Fast-forward time by 15 seconds (within 30s cache duration)
      jest.advanceTimersByTime(15000);

      // Ensure hasValidToken still returns true for cache test
      mockSecureTokenManager.hasValidToken.mockReturnValue(true);

      // Second auth check should use cache
      await authManager.checkAuth();
      expect(mockApiClient.get).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should make new API call after cache expires', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['USER']
      };

      mockSecureTokenManager.getToken.mockReturnValue('valid-token');
      mockSecureTokenManager.hasValidToken.mockReturnValue(true);
      mockApiClient.get.mockResolvedValue({ data: mockUser });

      // First auth check
      await authManager.checkAuth();
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);

      // Fast-forward time by 35 seconds (past 30s cache duration)
      jest.advanceTimersByTime(35000);

      // Ensure token is still valid for the second call
      mockSecureTokenManager.getToken.mockReturnValue('valid-token');
      mockSecureTokenManager.hasValidToken.mockReturnValue(true);

      // Second auth check should make new API call
      await authManager.checkAuth();
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Force Refresh', () => {
    it('should bypass cache and make new API call', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['USER']
      };

      mockSecureTokenManager.getToken.mockReturnValue('valid-token');
      mockSecureTokenManager.hasValidToken.mockReturnValue(true);
      mockApiClient.get.mockResolvedValue({ data: mockUser });

      // First auth check
      await authManager.checkAuth();
      expect(mockApiClient.get).toHaveBeenCalledTimes(1);

      // Force refresh should bypass cache
      await authManager.forceRefresh();
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Logout', () => {
    it('should clear tokens and reset state', () => {
      authManager.logout();

      expect(mockSecureTokenManager.clearToken).toHaveBeenCalled();
      expect(authManager.isAuthCheckInProgress()).toBe(false);
    });
  });

  describe('Token Info', () => {
    it('should delegate to SecureTokenManager for token info', () => {
      const mockTokenInfo = {
        expiresAt: Date.now() + 3600000,
        issuedAt: Date.now(),
        timeToExpiry: 3600000
      };

      mockSecureTokenManager.getTokenInfo.mockReturnValue(mockTokenInfo);

      const result = authManager.getTokenInfo();

      expect(result).toBe(mockTokenInfo);
      expect(mockSecureTokenManager.getTokenInfo).toHaveBeenCalled();
    });

    it('should delegate to SecureTokenManager for token validation', () => {
      mockSecureTokenManager.hasValidToken.mockReturnValue(true);

      const result = authManager.hasValidToken();

      expect(result).toBe(true);
      expect(mockSecureTokenManager.hasValidToken).toHaveBeenCalled();
    });
  });
});