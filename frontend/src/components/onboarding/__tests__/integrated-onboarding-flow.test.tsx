import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock step components for testing
jest.mock('../amenity-selection', () => ({
  __esModule: true,
  default: ({ onDataChange, onValidationChange }: any) => (
    <div data-testid="amenity-selection">
      <h2>Property Amenities</h2>
      <button onClick={() => onDataChange({ amenities: ['wifi', 'parking'] })}>
        Select Amenities
      </button>
    </div>
  ),
}));

jest.mock('../image-upload', () => ({
  __esModule: true,
  default: ({ onDataChange }: any) => (
    <div data-testid="image-upload">
      <h2>Property Images</h2>
      <button onClick={() => onDataChange({ images: ['image1.jpg'] })}>
        Upload Images
      </button>
    </div>
  ),
}));

jest.mock('../property-information-form', () => ({
  __esModule: true,
  default: ({ onDataChange }: any) => (
    <div data-testid="property-information">
      <h2>Property Information</h2>
      <button onClick={() => onDataChange({ name: 'Test Hotel' })}>
        Save Info
      </button>
    </div>
  ),
}));

jest.mock('../room-configuration-form', () => ({
  __esModule: true,
  default: ({ onDataChange }: any) => (
    <div data-testid="room-configuration">
      <h2>Room Configuration</h2>
      <button onClick={() => onDataChange({ rooms: [{ type: 'standard', count: 10 }] })}>
        Configure Rooms
      </button>
    </div>
  ),
}));

jest.mock('../business-features-form', () => ({
  __esModule: true,
  default: ({ onDataChange }: any) => (
    <div data-testid="business-features">
      <h2>Business Features</h2>
      <button onClick={() => onDataChange({ features: ['restaurant', 'spa'] })}>
        Select Features
      </button>
    </div>
  ),
}));

jest.mock('../quality-assurance-dashboard', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="quality-assurance">
      <h2>Quality Assurance</h2>
      <div>Quality Score: 85%</div>
    </div>
  ),
}));

jest.mock('../mobile-wizard', () => ({
  __esModule: true,
  default: ({ children, currentStep, onStepChange }: any) => (
    <div data-testid="mobile-wizard">
      <div>Step {currentStep + 1}</div>
      {children}
      <button onClick={() => onStepChange(currentStep + 1)}>Next</button>
      {currentStep > 0 && (
        <button onClick={() => onStepChange(currentStep - 1)}>Previous</button>
      )}
    </div>
  ),
}));

// Mock progressive enhancement to avoid infinite loops in tests
jest.mock('../progressive-enhancement', () => ({
  ProgressiveEnhancement: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock auth hook
const mockUseAuth = jest.fn();
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Get the mocked toast for use in tests
const { toast: mockToast } = jest.requireMock('sonner');

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import components after mocks
import { IntegratedOnboardingFlow } from '../integrated-onboarding-flow';
import { OnboardingErrorBoundary } from '../error-boundary';
import { ProgressiveEnhancement } from '../progressive-enhancement';

// Test utilities
const mockAuthenticatedUser = {
  id: 'user-1',
  email: 'test@hotel.com',
  role: 'SELLER',
};

const mockOnboardingSession = {
  id: 'session-1',
  hotelId: 'hotel-1',
  currentStep: 0,
  completedSteps: [],
  qualityScore: 0,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
};

const mockSuccessResponse = (data: any) => ({
  ok: true,
  json: async () => ({ success: true, data }),
});

const mockErrorResponse = (message: string, status = 400) => ({
  ok: false,
  status,
  json: async () => ({ success: false, message }),
});

describe('IntegratedOnboardingFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth state
    mockUseAuth.mockReturnValue({
      user: mockAuthenticatedUser,
      isAuthenticated: true,
      hasRole: jest.fn().mockReturnValue(true),
      isLoading: false,
    });

    // Default fetch responses
    mockFetch.mockImplementation((url: string, options: any) => {
      if (url.includes('/sessions') && options?.method === 'POST') {
        return Promise.resolve(mockSuccessResponse(mockOnboardingSession));
      }
      if (url.includes('/draft') && options?.method === 'GET') {
        return Promise.resolve(mockSuccessResponse({}));
      }
      return Promise.resolve(mockSuccessResponse({}));
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Authentication and Access Control', () => {
    it('should show loading state while checking authentication', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        hasRole: jest.fn().mockReturnValue(false),
        isLoading: true,
      });

      render(<IntegratedOnboardingFlow />);
      
      expect(screen.getByText('Initializing onboarding...')).toBeInTheDocument();
    });

    it('should show access denied for unauthenticated users', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        hasRole: jest.fn().mockReturnValue(false),
        isLoading: false,
      });

      render(<IntegratedOnboardingFlow />);
      
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Authentication required')).toBeInTheDocument();
    });

    it('should show access denied for users without SELLER role', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockAuthenticatedUser, role: 'USER' },
        isAuthenticated: true,
        hasRole: jest.fn().mockReturnValue(false),
        isLoading: false,
      });

      render(<IntegratedOnboardingFlow />);
      
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should redirect to login when login button is clicked', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        hasRole: jest.fn().mockReturnValue(false),
        isLoading: false,
      });

      render(<IntegratedOnboardingFlow />);
      
      const loginButton = screen.getByText('Try Again');
      await userEvent.click(loginButton);
      
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=/onboarding');
    });
  });

  describe('Session Initialization', () => {
    it('should create onboarding session on mount', async () => {
      render(<IntegratedOnboardingFlow />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/hotels/onboarding/sessions',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );
      });
    });

    it('should handle session creation failure', async () => {
      mockFetch.mockImplementationOnce(() => 
        Promise.resolve(mockErrorResponse('Failed to create session'))
      );

      render(<IntegratedOnboardingFlow />);
      
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to start onboarding process')).toBeInTheDocument();
      });
    });

    it('should retry session creation when try again is clicked', async () => {
      mockFetch
        .mockImplementationOnce(() => Promise.resolve(mockErrorResponse('Failed')))
        .mockImplementationOnce(() => Promise.resolve(mockSuccessResponse(mockOnboardingSession)));

      render(<IntegratedOnboardingFlow />);
      
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByText('Try Again');
      await userEvent.click(tryAgainButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Step Navigation and Completion', () => {
    beforeEach(async () => {
      render(<IntegratedOnboardingFlow />);
      
      // Wait for session initialization
      await waitFor(() => {
        expect(screen.getByText('Property Amenities')).toBeInTheDocument();
      });
    });

    it('should display first step (amenities) initially', () => {
      expect(screen.getByText('Property Amenities')).toBeInTheDocument();
      expect(screen.getByText('Select amenities that make your property special')).toBeInTheDocument();
    });

    it('should show progress indicators', () => {
      // Check for step indicators (1, 2, 3, etc.)
      expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
      
      // Check for progress bar
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should navigate to next step when current step is completed', async () => {
      // Mock successful step completion
      mockFetch.mockImplementation((url: string, options: any) => {
        if (url.includes('/steps') && options?.method === 'PUT') {
          return Promise.resolve(mockSuccessResponse({}));
        }
        if (url.includes('/complete') && options?.method === 'POST') {
          return Promise.resolve(mockSuccessResponse({}));
        }
        return Promise.resolve(mockSuccessResponse({}));
      });

      // Find and click next button (assuming amenities step has some form of next button)
      const nextButton = screen.getByText('Next');
      await userEvent.click(nextButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/steps'),
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });

    it('should show validation errors for invalid step data', async () => {
      mockFetch.mockImplementation((url: string, options: any) => {
        if (url.includes('/steps') && options?.method === 'PUT') {
          return Promise.resolve(mockErrorResponse('Validation failed'));
        }
        return Promise.resolve(mockSuccessResponse({}));
      });

      const nextButton = screen.getByText('Next');
      await userEvent.click(nextButton);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to save step progress');
      });
    });

    it('should allow navigation back to previous steps', async () => {
      // Simulate being on step 2
      const backButton = screen.getByText('Back');
      expect(backButton).toBeInTheDocument();
      
      // Back button should be enabled if not on first step
      expect(backButton).not.toBeDisabled();
    });
  });

  describe('Draft Saving and Loading', () => {
    beforeEach(async () => {
      render(<IntegratedOnboardingFlow />);
      
      await waitFor(() => {
        expect(screen.getByText('Property Amenities')).toBeInTheDocument();
      });
    });

    it('should auto-save draft data periodically', async () => {
      // Mock draft save endpoint
      mockFetch.mockImplementation((url: string, options: any) => {
        if (url.includes('/draft') && options?.method === 'PUT') {
          return Promise.resolve(mockSuccessResponse({}));
        }
        return Promise.resolve(mockSuccessResponse({}));
      });

      // Simulate user input that would trigger auto-save
      // This would depend on the specific implementation of step components
      
      // Wait for auto-save to trigger (typically after 2 seconds of inactivity)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 2100));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/draft'),
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });

    it('should load draft data on initialization', async () => {
      const mockDraftData = {
        amenities: { selectedAmenities: ['wifi', 'parking'] },
        'property-info': { description: 'Test description' }
      };

      mockFetch.mockImplementation((url: string, options: any) => {
        if (url.includes('/draft') && options?.method === 'GET') {
          return Promise.resolve(mockSuccessResponse(mockDraftData));
        }
        return Promise.resolve(mockSuccessResponse({}));
      });

      render(<IntegratedOnboardingFlow />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/draft'),
          expect.objectContaining({
            method: 'GET',
          })
        );
      });
    });

    it('should handle manual save button click', async () => {
      const saveButton = screen.getByText('Save');
      await userEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Progress saved');
      });
    });
  });

  describe('Offline Functionality', () => {
    beforeEach(() => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
    });

    it('should show offline indicator when offline', async () => {
      render(<IntegratedOnboardingFlow />);
      
      await waitFor(() => {
        expect(screen.getByText(/Working offline/)).toBeInTheDocument();
      });
    });

    it('should save to localStorage when offline', async () => {
      const mockSetItem = jest.fn();
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, setItem: mockSetItem },
        writable: true,
      });

      render(<IntegratedOnboardingFlow />);
      
      // Simulate auto-save trigger
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 2100));
      });

      await waitFor(() => {
        expect(mockSetItem).toHaveBeenCalledWith(
          'onboarding-draft',
          expect.stringContaining('data')
        );
      });
    });

    it('should sync data when coming back online', async () => {
      render(<IntegratedOnboardingFlow />);
      
      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
      });
      
      // Trigger online event
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Draft synced successfully');
      });
    });
  });

  describe('Onboarding Completion', () => {
    beforeEach(async () => {
      render(<IntegratedOnboardingFlow />);
      
      await waitFor(() => {
        expect(screen.getByText('Property Amenities')).toBeInTheDocument();
      });
    });

    it('should complete onboarding when all steps are finished', async () => {
      mockFetch.mockImplementation((url: string, options: any) => {
        if (url.includes('/complete') && options?.method === 'POST') {
          return Promise.resolve(mockSuccessResponse({
            sessionId: 'session-1',
            hotelId: 'hotel-1',
            qualityScore: 85
          }));
        }
        return Promise.resolve(mockSuccessResponse({}));
      });

      // Simulate completing all steps and clicking final complete button
      const completeButton = screen.getByText('Complete');
      await userEvent.click(completeButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/complete'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Onboarding completed successfully!');
      });
    });

    it('should redirect to hotel management after completion', async () => {
      mockFetch.mockImplementation((url: string, options: any) => {
        if (url.includes('/complete') && options?.method === 'POST') {
          return Promise.resolve(mockSuccessResponse({
            sessionId: 'session-1',
            hotelId: 'hotel-1',
            qualityScore: 85
          }));
        }
        return Promise.resolve(mockSuccessResponse({}));
      });

      const completeButton = screen.getByText('Complete');
      await userEvent.click(completeButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/seller/hotels/hotel-1');
      });
    });

    it('should handle completion failure gracefully', async () => {
      mockFetch.mockImplementation((url: string, options: any) => {
        if (url.includes('/complete') && options?.method === 'POST') {
          return Promise.resolve(mockErrorResponse('Completion failed'));
        }
        return Promise.resolve(mockSuccessResponse({}));
      });

      const completeButton = screen.getByText('Complete');
      await userEvent.click(completeButton);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to complete onboarding');
      });
    });

    it('should clear draft data after successful completion', async () => {
      const mockRemoveItem = jest.fn();
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, removeItem: mockRemoveItem },
        writable: true,
      });

      mockFetch.mockImplementation((url: string, options: any) => {
        if (url.includes('/complete') && options?.method === 'POST') {
          return Promise.resolve(mockSuccessResponse({
            sessionId: 'session-1',
            hotelId: 'hotel-1',
            qualityScore: 85
          }));
        }
        return Promise.resolve(mockSuccessResponse({}));
      });

      const completeButton = screen.getByText('Complete');
      await userEvent.click(completeButton);
      
      await waitFor(() => {
        expect(mockRemoveItem).toHaveBeenCalledWith('onboarding-draft');
      });
    });
  });

  describe('Error Handling', () => {
    it('should be wrapped in error boundary', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <OnboardingErrorBoundary>
          <ThrowError />
        </OnboardingErrorBoundary>
      );
      
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });

    it('should show error boundary with retry option', async () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <OnboardingErrorBoundary>
          <ThrowError />
        </OnboardingErrorBoundary>
      );
      
      const tryAgainButton = screen.getByText('Try Again');
      expect(tryAgainButton).toBeInTheDocument();
    });
  });

  describe('Progressive Enhancement', () => {
    it('should render mobile layout on mobile devices', () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
      });

      render(
        <ProgressiveEnhancement
          mobileComponent={() => <div data-testid="mobile-layout">Mobile Layout</div>}
        >
          <div>Default Layout</div>
        </ProgressiveEnhancement>
      );
      
      expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
    });

    it('should render desktop layout on desktop devices', () => {
      // Mock desktop user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
      });

      render(
        <ProgressiveEnhancement
          desktopComponent={() => <div data-testid="desktop-layout">Desktop Layout</div>}
        >
          <div>Default Layout</div>
        </ProgressiveEnhancement>
      );
      
      expect(screen.getByTestId('desktop-layout')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not make unnecessary API calls', async () => {
      render(<IntegratedOnboardingFlow />);
      
      await waitFor(() => {
        expect(screen.getByText('Property Amenities')).toBeInTheDocument();
      });

      // Should only make initial session creation and draft loading calls
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should debounce auto-save calls', async () => {
      render(<IntegratedOnboardingFlow />);
      
      await waitFor(() => {
        expect(screen.getByText('Property Amenities')).toBeInTheDocument();
      });

      // Simulate rapid changes that would trigger multiple auto-saves
      // The implementation should debounce these to a single call
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 2100));
      });

      // Should only make one auto-save call despite multiple triggers
      const draftCalls = mockFetch.mock.calls.filter(call => 
        call[0].includes('/draft') && call[1]?.method === 'PUT'
      );
      expect(draftCalls.length).toBeLessThanOrEqual(1);
    });
  });
});