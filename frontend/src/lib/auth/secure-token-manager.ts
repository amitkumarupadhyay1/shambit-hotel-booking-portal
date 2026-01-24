/**
 * Simple Token Manager - Memory-only token storage
 */

export class SecureTokenManager {
  private static instance: SecureTokenManager;
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  
  private constructor() {}

  public static getInstance(): SecureTokenManager {
    if (!SecureTokenManager.instance) {
      SecureTokenManager.instance = new SecureTokenManager();
    }
    return SecureTokenManager.instance;
  }

  public setToken(token: string, expiresIn: number): void {
    this.accessToken = token;
    this.tokenExpiresAt = Date.now() + (expiresIn * 1000);
  }

  public getToken(): string | null {
    if (!this.accessToken || !this.tokenExpiresAt) {
      return null;
    }

    // Check if expired (with 30s buffer)
    if (Date.now() >= (this.tokenExpiresAt - 30000)) {
      this.clearToken();
      return null;
    }

    return this.accessToken;
  }

  public hasValidToken(): boolean {
    return this.getToken() !== null;
  }

  public clearToken(): void {
    this.accessToken = null;
    this.tokenExpiresAt = null;
  }
}

// Export singleton instance
export const secureTokenManager = SecureTokenManager.getInstance();