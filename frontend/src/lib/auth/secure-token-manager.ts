/**
 * SecureTokenManager - Memory-first token storage with secure session management
 * 
 * This class addresses XSS vulnerabilities by:
 * 1. Storing tokens in memory only (no localStorage)
 * 2. Using sessionStorage as fallback for page refresh
 * 3. Implementing automatic token cleanup
 * 4. Adding token expiry validation
 * 
 * Security Features:
 * - Memory-first storage prevents XSS token theft
 * - Automatic cleanup on token expiry
 * - Session storage fallback for page refresh scenarios
 * - No persistent storage of sensitive tokens
 */

interface SessionData {
  token: string;
  expiresAt: number;
  sessionId: string;
}

export class SecureTokenManager {
  private static instance: SecureTokenManager;
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private tokenIssuedAt: number | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private sessionId: string;

  // Session storage key for page refresh fallback
  private readonly SESSION_KEY = 'kiro_session_temp';
  
  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeCleanup();
    this.restoreFromSession();
    
    // Clear session storage on page unload to prevent token persistence
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.clearSessionStorage();
      });
    }
  }

  /**
   * Get singleton instance of SecureTokenManager
   */
  public static getInstance(): SecureTokenManager {
    if (!SecureTokenManager.instance) {
      SecureTokenManager.instance = new SecureTokenManager();
    }
    return SecureTokenManager.instance;
  }

  /**
   * Store access token in memory with expiry validation
   * @param token - JWT access token
   * @param expiresIn - Token expiry in seconds
   */
  public setToken(token: string, expiresIn: number): void {
    const now = Date.now();
    const expiresAt = now + (expiresIn * 1000);
    
    this.accessToken = token;
    this.tokenExpiresAt = expiresAt;
    this.tokenIssuedAt = now;
    
    // Store in session storage as fallback for page refresh
    this.storeInSession(token, expiresAt);
    
    console.log('🔑 Token stored in memory:', {
      expiresIn: `${expiresIn}s`,
      expiresAt: new Date(expiresAt).toISOString()
    });
  }

  /**
   * Get access token if valid, null if expired or not set
   */
  public getToken(): string | null {
    // Check if token exists and is not expired
    if (!this.accessToken || !this.tokenExpiresAt) {
      return null;
    }

    // Check expiry with 30-second buffer for refresh
    const now = Date.now();
    const bufferTime = 30 * 1000; // 30 seconds
    
    if (now >= (this.tokenExpiresAt - bufferTime)) {
      console.log('🔑 Token expired or expiring soon, clearing');
      this.clearToken();
      return null;
    }

    return this.accessToken;
  }

  /**
   * Check if token exists and is valid
   */
  public hasValidToken(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Get token expiry information
   */
  public getTokenInfo(): { expiresAt: number | null; issuedAt: number | null; timeToExpiry: number | null } {
    return {
      expiresAt: this.tokenExpiresAt,
      issuedAt: this.tokenIssuedAt,
      timeToExpiry: this.tokenExpiresAt ? this.tokenExpiresAt - Date.now() : null
    };
  }

  /**
   * Clear token from memory and session storage
   */
  public clearToken(): void {
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.tokenIssuedAt = null;
    this.clearSessionStorage();
    
    console.log('🔑 Token cleared from memory and session');
  }

  /**
   * Clear all stored data and cleanup
   */
  public destroy(): void {
    this.clearToken();
    this.stopCleanup();
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.clearSessionStorage);
    }
    
    console.log('🔑 SecureTokenManager destroyed');
  }

  /**
   * Generate unique session ID for this browser session
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Store token in session storage as fallback for page refresh
   * Uses session-specific key to prevent cross-session token access
   */
  private storeInSession(token: string, expiresAt: number): void {
    if (typeof window === 'undefined') return;

    try {
      const sessionData: SessionData = {
        token,
        expiresAt,
        sessionId: this.sessionId
      };
      
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      console.log('🔑 Token stored in session storage as fallback');
    } catch (error) {
      console.warn('⚠️ Failed to store token in session storage:', error);
      // Continue without session storage - memory storage still works
    }
  }

  /**
   * Restore token from session storage on page refresh
   * Only restores if session ID matches and token is not expired
   */
  private restoreFromSession(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem(this.SESSION_KEY);
      if (!stored) return;

      const sessionData: SessionData = JSON.parse(stored);
      
      // Verify session ID matches (prevents cross-session token access)
      if (sessionData.sessionId !== this.sessionId) {
        console.log('🔑 Session ID mismatch, clearing stored token');
        this.clearSessionStorage();
        return;
      }

      // Check if token is still valid
      const now = Date.now();
      if (now >= sessionData.expiresAt) {
        console.log('🔑 Stored token expired, clearing');
        this.clearSessionStorage();
        return;
      }

      // Restore token to memory
      this.accessToken = sessionData.token;
      this.tokenExpiresAt = sessionData.expiresAt;
      this.tokenIssuedAt = now; // Approximate issued time
      
      console.log('🔑 Token restored from session storage');
    } catch (error) {
      console.warn('⚠️ Failed to restore token from session storage:', error);
      this.clearSessionStorage();
    }
  }

  /**
   * Clear session storage
   */
  private clearSessionStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.warn('⚠️ Failed to clear session storage:', error);
    }
  }

  /**
   * Initialize automatic cleanup interval
   */
  private initializeCleanup(): void {
    // Check for expired tokens every 30 seconds
    this.cleanupInterval = setInterval(() => {
      if (this.tokenExpiresAt && Date.now() >= this.tokenExpiresAt) {
        console.log('🔑 Automatic cleanup: Token expired');
        this.clearToken();
      }
    }, 30000);
  }

  /**
   * Stop automatic cleanup
   */
  private stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const secureTokenManager = SecureTokenManager.getInstance();