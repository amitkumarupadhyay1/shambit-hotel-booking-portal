'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class OnboardingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('Onboarding Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service
    this.reportError(error, errorInfo);

    // Show user-friendly toast notification
    toast.error('Something went wrong with the onboarding process', {
      description: 'Your progress has been saved. Please try refreshing the page.',
      duration: 10000,
    });
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Report to error monitoring service
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId: this.state.errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          userId: localStorage.getItem('userId'), // If available
        }),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      timestamp: new Date().toISOString(),
    };

    const mailtoLink = `mailto:support@example.com?subject=Onboarding Error Report&body=${encodeURIComponent(
      `Error ID: ${errorDetails.errorId}\nMessage: ${errorDetails.message}\nTime: ${errorDetails.timestamp}\n\nPlease describe what you were doing when this error occurred:`
    )}`;

    window.open(mailtoLink);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-slate-800">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-slate-600">
                Don't worry - your onboarding progress has been automatically saved.
                You can try refreshing the page or contact support if the problem persists.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error details for debugging (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Error Details (Development Only)
                  </h4>
                  <div className="text-xs text-red-700 font-mono">
                    <div className="mb-2">
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    {this.state.errorId && (
                      <div className="mb-2">
                        <strong>Error ID:</strong> {this.state.errorId}
                      </div>
                    )}
                    {this.state.error.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-red-600 hover:text-red-800">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={this.handleRetry}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleRefresh}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
                
                <Button
                  onClick={this.handleReportBug}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Report Bug
                </Button>
              </div>

              {/* Error ID for support */}
              {this.state.errorId && (
                <div className="text-center pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Error ID: <code className="bg-slate-100 px-1 rounded">{this.state.errorId}</code>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Please include this ID when contacting support
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors in functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);
    
    // Report error
    fetch('/api/errors/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    }).catch(console.error);

    // Show user-friendly error message
    toast.error('Something went wrong', {
      description: context ? `Error in ${context}` : 'Please try again or contact support',
    });
  }, []);

  return handleError;
};

export default OnboardingErrorBoundary;