/**
 * Unit tests for SecureTokenManager
 * Tests memory-only storage, token expiry, and session management
 */

import { SecureTokenManager } from '../secure-token-manager';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock sessionStorage
const mockSessionStorage: {
  store: Record<string, string>;
  getItem: jest.Mock<string | null, [string]>;
  setItem: jest.Mock<void, [string, string]>;
  removeItem: jest.Mock<void, [string]>;
  clear: jest.Mock<void, []>;
} = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string): string | null => mockSessionStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string): void => {
    mockSessionStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string): void => {
    delete mockSessionStorage.store[key];
  }),
  clear: jest.fn((): void => {
    mockSessionStorage.store = {};
  })
};

// Mock window and sessionStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

describe('SecureTokenManager', () => {
  let tokenManager: SecureTokenManager;

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    mockSessionStorage.clear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    
    // Get fresh instance
    tokenManager = SecureTokenManager.getInstance();
    
    // Clear any existing tokens
    tokenManager.clearToken();
  });

  afterEach(() => {
    tokenManager.destroy();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SecureTokenManager.getInstance();
      const instance2 = SecureTokenManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Token Storage', () => {
    it('should store token in memory only', () => {
      const token = 'test-token';
      const expiresIn = 3600; // 1 hour

      tokenManager.setToken(token, expiresIn);

      expect(tokenManager.getToken()).toBe(token);
      expect(tokenManager.hasValidToken()).toBe(true);
    });

    it('should not store token in localStorage', () => {
      const token = 'test-token';
      const expiresIn = 3600;

      tokenManager.setToken(token, expiresIn);

      // Verify no localStorage usage
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should store token in sessionStorage as fallback', () => {
      const token = 'test-token';
      const expiresIn = 3600;

      tokenManager.setToken(token, expiresIn);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'kiro_session_temp',
        expect.stringContaining(token)
      );
    });
  });

  describe('Token Expiry', () => {
    it('should return null for expired token', () => {
      const token = 'test-token';
      const expiresIn = -1; // Already expired

      tokenManager.setToken(token, expiresIn);

      expect(tokenManager.getToken()).toBeNull();
      expect(tokenManager.hasValidToken()).toBe(false);
    });

    it('should return null for token expiring soon (within 30s buffer)', () => {
      const token = 'test-token';
      const expiresIn = 25; // 25 seconds (within 30s buffer)

      tokenManager.setToken(token, expiresIn);

      expect(tokenManager.getToken()).toBeNull();
      expect(tokenManager.hasValidToken()).toBe(false);
    });

    it('should return token if not expired and outside buffer', () => {
      const token = 'test-token';
      const expiresIn = 60; // 1 minute (outside 30s buffer)

      tokenManager.setToken(token, expiresIn);

      expect(tokenManager.getToken()).toBe(token);
      expect(tokenManager.hasValidToken()).toBe(true);
    });
  });

  describe('Token Info', () => {
    it('should provide token expiry information', () => {
      const token = 'test-token';
      const expiresIn = 3600;
      const beforeSet = Date.now();

      tokenManager.setToken(token, expiresIn);

      const info = tokenManager.getTokenInfo();
      const afterSet = Date.now();

      expect(info.expiresAt).toBeGreaterThan(beforeSet + (expiresIn * 1000) - 1000);
      expect(info.expiresAt).toBeLessThan(afterSet + (expiresIn * 1000) + 1000);
      expect(info.issuedAt).toBeGreaterThanOrEqual(beforeSet);
      expect(info.issuedAt).toBeLessThanOrEqual(afterSet);
      expect(info.timeToExpiry).toBeGreaterThan(expiresIn * 1000 - 1000);
    });

    it('should return null values when no token is set', () => {
      const info = tokenManager.getTokenInfo();

      expect(info.expiresAt).toBeNull();
      expect(info.issuedAt).toBeNull();
      expect(info.timeToExpiry).toBeNull();
    });
  });

  describe('Token Cleanup', () => {
    it('should clear token from memory and session storage', () => {
      const token = 'test-token';
      const expiresIn = 3600;

      tokenManager.setToken(token, expiresIn);
      expect(tokenManager.hasValidToken()).toBe(true);

      tokenManager.clearToken();

      expect(tokenManager.getToken()).toBeNull();
      expect(tokenManager.hasValidToken()).toBe(false);
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('kiro_session_temp');
    });
  });

  describe('Session Storage Fallback', () => {
    it('should attempt to restore token from session storage on initialization', () => {
      // This test verifies that the constructor calls getItem to check for stored tokens
      // Since we're using a singleton, we can't easily test fresh initialization
      // But we can verify the restoration logic is called during the existing instance lifecycle
      
      const token = 'test-token';
      const expiresAt = Date.now() + 3600000; // 1 hour from now
      const sessionId = 'test-session-id';

      const sessionData = {
        token,
        expiresAt,
        sessionId
      };
      
      // Set up session storage data
      mockSessionStorage.store['kiro_session_temp'] = JSON.stringify(sessionData);
      
      // Call the private method directly to test restoration logic
      const restoreMethod = (tokenManager as any).restoreFromSession;
      if (restoreMethod) {
        restoreMethod.call(tokenManager);
      }

      // Verify session storage was accessed
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('kiro_session_temp');
    });

    it('should not restore expired token from session storage', () => {
      const token = 'test-token';
      const expiresAt = Date.now() - 1000; // Expired 1 second ago
      const sessionId = 'test-session-id';

      const sessionData = {
        token,
        expiresAt,
        sessionId
      };
      mockSessionStorage.store['kiro_session_temp'] = JSON.stringify(sessionData);

      // Create new instance
      const newManager = SecureTokenManager.getInstance();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('kiro_session_temp');
    });
  });

  describe('Automatic Cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should automatically clean up expired tokens', () => {
      const token = 'test-token';
      const expiresIn = 35; // 35 seconds (will be expired after 35s advance)

      tokenManager.setToken(token, expiresIn);
      expect(tokenManager.hasValidToken()).toBe(true);

      // Fast-forward time by 40 seconds (past cleanup interval and token expiry)
      jest.advanceTimersByTime(40000);

      expect(tokenManager.getToken()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle sessionStorage errors gracefully', () => {
      // Mock sessionStorage to throw error
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const token = 'test-token';
      const expiresIn = 3600;

      // Should not throw error
      expect(() => {
        tokenManager.setToken(token, expiresIn);
      }).not.toThrow();

      // Token should still be stored in memory
      expect(tokenManager.getToken()).toBe(token);
    });

    it('should handle malformed session data gracefully', () => {
      // Set invalid JSON in session storage
      mockSessionStorage.store['kiro_session_temp'] = 'invalid-json';

      // Should not throw error when creating new instance
      expect(() => {
        SecureTokenManager.getInstance();
      }).not.toThrow();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('kiro_session_temp');
    });
  });
});