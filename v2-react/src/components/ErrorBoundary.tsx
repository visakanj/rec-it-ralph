import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackType?: 'screen' | 'component';
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary catches JavaScript errors in child components and displays
 * a fallback UI instead of crashing the entire app.
 *
 * Usage:
 * <ErrorBoundary fallbackType="screen">
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so next render shows fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // TODO: Send to error reporting service (Sentry, LogRocket, etc.)
  }

  handleReset = (): void => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
    });

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = (): void => {
    // Navigate to home screen
    window.location.href = '/v2-react-build/';
  };

  render() {
    if (this.state.hasError) {
      const { fallbackType = 'screen' } = this.props;

      if (fallbackType === 'component') {
        // Compact inline error for components (sheets, cards, etc.)
        return (
          <div className="flex flex-col items-center justify-center p-6 bg-background-surface rounded-xl border border-border">
            <AlertTriangle className="w-8 h-8 text-error mb-3" />
            <p className="text-sm text-text-secondary text-center mb-4">
              Something went wrong
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg font-medium text-sm hover:bg-accent-hover active:scale-95 transition-all"
            >
              Try again
            </button>
          </div>
        );
      }

      // Full-screen error for pages
      return (
        <div className="min-h-screen bg-background-main flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-background-elevated flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-error" />
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-text-primary mb-3">
                Something went wrong
              </h2>
              <p className="text-text-secondary mb-2">
                We encountered an unexpected error. This has been logged and we'll look into it.
              </p>

              {/* Show error message in dev mode */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-xs text-text-tertiary cursor-pointer hover:text-text-secondary">
                    Error details (dev only)
                  </summary>
                  <pre className="mt-2 p-3 bg-background-surface rounded-lg text-xs text-error overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full px-6 py-3 bg-accent-primary text-white rounded-xl font-semibold hover:bg-accent-hover active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try again
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full px-6 py-3 bg-background-elevated text-text-primary rounded-xl font-medium hover:bg-background-card active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Go to home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Screen-level ErrorBoundary wrapper
 * Use this to wrap entire screens/pages
 */
export function ScreenErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallbackType="screen">
      {children}
    </ErrorBoundary>
  );
}

/**
 * Component-level ErrorBoundary wrapper
 * Use this for smaller components (sheets, modals, cards)
 */
export function ComponentErrorBoundary({ children, onReset }: { children: ReactNode; onReset?: () => void }) {
  return (
    <ErrorBoundary fallbackType="component" onReset={onReset}>
      {children}
    </ErrorBoundary>
  );
}
