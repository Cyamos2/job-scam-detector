// src/lib/crashReporting.ts
// Sentry crash reporting integration

import React from 'react';
import Constants from 'expo-constants';

// Note: we avoid importing @sentry/react-native at module-load time because
// missing peer deps (e.g., tslib) can cause Metro to fail resolving the bundle
// during dev. Instead we dynamically require the package at runtime inside
// initialize() and provide safe no-op fallbacks if Sentry is not available.

// Minimal subset of Sentry methods we rely on. We cast the dynamically-imported
// module to this shape to get better type safety while keeping runtime checks.
type SentryAPI = {
  init?: (opts?: any) => void;
  setUser?: (user: any) => void;
  setContext?: (name: string, ctx: any) => void;
  setTag?: (key: string, value: string) => void;
  addBreadcrumb?: (crumb: any) => void;
  captureMessage?: (message: string, opts?: any) => void;
  captureException?: (err: any) => void;
  withScope?: (fn: (scope: any) => void) => void;
  startTransaction?: (opts?: any) => any;
  ErrorBoundary?: any;
  flush?: (timeout?: number) => Promise<boolean>;
};

let SentryLib: SentryAPI | null = null;

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
      // Attempt to require Sentry dynamically if a Sentry implementation hasn't
      // already been provided (tests may inject a mock). If tslib or other deps are
      // missing, this can throw — we catch and disable crash reporting gracefully.
      if (!SentryLib) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const sentryModule = require('@sentry/react-native');
        SentryLib = (sentryModule && (sentryModule as any).default) ? (sentryModule as any).default : sentryModule;
      }

      (SentryLib as any).init?.({
        dsn: SENTRY_DSN,
        // Expo-specific toggles and debug flags
        enableInExpoDevelopment: process.env.NODE_ENV !== 'production',
        debug: process.env.NODE_ENV !== 'production',
        environment: process.env.NODE_ENV || 'development',

        // Performance monitoring (stricter in production)
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.0,

        // Session replay (stricter by default)
        replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.0,
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
      });

      // Add custom tags after init to avoid differences in init options across SDK versions
      (SentryLib as any).setTag?.('app_version', Constants.expoConfig?.version || 'unknown');
      (SentryLib as any).setTag?.('platform', Constants.platform?.ios ? 'ios' : 'android');

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

    (SentryLib as any).setUser?.({
      id: userId,
      email,
    });

    if (additionalData) {
      // Put extra user-related metadata into a context field to avoid leaking PII into the user object
      (SentryLib as any).setContext?.('user_meta', additionalData);
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.isInitialized || !SentryLib) return;
    (SentryLib as any).setUser?.(null);
  }

  /**
   * Add custom context to crash reports
   */
  setContext(name: string, context: Record<string, unknown>): void {
    if (!this.isInitialized || !SentryLib) return;
    (SentryLib as any).setContext?.(name, context);
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

    (SentryLib as any).addBreadcrumb?.({
      category,
      message,
      data,
      level,
      type: 'default',
      timestamp: Math.floor(Date.now() / 1000),
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

    // Stricter grading: only send messages at or above configured minimum level.
    const priority: Record<SeverityLevel, number> = { debug: 0, info: 1, warning: 2, error: 3, fatal: 4 };

    const minLevelStr = (process.env.EXPO_PUBLIC_SENTRY_MIN_LEVEL as SeverityLevel) || (process.env.NODE_ENV === 'production' ? 'warning' : 'info');
    const minLevel = minLevelStr as SeverityLevel;

    if (priority[level] < priority[minLevel]) {
      console.log(`[CrashReporting] Message below minimum level (${minLevel}), skipping send: ${message}`);
      return;
    }

    (SentryLib as any).captureMessage?.(message, { level });
  }

  /**
   * Capture an error/exception
   */
  captureError(error: Error, context?: Record<string, unknown>): void {
    if (!this.isInitialized || !SentryLib) {
      console.error(`[CrashReporting] Error (not initialized):`, error);
      return;
    }

    // Use a temporary scope so per-error context does not leak to other events
    if ((SentryLib as any).withScope) {
      (SentryLib as any).withScope((scope: any) => {
        if (context) scope.setContext?.('error_context', context);
        (SentryLib as any).captureException?.(error);
      });
    } else {
      if (context) (SentryLib as any).setContext?.('Error Context', context);
      (SentryLib as any).captureException?.(error);
    }
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
  async testCrash(): Promise<void> {
    if (!this.isInitialized || !SentryLib) {
      console.warn('[CrashReporting] Cannot test crash - not initialized');
      return;
    }

    const err = new Error('Test crash - manual capture');
    (SentryLib as any).captureException?.(err);

    // Attempt to flush events to Sentry (best-effort for tests)
    try {
      await (SentryLib as any).flush?.(2000);
      console.info('[CrashReporting] Test crash captured and flushed');
    } catch (e) {
      console.warn('[CrashReporting] Test crash captured (flush failed):', String(e));
    }
  }

  /**
   * Check if crash reporting is enabled
   */
  isEnabled(): boolean {
    return !!SENTRY_DSN && this.isInitialized && !!SentryLib;
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

// Helper for tests: allow injection of a mock Sentry implementation so tests don't
// need to load the native @sentry/react-native package.
export function __setSentryForTest(sentry: SentryAPI | null) {
  SentryLib = sentry;
}

export default crashReporting;

