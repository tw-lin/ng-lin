/**
 * Audit Auto-Subscription Service (v1.0.0)
 * 
 * Task 1.3: Event Bus Automatic Subscription
 * - Automatically subscribes AuditCollector to all events ('*' pattern)
 * - Routes events to appropriate audit recording methods
 * - Filters non-audit events (excludes UI-level events)
 * - Maintains backward compatibility with manual audit calls
 * 
 * Architecture:
 * ```
 * Event Bus → Auto-Subscription Service
 *     ↓ Subscribe to '*'
 * Event Type Router
 *     ├─→ auth.* → recordAuth()
 *     ├─→ permission.* → recordAuthorization()
 *     ├─→ data.* → recordDataAccess/Modification()
 *     ├─→ security.* → recordSecurityEvent()
 *     ├─→ config.* → recordConfigChange()
 *     └─→ compliance.* → recordComplianceEvent()
 * ```
 * 
 * Follows: docs/⭐️/Global-Audit-Log-系統拆解與對齊方案.md (Part V - Phase 1 - Task 1.3)
 * 
 * @author Global Event Bus Team
 * @version 1.0.0
 */

import { Injectable, inject, DestroyRef } from '@angular/core';
import { DomainEvent, Subscription } from '../models';
import { AuditCollectorService } from './audit-collector.service';
import { AuditLevel, AuditCategory } from '../models/audit-event.model';
import { InMemoryEventBus } from '../implementations/in-memory/in-memory-event-bus';

/**
 * Event Type Router Configuration
 */
interface RouteConfig {
  pattern: RegExp;
  category: AuditCategory;
  level?: AuditLevel;
  requiresReview?: boolean;
}

/**
 * Audit Auto-Subscription Service
 * 
 * Automatically subscribes to ALL events and routes them to appropriate audit methods.
 */
@Injectable({ providedIn: 'root' })
export class AuditAutoSubscriptionService {
  private eventBus = inject(InMemoryEventBus);
  private auditCollector = inject(AuditCollectorService);
  private destroyRef = inject(DestroyRef);
  
  private subscription: Subscription | null = null;
  private initialized = false;
  
  /**
   * Event Type Router - Maps event patterns to audit categories
   * 
   * Patterns are evaluated in order, first match wins.
   */
  private readonly routingTable: RouteConfig[] = [
    // Authentication Events
    {
      pattern: /^auth\./,
      category: AuditCategory.AUTHENTICATION,
      level: AuditLevel.INFO
    },
    {
      pattern: /^(login|logout|mfa|password|token)\./,
      category: AuditCategory.AUTHENTICATION,
      level: AuditLevel.INFO
    },
    
    // Authorization Events
    {
      pattern: /^(permission|role|acl|access)\./,
      category: AuditCategory.AUTHORIZATION,
      level: AuditLevel.INFO
    },
    
    // Data Access Events
    {
      pattern: /^(repo|issue|pr|org|team|project)\.(viewed|accessed|read|fetched)/,
      category: AuditCategory.DATA_ACCESS,
      level: AuditLevel.INFO
    },
    
    // Data Modification Events
    {
      pattern: /^(repo|issue|pr|org|team|project)\.(created|updated|deleted|modified|changed)/,
      category: AuditCategory.DATA_MODIFICATION,
      level: AuditLevel.WARNING,
      requiresReview: true
    },
    
    // Security Events
    {
      pattern: /^security\./,
      category: AuditCategory.SECURITY,
      level: AuditLevel.CRITICAL,
      requiresReview: true
    },
    {
      pattern: /^(breach|intrusion|attack|vulnerability|exploit)\./,
      category: AuditCategory.SECURITY,
      level: AuditLevel.CRITICAL,
      requiresReview: true
    },
    
    // System Configuration Events
    {
      pattern: /^(config|settings|system)\./,
      category: AuditCategory.SYSTEM_CONFIGURATION,
      level: AuditLevel.WARNING,
      requiresReview: true
    },
    
    // Compliance Events
    {
      pattern: /^(compliance|audit|gdpr|hipaa|sox)\./,
      category: AuditCategory.COMPLIANCE,
      level: AuditLevel.WARNING,
      requiresReview: true
    },
    
    // Business Operation Events (default)
    {
      pattern: /.*/,
      category: AuditCategory.BUSINESS_OPERATION,
      level: AuditLevel.INFO
    }
  ];
  
  /**
   * Excluded Event Patterns - Events that should NOT be audited
   * 
   * UI-level events, internal system events, etc.
   */
  private readonly excludedPatterns: RegExp[] = [
    /^ui\./,                    // UI-level events
    /^internal\./,              // Internal system events
    /^debug\./,                 // Debug events
    /^telemetry\./,             // Telemetry events
    /^metrics\./,               // Metrics events
    /^healthcheck\./            // Health check events
  ];
  
  constructor() {
    console.log('[AuditAutoSubscriptionService] Service created');
  }
  
  /**
   * Initialize automatic subscription to Event Bus
   * 
   * Should be called once during app initialization.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('[AuditAutoSubscriptionService] Already initialized, skipping');
      return;
    }
    
    try {
      console.log('[AuditAutoSubscriptionService] Initializing automatic audit subscription...');
      
      // Subscribe to ALL events using '*' wildcard
      this.subscription = await this.eventBus.subscribe(
        '*',
        async (event: DomainEvent) => {
          await this.handleEvent(event);
        },
        {
          retryPolicy: {
            maxAttempts: 5,
            backoff: 'exponential',
            initialDelay: 1000,
            maxDelay: 30000
          }
        }
      );
      
      this.initialized = true;
      
      // Auto-cleanup on destroy
      this.destroyRef.onDestroy(() => {
        this.destroy();
      });
      
      console.log('[AuditAutoSubscriptionService] Successfully subscribed to all events (*)');
    } catch (error) {
      console.error('[AuditAutoSubscriptionService] Failed to initialize:', error);
      throw error;
    }
  }
  
  /**
   * Handle incoming event and route to appropriate audit method
   * 
   * @param event - Domain event to audit
   */
  private async handleEvent(event: DomainEvent): Promise<void> {
    try {
      // 1. Filter out excluded events
      if (this.shouldExclude(event.eventType)) {
        console.debug(`[AuditAutoSubscriptionService] Excluded event: ${event.eventType}`);
        return;
      }
      
      // 2. Route to appropriate audit method
      const route = this.routeEvent(event.eventType);
      
      // 3. Extract audit metadata
      const actor = this.extractActor(event);
      const resource = this.extractResource(event);
      const action = this.extractAction(event);
      
      // 4. Call appropriate audit recording method based on category
      await this.recordAudit(
        event,
        route.category,
        actor,
        resource,
        action,
        {
          level: route.level,
          requiresReview: route.requiresReview,
          metadata: event.payload
        }
      );
      
      console.debug(`[AuditAutoSubscriptionService] Audited ${event.eventType} as ${route.category}`);
    } catch (error) {
      console.error(
        `[AuditAutoSubscriptionService] Error handling event ${event.eventType}:`,
        error
      );
      // Don't throw - audit failures should not break business logic
    }
  }
  
  /**
   * Check if event should be excluded from auditing
   */
  private shouldExclude(eventType: string): boolean {
    return this.excludedPatterns.some(pattern => pattern.test(eventType));
  }
  
  /**
   * Route event to appropriate audit category
   */
  private routeEvent(eventType: string): RouteConfig {
    const route = this.routingTable.find(config => config.pattern.test(eventType));
    return route || this.routingTable[this.routingTable.length - 1]; // Default to last (catch-all)
  }
  
  /**
   * Extract actor from event
   */
  private extractActor(event: DomainEvent): string {
    const payload = event.payload as any;
    return payload?.userId ||
           payload?.user?.id ||
           payload?.actorId ||
           payload?.actor?.id ||
           'system';
  }
  
  /**
   * Extract resource from event
   */
  private extractResource(event: DomainEvent): string {
    const payload = event.payload as any;
    return event.aggregateType ||
           payload?.resourceType ||
           this.extractResourceFromEventType(event.eventType);
  }
  
  /**
   * Extract resource type from event type
   * 
   * Examples:
   * - repo.created → repo
   * - issue.closed → issue
   * - auth.login.success → auth
   */
  private extractResourceFromEventType(eventType: string): string {
    const parts = eventType.split('.');
    return parts[0] || 'unknown';
  }
  
  /**
   * Extract action from event
   */
  private extractAction(event: DomainEvent): string {
    const parts = event.eventType.split('.');
    return parts[parts.length - 1] || 'unknown';
  }
  
  /**
   * Record audit using appropriate AuditCollector method based on category
   */
  private async recordAudit(
    event: DomainEvent,
    category: AuditCategory,
    actor: string,
    resource: string,
    action: string,
    options: {
      level?: AuditLevel;
      requiresReview?: boolean;
      metadata?: any;
    }
  ): Promise<void> {
    const commonOptions = {
      level: options.level,
      requiresReview: options.requiresReview,
      metadata: options.metadata,
      ipAddress: (event.payload as any)?.ipAddress,
      userAgent: (event.payload as any)?.userAgent
    };
    
    const resourceId = event.aggregateId || (event.payload as any)?.resourceId || 'unknown';
    
    switch (category) {
      case AuditCategory.AUTHENTICATION:
        await this.auditCollector.recordAuth(
          event.eventId,
          event.eventType,
          actor,
          action,
          commonOptions
        );
        break;
        
      case AuditCategory.AUTHORIZATION:
        await this.auditCollector.recordAuthorization(
          event.eventId,
          event.eventType,
          actor,
          action,
          resource,
          resourceId,
          commonOptions
        );
        break;
        
      case AuditCategory.DATA_ACCESS:
        await this.auditCollector.recordDataAccess(
          event.eventId,
          event.eventType,
          actor,
          action,
          resource,
          resourceId,
          undefined, // deprecated tenantId param
          commonOptions
        );
        break;
        
      case AuditCategory.DATA_MODIFICATION:
        const changes = (event.payload as any)?.changes || {};
        await this.auditCollector.recordDataModification(
          event.eventId,
          event.eventType,
          actor,
          action,
          resource,
          resourceId,
          changes,
          undefined, // deprecated tenantId param
          commonOptions
        );
        break;
        
      case AuditCategory.SECURITY:
        const description = (event.payload as any)?.description || 
                           (event.payload as any)?.threatType || 
                           event.eventType;
        await this.auditCollector.recordSecurityEvent(
          event.eventId,
          event.eventType,
          actor,
          action,
          description,
          AuditLevel.CRITICAL, // Always CRITICAL for security
          {
            ...commonOptions,
            requiresReview: true
          }
        );
        break;
        
      case AuditCategory.SYSTEM_CONFIGURATION:
        const configChanges = {
          old: (event.payload as any)?.oldValue,
          new: (event.payload as any)?.newValue
        };
        await this.auditCollector.recordConfigChange(
          event.eventId,
          event.eventType,
          actor,
          action,
          (event.payload as any)?.configKey || resource,
          configChanges,
          commonOptions
        );
        break;
        
      case AuditCategory.COMPLIANCE:
        const complianceType = (event.payload as any)?.regulation || 
                              (event.payload as any)?.complianceType || 
                              'unknown';
        await this.auditCollector.recordComplianceEvent(
          event.eventId,
          event.eventType,
          actor,
          action,
          resource,
          resourceId,
          complianceType,
          commonOptions
        );
        break;
        
      case AuditCategory.BUSINESS_OPERATION:
      default:
        // Use generic collectFromDomainEvent for business operations
        await this.auditCollector.collectFromDomainEvent(event, {
          level: options.level || AuditLevel.INFO,
          category: AuditCategory.BUSINESS_OPERATION,
          requiresReview: options.requiresReview
        });
        break;
    }
  }
  
  /**
   * Clean up subscriptions
   */
  private async destroy(): Promise<void> {
    if (this.subscription) {
      await this.eventBus.unsubscribe(this.subscription);
      this.subscription = null;
      this.initialized = false;
      console.log('[AuditAutoSubscriptionService] Subscription cleaned up');
    }
  }
  
  /**
   * Get initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
