/**
 * Audit Auto-Subscription Initializer
 *
 * APP_INITIALIZER for automatic audit event subscription.
 * Initializes the AuditAutoSubscriptionService during app startup.
 *
 * Task 1.3: Event Bus Automatic Subscription
 * - Ensures audit collector is subscribed to all events before app starts
 * - Provides factory function for Angular DI
 *
 * Usage in app.config.ts:
 * ```typescript
 * import { provideAuditAutoSubscription } from '@core/event-bus/initializers';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     ...otherProviders,
 *     provideAuditAutoSubscription()
 *   ]
 * };
 * ```
 *
 * Follows: docs/⭐️/Global-Audit-Log-系統拆解與對齊方案.md (Part V - Phase 1 - Task 1.3)
 *
 * @author Global Event Bus Team
 * @version 1.0.0
 */

import { APP_INITIALIZER, Provider } from '@angular/core';
import { AuditAutoSubscriptionService } from '../services/audit-auto-subscription.service';

/**
 * Factory function for audit auto-subscription initialization
 *
 * Returns a function that initializes the audit subscription.
 * This function is called during Angular app initialization.
 */
export function auditAutoSubscriptionInitializer(auditAutoSubscription: AuditAutoSubscriptionService): () => Promise<void> {
  return async (): Promise<void> => {
    console.log('[APP_INITIALIZER] Initializing Audit Auto-Subscription...');

    try {
      await auditAutoSubscription.initialize();
      console.log('[APP_INITIALIZER] Audit Auto-Subscription initialized successfully');
    } catch (error) {
      console.error('[APP_INITIALIZER] Failed to initialize Audit Auto-Subscription:', error);
      // Don't throw - allow app to start even if audit subscription fails
      // Audit is important but not critical for app functionality
    }
  };
}

/**
 * Provider function for audit auto-subscription
 *
 * Registers the APP_INITIALIZER with Angular DI.
 *
 * @returns Provider for APP_INITIALIZER
 */
export function provideAuditAutoSubscription(): Provider {
  return {
    provide: APP_INITIALIZER,
    useFactory: auditAutoSubscriptionInitializer,
    deps: [AuditAutoSubscriptionService],
    multi: true
  };
}
