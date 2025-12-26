# Layer 6: Query Service (Multi-dimensional Queries)

> **Purpose**: Provide powerful, multi-dimensional query capabilities for audit events with filtering, aggregation, time-range selection, and compliance-focused views.

## Overview

Layer 6 is the **query layer** that enables stakeholders to extract insights from audit data. It supports 8 query patterns, complex filtering, and pre-built compliance reports.

## Query Patterns

### 1. Timeline Query (Temporal Analysis)

```typescript
// Get all events in a time range
export interface TimelineQuery {
  startTime: Date;
  endTime: Date;
  blueprintId?: string;
  categories?: AuditEventCategory[];
  severities?: AuditSeverity[];
  limit?: number;
  offset?: number;
}

// Example: Get all security events in the last 24 hours
const query: TimelineQuery = {
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
  endTime: new Date(),
  categories: [AuditEventCategory.SECURITY],
  severities: [AuditSeverity.CRITICAL, AuditSeverity.HIGH]
};

const events = await auditQueryService.queryTimeline(query);
```

### 2. Actor Query (Who Did What)

```typescript
// Get all events by a specific actor
export interface ActorQuery {
  actorId: string;
  actorType: 'user' | 'team' | 'partner' | 'system' | 'ai';
  startTime?: Date;
  endTime?: Date;
  operations?: AuditOperation[];
  blueprintId?: string;
}

// Example: Get all actions by a user in a blueprint
const query: ActorQuery = {
  actorId: 'user-123',
  actorType: 'user',
  blueprintId: 'bp-456',
  operations: [AuditOperation.CREATE, AuditOperation.UPDATE, AuditOperation.DELETE]
};

const events = await auditQueryService.queryByActor(query);
```

### 3. Entity Query (Resource Audit Trail)

```typescript
// Get all events for a specific entity
export interface EntityQuery {
  entityType: AuditEntityType;
  entityId: string;
  startTime?: Date;
  endTime?: Date;
  operations?: AuditOperation[];
  includeRelated?: boolean; // Include related entities (e.g., tasks of a blueprint)
}

// Example: Get full audit trail for a task
const query: EntityQuery = {
  entityType: AuditEntityType.TASK,
  entityId: 'task-789',
  includeRelated: true
};

const events = await auditQueryService.queryByEntity(query);
```

### 4. Compliance Query (Regulatory Reports)

```typescript
// Get events relevant to specific compliance frameworks
export interface ComplianceQuery {
  complianceTags: ComplianceTag[];
  startTime: Date;
  endTime: Date;
  blueprintId?: string;
  includeViolations?: boolean; // Only violations
  groupBy?: 'tag' | 'severity' | 'category';
}

// Example: GDPR compliance report for last quarter
const query: ComplianceQuery = {
  complianceTags: [ComplianceTag.GDPR],
  startTime: new Date('2025-10-01'),
  endTime: new Date('2025-12-31'),
  includeViolations: true,
  groupBy: 'severity'
};

const report = await auditQueryService.queryCompliance(query);
```

### 5. Aggregation Query (Statistical Analysis)

```typescript
// Aggregate events for analytics
export interface AggregationQuery {
  startTime: Date;
  endTime: Date;
  blueprintId?: string;
  groupBy: 'category' | 'severity' | 'actor' | 'entityType' | 'hour' | 'day' | 'week';
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max';
  filters?: {
    categories?: AuditEventCategory[];
    severities?: AuditSeverity[];
    operations?: AuditOperation[];
  };
}

// Example: Count events by category for last 30 days
const query: AggregationQuery = {
  startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  endTime: new Date(),
  groupBy: 'category',
  aggregation: 'count'
};

const stats = await auditQueryService.aggregate(query);
// Result: { USER_ACTION: 1250, AI_DECISION: 42, SECURITY: 18, ... }
```

### 6. Full-Text Search Query

```typescript
// Search audit events by text content
export interface SearchQuery {
  searchText: string;
  startTime?: Date;
  endTime?: Date;
  blueprintId?: string;
  categories?: AuditEventCategory[];
  limit?: number;
  offset?: number;
}

// Example: Search for "permission denied" events
const query: SearchQuery = {
  searchText: 'permission denied',
  categories: [AuditEventCategory.SECURITY],
  limit: 100
};

const events = await auditQueryService.search(query);
```

### 7. Change Detection Query (Delta Analysis)

```typescript
// Detect changes to entities over time
export interface ChangeDetectionQuery {
  entityType: AuditEntityType;
  entityId: string;
  startTime: Date;
  endTime: Date;
  fields?: string[]; // Specific fields to track
}

// Example: Track all changes to a task's status
const query: ChangeDetectionQuery = {
  entityType: AuditEntityType.TASK,
  entityId: 'task-789',
  startTime: new Date('2025-12-01'),
  endTime: new Date('2025-12-26'),
  fields: ['status']
};

const changes = await auditQueryService.detectChanges(query);
// Result: [
//   { timestamp: '2025-12-01T10:00:00Z', field: 'status', oldValue: 'pending', newValue: 'in-progress' },
//   { timestamp: '2025-12-15T14:30:00Z', field: 'status', oldValue: 'in-progress', newValue: 'completed' }
// ]
```

### 8. Anomaly Detection Query

```typescript
// Detect anomalous patterns in audit data
export interface AnomalyQuery {
  startTime: Date;
  endTime: Date;
  blueprintId?: string;
  anomalyTypes: Array<
    'unusual_actor' |           // Actor with unusual activity
    'high_failure_rate' |       // High rate of failed operations
    'unusual_time' |            // Activity at unusual times
    'permission_escalation' |   // Sudden permission changes
    'data_exfiltration' |       // Large data exports
    'rapid_changes'             // Rapid succession of changes
  >;
  threshold?: number; // Sensitivity (0.0 to 1.0)
}

// Example: Detect unusual actor behavior
const query: AnomalyQuery = {
  startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  endTime: new Date(),
  anomalyTypes: ['unusual_actor', 'high_failure_rate'],
  threshold: 0.7 // 70% confidence
};

const anomalies = await auditQueryService.detectAnomalies(query);
```

## Query Service Implementation

```typescript
// src/app/core/audit/query/audit-query.service.ts

@Injectable({ providedIn: 'root' })
export class AuditQueryService {
  private firestore = inject(Firestore);
  private logger = inject(LoggerService);

  /**
   * Query events within a time range
   */
  async queryTimeline(query: TimelineQuery): Promise<ClassifiedAuditEvent[]> {
    const constraints = [
      where('timestamp', '>=', query.startTime.toISOString()),
      where('timestamp', '<=', query.endTime.toISOString())
    ];

    if (query.blueprintId) {
      constraints.push(where('blueprintId', '==', query.blueprintId));
    }

    if (query.categories && query.categories.length > 0) {
      constraints.push(where('category', 'in', query.categories));
    }

    if (query.severities && query.severities.length > 0) {
      constraints.push(where('severity', 'in', query.severities));
    }

    constraints.push(orderBy('timestamp', 'desc'));

    if (query.limit) {
      constraints.push(limit(query.limit));
    }

    const q = query(
      collection(this.firestore, 'audit_events'),
      ...constraints
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ClassifiedAuditEvent);
  }

  /**
   * Query events by actor
   */
  async queryByActor(query: ActorQuery): Promise<ClassifiedAuditEvent[]> {
    const constraints = [
      where('actor', '==', query.actorId),
      where('actorType', '==', query.actorType)
    ];

    if (query.blueprintId) {
      constraints.push(where('blueprintId', '==', query.blueprintId));
    }

    if (query.startTime) {
      constraints.push(where('timestamp', '>=', query.startTime.toISOString()));
    }

    if (query.endTime) {
      constraints.push(where('timestamp', '<=', query.endTime.toISOString()));
    }

    if (query.operations && query.operations.length > 0) {
      constraints.push(where('operation', 'in', query.operations));
    }

    constraints.push(orderBy('timestamp', 'desc'));

    const q = query(
      collection(this.firestore, 'audit_events'),
      ...constraints
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ClassifiedAuditEvent);
  }

  /**
   * Query events by entity
   */
  async queryByEntity(query: EntityQuery): Promise<ClassifiedAuditEvent[]> {
    const constraints = [
      where('entityType', '==', query.entityType),
      where('entityId', '==', query.entityId)
    ];

    if (query.startTime) {
      constraints.push(where('timestamp', '>=', query.startTime.toISOString()));
    }

    if (query.endTime) {
      constraints.push(where('timestamp', '<=', query.endTime.toISOString()));
    }

    if (query.operations && query.operations.length > 0) {
      constraints.push(where('operation', 'in', query.operations));
    }

    constraints.push(orderBy('timestamp', 'asc')); // Chronological order for audit trail

    const q = query(
      collection(this.firestore, 'audit_events'),
      ...constraints
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ClassifiedAuditEvent);
  }

  /**
   * Query events for compliance reporting
   */
  async queryCompliance(query: ComplianceQuery): Promise<ComplianceReport> {
    const constraints = [
      where('timestamp', '>=', query.startTime.toISOString()),
      where('timestamp', '<=', query.endTime.toISOString()),
      where('complianceTags', 'array-contains-any', query.complianceTags)
    ];

    if (query.blueprintId) {
      constraints.push(where('blueprintId', '==', query.blueprintId));
    }

    if (query.includeViolations) {
      constraints.push(where('category', '==', AuditEventCategory.COMPLIANCE));
    }

    const q = query(
      collection(this.firestore, 'audit_events'),
      ...constraints
    );

    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => doc.data() as ClassifiedAuditEvent);

    // Group events based on query.groupBy
    return this.buildComplianceReport(events, query);
  }

  /**
   * Aggregate events for analytics
   */
  async aggregate(query: AggregationQuery): Promise<Record<string, number>> {
    // Note: Firestore doesn't support server-side aggregation well
    // For production, consider using Cloud Functions + BigQuery export
    
    const constraints = [
      where('timestamp', '>=', query.startTime.toISOString()),
      where('timestamp', '<=', query.endTime.toISOString())
    ];

    if (query.blueprintId) {
      constraints.push(where('blueprintId', '==', query.blueprintId));
    }

    if (query.filters) {
      if (query.filters.categories && query.filters.categories.length > 0) {
        constraints.push(where('category', 'in', query.filters.categories));
      }
      if (query.filters.severities && query.filters.severities.length > 0) {
        constraints.push(where('severity', 'in', query.filters.severities));
      }
      if (query.filters.operations && query.filters.operations.length > 0) {
        constraints.push(where('operation', 'in', query.filters.operations));
      }
    }

    const q = query(
      collection(this.firestore, 'audit_events'),
      ...constraints
    );

    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => doc.data() as ClassifiedAuditEvent);

    // Client-side aggregation
    return this.performAggregation(events, query);
  }

  /**
   * Full-text search across audit events
   */
  async search(query: SearchQuery): Promise<ClassifiedAuditEvent[]> {
    // Note: Firestore doesn't support full-text search natively
    // For production, consider using Algolia, Elasticsearch, or Cloud Search
    
    const constraints = [];

    if (query.startTime) {
      constraints.push(where('timestamp', '>=', query.startTime.toISOString()));
    }

    if (query.endTime) {
      constraints.push(where('timestamp', '<=', query.endTime.toISOString()));
    }

    if (query.blueprintId) {
      constraints.push(where('blueprintId', '==', query.blueprintId));
    }

    if (query.categories && query.categories.length > 0) {
      constraints.push(where('category', 'in', query.categories));
    }

    constraints.push(orderBy('timestamp', 'desc'));

    if (query.limit) {
      constraints.push(limit(query.limit));
    }

    const q = query(
      collection(this.firestore, 'audit_events'),
      ...constraints
    );

    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => doc.data() as ClassifiedAuditEvent);

    // Client-side text filtering
    const searchLower = query.searchText.toLowerCase();
    return events.filter(event => 
      event.searchText?.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Detect changes to entities over time
   */
  async detectChanges(query: ChangeDetectionQuery): Promise<ChangeRecord[]> {
    const events = await this.queryByEntity({
      entityType: query.entityType,
      entityId: query.entityId,
      startTime: query.startTime,
      endTime: query.endTime,
      operations: [AuditOperation.UPDATE]
    });

    // Extract changes from update events
    const changes: ChangeRecord[] = [];
    
    for (const event of events) {
      if (event.operation === AuditOperation.UPDATE && event.data) {
        const fields = query.fields || Object.keys(event.data);
        
        for (const field of fields) {
          if (event.data[field] !== undefined) {
            changes.push({
              timestamp: event.timestamp,
              field,
              oldValue: event.data[`${field}_old`],
              newValue: event.data[field],
              actor: event.actor
            });
          }
        }
      }
    }

    return changes.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Detect anomalies in audit data
   */
  async detectAnomalies(query: AnomalyQuery): Promise<AnomalyRecord[]> {
    // This is a placeholder for anomaly detection logic
    // In production, consider using Cloud Functions + ML models
    
    const events = await this.queryTimeline({
      startTime: query.startTime,
      endTime: query.endTime,
      blueprintId: query.blueprintId
    });

    const anomalies: AnomalyRecord[] = [];

    // Implement anomaly detection algorithms
    for (const anomalyType of query.anomalyTypes) {
      switch (anomalyType) {
        case 'unusual_actor':
          anomalies.push(...this.detectUnusualActors(events, query.threshold));
          break;
        case 'high_failure_rate':
          anomalies.push(...this.detectHighFailureRate(events, query.threshold));
          break;
        // ... other anomaly types
      }
    }

    return anomalies;
  }

  // Helper methods
  private performAggregation(
    events: ClassifiedAuditEvent[],
    query: AggregationQuery
  ): Record<string, number> {
    const result: Record<string, number> = {};

    for (const event of events) {
      const key = this.getAggregationKey(event, query.groupBy);
      result[key] = (result[key] || 0) + 1;
    }

    return result;
  }

  private getAggregationKey(event: ClassifiedAuditEvent, groupBy: string): string {
    switch (groupBy) {
      case 'category': return event.category;
      case 'severity': return event.severity;
      case 'actor': return event.actor;
      case 'entityType': return event.entityType || 'unknown';
      case 'hour': return new Date(event.timestamp).toISOString().slice(0, 13);
      case 'day': return new Date(event.timestamp).toISOString().slice(0, 10);
      case 'week': {
        const date = new Date(event.timestamp);
        const week = Math.floor(date.getDate() / 7) + 1;
        return `${date.getFullYear()}-W${week}`;
      }
      default: return 'unknown';
    }
  }

  private buildComplianceReport(
    events: ClassifiedAuditEvent[],
    query: ComplianceQuery
  ): ComplianceReport {
    // Build structured compliance report
    // Implementation details omitted for brevity
    return {} as ComplianceReport;
  }

  private detectUnusualActors(events: ClassifiedAuditEvent[], threshold?: number): AnomalyRecord[] {
    // Implement unusual actor detection
    // Implementation details omitted for brevity
    return [];
  }

  private detectHighFailureRate(events: ClassifiedAuditEvent[], threshold?: number): AnomalyRecord[] {
    // Implement high failure rate detection
    // Implementation details omitted for brevity
    return [];
  }
}

// Supporting types
export interface ChangeRecord {
  timestamp: string;
  field: string;
  oldValue: any;
  newValue: any;
  actor: string;
}

export interface AnomalyRecord {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  events: ClassifiedAuditEvent[];
  confidence: number;
  timestamp: string;
}

export interface ComplianceReport {
  complianceTags: ComplianceTag[];
  startTime: Date;
  endTime: Date;
  totalEvents: number;
  violations: number;
  byCategory: Record<AuditEventCategory, number>;
  bySeverity: Record<AuditSeverity, number>;
  events: ClassifiedAuditEvent[];
}
```

## Query Optimization

### Firestore Indexes

```javascript
// firestore.indexes.json
{
  "indexes": [
    // Timeline queries
    {
      "collectionGroup": "audit_events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "timestamp", "order": "DESCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "severity", "order": "ASCENDING" }
      ]
    },
    // Actor queries
    {
      "collectionGroup": "audit_events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "actor", "order": "ASCENDING" },
        { "fieldPath": "actorType", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    // Entity queries
    {
      "collectionGroup": "audit_events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "entityType", "order": "ASCENDING" },
        { "fieldPath": "entityId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    },
    // Compliance queries
    {
      "collectionGroup": "audit_events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "complianceTags", "arrayConfig": "CONTAINS" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Caching Strategy

```typescript
@Injectable({ providedIn: 'root' })
export class AuditQueryService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  async queryTimeline(query: TimelineQuery): Promise<ClassifiedAuditEvent[]> {
    const cacheKey = this.getCacheKey('timeline', query);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const events = await this.performTimelineQuery(query);
    this.cache.set(cacheKey, { data: events, timestamp: Date.now() });

    return events;
  }

  private getCacheKey(queryType: string, query: any): string {
    return `${queryType}:${JSON.stringify(query)}`;
  }
}
```

## Success Criteria

✅ **Query Patterns**: All 8 query patterns implemented
✅ **Performance**: <500ms for most queries, <2s for aggregations
✅ **Scalability**: Handle 1M+ events efficiently
✅ **Flexibility**: Support complex filters and multi-dimensional analysis
✅ **Compliance**: Pre-built compliance report templates
✅ **Caching**: 80%+ cache hit rate for common queries

## Related Documentation

- [Layer 5: Storage Tiers](./LAYER_5_STORAGE_TIERS.md) - Data storage
- [Layer 7: Export Service](./LAYER_7_EXPORT_SERVICE.md) - Export results
- [Schema Registry](../audit-schemas/SCHEMA_REGISTRY.md) - Event schemas
- [Compliance Framework](../BEHAVIORAL_COMPLIANCE_FRAMEWORK.md) - Compliance requirements

---

**Status**: Design Complete, Implementation 0%
**Next Steps**: Implement AuditQueryService with Firestore indexes
**Owner**: Audit System Team
**Last Updated**: 2025-12-26
