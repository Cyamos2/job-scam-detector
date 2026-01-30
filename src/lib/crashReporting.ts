// src/lib/crashReporting.ts
// Sentry crash reporting integration

import * as Sentry from '@sentry/react-native';
import React from 'react';
import Constants from 'expo-constants';

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
      Sentry.init({
        dsn: SENTRY_DSN,
        enableInExpoDevelopment: process.env.NODE_ENV !== 'production',
        debug: process.env.NODE_ENV !== 'production',
        environment: process.env.NODE_ENV || 'development',
        
        // Performance monitoring
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
        
        // Session replay (optional - requires additional setup)
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        
        // Filter out common non-actionable errors
        beforeSend: (event, hint) => {
          const error = hint.originalException;
          
          // Filter out network errors that are expected
          if (error instanceof TypeError) {
            if (error.message.includes('Network request failed')) {
              return null; // Ignore network errors
            }
          }
          
          // Filter out specific React Native warnings
          if (event.message?.includes('Warning:')) {
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
      console.log('[CrashReporting] Initialized successfully');
    } catch (error) {
      console.error('[CrashReporting] Initialization failed:', error);
    }
  }

  /**
   * Set user context for crash reports
   */
  setUser(userId: string, email?: string, additionalData?: Record<string, unknown>): void {
    if (!this.isInitialized) return;

    Sentry.setUser({
      id: userId,
      email,
      ...additionalData,
    });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.isInitialized) return;
    Sentry.setUser(null);
  }

  /**
   * Add custom context to crash reports
   */
  setContext(name: string, context: Record<string, unknown>): void {
    if (!this.isInitialized) return;
    Sentry.setContext(name, context);
  }

  /**
   * Add custom tags to crash reports
   */
  setTag(key: string, value: string): void {
    if (!this.isInitialized) return;
    Sentry.setTag(key, value);
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
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
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
    if (!this.isInitialized) {
      console.log(`[CrashReporting] Message (not initialized): ${message}`);
      return;
    }

    Sentry.captureMessage(message, { level });
  }

  /**
   * Capture an error/exception
   */
  captureError(error: Error, context?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      console.error(`[CrashReporting] Error (not initialized):`, error);
      return;
    }

    if (context) {
      Sentry.setContext('Error Context', context);
    }
    Sentry.captureException(error);
  }

  /**
   * Start a transaction for performance monitoring
   */
  startTransaction(name: string, op: string): {
    finish: () => void;
    setStatus: (status: string) => void;
    startChild: (options: { op: string; description: string }) => {
      finish: () => void;
    };
  } | null {
    if (!this.isInitialized) return null;

    // In React Native, we use the startTransaction method from Sentry
    // This creates a performance monitoring transaction
    return Sentry.startTransaction({
      name,
      op,
    });
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
  getSentry(): typeof Sentry | null {
    return this.isInitialized ? Sentry : null;
  }
}

// Export singleton instance
export const crashReporting = new CrashReportingService();

// Export Sentry components for React integration
export const SentryErrorBoundary = SENTRY_DSN 
  ? Sentry.ErrorBoundary 
  : ({ children }: { children: React.ReactNode }) => React.Fragment(children);

export default crashReporting;

