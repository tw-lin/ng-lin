# Event Bus System API Reference

Complete API documentation for the GigHub Global Event Bus System.

## Table of Contents

1. [Core Interfaces](#core-interfaces)
2. [Event Bus Implementations](#event-bus-implementations)
3. [Domain Events](#domain-events)
4. [Event Consumers](#event-consumers)
5. [Services](#services)
6. [Decorators](#decorators)
7. [Models & Types](#models--types)
8. [Utilities](#utilities)
9. [Testing](#testing)

---

## Core Interfaces

### IEventBus

The central event bus contract for all implementations.

**Location**: `src/app/core/event-bus/interfaces/event-bus.interface.ts`

```typescript
interface IEventBus {
  // Publishing
  publish(event: DomainEvent): Promise<void>;
  publishBatch(events: DomainEvent[]): Promise<void>;
  
  // Subscription
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
    options?: SubscribeOptions
  ): Promise<Subscription>;
  
  unsubscribe(subscription: Subscription): Promise<void>;
  
  // Observables
  observe<T extends DomainEvent>(eventType: string): Observable<T>;
  observeAll(): Observable<DomainEvent>;
}
```

**Methods**:

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `publish` | `event: DomainEvent` | `Promise<void>` | Publish single event to bus |
| `publishBatch` | `events: DomainEvent[]` | `Promise<void>` | Publish multiple events atomically |
| `subscribe` | `eventType, handler, options?` | `Promise<Subscription>` | Subscribe to event type with handler |
| `unsubscribe` | `subscription: Subscription` | `Promise<void>` | Cancel event subscription |
| `observe` | `eventType: string` | `Observable<T>` | Get RxJS stream for event type |
| `observeAll` | - | `Observable<DomainEvent>` | Get RxJS stream of all events |

**Usage Example**:

```typescript
@Injectable()
export class TaskService {
  private eventBus = inject(InMemoryEventBus);
  
  async createTask(data: CreateTaskInput): Promise<Task> {
    const task = await this.repository.save(data);
    
    // Publish domain event
    await this.eventBus.publish(
      new TaskCreatedEvent({
        taskId: task.id,
        blueprintId: task.blueprintId,
        title: task.title,
        creator: data.creator
      })
    );
    
    return task;
  }
}
```

---

### IEventStore

Event persistence interface for event sourcing patterns.

**Location**: `src/app/core/event-bus/interfaces/event-store.interface.ts`

```typescript
interface IEventStore {
  // Persistence
  append(event: DomainEvent): Promise<void>;
  appendBatch(events: DomainEvent[]): Promise<void>;
  
  // Retrieval
  getEvents(criteria: EventCriteria): Promise<DomainEvent[]>;
  getEventsByAggregate(aggregateId: string, aggregateType: string): Promise<DomainEvent[]>;
  getEventsSince(timestamp: Date): Promise<DomainEvent[]>;
  
  // Snapshots
  saveSnapshot(snapshot: AggregateSnapshot): Promise<void>;
  getLatestSnapshot(aggregateId: string, aggregateType: string): Promise<AggregateSnapshot | null>;
}
```

**Methods**:

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `append` | `event: DomainEvent` | `Promise<void>` | Persist single event |
| `appendBatch` | `events: DomainEvent[]` | `Promise<void>` | Persist multiple events atomically |
| `getEvents` | `criteria: EventCriteria` | `Promise<DomainEvent[]>` | Query events by criteria |
| `getEventsByAggregate` | `aggregateId, aggregateType` | `Promise<DomainEvent[]>` | Get all events for aggregate |
| `getEventsSince` | `timestamp: Date` | `Promise<DomainEvent[]>` | Get events after timestamp |
| `saveSnapshot` | `snapshot: AggregateSnapshot` | `Promise<void>` | Save aggregate snapshot |
| `getLatestSnapshot` | `aggregateId, aggregateType` | `Promise<AggregateSnapshot?>` | Get latest snapshot |

---

### EventHandler

Type definition for event handler functions.

```typescript
type EventHandler<T extends DomainEvent> = (event: T) => Promise<void> | void;
```

**Usage**:

```typescript
const handler: EventHandler<TaskCreatedEvent> = async (event) => {
  console.log(`Task ${event.payload.taskId} created`);
  await notificationService.send(...);
};
```

---

## Event Bus Implementations

### InMemoryEventBus

In-process event bus using RxJS Subjects (default implementation).

**Location**: `src/app/core/event-bus/implementations/in-memory/in-memory-event-bus.ts`

**Provider Token**: `EVENT_BUS`

**Features**:
- ✅ Zero latency (in-process)
- ✅ Type-safe subscriptions
- ✅ Automatic retry with exponential backoff
- ✅ Dead letter queue for failed events
- ✅ Correlation tracking
- ⚠️ No persistence (events lost on app reload)
- ⚠️ Single instance only (no cross-tab communication)

**Configuration**:

```typescript
// app.config.ts
import { InMemoryEventBus } from '@core/event-bus';
import { EVENT_BUS } from '@core/event-bus/constants';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: EVENT_BUS, useClass: InMemoryEventBus },
    // ...
  ]
};
```

**Methods** (implements `IEventBus`):

```typescript
class InMemoryEventBus implements IEventBus {
  // Core publishing
  async publish(event: DomainEvent): Promise<void>;
  async publishBatch(events: DomainEvent[]): Promise<void>;
  
  // Subscription management
  async subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
    options?: SubscribeOptions
  ): Promise<Subscription>;
  
  async unsubscribe(subscription: Subscription): Promise<void>;
  
  // Observable streams
  observe<T extends DomainEvent>(eventType: string): Observable<T>;
  observeAll(): Observable<DomainEvent>;
  
  // Utility methods
  getSubscriptionCount(eventType?: string): number;
  clearAllSubscriptions(): void;
}
```

**Usage Example**:

```typescript
@Injectable()
export class NotificationService {
  private eventBus = inject(EVENT_BUS);
  
  async initialize(): Promise<void> {
    // Subscribe to task events
    await this.eventBus.subscribe(
      'task.created',
      async (event: TaskCreatedEvent) => {
        await this.sendNotification(event);
      },
      {
        retryPolicy: {
          maxAttempts: 3,
          backoff: 'exponential',
          initialDelay: 1000
        }
      }
    );
  }
}
```

---

### FirebaseEventBus

Firebase Realtime Database implementation for cross-tab/device synchronization.

**Location**: `src/app/core/event-bus/implementations/firebase/firebase-event-bus.ts`

**Features**:
- ✅ Real-time synchronization across tabs/devices
- ✅ Persistent event storage
- ✅ Firebase Security Rules enforcement
- ✅ Offline support with automatic sync
- ⚠️ Network latency (30-100ms typical)
- ⚠️ Firebase usage costs (free tier: 1GB storage, 10GB download/month)

**Configuration**:

```typescript
// app.config.ts
import { FirebaseEventBus } from '@core/event-bus/implementations/firebase';
import { EVENT_BUS } from '@core/event-bus/constants';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: EVENT_BUS, useClass: FirebaseEventBus },
    // Firebase must be initialized first
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideDatabase(() => getDatabase()),
    // ...
  ]
};
```

**Firebase Structure**:

```
/events
  /{eventId}
    eventType: "task.created"
    aggregateId: "task-123"
    aggregateType: "task"
    timestamp: 1703500800000
    payload: {...}
    metadata: {...}
    
/subscriptions
  /{subscriptionId}
    eventType: "task.created"
    subscriberId: "notification-service"
    createdAt: 1703500800000
```

**Security Rules Example**:

```javascript
{
  "rules": {
    "events": {
      "$eventId": {
        // Authenticated users can read all events
        ".read": "auth != null",
        
        // Only system can write events
        ".write": "root.child('system').child(auth.uid).exists()"
      }
    }
  }
}
```

---

## Domain Events

### DomainEvent (Base Class)

Abstract base class for all domain events.

**Location**: `src/app/core/event-bus/models/base-event.ts`

```typescript
abstract class DomainEvent {
  // Identity
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  
  // Timing
  readonly occurredAt: Date;
  readonly version: number;
  
  // Metadata
  readonly metadata: EventMetadata;
  readonly correlationId?: string;
  readonly causationId?: string;
  
  // Payload (defined in subclasses)
  abstract readonly payload: unknown;
  
  constructor(options: DomainEventOptions) {
    this.eventId = options.eventId ?? generateEventId();
    this.aggregateId = options.aggregateId;
    this.aggregateType = options.aggregateType;
    this.occurredAt = options.occurredAt ?? new Date();
    this.version = options.version ?? 1;
    this.metadata = options.metadata ?? {};
    this.correlationId = options.correlationId;
    this.causationId = options.causationId;
  }
}
```

**Properties**:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `eventId` | `string` | ✅ | Unique event identifier (UUID) |
| `eventType` | `string` | ✅ | Event type (e.g., "task.created") |
| `aggregateId` | `string` | ✅ | ID of aggregate this event belongs to |
| `aggregateType` | `string` | ✅ | Type of aggregate (e.g., "task") |
| `occurredAt` | `Date` | ✅ | When event occurred |
| `version` | `number` | ✅ | Event schema version |
| `metadata` | `EventMetadata` | ✅ | Additional context |
| `correlationId` | `string` | ❌ | Links related events across services |
| `causationId` | `string` | ❌ | ID of event that caused this event |
| `payload` | `unknown` | ✅ | Event-specific data (defined in subclass) |

---

### Task Events

**Location**: `src/app/core/event-bus/domain-events/task-events.ts`

#### TaskCreatedEvent

```typescript
class TaskCreatedEvent extends DomainEvent {
  readonly eventType = 'task.created' as const;
  readonly aggregateType = 'task' as const;
  
  readonly payload: {
    taskId: string;
    blueprintId: string;
    title: string;
    description: string;
    status: TaskStatus;
    assigneeId?: string;
    assigneeType?: 'user' | 'team' | 'partner';
    priority: TaskPriority;
    dueDate?: Date;
    tags: string[];
    creator: {
      userId: string;
      userType: 'user' | 'team' | 'partner';
      userName: string;
    };
    createdAt: Date;
  };
  
  constructor(data: TaskCreatedEventData) {
    super({
      aggregateId: data.taskId,
      aggregateType: 'task',
      metadata: {
        source: 'task-service',
        blueprintId: data.blueprintId,
        version: '1.0.0'
      }
    });
    
    this.payload = data;
  }
}
```

#### TaskUpdatedEvent

```typescript
class TaskUpdatedEvent extends DomainEvent {
  readonly eventType = 'task.updated' as const;
  readonly aggregateType = 'task' as const;
  
  readonly payload: {
    taskId: string;
    blueprintId: string;
    changes: Partial<Task>;
    previousState: Partial<Task>;
    updater: {
      userId: string;
      userName: string;
    };
    updatedAt: Date;
  };
}
```

#### TaskCompletedEvent

```typescript
class TaskCompletedEvent extends DomainEvent {
  readonly eventType = 'task.completed' as const;
  readonly aggregateType = 'task' as const;
  
  readonly payload: {
    taskId: string;
    blueprintId: string;
    completedBy: {
      userId: string;
      userName: string;
    };
    completedAt: Date;
    duration?: number; // milliseconds
  };
}
```

#### TaskDeletedEvent

```typescript
class TaskDeletedEvent extends DomainEvent {
  readonly eventType = 'task.deleted' as const;
  readonly aggregateType = 'task' as const;
  
  readonly payload: {
    taskId: string;
    blueprintId: string;
    deletedBy: {
      userId: string;
      userName: string;
    };
    deletedAt: Date;
    reason?: string;
  };
}
```

---

### Blueprint Events

**Location**: `src/app/core/event-bus/domain-events/blueprint-events.ts`

#### BlueprintCreatedEvent
#### BlueprintUpdatedEvent
#### BlueprintArchivedEvent
#### BlueprintDeletedEvent

(Similar structure to Task events)

---

### Authentication Events

**Location**: `src/app/core/event-bus/domain-events/auth-events.ts`

#### UserLoggedInEvent
#### UserLoggedOutEvent
#### UserSessionExpiredEvent
#### PasswordChangedEvent
#### EmailVerifiedEvent

(Similar structure to Task events)

---

### Permission Events

**Location**: `src/app/core/event-bus/domain-events/permission-events.ts`

#### PermissionGrantedEvent
#### PermissionRevokedEvent
#### RoleAssignedEvent
#### RoleRemovedEvent

(Similar structure to Task events)

---

## Event Consumers

### EventConsumer (Base Class)

Abstract base class for event consumers with built-in lifecycle management.

**Location**: `src/app/core/event-bus/services/event-consumer.base.ts`

```typescript
abstract class EventConsumer implements OnInit, OnDestroy {
  protected eventBus = inject(EVENT_BUS);
  protected destroyRef = inject(DestroyRef);
  
  private subscriptions: Subscription[] = [];
  
  async ngOnInit(): Promise<void> {
    await this.onInitialize();
  }
  
  async ngOnDestroy(): Promise<void> {
    await this.onDestroy();
    await this.unsubscribeAll();
  }
  
  // Lifecycle hooks
  protected abstract onInitialize(): Promise<void>;
  protected abstract onDestroy(): Promise<void>;
  
  // Subscription management
  protected async subscribeToEvent<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
    options?: SubscribeOptions
  ): Promise<void> {
    const subscription = await this.eventBus.subscribe(
      eventType,
      handler,
      options
    );
    
    this.subscriptions.push(subscription);
  }
  
  private async unsubscribeAll(): Promise<void> {
    for (const subscription of this.subscriptions) {
      await this.eventBus.unsubscribe(subscription);
    }
    
    this.subscriptions = [];
  }
}
```

**Usage Example**:

```typescript
@Injectable({ providedIn: 'root' })
export class AuditLogConsumer extends EventConsumer {
  private auditService = inject(AuditLogService);
  
  protected async onInitialize(): Promise<void> {
    // Subscribe to all events for audit logging
    await this.subscribeToEvent(
      '*', // Wildcard: all events
      async (event: DomainEvent) => {
        await this.auditService.logEvent(event);
      }
    );
  }
  
  protected async onDestroy(): Promise<void> {
    // Cleanup if needed
  }
}
```

---

## Services

### AuditLogService

Automatically logs all domain events to the audit system.

**Location**: `src/app/core/event-bus/services/audit-log.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class AuditLogService extends EventConsumer {
  private auditCollector = inject(AuditCollectorService);
  private tenantContext = inject(TenantContextService);
  
  protected async onInitialize(): Promise<void> {
    // Subscribe to all domain events
    await this.subscribeToEvent('*', async (event: DomainEvent) => {
      await this.logEvent(event);
    });
  }
  
  private async logEvent(event: DomainEvent): Promise<void> {
    const auditEvent: AuditEvent = {
      eventId: generateUUID(),
      eventType: event.eventType,
      tenantId: this.tenantContext.getCurrentTenantId(),
      blueprintId: event.metadata.blueprintId,
      timestamp: event.occurredAt,
      
      actorType: 'user', // Derive from event metadata
      actorId: event.metadata.userId,
      
      entityType: event.aggregateType,
      entityId: event.aggregateId,
      
      // Auto-classified by ClassificationEngine
      category: EventCategory.DATA_ACCESS,
      level: EventSeverity.MEDIUM,
      
      rawPayload: event.payload,
      metadata: event.metadata
    };
    
    await this.auditCollector.collect(auditEvent);
  }
  
  protected async onDestroy(): Promise<void> {
    // Cleanup
  }
}
```

**Methods**:

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `logEvent` | `event: DomainEvent` | `Promise<void>` | Log event to audit system |

---

### AuthAuditService

Specialized audit service for authentication events.

**Location**: `src/app/core/event-bus/services/auth-audit.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class AuthAuditService extends EventConsumer {
  protected async onInitialize(): Promise<void> {
    // Subscribe to auth-specific events
    await this.subscribeToEvent('auth.*', async (event) => {
      await this.logAuthEvent(event);
    });
  }
  
  private async logAuthEvent(event: DomainEvent): Promise<void> {
    // Enhanced logging for auth events (include IP, user agent, etc.)
  }
  
  protected async onDestroy(): Promise<void> {}
}
```

---

### PermissionAuditService

Specialized audit service for permission changes.

**Location**: `src/app/core/event-bus/services/permission-audit.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class PermissionAuditService extends EventConsumer {
  protected async onInitialize(): Promise<void> {
    await this.subscribeToEvent('permission.*', async (event) => {
      await this.logPermissionEvent(event);
    });
  }
  
  private async logPermissionEvent(event: DomainEvent): Promise<void> {
    // Enhanced logging for permission changes
  }
  
  protected async onDestroy(): Promise<void> {}
}
```

---

### TenantValidationMiddleware

Middleware service that validates tenant context on all events.

**Location**: `src/app/core/event-bus/services/tenant-validation-middleware.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class TenantValidationMiddleware extends EventConsumer {
  private tenantContext = inject(TenantContextService);
  
  protected async onInitialize(): Promise<void> {
    // Validate all events have valid tenant context
    await this.subscribeToEvent('*', async (event) => {
      await this.validateTenantContext(event);
    });
  }
  
  private async validateTenantContext(event: DomainEvent): Promise<void> {
    const tenantId = event.metadata.tenantId || event.metadata.blueprintId;
    
    if (!tenantId) {
      throw new Error(`Event ${event.eventId} missing tenant context`);
    }
    
    const isValid = await this.tenantContext.validateTenant(tenantId);
    
    if (!isValid) {
      throw new Error(`Event ${event.eventId} has invalid tenant ${tenantId}`);
    }
  }
  
  protected async onDestroy(): Promise<void> {}
}
```

---

### TenantContextService

Manages current tenant context across the application.

**Location**: `src/app/core/event-bus/services/tenant-context.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class TenantContextService {
  // Signals for reactive tenant state
  private currentTenantId = signal<string | null>(null);
  private currentBlueprintId = signal<string | null>(null);
  
  // Public readonly signals
  readonly tenantId$ = this.currentTenantId.asReadonly();
  readonly blueprintId$ = this.currentBlueprintId.asReadonly();
  
  // Computed signals
  readonly hasTenantContext = computed(() => this.currentTenantId() !== null);
  readonly hasBlueprintContext = computed(() => this.currentBlueprintId() !== null);
  
  // Methods
  setTenantContext(tenantId: string): void {
    this.currentTenantId.set(tenantId);
  }
  
  setBlueprintContext(blueprintId: string): void {
    this.currentBlueprintId.set(blueprintId);
  }
  
  getCurrentTenantId(): string | null {
    return this.currentTenantId();
  }
  
  getCurrentBlueprintId(): string | null {
    return this.currentBlueprintId();
  }
  
  async validateTenant(tenantId: string): Promise<boolean> {
    // Validate tenant exists and user has access
    return true; // Implementation
  }
  
  clearContext(): void {
    this.currentTenantId.set(null);
    this.currentBlueprintId.set(null);
  }
}
```

**Methods**:

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `setTenantContext` | `tenantId: string` | `void` | Set current tenant ID |
| `setBlueprintContext` | `blueprintId: string` | `void` | Set current blueprint ID |
| `getCurrentTenantId` | - | `string \| null` | Get current tenant ID |
| `getCurrentBlueprintId` | - | `string \| null` | Get current blueprint ID |
| `validateTenant` | `tenantId: string` | `Promise<boolean>` | Check if tenant is valid |
| `clearContext` | - | `void` | Clear all context |

**Signals**:

| Signal | Type | Description |
|--------|------|-------------|
| `tenantId$` | `Signal<string \| null>` | Current tenant ID (readonly) |
| `blueprintId$` | `Signal<string \| null>` | Current blueprint ID (readonly) |
| `hasTenantContext` | `Signal<boolean>` | True if tenant context set |
| `hasBlueprintContext` | `Signal<boolean>` | True if blueprint context set |

---

## Decorators

### @Subscribe

Decorator for declarative event subscription on class methods.

**Location**: `src/app/core/event-bus/decorators/subscribe.decorator.ts`

```typescript
function Subscribe(
  eventType: string,
  options?: SubscribeOptions
): MethodDecorator;
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventType` | `string` | ✅ | Event type pattern (supports wildcards) |
| `options` | `SubscribeOptions` | ❌ | Subscription configuration |

**SubscribeOptions**:

```typescript
interface SubscribeOptions {
  retryPolicy?: {
    maxAttempts: number;        // Max retry attempts (default: 3)
    backoff: 'linear' | 'exponential'; // Backoff strategy (default: exponential)
    initialDelay: number;       // Initial delay in ms (default: 1000)
    maxDelay?: number;          // Max delay in ms (default: 30000)
  };
  deadLetterQueue?: boolean;    // Send failed events to DLQ (default: true)
  priority?: 'low' | 'normal' | 'high'; // Processing priority (default: normal)
  filter?: (event: DomainEvent) => boolean; // Additional filtering
}
```

**Usage Example**:

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationConsumer extends EventConsumer {
  private notificationService = inject(NotificationService);
  
  @Subscribe('task.created', {
    retryPolicy: {
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 1000
    },
    priority: 'high'
  })
  async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
    await this.notificationService.send({
      type: 'task_created',
      recipients: await this.getWatchers(event.payload.blueprintId),
      data: event.payload
    });
  }
  
  @Subscribe('task.*', {
    filter: (event) => event.payload.priority === 'high'
  })
  async handleHighPriorityTasks(event: DomainEvent): Promise<void> {
    // Handle all high-priority task events
  }
  
  protected async onInitialize(): Promise<void> {
    // Decorator-based subscriptions auto-register
  }
  
  protected async onDestroy(): Promise<void> {}
}
```

**Wildcard Patterns**:

| Pattern | Matches | Examples |
|---------|---------|----------|
| `task.*` | All task events | task.created, task.updated, task.deleted |
| `*.created` | All created events | task.created, blueprint.created, user.created |
| `*` | All events | Everything |
| `task.{created,updated}` | Specific events | task.created, task.updated (not task.deleted) |

---

### @EventHandler

Alternative decorator syntax for event handlers.

**Location**: `src/app/core/event-bus/decorators/event-handler.decorator.ts`

```typescript
function EventHandler(options: EventHandlerOptions): MethodDecorator;
```

**Usage**:

```typescript
@Injectable()
export class TaskConsumer {
  @EventHandler({
    eventType: 'task.created',
    retryPolicy: { maxAttempts: 3 }
  })
  async onTaskCreated(event: TaskCreatedEvent): Promise<void> {
    // Handle event
  }
}
```

---

### @Retry

Decorator for automatic retry logic on methods.

**Location**: `src/app/core/event-bus/decorators/retry.decorator.ts`

```typescript
function Retry(options: RetryOptions): MethodDecorator;

interface RetryOptions {
  maxAttempts: number;
  backoff: 'linear' | 'exponential';
  initialDelay: number;
  maxDelay?: number;
}
```

**Usage**:

```typescript
@Injectable()
export class ExternalApiService {
  @Retry({
    maxAttempts: 5,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 30000
  })
  async callExternalApi(data: any): Promise<Response> {
    return await fetch('https://api.example.com/data', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
```

---

## Models & Types

### DomainEvent

See [Domain Events](#domain-events) section above.

---

### EventMetadata

Additional context for events.

```typescript
interface EventMetadata {
  // Source identification
  source?: string;              // Service that produced the event
  version?: string;             // Event schema version
  
  // Tenant/context
  tenantId?: string;            // Tenant identifier
  blueprintId?: string;         // Blueprint context
  organizationId?: string;      // Organization context
  
  // Actor
  userId?: string;              // User who triggered event
  userName?: string;            // User display name
  userType?: 'user' | 'team' | 'partner' | 'ai' | 'system';
  
  // Request context
  requestId?: string;           // HTTP request ID
  ipAddress?: string;           // Client IP address
  userAgent?: string;           // Client user agent
  
  // Tracing
  traceId?: string;             // Distributed trace ID
  spanId?: string;              // Trace span ID
  
  // Custom data
  [key: string]: any;           // Additional metadata
}
```

---

### Subscription

Represents an active event subscription.

```typescript
interface Subscription {
  id: string;                   // Unique subscription ID
  eventType: string;            // Subscribed event type
  subscriberId: string;         // Identifier of subscriber
  createdAt: Date;              // When subscription was created
  options?: SubscribeOptions;   // Subscription options
  
  // Status
  isActive: boolean;            // Is subscription active
  lastTriggered?: Date;         // Last time handler was called
  triggerCount: number;         // Total times handler called
  errorCount: number;           // Total errors encountered
}
```

---

### EventCriteria

Query criteria for event retrieval.

```typescript
interface EventCriteria {
  // Type filtering
  eventType?: string;           // Exact match or wildcard pattern
  eventTypes?: string[];        // Multiple event types
  
  // Aggregate filtering
  aggregateId?: string;         // Specific aggregate
  aggregateType?: string;       // Type of aggregate
  
  // Time filtering
  from?: Date;                  // Events after this time
  to?: Date;                    // Events before this time
  
  // Tenant filtering
  tenantId?: string;            // Specific tenant
  blueprintId?: string;         // Specific blueprint
  
  // Pagination
  limit?: number;               // Max results (default: 100)
  offset?: number;              // Skip results (default: 0)
  
  // Sorting
  sortBy?: 'timestamp' | 'eventType'; // Sort field
  sortOrder?: 'asc' | 'desc';   // Sort direction
}
```

**Usage**:

```typescript
const criteria: EventCriteria = {
  eventType: 'task.*',
  blueprintId: 'blueprint-123',
  from: new Date('2025-01-01'),
  limit: 50,
  sortBy: 'timestamp',
  sortOrder: 'desc'
};

const events = await eventStore.getEvents(criteria);
```

---

## Utilities

### generateEventId

Generate unique event identifiers (UUID v4).

**Location**: `src/app/core/event-bus/utils/event-id-generator.util.ts`

```typescript
function generateEventId(): string;
```

**Usage**:

```typescript
const eventId = generateEventId();
// Returns: "550e8400-e29b-41d4-a716-446655440000"
```

---

### CorrelationTracker

Track related events across services using correlation IDs.

**Location**: `src/app/core/event-bus/utils/correlation-tracker.util.ts`

```typescript
class CorrelationTracker {
  // Set current correlation ID
  static setCorrelationId(id: string): void;
  
  // Get current correlation ID
  static getCorrelationId(): string | null;
  
  // Generate new correlation ID
  static generateCorrelationId(): string;
  
  // Clear correlation ID
  static clearCorrelationId(): void;
}
```

**Usage**:

```typescript
// Service A
async createTask(data: CreateTaskInput): Promise<Task> {
  // Generate correlation ID for request
  const correlationId = CorrelationTracker.generateCorrelationId();
  CorrelationTracker.setCorrelationId(correlationId);
  
  const task = await this.repository.save(data);
  
  // Publish event with correlation ID
  await this.eventBus.publish(
    new TaskCreatedEvent({
      ...data,
      correlationId
    })
  );
  
  return task;
}

// Service B (event handler)
@Subscribe('task.created')
async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
  // Retrieve correlation ID from event
  const correlationId = event.correlationId;
  
  // Use same correlation ID for subsequent events
  CorrelationTracker.setCorrelationId(correlationId);
  
  // Publish related event
  await this.eventBus.publish(
    new NotificationSentEvent({
      correlationId
    })
  );
}
```

---

### EventMatcher

Pattern matching for event types.

**Location**: `src/app/core/event-bus/utils/event-matcher.util.ts`

```typescript
class EventMatcher {
  // Check if event type matches pattern
  static matches(eventType: string, pattern: string): boolean;
  
  // Get all matching patterns for event type
  static getMatchingPatterns(eventType: string, patterns: string[]): string[];
}
```

**Usage**:

```typescript
EventMatcher.matches('task.created', 'task.*');     // true
EventMatcher.matches('task.created', '*.created');  // true
EventMatcher.matches('task.created', 'blueprint.*'); // false
EventMatcher.matches('task.created', '*');          // true

const patterns = ['task.*', 'blueprint.*', '*.created'];
EventMatcher.getMatchingPatterns('task.created', patterns);
// Returns: ['task.*', '*.created']
```

---

## Testing

### MockEventBus

Mock event bus for unit testing.

**Location**: `src/app/core/event-bus/testing/mock-event-bus.ts`

```typescript
class MockEventBus implements IEventBus {
  // Recorded events
  publishedEvents: DomainEvent[] = [];
  subscriptions: Map<string, EventHandler<any>[]> = new Map();
  
  // IEventBus implementation
  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);
    await this.triggerHandlers(event);
  }
  
  async publishBatch(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
  
  async subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>,
    options?: SubscribeOptions
  ): Promise<Subscription> {
    const handlers = this.subscriptions.get(eventType) || [];
    handlers.push(handler);
    this.subscriptions.set(eventType, handlers);
    
    return {
      id: generateEventId(),
      eventType,
      subscriberId: 'mock',
      createdAt: new Date(),
      isActive: true,
      triggerCount: 0,
      errorCount: 0
    };
  }
  
  // Test utilities
  reset(): void {
    this.publishedEvents = [];
    this.subscriptions.clear();
  }
  
  getPublishedEvents(eventType?: string): DomainEvent[] {
    if (!eventType) return this.publishedEvents;
    return this.publishedEvents.filter(e => e.eventType === eventType);
  }
  
  getPublishedEventCount(eventType?: string): number {
    return this.getPublishedEvents(eventType).length;
  }
  
  async triggerEvent(event: DomainEvent): Promise<void> {
    await this.publish(event);
  }
  
  private async triggerHandlers(event: DomainEvent): Promise<void> {
    const handlers = this.subscriptions.get(event.eventType) || [];
    for (const handler of handlers) {
      await handler(event);
    }
  }
}
```

**Usage in Tests**:

```typescript
describe('TaskService', () => {
  let service: TaskService;
  let eventBus: MockEventBus;
  
  beforeEach(() => {
    eventBus = new MockEventBus();
    
    TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: EVENT_BUS, useValue: eventBus }
      ]
    });
    
    service = TestBed.inject(TaskService);
  });
  
  it('should publish TaskCreatedEvent when creating task', async () => {
    const task = await service.createTask({
      title: 'Test Task',
      blueprintId: 'blueprint-123'
    });
    
    // Assert event was published
    expect(eventBus.getPublishedEventCount('task.created')).toBe(1);
    
    const event = eventBus.getPublishedEvents('task.created')[0] as TaskCreatedEvent;
    expect(event.payload.taskId).toBe(task.id);
    expect(event.payload.title).toBe('Test Task');
  });
});
```

---

### TestEvent

Helper class for creating test events.

**Location**: `src/app/core/event-bus/testing/test-event.ts`

```typescript
class TestEvent extends DomainEvent {
  readonly eventType = 'test.event' as const;
  readonly aggregateType = 'test' as const;
  
  readonly payload: {
    testData: string;
  };
  
  constructor(testData: string) {
    super({
      aggregateId: 'test-123',
      aggregateType: 'test'
    });
    
    this.payload = { testData };
  }
}
```

---

### EventBusTestUtils

Testing utilities for event bus testing.

**Location**: `src/app/core/event-bus/testing/event-bus-test.utils.ts`

```typescript
class EventBusTestUtils {
  // Wait for event to be published
  static async waitForEvent(
    eventBus: MockEventBus,
    eventType: string,
    timeout: number = 5000
  ): Promise<DomainEvent>;
  
  // Wait for multiple events
  static async waitForEvents(
    eventBus: MockEventBus,
    eventType: string,
    count: number,
    timeout: number = 5000
  ): Promise<DomainEvent[]>;
  
  // Assert event was published
  static assertEventPublished(
    eventBus: MockEventBus,
    eventType: string,
    predicate?: (event: DomainEvent) => boolean
  ): void;
  
  // Assert event count
  static assertEventCount(
    eventBus: MockEventBus,
    eventType: string,
    expectedCount: number
  ): void;
}
```

**Usage**:

```typescript
it('should publish event within timeout', async () => {
  const eventPromise = EventBusTestUtils.waitForEvent(
    eventBus,
    'task.created',
    2000 // 2 second timeout
  );
  
  await service.createTask({ title: 'Test' });
  
  const event = await eventPromise;
  expect(event.eventType).toBe('task.created');
});

it('should publish correct number of events', async () => {
  await service.createTask({ title: 'Task 1' });
  await service.createTask({ title: 'Task 2' });
  
  EventBusTestUtils.assertEventCount(eventBus, 'task.created', 2);
});
```

---

## Advanced Patterns

### Event Versioning

Handle event schema evolution over time.

**Pattern**: Version events using `version` field and implement upcasters.

```typescript
// Version 1
class TaskCreatedEventV1 extends DomainEvent {
  readonly version = 1;
  readonly payload: {
    taskId: string;
    title: string;
  };
}

// Version 2 (added description field)
class TaskCreatedEventV2 extends DomainEvent {
  readonly version = 2;
  readonly payload: {
    taskId: string;
    title: string;
    description: string; // New field
  };
}

// Upcaster: V1 → V2
class TaskCreatedEventUpcaster {
  upcast(eventV1: TaskCreatedEventV1): TaskCreatedEventV2 {
    return new TaskCreatedEventV2({
      ...eventV1.payload,
      description: '' // Default value for new field
    });
  }
}
```

---

### Saga Pattern

Coordinate long-running transactions across multiple services.

```typescript
@Injectable({ providedIn: 'root' })
export class CreateProjectSaga extends EventConsumer {
  protected async onInitialize(): Promise<void> {
    // Step 1: Blueprint created
    await this.subscribeToEvent('blueprint.created', async (event) => {
      await this.createDefaultTasks(event);
    });
    
    // Step 2: Tasks created
    await this.subscribeToEvent('task.batch.created', async (event) => {
      await this.assignTeamMembers(event);
    });
    
    // Step 3: Team assigned
    await this.subscribeToEvent('team.assigned', async (event) => {
      await this.sendWelcomeNotifications(event);
    });
    
    // Compensating transactions for failures
    await this.subscribeToEvent('blueprint.creation.failed', async (event) => {
      await this.rollbackProject(event);
    });
  }
  
  private async createDefaultTasks(event: BlueprintCreatedEvent): Promise<void> {
    // Create default tasks for new blueprint
  }
  
  private async assignTeamMembers(event: TaskBatchCreatedEvent): Promise<void> {
    // Assign team members to tasks
  }
  
  private async sendWelcomeNotifications(event: TeamAssignedEvent): Promise<void> {
    // Send welcome notifications
  }
  
  private async rollbackProject(event: BlueprintCreationFailedEvent): Promise<void> {
    // Compensating transaction: undo all changes
  }
  
  protected async onDestroy(): Promise<void> {}
}
```

---

### CQRS with Event Sourcing

Separate read and write models using event sourcing.

```typescript
// Write side: Command Handler
@Injectable()
export class TaskCommandHandler {
  private eventBus = inject(EVENT_BUS);
  private eventStore = inject(EVENT_STORE);
  
  async createTask(command: CreateTaskCommand): Promise<void> {
    // Create event
    const event = new TaskCreatedEvent({
      taskId: generateId(),
      title: command.title,
      ...command
    });
    
    // Persist to event store
    await this.eventStore.append(event);
    
    // Publish to event bus
    await this.eventBus.publish(event);
  }
}

// Read side: Query Handler (builds read model from events)
@Injectable()
export class TaskQueryHandler extends EventConsumer {
  private taskReadModel = signal<Map<string, Task>>(new Map());
  
  protected async onInitialize(): Promise<void> {
    // Rebuild read model from event store
    await this.rebuildReadModel();
    
    // Subscribe to events to keep read model updated
    await this.subscribeToEvent('task.*', async (event) => {
      await this.updateReadModel(event);
    });
  }
  
  private async rebuildReadModel(): Promise<void> {
    const events = await this.eventStore.getEvents({
      aggregateType: 'task'
    });
    
    for (const event of events) {
      await this.applyEvent(event);
    }
  }
  
  private async updateReadModel(event: DomainEvent): Promise<void> {
    await this.applyEvent(event);
  }
  
  private async applyEvent(event: DomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'task.created':
        const taskCreated = event as TaskCreatedEvent;
        this.taskReadModel.update(model => {
          model.set(taskCreated.payload.taskId, {
            id: taskCreated.payload.taskId,
            title: taskCreated.payload.title,
            // ...
          });
          return new Map(model);
        });
        break;
        
      case 'task.updated':
        // Update existing task in read model
        break;
        
      case 'task.deleted':
        // Remove task from read model
        break;
    }
  }
  
  // Query methods
  getTaskById(id: string): Task | undefined {
    return this.taskReadModel().get(id);
  }
  
  getAllTasks(): Task[] {
    return Array.from(this.taskReadModel().values());
  }
  
  protected async onDestroy(): Promise<void> {}
}
```

---

## Performance Considerations

### Batching

Publish multiple events atomically to reduce overhead.

```typescript
const events: DomainEvent[] = [
  new TaskCreatedEvent(...),
  new TaskCreatedEvent(...),
  new TaskCreatedEvent(...)
];

// Better: Single batch publish
await eventBus.publishBatch(events);

// Avoid: Multiple individual publishes
for (const event of events) {
  await eventBus.publish(event); // ❌ Inefficient
}
```

---

### Throttling/Debouncing

Limit event publishing frequency for high-frequency events.

```typescript
@Injectable()
export class MouseTrackingService {
  private eventBus = inject(EVENT_BUS);
  private mouseMoveSubject = new Subject<MouseEvent>();
  
  constructor() {
    // Throttle: Emit at most once per 100ms
    this.mouseMoveSubject
      .pipe(throttleTime(100))
      .subscribe(async (event) => {
        await this.eventBus.publish(
          new MouseMovedEvent({ x: event.clientX, y: event.clientY })
        );
      });
  }
  
  onMouseMove(event: MouseEvent): void {
    this.mouseMoveSubject.next(event);
  }
}
```

---

## Error Handling

### Retry Logic

Automatic retry with exponential backoff for transient failures.

```typescript
await eventBus.subscribe(
  'task.created',
  async (event) => {
    await externalApi.call(event); // May fail
  },
  {
    retryPolicy: {
      maxAttempts: 3,
      backoff: 'exponential',
      initialDelay: 1000,  // 1s
      maxDelay: 30000      // 30s max
    }
  }
);

// Retry schedule:
// Attempt 1: Immediate
// Attempt 2: 2s delay (2^1 * 1s)
// Attempt 3: 4s delay (2^2 * 1s)
// Attempt 4: 8s delay (2^3 * 1s), capped at maxDelay
```

---

### Dead Letter Queue

Failed events are sent to DLQ for manual inspection.

```typescript
// Events that fail after all retries are sent to DLQ
await eventBus.subscribe(
  'task.created',
  async (event) => {
    throw new Error('Permanent failure');
  },
  {
    retryPolicy: { maxAttempts: 3 },
    deadLetterQueue: true // Send to DLQ after max attempts
  }
);

// Query DLQ for failed events
const failedEvents = await dlqService.getFailedEvents({
  eventType: 'task.created',
  from: new Date('2025-01-01')
});

// Retry DLQ event manually
await dlqService.retryEvent(failedEvents[0].id);
```

---

## Security

### Event Authorization

Validate that event publishers have permission to publish events.

```typescript
@Injectable()
export class AuthorizedEventBus implements IEventBus {
  private innerBus = inject(InMemoryEventBus);
  private permissionService = inject(PermissionService);
  
  async publish(event: DomainEvent): Promise<void> {
    // Check if current user can publish this event type
    const canPublish = await this.permissionService.canPublishEvent(
      event.eventType,
      event.metadata.userId
    );
    
    if (!canPublish) {
      throw new UnauthorizedError(
        `User ${event.metadata.userId} cannot publish ${event.eventType}`
      );
    }
    
    await this.innerBus.publish(event);
  }
  
  // ... other IEventBus methods
}
```

---

### Event Encryption

Encrypt sensitive event payloads.

```typescript
@Injectable()
export class EncryptedEventBus implements IEventBus {
  private innerBus = inject(InMemoryEventBus);
  private encryptionService = inject(EncryptionService);
  
  async publish(event: DomainEvent): Promise<void> {
    // Encrypt sensitive fields
    const encryptedEvent = await this.encryptEvent(event);
    await this.innerBus.publish(encryptedEvent);
  }
  
  private async encryptEvent(event: DomainEvent): Promise<DomainEvent> {
    if (this.isSensitiveEvent(event)) {
      const encryptedPayload = await this.encryptionService.encrypt(
        JSON.stringify(event.payload)
      );
      
      return {
        ...event,
        payload: { encrypted: encryptedPayload }
      };
    }
    
    return event;
  }
  
  private isSensitiveEvent(event: DomainEvent): boolean {
    return ['auth.*', 'payment.*', 'user.data.*'].some(pattern =>
      EventMatcher.matches(event.eventType, pattern)
    );
  }
}
```

---

## Migration Guide

### From Manual Event Handling to Event Bus

**Before** (Manual event handling):

```typescript
@Injectable()
export class TaskService {
  private notificationService = inject(NotificationService);
  private auditService = inject(AuditService);
  
  async createTask(data: CreateTaskInput): Promise<Task> {
    const task = await this.repository.save(data);
    
    // Manual notifications
    await this.notificationService.notifyWatchers(task);
    
    // Manual audit logging
    await this.auditService.logTaskCreated(task);
    
    return task;
  }
}
```

**After** (Event Bus):

```typescript
@Injectable()
export class TaskService {
  private eventBus = inject(EVENT_BUS);
  
  async createTask(data: CreateTaskInput): Promise<Task> {
    const task = await this.repository.save(data);
    
    // Publish event once
    await this.eventBus.publish(new TaskCreatedEvent({
      taskId: task.id,
      ...data
    }));
    
    return task;
  }
}

// Separate consumers handle cross-cutting concerns
@Injectable()
export class NotificationConsumer extends EventConsumer {
  @Subscribe('task.created')
  async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
    await this.notificationService.notifyWatchers(event.payload);
  }
  
  protected async onInitialize(): Promise<void> {}
  protected async onDestroy(): Promise<void> {}
}

@Injectable()
export class AuditConsumer extends EventConsumer {
  @Subscribe('task.*')
  async handleTaskEvents(event: DomainEvent): Promise<void> {
    await this.auditService.logEvent(event);
  }
  
  protected async onInitialize(): Promise<void> {}
  protected async onDestroy(): Promise<void> {}
}
```

---

## References

- **Event-Driven Architecture**: https://martinfowler.com/articles/201701-event-driven.html
- **Domain Events**: https://martinfowler.com/eaaDev/DomainEvent.html
- **CQRS**: https://martinfowler.com/bliki/CQRS.html
- **Event Sourcing**: https://martinfowler.com/eaaDev/EventSourcing.html
- **Saga Pattern**: https://microservices.io/patterns/data/saga.html

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-26 | Initial release |

---

**Maintained by**: GigHub Development Team  
**Last Updated**: 2025-12-26  
**Status**: Production Ready ✅
