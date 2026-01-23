/**
 * Request Deduplicator - Prevents multiple simultaneous requests to the same endpoint
 * Fixes rate limiting issues by ensuring only one request per endpoint at a time
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly CACHE_TTL = 5000; // 5 seconds

  /**
   * Deduplicate requests by endpoint and method
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: {
      ttl?: number;
      forceRefresh?: boolean;
    } = {}
  ): Promise<T> {
    const { ttl = this.CACHE_TTL, forceRefresh = false } = options;
    
    // Clean up expired requests
    this.cleanup();

    // Check if we should force a refresh
    if (forceRefresh) {
      this.pendingRequests.delete(key);
    }

    // Check if request is already pending
    const existing = this.pendingRequests.get(key);
    if (existing) {
      console.log(`🔄 Deduplicating request: ${key}`);
      return existing.promise;
    }

    // Create new request
    console.log(`🚀 Making new request: ${key}`);
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      setTimeout(() => {
        this.pendingRequests.delete(key);
      }, ttl);
    });

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  /**
   * Clear a specific request from cache
   */
  clear(key: string): void {
    this.pendingRequests.delete(key);
  }

  /**
   * Clear all pending requests
   */
  clearAll(): void {
    this.pendingRequests.clear();
  }

  /**
   * Clean up expired requests
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.CACHE_TTL * 2) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Get the number of pending requests
   */
  getPendingCount(): number {
    this.cleanup();
    return this.pendingRequests.size;
  }

  /**
   * Check if a request is pending
   */
  isPending(key: string): boolean {
    this.cleanup();
    return this.pendingRequests.has(key);
  }
}

// Singleton instance
const requestDeduplicator = new RequestDeduplicator();

export default requestDeduplicator;

/**
 * Helper function to create request keys
 */
export const createRequestKey = (method: string, url: string, params?: any): string => {
  const paramString = params ? JSON.stringify(params) : '';
  return `${method.toUpperCase()}:${url}${paramString ? `:${paramString}` : ''}`;
};

/**
 * Decorator for API methods to add automatic deduplication
 */
export const withDeduplication = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string
) => {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    return requestDeduplicator.deduplicate(key, () => fn(...args));
  };
};