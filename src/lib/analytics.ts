// src/lib/analytics.ts
// Analytics service for tracking user events and app usage

import { Platform } from 'react-native';

// Analytics event names
export const AnalyticsEvents = {
  // Job analysis events
  JOB_ANALYSIS_STARTED: 'job_analysis_started',
  JOB_ANALYSIS_COMPLETED: 'job_analysis_completed',
  JOB_ANALYSIS_FAILED: 'job_analysis_failed',
  SCREENSHOT_ANALYSIS_STARTED: 'screenshot_analysis_started',
  SCREENSHOT_ANALYSIS_COMPLETED: 'screenshot_analysis_completed',
  SCREENSHOT_ANALYSIS_FAILED: 'screenshot_analysis_failed',
  
  // Risk events
  HIGH_RISK_DETECTED: 'high_risk_detected',
  MEDIUM_RISK_DETECTED: 'medium_risk_detected',
  LOW_RISK_DETECTED: 'low_risk_detected',
  
  // Navigation events
  SCREEN_VIEW: 'screen_view',
  
  // User actions
  JOB_SAVED: 'job_saved',
  JOB_DELETED: 'job_deleted',
  JOB_UPDATED: 'job_updated',
  
  // Settings events
  SETTING_CHANGED: 'setting_changed',
  THEME_CHANGED: 'theme_changed',
  DARK_MODE_TOGGLED: 'dark_mode_toggled',
  
  // App lifecycle
  APP_OPENED: 'app_opened',
  APP_CLOSED: 'app_closed',
  
  // Search events
  SEARCH_PERFORMED: 'search_performed',
  DATABASE_FILTER_CHANGED: 'database_filter_changed',
} as const;

// Event parameters types
export type EventParams = Record<string, string | number | boolean | undefined>;

class AnalyticsService {
  private isInitialized: boolean = false;
  private pendingEvents: Array<{ name: string; params: EventParams }> = [];

  /**
   * Initialize analytics service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Firebase Analytics initialization would go here
      // For now, we'll use a placeholder that can be replaced with actual Firebase setup
      // await analytics().setAnalyticsCollectionEnabled(true);
      
      this.isInitialized = true;
      
      // Process any pending events
      for (const event of this.pendingEvents) {
        await this.trackEvent(event.name, event.params);
      }
      this.pendingEvents = [];
      
      console.log('[Analytics] Initialized successfully');
    } catch (error) {
      console.error('[Analytics] Initialization failed:', error);
    }
  }

  /**
   * Track a custom event
   */
  async trackEvent(name: string, params: EventParams = {}): Promise<void> {
    const sanitizedParams = this.sanitizeParams(params);

    if (!this.isInitialized) {
      // Queue the event for later
      this.pendingEvents.push({ name, params: sanitizedParams });
      return;
    }

    try {
      // Firebase Analytics tracking
      // await analytics().logEvent(name, sanitizedParams);
      
      console.log(`[Analytics] Event: ${name}`, sanitizedParams);
    } catch (error) {
      console.error(`[Analytics] Failed to track event ${name}:`, error);
    }
  }

  /**
   * Track screen views
   */
  async trackScreenView(screenName: string, params: EventParams = {}): Promise<void> {
    await this.trackEvent(AnalyticsEvents.SCREEN_VIEW, {
      screen_name: screenName,
      platform: Platform.OS,
      ...params,
    });
  }

  /**
   * Track job analysis
   */
  async trackJobAnalysis(
    risk: 'high' | 'medium' | 'low',
    score: number,
    hasUrl: boolean,
    hasNotes: boolean
  ): Promise<void> {
    await this.trackEvent(AnalyticsEvents.JOB_ANALYSIS_COMPLETED, {
      risk_level: risk,
      risk_score: score,
      has_url: hasUrl,
      has_notes: hasNotes,
      platform: Platform.OS,
    });

    // Track specific risk events
    if (risk === 'high') {
      await this.trackEvent(AnalyticsEvents.HIGH_RISK_DETECTED, {
        risk_score: score,
        has_url: hasUrl,
      });
    } else if (risk === 'medium') {
      await this.trackEvent(AnalyticsEvents.MEDIUM_RISK_DETECTED, { score });
    } else {
      await this.trackEvent(AnalyticsEvents.LOW_RISK_DETECTED, { score });
    }
  }

  /**
   * Track screenshot analysis
   */
  async trackScreenshotAnalysis(
    success: boolean,
    textLength?: number,
    error?: string
  ): Promise<void> {
    if (success) {
      await this.trackEvent(AnalyticsEvents.SCREENSHOT_ANALYSIS_COMPLETED, {
        text_length: textLength || 0,
        platform: Platform.OS,
      });
    } else {
      await this.trackEvent(AnalyticsEvents.SCREENSHOT_ANALYSIS_FAILED, {
        error: error || 'unknown',
        platform: Platform.OS,
      });
    }
  }

  /**
   * Track job CRUD operations
   */
  async trackJobSaved(jobId: string, risk: string): Promise<void> {
    await this.trackEvent(AnalyticsEvents.JOB_SAVED, {
      job_id: jobId,
      risk_level: risk,
      platform: Platform.OS,
    });
  }

  async trackJobDeleted(jobId: string): Promise<void> {
    await this.trackEvent(AnalyticsEvents.JOB_DELETED, {
      job_id: jobId,
      platform: Platform.OS,
    });
  }

  async trackSettingChanged(settingName: string, value: string): Promise<void> {
    await this.trackEvent(AnalyticsEvents.SETTING_CHANGED, {
      setting_name: settingName,
      setting_value: value,
      platform: Platform.OS,
    });
  }

  /**
   * Track theme changes
   */
  async trackThemeChanged(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.trackEvent(AnalyticsEvents.THEME_CHANGED, {
      theme,
      platform: Platform.OS,
    });
  }

  /**
   * Track database filter changes
   */
  async trackDatabaseFilterChanged(filter: string): Promise<void> {
    await this.trackEvent(AnalyticsEvents.DATABASE_FILTER_CHANGED, {
      filter,
      platform: Platform.OS,
    });
  }

  /**
   * Track search operations
   */
  async trackSearchPerformed(query: string, resultsCount: number): Promise<void> {
    await this.trackEvent(AnalyticsEvents.SEARCH_PERFORMED, {
      query_length: query.length,
      results_count: resultsCount,
      has_results: resultsCount > 0,
      platform: Platform.OS,
    });
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: Record<string, string>): Promise<void> {
    try {
      // await analytics().setUserProperties(properties);
      console.log('[Analytics] User properties set:', properties);
    } catch (error) {
      console.error('[Analytics] Failed to set user properties:', error);
    }
  }

  /**
   * Sanitize event parameters
   */
  private sanitizeParams(params: EventParams): EventParams {
    const sanitized: EventParams = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        // Truncate long strings
        const strValue = String(value);
        sanitized[key] = strValue.length > 100 ? strValue.substring(0, 100) + '...' : strValue;
      }
    }
    
    return sanitized;
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

export default analytics;

