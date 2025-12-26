# Audit System API Reference

Complete API documentation for the GigHub Global Audit Logging System Phase 1.

## Table of Contents

1. [Layer 0: Models & Interfaces](#layer-0-models--interfaces)
2. [Layer 3: Audit Collector Service](#layer-3-audit-collector-service)
3. [Layer 4: Classification Engine Service](#layer-4-classification-engine-service)
4. [Layer 5: Storage Repository](#layer-5-storage-repository)
5. [Layer 6: Query Service](#layer-6-query-service)
6. [Security Rules](#security-rules)
7. [Lifecycle Policies](#lifecycle-policies)

---

## Layer 0: Models & Interfaces

### AuditEvent Interface

The core audit event structure.

```typescript
interface AuditEvent {
  // Core Identity
  eventId: string;              // Unique event identifier (UUID)
  eventType: string;            // Event type (e.g., 'user.login', 'task.created')
  tenantId: string;             // Tenant/organization ID
  blueprintId?: string;         // Optional blueprint context
  timestamp: Date;              // Event occurrence time

  // Actor Information
  actorType: 'user' | 'team' | 'partner' | 'ai' | 'system';
  actorId: string;              // Actor unique identifier
  actorName?: string;           // Actor display name
  actorMetadata?: Record<string, any>;  // Additional actor context

  // Entity Information (what was acted upon)
  entityType?: string;          // Entity type (e.g., 'task', 'blueprint', 'user')
  entityId?: string;            // Entity unique identifier
  entityName?: string;          // Entity display name
  parentEntityType?: string;    // Parent entity type (hierarchical)
  parentEntityId?: string;      // Parent entity ID

  // Classification (auto-populated by ClassificationEngine)
  category: EventCategory;      // Event category (11 categories)
  level: EventSeverity;         // Severity level (LOW, MEDIUM, HIGH, CRITICAL)
  riskScore?: number;           // Risk score (0-100)
  complianceTags?: string[];    // Compliance frameworks (GDPR, HIPAA, etc.)

  // Storage Management
  tier: StorageTier;            // Storage tier (HOT, WARM, COLD)
  retentionDate?: Date;         // Calculated retention expiration
  archivedAt?: Date;            // Archive timestamp (COLD tier)

  // Change Tracking (for data modification events)
  changes?: {
    field: string;              // Changed field name
    oldValue: any;              // Previous value
    newValue: any;              // New value
  }[];

  // Operation Context
  operationType?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE';
  outcome?: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  description?: string;         // Human-readable description

  // Error Information (for failure events)
  errorCode?: string;           // Error code
  errorMessage?: string;        // Error message
  stackTrace?: string;          // Stack trace (development only)

  // Request Context
  requestId?: string;           // Request correlation ID
  sessionId?: string;           // User session ID
  ipAddress?: string;           // Client IP address
  userAgent?: string;           // Client user agent

  // Review Workflow (for high-risk events)
  reviewRequired?: boolean;     // Requires manual review
  reviewedAt?: Date;            // Review timestamp
  reviewedBy?: string;          // Reviewer ID
  reviewNotes?: string;         // Review comments

  // AI-specific (for AI decision events)
  aiModel?: string;             // AI model identifier
  aiConfidence?: number;        // Confidence score (0-1)
  aiMetadata?: Record<string, any>;  // AI-specific metadata

  // Additional Context
  metadata?: Record<string, any>;    // Custom metadata
  source?: string;              // Event source system
}
```

### EventCategory Enum

11 audit categories aligned with GitHub Master System:

```typescript
enum EventCategory {
  AUTH = 'AUTHENTICATION',           // Login, logout, MFA events
  AUTHZ = 'AUTHORIZATION',           // Permission grants, access control
  USER_ACTION = 'USER_ACTION',       // User-initiated actions
  DATA_ACCESS = 'DATA_ACCESS',       // Data read/query operations
  DATA_MODIFICATION = 'DATA_MODIFICATION',  // Data create/update/delete
  SYSTEM_EVENT = 'SYSTEM_EVENT',     // System operations
  AI_DECISION = 'AI_DECISION',       // AI-generated decisions
  SECURITY_INCIDENT = 'SECURITY_INCIDENT',  // Security violations
  COMPLIANCE_EVENT = 'COMPLIANCE_EVENT',    // Compliance-related events
  PERFORMANCE_ISSUE = 'PERFORMANCE_ISSUE',  // Performance problems
  ERROR_EXCEPTION = 'ERROR_EXCEPTION'       // Errors and exceptions
}
```

### EventSeverity Enum

4 severity levels with risk score thresholds:

```typescript
enum EventSeverity {
  LOW = 'LOW',           // Risk score: 0-25
  MEDIUM = 'MEDIUM',     // Risk score: 26-50
  HIGH = 'HIGH',         // Risk score: 51-75
  CRITICAL = 'CRITICAL'  // Risk score: 76-100
}
```

### StorageTier Enum

3-tier storage strategy with retention policies:

```typescript
enum StorageTier {
  HOT = 'HOT',    // Active events, 7-day retention, Firestore collection
  WARM = 'WARM',  // Older events, 90-day retention, Firestore collection
  COLD = 'COLD'   // Archived events, 7-year retention, Cloud Storage + BigQuery
}
```

---

## Layer 3: Audit Collector Service

### AuditCollectorEnhancedService

Bridges BlueprintEventBus with the audit infrastructure.

#### Methods

##### recordAuditEvent()

Manually record an audit event (bypasses batch processing).

```typescript
async recordAuditEvent(event: Partial<AuditEvent>): Promise<AuditEvent>
```

**Parameters**:
- `event`: Partial audit event (requires eventType, actorId, actorType minimum)

**Returns**: Promise<AuditEvent> - The classified and persisted event

**Example**:
```typescript
const auditEvent = await collectorService.recordAuditEvent({
  eventType: 'user.custom.action',
  actorType: 'user',
  actorId: 'user-123',
  actorName: 'John Doe',
  entityType: 'task',
  entityId: 'task-456',
  description: 'User performed custom action',
  metadata: { customField: 'value' }
});
```

##### getStatistics()

Get collector statistics (events collected, classified, persisted, failed).

```typescript
getStatistics(): CollectorStatistics
```

**Returns**:
```typescript
interface CollectorStatistics {
  eventsCollected: number;
  eventsClassified: number;
  eventsPersisted: number;
  eventsFailed: number;
  circuitBreakerTrips: number;
  lastBatchProcessed?: Date;
  lastCircuitBreakerTrip?: Date;
}
```

#### Configuration

Default batch configuration:

```typescript
{
  maxSize: 50,        // Auto-flush after 50 events
  maxWaitMs: 5000     // Auto-flush after 5 seconds
}
```

#### Circuit Breaker

Automatic failure protection:

```typescript
{
  maxFailures: 3,          // Open circuit after 3 consecutive failures
  resetTimeoutMs: 60000    // Attempt recovery after 60 seconds
}
```

**States**:
- `CLOSED`: Normal operation, events processed
- `OPEN`: Circuit broken, events sent to DLQ
- `HALF_OPEN`: Testing recovery, single event attempt

---

## Layer 4: Classification Engine Service

### ClassificationEngineService

Automatically classifies audit events based on 102 event type patterns.

#### Methods

##### classify()

Classify a single audit event.

```typescript
classify(event: AuditEvent): ClassifiedAuditEvent
```

**Example**:
```typescript
const classified = classificationEngine.classify({
  eventType: 'user.login',
  actorType: 'user',
  actorId: 'user-123'
});

console.log(`Risk Score: ${classified.riskScore}`);
console.log(`Category: ${classified.category}`);
```

##### classifyBatch()

Classify multiple events in batch (optimized performance).

```typescript
classifyBatch(events: AuditEvent[]): ClassifiedAuditEvent[]
```

**Performance**: < 10ms per event for batches up to 1000 events

##### getRiskStatistics()

Get risk statistics for a tenant.

```typescript
getRiskStatistics(tenantId: string): RiskStatistics
```

---

## Layer 5: Storage Repository

### AuditEventRepository

Handles multi-tier Firestore persistence with automatic classification.

#### Methods

##### create()

Create a single audit event (automatically classifies and determines tier).

```typescript
async create(event: Partial<AuditEvent>): Promise<AuditEvent>
```

##### createBatch()

Create multiple events in batch (transactional).

```typescript
async createBatch(events: Partial<AuditEvent>[]): Promise<AuditEvent[]>
```

**Performance**: Optimized for batches up to 500 events

##### findByDateRange()

Find events within date range.

```typescript
async findByDateRange(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  options?: QueryOptions
): Promise<AuditEvent[]>
```

##### findByActor()

Find all events for a specific actor.

```typescript
async findByActor(
  tenantId: string,
  actorId: string,
  options?: QueryOptions
): Promise<AuditEvent[]>
```

##### findByEntity()

Find all events for a specific entity.

```typescript
async findByEntity(
  tenantId: string,
  entityType: string,
  entityId: string,
  options?: QueryOptions
): Promise<AuditEvent[]>
```

---

## Layer 6: Query Service

### AuditQueryService

8 advanced query patterns for enterprise-grade audit analysis.

#### 1. Timeline Reconstruction

```typescript
async getTimeline(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  options?: TimelineOptions
): Promise<TimelineEvent[]>
```

#### 2. Actor Activity Tracking

```typescript
async getActorActivity(
  tenantId: string,
  actorId: string,
  options?: ActorActivityOptions
): Promise<ActorActivity>
```

#### 3. Entity History Tracking

```typescript
async getEntityHistory(
  tenantId: string,
  entityType: string,
  entityId: string
): Promise<EntityHistory>
```

#### 4. Compliance Reporting

```typescript
async getComplianceEvents(
  tenantId: string,
  complianceTag: string,
  startDate: Date,
  endDate: Date
): Promise<ComplianceReport>
```

#### 5. Aggregation & Statistics

```typescript
async getEventStatistics(
  tenantId: string,
  options?: StatisticsOptions
): Promise<EventStatistics>
```

#### 6. Full-Text Search

```typescript
async searchEvents(
  tenantId: string,
  searchQuery: string,
  options?: SearchOptions
): Promise<AuditEvent[]>
```

#### 7. Change Detection

```typescript
async detectChanges(
  tenantId: string,
  entityType: string,
  entityId: string
): Promise<ChangeDetectionResult>
```

#### 8. Anomaly Detection

```typescript
async detectAnomalies(
  tenantId: string,
  options?: AnomalyDetectionOptions
): Promise<AnomalyDetectionResult>
```

---

## Complete Audit Flow Example

```typescript
// 1. Initialize services
const collector = inject(AuditCollectorEnhancedService);
const queryService = inject(AuditQueryService);

// 2. Record an event (automatic via BlueprintEventBus)
// OR manually:
const event = await collector.recordAuditEvent({
  eventType: 'user.login',
  actorType: 'user',
  actorId: 'user-123'
});

// 3. Query recent activity
const timeline = await queryService.getTimeline(
  'tenant-123',
  new Date(Date.now() - 24 * 60 * 60 * 1000),
  new Date()
);

// 4. Get user activity
const userActivity = await queryService.getActorActivity(
  'tenant-123',
  'user-123'
);

// 5. Generate compliance report
const complianceReport = await queryService.getComplianceEvents(
  'tenant-123',
  'GDPR',
  new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  new Date()
);
```

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-26  
**Phase**: Phase 1 Complete  
**Maintainer**: Audit System Team
