# Layer 1: Event Sources (Business Modules)

> **Purpose**: Instrument all business modules to emit audit events at key decision points and state transitions.

## Overview

Layer 1 is the **instrumentation layer** that captures audit-worthy events from business modules. Every user action, system decision, data mutation, and side effect is captured as a structured event.

## Event Source Categories

### 1. User Actions (UI Layer)
**Location**: `src/app/routes/*/`

```typescript
// Example: Task creation
{
  type: 'user.action.task.created',
  blueprintId: 'bp-123',
  timestamp: '2025-12-26T01:00:00Z',
  actor: 'user-456',
  actorType: 'user',
  data: {
    taskId: 'task-789',
    title: 'Install plumbing',
    assignedTo: 'team-101',
    assignedToType: 'team'
  },
  metadata: {
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    sessionId: 'sess-abc'
  }
}
```

**Instrumentation Points**:
- Login/logout events
- Create/update/delete operations
- State transitions (task status changes)
- Permission grant/revoke
- Blueprint membership changes
- Document uploads
- Export requests

### 2. AI Decisions (Meta Layer)
**Location**: AI agent execution context

```typescript
// Example: Architectural decision
{
  type: 'ai.decision.architectural',
  timestamp: '2025-12-26T01:00:00Z',
  actor: 'copilot-agent',
  actorType: 'ai',
  data: {
    decisionType: 'pattern_selection',
    context: 'Choosing state management approach',
    options: [
      { name: 'BehaviorSubject', score: 60, reason: 'RxJS-based' },
      { name: 'Signals', score: 95, reason: 'Angular 20 native' }
    ],
    selected: 'Signals',
    reasoning: 'Aligns with Angular 20 best practices and project guidelines',
    confidence: 0.95
  },
  metadata: {
    guidelinesChecked: ['angular.instructions.md', '🧠AI_Behavior_Guidelines.md'],
    constraintsApplied: ['standalone-components', 'no-ngmodules']
  }
}
```

**Instrumentation Points**:
- Pattern selection decisions
- Refactoring recommendations
- Guideline compliance checks
- Constraint violation detections
- Data flow analysis
- Side effect predictions

### 3. Data Flow (Repository Layer)
**Location**: `src/app/core/data-access/*/`

```typescript
// Example: Data query
{
  type: 'data.flow.query',
  timestamp: '2025-12-26T01:00:00Z',
  actor: 'system',
  actorType: 'system',
  data: {
    collection: 'tasks',
    operation: 'query',
    filters: { blueprintId: 'bp-123', status: 'in-progress' },
    resultCount: 42,
    duration: 127 // ms
  },
  metadata: {
    repository: 'TaskRepository',
    method: 'findByBlueprintIdAndStatus',
    cacheHit: false
  }
}
```

**Instrumentation Points**:
- Database queries (reads)
- Data mutations (creates, updates, deletes)
- Migration executions
- Batch operations
- Transaction boundaries
- Cache operations

### 4. Security Events (Permission Layer)
**Location**: `src/app/core/services/permission.service.ts`, `firestore.rules`

```typescript
// Example: Permission check
{
  type: 'security.permission.checked',
  timestamp: '2025-12-26T01:00:00Z',
  actor: 'user-456',
  actorType: 'user',
  blueprintId: 'bp-123',
  data: {
    resource: 'task-789',
    resourceType: 'task',
    permission: 'task:update',
    result: 'granted',
    reason: 'User has admin role with task:update permission'
  },
  metadata: {
    roles: ['admin', 'member'],
    permissions: ['task:read', 'task:create', 'task:update'],
    memberStatus: 'active'
  }
}
```

**Instrumentation Points**:
- Permission checks (allowed/denied)
- Authentication events
- Authorization events
- Security rule evaluations
- Token validations
- Role assignments

### 5. System Events (Infrastructure Layer)
**Location**: `src/app/core/services/`, Firebase Functions

```typescript
// Example: Configuration change
{
  type: 'system.config.changed',
  timestamp: '2025-12-26T01:00:00Z',
  actor: 'admin-user',
  actorType: 'user',
  data: {
    key: 'features.advancedSearch.enabled',
    oldValue: false,
    newValue: true,
    reason: 'Enabling advanced search for all users'
  },
  metadata: {
    environment: 'production',
    deploymentVersion: 'v2.1.0'
  }
}
```

**Instrumentation Points**:
- Configuration changes
- Health check failures
- Performance anomalies
- Error boundaries triggered
- Circuit breaker state changes
- Rate limit violations

### 6. Blueprint Lifecycle
**Location**: `src/app/core/services/blueprint.service.ts`

```typescript
// Example: Blueprint created
{
  type: 'blueprint.lifecycle.created',
  timestamp: '2025-12-26T01:00:00Z',
  actor: 'user-456',
  actorType: 'user',
  blueprintId: 'bp-123',
  data: {
    name: 'Office Tower Construction',
    ownerType: 'organization',
    ownerId: 'org-789',
    visibility: 'private'
  },
  metadata: {
    template: 'construction-project',
    estimatedDuration: '18 months'
  }
}
```

**Instrumentation Points**:
- Blueprint creation
- Blueprint deletion (soft/hard)
- Blueprint archival
- Blueprint restoration
- Ownership transfer
- Visibility changes

## Instrumentation Strategy

### Automatic Instrumentation (Decorator Pattern)

```typescript
// src/app/core/audit/decorators/audit-action.decorator.ts

export function AuditAction(eventType: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      const context = this; // Service instance

      try {
        const result = await originalMethod.apply(context, args);
        const duration = performance.now() - startTime;

        // Emit success event
        context.auditCollector.emit({
          type: eventType,
          timestamp: new Date().toISOString(),
          actor: context.getCurrentUser()?.id || 'system',
          actorType: context.getCurrentUser() ? 'user' : 'system',
          data: {
            args: sanitizeArgs(args),
            result: sanitizeResult(result),
            duration
          },
          metadata: {
            service: target.constructor.name,
            method: propertyKey,
            status: 'success'
          }
        });

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;

        // Emit failure event
        context.auditCollector.emit({
          type: `${eventType}.failed`,
          timestamp: new Date().toISOString(),
          actor: context.getCurrentUser()?.id || 'system',
          actorType: context.getCurrentUser() ? 'user' : 'system',
          data: {
            args: sanitizeArgs(args),
            error: {
              message: error.message,
              code: error.code,
              stack: error.stack
            },
            duration
          },
          metadata: {
            service: target.constructor.name,
            method: propertyKey,
            status: 'failure'
          }
        });

        throw error;
      }
    };

    return descriptor;
  };
}

// Usage in service
@Injectable({ providedIn: 'root' })
export class TaskService {
  @AuditAction('user.action.task.created')
  async createTask(blueprintId: string, task: CreateTaskDto): Promise<Task> {
    // Business logic here
  }
}
```

### Manual Instrumentation (Explicit Calls)

```typescript
// For complex scenarios requiring custom logic

export class TaskService {
  private auditCollector = inject(AuditCollectorService);

  async complexOperation(blueprintId: string, data: any): Promise<void> {
    // Pre-operation audit
    this.auditCollector.emit({
      type: 'task.operation.started',
      blueprintId,
      timestamp: new Date().toISOString(),
      actor: this.getCurrentUser()?.id,
      actorType: 'user',
      data: { operation: 'complexOperation', params: data }
    });

    try {
      // Step 1
      await this.step1();
      this.auditCollector.emit({
        type: 'task.operation.step_completed',
        blueprintId,
        data: { step: 1, status: 'success' }
      });

      // Step 2
      await this.step2();
      this.auditCollector.emit({
        type: 'task.operation.step_completed',
        blueprintId,
        data: { step: 2, status: 'success' }
      });

      // Post-operation audit
      this.auditCollector.emit({
        type: 'task.operation.completed',
        blueprintId,
        data: { operation: 'complexOperation', result: 'success' }
      });
    } catch (error) {
      this.auditCollector.emit({
        type: 'task.operation.failed',
        blueprintId,
        data: { operation: 'complexOperation', error: error.message }
      });
      throw error;
    }
  }
}
```

## Event Emission Rules

### 1. Event Completeness
- **MUST** include `type`, `timestamp`, `actor`, `actorType`
- **MUST** include `blueprintId` for tenant-scoped events
- **SHOULD** include `data` with relevant context
- **SHOULD** include `metadata` for debugging

### 2. Sensitive Data Handling
- **MUST** sanitize passwords, tokens, secrets
- **MUST** hash PII (email, phone) if required for audit
- **SHOULD** redact sensitive fields in `data` payload
- **SHOULD** store full data separately with encryption

```typescript
function sanitizeArgs(args: any[]): any[] {
  return args.map(arg => {
    if (typeof arg === 'object') {
      return Object.keys(arg).reduce((acc, key) => {
        if (SENSITIVE_FIELDS.includes(key)) {
          acc[key] = '[REDACTED]';
        } else {
          acc[key] = arg[key];
        }
        return acc;
      }, {});
    }
    return arg;
  });
}

const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'privateKey',
  'creditCard',
  'ssn'
];
```

### 3. Performance Considerations
- **Asynchronous emission** - Use `Promise.resolve().then(() => emit())` to avoid blocking
- **Batching** - Buffer events and send in batches every 100ms or 50 events
- **Sampling** - Sample high-frequency events (e.g., 10% of queries)
- **Circuit breaker** - Stop emitting if audit system is down

```typescript
export class AuditCollectorService {
  private buffer: AuditEvent[] = [];
  private batchSize = 50;
  private batchInterval = 100; // ms

  emit(event: AuditEvent): void {
    // Non-blocking emission
    Promise.resolve().then(() => {
      this.buffer.push(event);

      if (this.buffer.length >= this.batchSize) {
        this.flush();
      }
    });
  }

  private flush(): void {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0, this.buffer.length);
    this.eventBus.publish({
      type: 'audit.batch',
      events: batch
    });
  }
}
```

### 4. Event Prioritization
- **P0 (Critical)** - Security events, permission denials, data mutations
- **P1 (High)** - User actions, AI decisions, compliance checks
- **P2 (Medium)** - Data queries, system events, performance metrics
- **P3 (Low)** - Debug events, detailed traces

```typescript
export interface AuditEvent {
  type: string;
  timestamp: string;
  actor: string;
  actorType: 'user' | 'team' | 'partner' | 'system' | 'ai';
  blueprintId?: string;
  data: any;
  metadata?: any;
  priority: 'P0' | 'P1' | 'P2' | 'P3'; // Add priority field
}
```

## Integration with Event Bus

```typescript
// src/app/core/audit/collectors/audit-collector.service.ts

@Injectable({ providedIn: 'root' })
export class AuditCollectorService {
  private eventBus = inject(BlueprintEventBus);
  private buffer: AuditEvent[] = [];

  emit(event: AuditEvent): void {
    // Validate event structure
    if (!this.validate(event)) {
      console.error('Invalid audit event:', event);
      return;
    }

    // Add to buffer
    this.buffer.push(event);

    // Trigger flush if needed
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  private flush(): void {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0, this.buffer.length);

    // Publish to event bus (Layer 2)
    this.eventBus.publish({
      type: 'audit.events.batch',
      blueprintId: 'global', // Global audit topic
      timestamp: new Date(),
      actor: 'audit-collector',
      data: {
        events: batch,
        count: batch.length
      }
    });
  }

  private validate(event: AuditEvent): boolean {
    return !!(
      event.type &&
      event.timestamp &&
      event.actor &&
      event.actorType
    );
  }
}
```

## Coverage Metrics

### Target Coverage (100+ Instrumentation Points)

| Category | Points | Priority | Status |
|----------|--------|----------|--------|
| User Actions | 25 | P1 | 11 implemented (44%) |
| AI Decisions | 8 | P0 | 0 implemented (0%) |
| Data Flow | 20 | P1 | 4 implemented (20%) |
| Security | 15 | P0 | 3 implemented (20%) |
| System | 10 | P2 | 2 implemented (20%) |
| Blueprint | 15 | P1 | 5 implemented (33%) |
| Task | 12 | P1 | 6 implemented (50%) |
| Organization | 8 | P2 | 3 implemented (37%) |
| Integration | 6 | P2 | 0 implemented (0%) |
| Performance | 5 | P3 | 1 implemented (20%) |

**Current Total**: 35/124 points implemented (28%)
**Target**: 100% coverage across all categories

## Implementation Roadmap

### Phase 1: Core Events (P0/P1)
**Timeline**: Week 1-2

1. Security events (permission checks, auth)
2. User actions (CRUD operations)
3. Blueprint lifecycle events
4. Task lifecycle events
5. AI decision events (new)

### Phase 2: Data & System Events (P1/P2)
**Timeline**: Week 3-4

6. Data flow events (queries, mutations)
7. System events (config, health)
8. Organization events
9. Performance metrics

### Phase 3: Integration & Advanced (P2/P3)
**Timeline**: Week 5-6

10. Integration events (API, webhooks)
11. Detailed traces
12. Debug events
13. Sampling & optimization

## Success Criteria

✅ **Coverage**: 100+ instrumentation points across 10 categories
✅ **Performance**: <5ms overhead per event emission
✅ **Completeness**: All events include required fields
✅ **Security**: No sensitive data in event payloads
✅ **Reliability**: 99.9% event delivery rate
✅ **Observability**: Real-time monitoring dashboard

## Related Documentation

- [Layer 2: Event Bus](./LAYER_2_EVENT_BUS.md) - Distribution center
- [Schema Registry](../audit-schemas/SCHEMA_REGISTRY.md) - Event schemas
- [Integration Map](../audit-architecture/INTEGRATION_MAP.md) - Layer integration
- [Meta-Audit Framework](../audit-architecture/META_AUDIT_FRAMEWORK.md) - AI self-auditing

---

**Status**: Design Complete, Implementation 28% (Target: 100%)
**Next Steps**: Implement Phase 1 (Core Events)
**Owner**: Audit System Team
**Last Updated**: 2025-12-26
