// src/lib/crashReporting.ts
// Sentry crash reporting integration

import React from 'react';
import Constants from 'expo-constants';

// Note: we avoid importing @sentry/react-native at module-load time because
// missing peer deps (e.g., tslib) can cause Metro to fail resolving the bundle
// during dev. Instead we dynamically require the package at runtime inside
// initialize() and provide safe no-op fallbacks if Sentry is not available.
let SentryLib: typeof import('@sentry/react-native') | null = null;

// Sentry DSN - replace with your actual DSN from Sentry.io
const SENTRY_DSN = Constants?.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN || '';

export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

class CrashReportingService {
  private isInitialized: boolean = false;

  /**
   * Initialize Sentry for crash reporting
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || !SENTRY_DSN) {
      console.log('[CrashReporting] Skipping initialization (already initialized or no DSN)');
      return;
    }

    try {
      // Attempt to require Sentry dynamically; if tslib or other deps are missing,
      // this can throw — we catch and disable crash reporting gracefully.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      SentryLib = require('@sentry/react-native');

      (SentryLib as any).init({
        dsn: SENTRY_DSN,
        // Expo-specific toggles and debug flags (kept permissive in dev)
        enableInExpoDevelopment: process.env.NODE_ENV !== 'production',
        debug: process.env.NODE_ENV !== 'production',
        environment: process.env.NODE_ENV || 'development',

        // Performance monitoring
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

        // Session replay (optional - requires additional setup)
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,

        // Filter out common non-actionable errors
        beforeSend: (event: any, hint: any) => {
          const error = hint?.originalException;

          // Filter out network errors that are expected
          if (error instanceof TypeError) {
            if (error.message?.includes('Network request failed')) {
              return null; // Ignore network errors
            }
          }

          // Filter out specific React Native warnings
          if (event?.message?.includes('Warning:')) {
            return null; // Ignore React warnings
          }

          return event;
        },

        // Add custom tags
        initialScope: {
          tags: {
            app_version: Constants.expoConfig?.version || 'unknown',
            platform: Constants.platform?.ios ? 'ios' : 'android',
          },
        },
      });

      this.isInitialized = true;
      console.info('[CrashReporting] Initialized successfully');
    } catch (error) {
      // If Sentry fails to load (e.g., missing peer deps), keep app running.
      SentryLib = null;
      console.info('[CrashReporting] Sentry not available or initialization failed:', String(error));
    }
  }

  /**
   * Set user context for crash reports
   */
  setUser(userId: string, email?: string, additionalData?: Record<string, unknown>): void {
    if (!this.isInitialized || !SentryLib) return;

    SentryLib.setUser({
      id: userId,
      email,
      ...additionalData,
    });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.isInitialized || !SentryLib) return;
    SentryLib.setUser(null);
  }

  /**
   * Add custom context to crash reports
   */
  setContext(name: string, context: Record<string, unknown>): void {
    if (!this.isInitialized || !SentryLib) return;
    SentryLib.setContext(name, context);
  }

  /**
   * Add custom tags to crash reports
   */
  setTag(key: string, value: string): void {
    if (!this.isInitialized || !SentryLib) return;
    // Use optional chaining in case the function isn't available on the loaded lib
    (SentryLib as any).setTag?.(key, value);
  }

  /**
   * Add breadcrumbs for crash debugging
   */
  addBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, unknown>,
    level: SeverityLevel = 'info'
  ): void {
    if (!this.isInitialized || !SentryLib) return;

    SentryLib.addBreadcrumb({
      category,
      message,
      data,
      level,
      type: 'default',
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Capture a message with optional severity
   */
  captureMessage(message: string, level: SeverityLevel = 'info'): void {
    if (!this.isInitialized || !SentryLib) {
      console.log(`[CrashReporting] Message (not initialized): ${message}`);
      return;
    }

    SentryLib.captureMessage(message, { level });
  }

  /**
   * Capture an error/exception
   */
  captureError(error: Error, context?: Record<string, unknown>): void {
    if (!this.isInitialized || !SentryLib) {
      console.error(`[CrashReporting] Error (not initialized):`, error);
      return;
    }

    if (context) {
      SentryLib.setContext('Error Context', context);
    }
    SentryLib.captureException(error);
  }

  /**
   * Start a transaction for performance monitoring
   */
  startTransaction(name: string, op: string): any | null {
    if (!this.isInitialized || !SentryLib) return null;

    // Use startTransaction if available on the loaded Sentry lib
    try {
      const fn = (SentryLib as any).startTransaction;
      return typeof fn === 'function' ? fn({ name, op }) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Manually trigger a crash (for testing only)
   */
  testCrash(): void {
    if (!this.isInitialized) {
      console.warn('[CrashReporting] Cannot test crash - not initialized');
      return;
    }

    throw new Error('Test crash - this should be caught by Sentry');
  }

  /**
   * Check if crash reporting is enabled
   */
  isEnabled(): boolean {
    return this.isInitialized && !!SENTRY_DSN;
  }

  /**
   * Get the current Sentry instance (for advanced usage)
   */
  getSentry(): any | null {
    return this.isInitialized && SentryLib ? SentryLib : null;
  }
}

// Export singleton instance
export const crashReporting = new CrashReportingService();

// Export Sentry components for React integration
export function SentryErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback?: (props: { error: any; componentStack: any; resetError: () => void }) => React.ReactNode }): React.ReactElement {
  // If Sentry is configured and the ErrorBoundary component is available, use it.
  if (SENTRY_DSN && SentryLib && (SentryLib as any).ErrorBoundary) {
    const ErrorBoundary = (SentryLib as any).ErrorBoundary;
    // Forward the optional fallback prop to Sentry's ErrorBoundary
    return React.createElement(ErrorBoundary, { fallback }, children);
  }

  // Fallback: render children directly (no ErrorBoundary available)
  return React.createElement(React.Fragment, null, children);
}

export default crashReporting;

