/**
 * Onboarding Session Manager
 * Prevents duplicate session creation across multiple component instances
 */

interface OnboardingSession {
  id: string;
  hotelId: string;
  currentStep: number;
  completedSteps: string[];
  qualityScore: number;
  expiresAt: string;
}

class OnboardingSessionManager {
  private static instance: OnboardingSessionManager;
  private session: OnboardingSession | null = null;
  private initPromise: Promise<OnboardingSession> | null = null;
  private listeners: Set<(session: OnboardingSession | null) => void> = new Set();

  private constructor() {}

  static getInstance(): OnboardingSessionManager {
    if (!OnboardingSessionManager.instance) {
      OnboardingSessionManager.instance = new OnboardingSessionManager();
    }
    return OnboardingSessionManager.instance;
  }

  getSession(): OnboardingSession | null {
    return this.session;
  }

  setSession(session: OnboardingSession | null): void {
    this.session = session;
    this.notifyListeners();
  }

  getInitPromise(): Promise<OnboardingSession> | null {
    return this.initPromise;
  }

  setInitPromise(promise: Promise<OnboardingSession> | null): void {
    this.initPromise = promise;
  }

  subscribe(listener: (session: OnboardingSession | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.session));
  }

  clear(): void {
    this.session = null;
    this.initPromise = null;
    this.notifyListeners();
  }
}

export default OnboardingSessionManager;
export type { OnboardingSession };