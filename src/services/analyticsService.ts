import { analytics } from '../firebase';
import { logEvent, Analytics } from 'firebase/analytics';

export const AnalyticsEvents = {
  // User engagement
  PAGE_VIEW: 'page_view',
  SESSION_START: 'session_start',

  // User actions
  USER_SIGNUP: 'user_signup',
  GROUP_CREATE: 'group_create',
  GROUP_JOIN: 'group_join',
  RATING_SUBMIT: 'rating_submit',

  // User retention
  USER_RETURN: 'user_return',
} as const;

export interface AnalyticsService {
  // Track page views
  trackPageView(pageName: string): void;

  // Track user signup
  trackUserSignup(method: string): void;

  // Track group creation
  trackGroupCreate(groupId: string): void;

  // Track group join
  trackGroupJoin(groupId: string): void;

  // Track rating submission
  trackRatingSubmit(groupId: string, rating: number): void;

  // Track returning users
  trackUserReturn(daysSinceLastVisit: number): void;
}

type AnalyticsParams = {
  page_name?: string;
  signup_method?: string;
  group_id?: string;
  rating_value?: number;
  days_since_last_visit?: number;
  timestamp: string;
};

class FirebaseAnalyticsService implements AnalyticsService {
  private readonly analytics: Analytics | null = analytics;
  private readonly debugMode = import.meta.env.VITE_FIREBASE_EMULATOR_DEBUG === 'true';
  private readonly enableLocalAnalytics = import.meta.env.VITE_ENABLE_LOCAL_ANALYTICS === 'true';

  private logEvent(eventName: string, params: Omit<AnalyticsParams, 'timestamp'>): void {
    try {
      if (!this.analytics && !this.enableLocalAnalytics) {
        if (this.debugMode) {
          console.warn(
            `Analytics not available. Event ${eventName} would have been logged with params:`,
            params
          );
        }
        return;
      }

      const eventParams = {
        ...params,
        timestamp: new Date().toISOString(),
      };

      if (this.analytics) {
        logEvent(this.analytics, eventName, eventParams);
      }

      if (this.debugMode || this.enableLocalAnalytics) {
        console.log(`Analytics event logged: ${eventName}`, eventParams);
      }
    } catch (error) {
      console.error(`Error tracking analytics event ${eventName}:`, error);
    }
  }

  trackPageView(pageName: string): void {
    this.logEvent(AnalyticsEvents.PAGE_VIEW, {
      page_name: pageName,
    });
  }

  trackUserSignup(method: string): void {
    this.logEvent(AnalyticsEvents.USER_SIGNUP, {
      signup_method: method,
    });
  }

  trackGroupCreate(groupId: string): void {
    this.logEvent(AnalyticsEvents.GROUP_CREATE, {
      group_id: groupId,
    });
  }

  trackGroupJoin(groupId: string): void {
    this.logEvent(AnalyticsEvents.GROUP_JOIN, {
      group_id: groupId,
    });
  }

  trackRatingSubmit(groupId: string, rating: number): void {
    this.logEvent(AnalyticsEvents.RATING_SUBMIT, {
      group_id: groupId,
      rating_value: rating,
    });
  }

  trackUserReturn(daysSinceLastVisit: number): void {
    this.logEvent(AnalyticsEvents.USER_RETURN, {
      days_since_last_visit: daysSinceLastVisit,
    });
  }
}

export const analyticsService: AnalyticsService = new FirebaseAnalyticsService();
