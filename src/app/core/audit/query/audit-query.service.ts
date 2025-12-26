import { Injectable, inject } from '@angular/core';
import { AuditEventRepository, StorageTier, QueryOptions } from '../repositories';
import { ClassifiedAuditEvent } from '../services';
import { AuditEvent, AuditLevel, AuditCategory } from '@core/event-bus/models';

/**
 * Timeline Query Options
 * Reconstruct event timeline for a specific context
 */
export interface TimelineQueryOptions {
  tenantId?: string;
  blueprintId?: string;
  startTime: Date;
  endTime: Date;
  actors?: string[];
  categories?: AuditCategory[];
  levels?: AuditLevel[];
  limit?: number;
  tier?: StorageTier;
}

/**
 * Actor Query Options
 * Track all activities by specific actors (users, AI agents, systems)
 */
export interface ActorQueryOptions {
  tenantId?: string;
  actorId: string;
  actorType?: 'user' | 'team' | 'partner' | 'ai' | 'system';
  startTime?: Date;
  endTime?: Date;
  categories?: AuditCategory[];
  limit?: number;
  tier?: StorageTier;
}

/**
 * Entity Query Options
 * Track all changes to a specific entity (resource-centric view)
 */
export interface EntityQueryOptions {
  tenantId?: string;
  resourceType: string;
  resourceId: string;
  startTime?: Date;
  endTime?: Date;
  operation?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE';
  limit?: number;
  tier?: StorageTier;
}

/**
 * Compliance Query Options
 * Generate compliance reports for specific frameworks
 */
export interface ComplianceQueryOptions {
  tenantId: string;
  framework: 'GDPR' | 'HIPAA' | 'SOC2' | 'ISO27001' | 'AI_GOVERNANCE';
  startTime: Date;
  endTime: Date;
  includeHighRiskOnly?: boolean;
  includeReviewRequired?: boolean;
  tier?: StorageTier;
}

/**
 * Aggregation Result
 */
export interface AggregationResult {
  totalEvents: number;
  byCategory: Record<AuditCategory, number>;
  byLevel: Record<AuditLevel, number>;
  byActor: Record<string, number>;
  byResult: { success: number; failure: number };
  averageRiskScore: number;
  highRiskCount: number;
  criticalCount: number;
}

/**
 * Timeline Event (Enhanced for display)
 */
export interface TimelineEvent extends ClassifiedAuditEvent {
  sequenceNumber?: number;
  relatedEvents?: string[]; // IDs of related events
  duration?: number; // For paired start/end events
}

/**
 * Audit Query Service
 *
 * Provides 8 advanced query patterns for audit trail analysis:
 * 1. Timeline Reconstruction - Chronological event sequence
 * 2. Actor Tracking - User/AI/System activity monitoring
 * 3. Entity History - Resource-centric change log
 * 4. Compliance Reporting - Framework-specific audits
 * 5. Aggregation - Statistical analysis
 * 6. Search - Full-text event search
 * 7. Change Detection - Before/after comparison
 * 8. Anomaly Detection - Risk-based filtering
 *
 * Integration Strategy:
 * ✅ REUSES: AuditEventRepository for data access
 * ✅ EXTENDS: ClassifiedAuditEvent for enhanced metadata
 * ✅ NO DUPLICATION: Leverages existing repository query capabilities
 */
@Injectable({ providedIn: 'root' })
export class AuditQueryService {
  private readonly repository = inject(AuditEventRepository);

  /**
   * Pattern 1: Timeline Reconstruction
   *
   * Reconstruct chronological event timeline with actor correlation.
   * Use cases: Incident investigation, compliance audits, user journey analysis
   *
   * @param options - Timeline query parameters
   * @returns Chronologically ordered events with sequence numbers
   */
  async queryTimeline(options: TimelineQueryOptions): Promise<TimelineEvent[]> {
    const queryOpts: QueryOptions = {
      tenantId: options.tenantId,
      startTime: options.startTime,
      endTime: options.endTime,
      limit: options.limit || 1000,
      tier: options.tier || StorageTier.HOT
    };

    // Add filters if provided
    if (options.actors && options.actors.length > 0) {
      // Note: Repository query() expects single actor, so we'll need to query multiple times
      // or enhance repository to support actor array (future enhancement)
      queryOpts.actor = options.actors[0]; // For now, use first actor
    }

    if (options.categories && options.categories.length > 0) {
      queryOpts.category = options.categories[0]; // For now, use first category
    }

    if (options.levels && options.levels.length > 0) {
      queryOpts.level = options.levels[0]; // For now, use first level
    }

    const events = await this.repository.query(queryOpts);

    // Enhance events with sequence numbers and sort chronologically
    const timeline: TimelineEvent[] = events
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((event, index) => ({
        ...event,
        sequenceNumber: index + 1
      }));

    return timeline;
  }

  /**
   * Pattern 2: Actor Tracking
   *
   * Track all activities performed by a specific actor.
   * Use cases: User behavior analysis, AI decision auditing, system operation monitoring
   *
   * @param options - Actor query parameters
   * @returns All events performed by the actor
   */
  async queryByActor(options: ActorQueryOptions): Promise<ClassifiedAuditEvent[]> {
    const queryOpts: QueryOptions = {
      tenantId: options.tenantId,
      actor: options.actorId,
      startTime: options.startTime,
      endTime: options.endTime,
      limit: options.limit || 500,
      tier: options.tier || StorageTier.HOT
    };

    if (options.categories && options.categories.length > 0) {
      queryOpts.category = options.categories[0];
    }

    const events = await this.repository.query(queryOpts);

    // Filter by actor type if specified
    if (options.actorType) {
      return events.filter(e => e.actor?.includes(options.actorType!) || e.eventType.startsWith(options.actorType!));
    }

    return events;
  }

  /**
   * Pattern 3: Entity History
   *
   * Retrieve complete change history for a specific entity.
   * Use cases: Resource audit trail, change tracking, compliance verification
   *
   * @param options - Entity query parameters
   * @returns All events related to the entity
   */
  async queryByEntity(options: EntityQueryOptions): Promise<ClassifiedAuditEvent[]> {
    const queryOpts: QueryOptions = {
      tenantId: options.tenantId,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      startTime: options.startTime,
      endTime: options.endTime,
      limit: options.limit || 500,
      tier: options.tier || StorageTier.HOT
    };

    const events = await this.repository.query(queryOpts);

    // Filter by operation type if specified
    if (options.operation) {
      return events.filter(e => e.action?.toUpperCase() === options.operation);
    }

    return events;
  }

  /**
   * Pattern 4: Compliance Reporting
   *
   * Generate compliance reports for specific regulatory frameworks.
   * Use cases: GDPR data access logs, HIPAA audit trails, SOC2 reporting
   *
   * @param options - Compliance query parameters
   * @returns Events relevant to the compliance framework
   */
  async queryCompliance(options: ComplianceQueryOptions): Promise<ClassifiedAuditEvent[]> {
    const queryOpts: QueryOptions = {
      tenantId: options.tenantId,
      startTime: options.startTime,
      endTime: options.endTime,
      tier: options.tier || StorageTier.WARM, // Compliance often queries historical data
      limit: 10000 // Higher limit for compliance reports
    };

    const events = await this.repository.query(queryOpts);

    // Filter by compliance framework tag
    let filtered = events.filter(e => e.complianceTags && e.complianceTags.includes(options.framework));

    // Apply additional filters
    if (options.includeHighRiskOnly) {
      filtered = filtered.filter(e => e.riskScore >= 70);
    }

    if (options.includeReviewRequired) {
      filtered = filtered.filter(e => e.autoReviewRequired);
    }

    return filtered.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Pattern 5: Aggregation
   *
   * Perform statistical analysis on audit events.
   * Use cases: Dashboards, trend analysis, capacity planning
   *
   * @param tenantId - Tenant identifier
   * @param startTime - Start of analysis period
   * @param endTime - End of analysis period
   * @param tier - Storage tier to query
   * @returns Aggregated statistics
   */
  async aggregate(tenantId: string, startTime: Date, endTime: Date, tier: StorageTier = StorageTier.HOT): Promise<AggregationResult> {
    const events = await this.repository.query({
      tenantId,
      startTime,
      endTime,
      tier,
      limit: 10000
    });

    const byCategory: Record<string, number> = {};
    const byLevel: Record<string, number> = {};
    const byActor: Record<string, number> = {};
    let successCount = 0;
    let failureCount = 0;
    let totalRisk = 0;
    let highRiskCount = 0;
    let criticalCount = 0;

    events.forEach(event => {
      // Category aggregation
      byCategory[event.category] = (byCategory[event.category] || 0) + 1;

      // Level aggregation
      byLevel[event.level] = (byLevel[event.level] || 0) + 1;

      // Actor aggregation
      if (event.actor) {
        byActor[event.actor] = (byActor[event.actor] || 0) + 1;
      }

      // Result aggregation
      if (event.result === 'success') {
        successCount++;
      } else if (event.result === 'failure') {
        failureCount++;
      }

      // Risk aggregation
      totalRisk += event.riskScore;
      if (event.riskScore >= 70) {
        highRiskCount++;
      }
      if (event.level === AuditLevel.CRITICAL) {
        criticalCount++;
      }
    });

    return {
      totalEvents: events.length,
      byCategory: byCategory as Record<AuditCategory, number>,
      byLevel: byLevel as Record<AuditLevel, number>,
      byActor,
      byResult: { success: successCount, failure: failureCount },
      averageRiskScore: events.length > 0 ? Math.round(totalRisk / events.length) : 0,
      highRiskCount,
      criticalCount
    };
  }

  /**
   * Pattern 6: Search
   *
   * Full-text search across audit events.
   * Use cases: Incident investigation, troubleshooting, ad-hoc queries
   *
   * @param tenantId - Tenant identifier
   * @param searchTerm - Search keyword
   * @param options - Additional query options
   * @returns Matching events
   */
  async search(
    tenantId: string,
    searchTerm: string,
    options?: { startTime?: Date; endTime?: Date; tier?: StorageTier; limit?: number }
  ): Promise<ClassifiedAuditEvent[]> {
    const events = await this.repository.query({
      tenantId,
      startTime: options?.startTime,
      endTime: options?.endTime,
      tier: options?.tier || StorageTier.HOT,
      limit: options?.limit || 1000
    });

    const lowerSearchTerm = searchTerm.toLowerCase();

    return events.filter(
      event =>
        event.eventType.toLowerCase().includes(lowerSearchTerm) ||
        event.action?.toLowerCase().includes(lowerSearchTerm) ||
        event.actor?.toLowerCase().includes(lowerSearchTerm) ||
        event.resourceType?.toLowerCase().includes(lowerSearchTerm) ||
        event.errorMessage?.toLowerCase().includes(lowerSearchTerm) ||
        JSON.stringify(event.metadata || {})
          .toLowerCase()
          .includes(lowerSearchTerm)
    );
  }

  /**
   * Pattern 7: Change Detection
   *
   * Compare two time periods to detect changes.
   * Use cases: Drift detection, anomaly identification, trend analysis
   *
   * @param tenantId - Tenant identifier
   * @param period1Start - Start of first period
   * @param period1End - End of first period
   * @param period2Start - Start of second period
   * @param period2End - End of second period
   * @returns Comparison statistics
   */
  async comparePeriods(
    tenantId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
  ): Promise<{
    period1: AggregationResult;
    period2: AggregationResult;
    changes: {
      totalEventsDelta: number;
      averageRiskDelta: number;
      highRiskDelta: number;
      criticalDelta: number;
    };
  }> {
    const [period1Stats, period2Stats] = await Promise.all([
      this.aggregate(tenantId, period1Start, period1End),
      this.aggregate(tenantId, period2Start, period2End)
    ]);

    return {
      period1: period1Stats,
      period2: period2Stats,
      changes: {
        totalEventsDelta: period2Stats.totalEvents - period1Stats.totalEvents,
        averageRiskDelta: period2Stats.averageRiskScore - period1Stats.averageRiskScore,
        highRiskDelta: period2Stats.highRiskCount - period1Stats.highRiskCount,
        criticalDelta: period2Stats.criticalCount - period1Stats.criticalCount
      }
    };
  }

  /**
   * Pattern 8: Anomaly Detection
   *
   * Identify high-risk or unusual events requiring attention.
   * Use cases: Security monitoring, proactive alerting, risk management
   *
   * @param tenantId - Tenant identifier
   * @param options - Detection parameters
   * @returns High-risk or anomalous events
   */
  async detectAnomalies(
    tenantId: string,
    options?: {
      startTime?: Date;
      endTime?: Date;
      riskThreshold?: number;
      includeReviewRequired?: boolean;
      tier?: StorageTier;
    }
  ): Promise<ClassifiedAuditEvent[]> {
    const events = await this.repository.query({
      tenantId,
      startTime: options?.startTime,
      endTime: options?.endTime,
      tier: options?.tier || StorageTier.HOT,
      limit: 5000
    });

    const riskThreshold = options?.riskThreshold || 70;

    let anomalies = events.filter(e => e.riskScore >= riskThreshold);

    if (options?.includeReviewRequired) {
      anomalies = anomalies.filter(e => e.autoReviewRequired);
    }

    // Sort by risk score descending
    return anomalies.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Get Recent Critical Events
   *
   * Quick access to recent critical security events.
   * Use cases: Real-time monitoring, incident response
   *
   * @param tenantId - Tenant identifier
   * @param hours - Number of hours to look back (default: 24)
   * @returns Recent critical events
   */
  async getRecentCriticalEvents(tenantId: string, hours: number = 24): Promise<ClassifiedAuditEvent[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    return this.repository.query({
      tenantId,
      level: AuditLevel.CRITICAL,
      startTime,
      endTime,
      tier: StorageTier.HOT,
      limit: 100
    });
  }

  /**
   * Get AI Decision History
   *
   * Track all AI agent decisions for transparency and auditing.
   * Use cases: AI governance, explainability, decision review
   *
   * @param tenantId - Tenant identifier
   * @param aiAgentId - Specific AI agent identifier (optional)
   * @param startTime - Start time (optional)
   * @param endTime - End time (optional)
   * @returns AI decision events
   */
  async getAIDecisions(tenantId: string, aiAgentId?: string, startTime?: Date, endTime?: Date): Promise<ClassifiedAuditEvent[]> {
    const events = await this.repository.query({
      tenantId,
      actor: aiAgentId,
      startTime,
      endTime,
      tier: StorageTier.HOT,
      limit: 1000
    });

    // Filter for AI-related events
    return events.filter(e => e.eventType.startsWith('ai.') || e.aiGenerated === true || e.complianceTags?.includes('AI_GOVERNANCE'));
  }
}
