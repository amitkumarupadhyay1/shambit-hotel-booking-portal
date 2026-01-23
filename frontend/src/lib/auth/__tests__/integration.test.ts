/**
 * Integration tests for SecureTokenManager with API client
 * Tests the complete flow of token management
 */

import { secureTokenManager } from '../secure-token-manager';
import { setAccessToken, getAccessToken } from '../../api/client';

describe('SecureTokenManager Integration', () => {
  beforeEach(() => {
    // Clear any existing tokens
    secureTokenManager.clearToken();
  });

  afterEach(() => {
    secureTokenManager.clearToken();
  });

  it('should integrate with API client token management', () => {
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.Hmac_signature';
    
    // Set token via API client
    setAccessToken(testToken);
    
    // Verify token is available via API client
    expect(getAccessToken()).toBe(testToken);
    
    // Verify token is stored in SecureTokenManager
    expect(secureTokenManager.hasValidToken()).toBe(true);
  });

  it('should clear token from both API client and SecureTokenManager', () => {
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.Hmac_signature';
    
    // Set token
    setAccessToken(testToken);
    expect(getAccessToken()).toBe(testToken);
    
    // Clear token
    setAccessToken(null);
    
    // Verify token is cleared from both
    expect(getAccessToken()).toBeNull();
    expect(secureTokenManager.hasValidToken()).toBe(false);
  });

  it('should handle expired tokens correctly', () => {
    // Create an expired token (exp in the past)
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxfQ.expired_signature';
    
    // Set expired token
    setAccessToken(expiredToken);
    
    // Should return null for expired token
    expect(getAccessToken()).toBeNull();
    expect(secureTokenManager.hasValidToken()).toBe(false);
  });

  it('should not use localStorage for token storage', () => {
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.Hmac_signature';
    
    // Mock localStorage to verify it's not used
    const localStorageSetSpy = jest.spyOn(Storage.prototype, 'setItem');
    const localStorageGetSpy = jest.spyOn(Storage.prototype, 'getItem');
    
    // Set token
    setAccessToken(testToken);
    
    // Verify localStorage is not used for token storage
    expect(localStorageSetSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('token'),
      expect.any(String)
    );
    
    // Get token
    getAccessToken();
    
    // Verify localStorage is not accessed for token retrieval
    expect(localStorageGetSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('token')
    );
    
    // Clean up spies
    localStorageSetSpy.mockRestore();
    localStorageGetSpy.mockRestore();
  });
});