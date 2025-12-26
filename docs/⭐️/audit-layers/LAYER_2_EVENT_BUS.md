# Layer 2: Event Bus (Distribution Center)

> **Purpose**: Distribute audit events from sources (Layer 1) to consumers (Layer 3+) with guaranteed delivery, topic-based routing, and dead letter handling.

## Overview

Layer 2 is the **distribution layer** that ensures all audit events reach their intended consumers reliably. It extends the existing `BlueprintEventBus` with audit-specific topics, priorities, and delivery guarantees.

## Architecture

### Current Event Bus (BlueprintEventBus)
**Location**: `src/app/core/services/blueprint-event-bus.service.ts`

```typescript
// Current implementation (to be extended)
export interface BlueprintEvent {
  type: string;
  blueprintId: string;
  timestamp: Date;
  actor: string;
  data?: any;
}

@Injectable({ providedIn: 'root' })
export class BlueprintEventBus {
  private eventSubject = new Subject<BlueprintEvent>();
  
  publish(event: BlueprintEvent): void {
    this.eventSubject.next(event);
  }
  
  subscribe(eventType: string, handler: (event: BlueprintEvent) => void): Subscription {
    return this.eventSubject
      .pipe(filter(e => e.type === eventType))
      .subscribe(handler);
  }
}
```

### Enhanced Audit Event Bus

```typescript
// src/app/core/audit/audit-event-bus.service.ts

export interface AuditEvent {
  type: string;
  timestamp: string;
  actor: string;
  actorType: 'user' | 'team' | 'partner' | 'system' | 'ai';
  blueprintId?: string;
  data: any;
  metadata?: any;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  ttl?: number; // Time-to-live in seconds
}

export interface AuditEventEnvelope {
  id: string; // Unique event ID
  event: AuditEvent;
  timestamp: Date;
  attempts: number; // Delivery attempt count
  maxAttempts: number;
  nextRetry?: Date;
}

@Injectable({ providedIn: 'root' })
export class AuditEventBus {
  private eventSubject = new Subject<AuditEventEnvelope>();
  private deadLetterSubject = new Subject<AuditEventEnvelope>();
  
  // Topic-based routing
  private topics = new Map<string, Subject<AuditEventEnvelope>>();
  
  // In-flight tracking for delivery guarantees
  private inFlight = new Map<string, AuditEventEnvelope>();
  
  // Metrics
  private metrics = {
    published: 0,
    delivered: 0,
    failed: 0,
    deadLettered: 0
  };

  constructor() {
    this.initializeTopics();
    this.startDeadLetterMonitor();
  }

  // Publish event with delivery guarantee
  async publish(event: AuditEvent): Promise<void> {
    const envelope: AuditEventEnvelope = {
      id: this.generateEventId(),
      event,
      timestamp: new Date(),
      attempts: 0,
      maxAttempts: event.priority === 'P0' ? 5 : 3
    };

    // Track in-flight
    this.inFlight.set(envelope.id, envelope);

    // Publish to topic
    const topic = this.getTopicForEvent(event);
    this.topics.get(topic)?.next(envelope);
    
    // Publish to main stream
    this.eventSubject.next(envelope);
    
    this.metrics.published++;

    // Auto-acknowledge after TTL
    if (event.ttl) {
      setTimeout(() => this.acknowledge(envelope.id), event.ttl * 1000);
    }
  }

  // Topic-based subscription
  subscribe(
    topic: string,
    handler: (envelope: AuditEventEnvelope) => Promise<void>
  ): Subscription {
    const topicSubject = this.topics.get(topic);
    if (!topicSubject) {
      throw new Error(`Unknown topic: ${topic}`);
    }

    return topicSubject.subscribe(async (envelope) => {
      try {
        await handler(envelope);
        this.acknowledge(envelope.id);
      } catch (error) {
        this.handleDeliveryFailure(envelope, error);
      }
    });
  }

  // Acknowledge successful delivery
  acknowledge(eventId: string): void {
    this.inFlight.delete(eventId);
    this.metrics.delivered++;
  }

  // Handle delivery failure with retry logic
  private handleDeliveryFailure(envelope: AuditEventEnvelope, error: any): void {
    envelope.attempts++;

    if (envelope.attempts >= envelope.maxAttempts) {
      // Move to dead letter queue
      this.deadLetterSubject.next(envelope);
      this.inFlight.delete(envelope.id);
      this.metrics.deadLettered++;
      
      console.error(`Event ${envelope.id} moved to dead letter queue after ${envelope.attempts} attempts`, error);
    } else {
      // Schedule retry with exponential backoff
      const backoffMs = Math.pow(2, envelope.attempts) * 1000; // 2s, 4s, 8s, 16s, 32s
      envelope.nextRetry = new Date(Date.now() + backoffMs);
      
      setTimeout(() => {
        const topic = this.getTopicForEvent(envelope.event);
        this.topics.get(topic)?.next(envelope);
      }, backoffMs);

      this.metrics.failed++;
      console.warn(`Event ${envelope.id} retry scheduled (attempt ${envelope.attempts}/${envelope.maxAttempts})`, error);
    }
  }

  // Topic initialization
  private initializeTopics(): void {
    const topics = [
      'audit.user',        // User action events
      'audit.ai',          // AI decision events
      'audit.data',        // Data flow events
      'audit.security',    // Security events
      'audit.system',      // System events
      'audit.blueprint',   // Blueprint lifecycle
      'audit.task',        // Task lifecycle
      'audit.org',         // Organization events
      'audit.integration', // Integration events
      'audit.performance', // Performance metrics
      'audit.compliance'   // Compliance checks
    ];

    topics.forEach(topic => {
      this.topics.set(topic, new Subject<AuditEventEnvelope>());
    });
  }

  // Get topic for event type
  private getTopicForEvent(event: AuditEvent): string {
    const parts = event.type.split('.');
    if (parts.length >= 2) {
      const category = parts[0]; // 'user', 'ai', 'data', etc.
      return `audit.${category}`;
    }
    return 'audit.system'; // Default topic
  }

  // Dead letter queue monitoring
  private startDeadLetterMonitor(): void {
    this.deadLetterSubject.subscribe(envelope => {
      // Log to Firestore for manual review
      this.logDeadLetter(envelope);
    });
  }

  private async logDeadLetter(envelope: AuditEventEnvelope): Promise<void> {
    // TODO: Implement Firestore logging
    console.error('Dead letter event:', envelope);
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Metrics accessor
  getMetrics() {
    return { ...this.metrics };
  }
}
```

## Topic Routing

### Topic Hierarchy

```
audit.*                     # Root topic (all events)
├── audit.user.*           # User action events
│   ├── audit.user.login
│   ├── audit.user.logout
│   └── audit.user.action.*
├── audit.ai.*             # AI decision events
│   ├── audit.ai.decision.*
│   ├── audit.ai.compliance.*
│   └── audit.ai.dataflow.*
├── audit.data.*           # Data flow events
│   ├── audit.data.query
│   ├── audit.data.mutation
│   └── audit.data.migration
├── audit.security.*       # Security events
│   ├── audit.security.permission.*
│   ├── audit.security.auth.*
│   └── audit.security.violation
├── audit.system.*         # System events
│   ├── audit.system.config.*
│   ├── audit.system.health
│   └── audit.system.performance
├── audit.blueprint.*      # Blueprint lifecycle
├── audit.task.*           # Task lifecycle
├── audit.org.*            # Organization events
├── audit.integration.*    # Integration events
├── audit.performance.*    # Performance metrics
└── audit.compliance.*     # Compliance checks
```

### Topic Subscription Examples

```typescript
// Subscribe to all user actions
auditEventBus.subscribe('audit.user', async (envelope) => {
  await userActionCollector.collect(envelope.event);
});

// Subscribe to security violations only
auditEventBus.subscribe('audit.security', async (envelope) => {
  if (envelope.event.type.endsWith('.violation')) {
    await securityAlertService.notify(envelope.event);
  }
});

// Subscribe to all AI decisions
auditEventBus.subscribe('audit.ai', async (envelope) => {
  await aiDecisionCollector.collect(envelope.event);
});
```

## Delivery Guarantees

### At-Least-Once Delivery

```typescript
// Publisher side
await auditEventBus.publish({
  type: 'user.action.task.created',
  timestamp: new Date().toISOString(),
  actor: 'user-123',
  actorType: 'user',
  blueprintId: 'bp-456',
  data: { taskId: 'task-789' },
  priority: 'P1'
});

// Consumer side
auditEventBus.subscribe('audit.user', async (envelope) => {
  try {
    // Process event
    await processEvent(envelope.event);
    
    // Acknowledge successful processing
    // (automatically done by subscribe handler)
  } catch (error) {
    // Event will be retried automatically
    throw error;
  }
});
```

### Retry Logic with Exponential Backoff

```typescript
// Retry schedule for failed events
Attempt 1: Immediate
Attempt 2: +2 seconds
Attempt 3: +4 seconds
Attempt 4: +8 seconds
Attempt 5: +16 seconds
Max: 5 attempts for P0, 3 attempts for P1/P2/P3
```

### Dead Letter Queue (DLQ)

```typescript
// Monitor dead letter queue
auditEventBus.subscribeToDeadLetters(async (envelope) => {
  // Log to Firestore for manual review
  await deadLetterRepository.create({
    eventId: envelope.id,
    event: envelope.event,
    attempts: envelope.attempts,
    lastError: envelope.metadata?.lastError,
    timestamp: new Date()
  });

  // Alert operations team
  await alertService.send({
    severity: 'high',
    message: `Audit event ${envelope.id} failed after ${envelope.attempts} attempts`,
    details: envelope
  });
});
```

## Priority Handling

### Priority Levels

| Priority | Max Attempts | Retry Backoff | TTL | Use Case |
|----------|--------------|---------------|-----|----------|
| P0 | 5 | Exponential (2^n) | No TTL | Security events, permission denials |
| P1 | 3 | Exponential (2^n) | 1 hour | User actions, AI decisions |
| P2 | 3 | Exponential (2^n) | 15 minutes | Data queries, system events |
| P3 | 2 | Linear (5s) | 5 minutes | Debug events, detailed traces |

### Priority-Based Routing

```typescript
export class AuditEventBus {
  publish(event: AuditEvent): Promise<void> {
    const envelope = this.createEnvelope(event);

    // P0 events: Immediate processing with aggressive retry
    if (event.priority === 'P0') {
      envelope.maxAttempts = 5;
      envelope.ttl = undefined; // No expiry
      this.highPriorityQueue.enqueue(envelope);
    }
    // P1 events: Standard processing
    else if (event.priority === 'P1') {
      envelope.maxAttempts = 3;
      envelope.ttl = 3600; // 1 hour
      this.standardQueue.enqueue(envelope);
    }
    // P2/P3 events: Best-effort processing
    else {
      envelope.maxAttempts = event.priority === 'P2' ? 3 : 2;
      envelope.ttl = event.priority === 'P2' ? 900 : 300; // 15 min / 5 min
      this.lowPriorityQueue.enqueue(envelope);
    }

    return this.processQueue(event.priority);
  }
}
```

## Event Batching

### Batch Configuration

```typescript
export class AuditEventBus {
  private batchConfig = {
    maxBatchSize: 50,
    maxBatchWaitMs: 100,
    enableBatching: true
  };

  private batch: AuditEventEnvelope[] = [];
  private batchTimer: any;

  publish(event: AuditEvent): Promise<void> {
    const envelope = this.createEnvelope(event);

    if (this.batchConfig.enableBatching) {
      this.batch.push(envelope);

      // Flush if batch is full
      if (this.batch.length >= this.batchConfig.maxBatchSize) {
        this.flushBatch();
      }
      // Schedule flush if first event in batch
      else if (this.batch.length === 1) {
        this.batchTimer = setTimeout(
          () => this.flushBatch(),
          this.batchConfig.maxBatchWaitMs
        );
      }
    } else {
      // Non-batched publishing
      this.publishSingle(envelope);
    }
  }

  private flushBatch(): void {
    if (this.batch.length === 0) return;

    clearTimeout(this.batchTimer);
    const envelopes = this.batch.splice(0, this.batch.length);

    // Publish batch to all subscribers
    envelopes.forEach(envelope => {
      const topic = this.getTopicForEvent(envelope.event);
      this.topics.get(topic)?.next(envelope);
    });
  }
}
```

## Monitoring & Metrics

### Real-time Metrics

```typescript
export interface EventBusMetrics {
  published: number;
  delivered: number;
  failed: number;
  deadLettered: number;
  inFlight: number;
  avgDeliveryTimeMs: number;
  topicDistribution: Record<string, number>;
}

export class AuditEventBus {
  getMetrics(): EventBusMetrics {
    return {
      published: this.metrics.published,
      delivered: this.metrics.delivered,
      failed: this.metrics.failed,
      deadLettered: this.metrics.deadLettered,
      inFlight: this.inFlight.size,
      avgDeliveryTimeMs: this.calculateAvgDeliveryTime(),
      topicDistribution: this.getTopicDistribution()
    };
  }

  private calculateAvgDeliveryTime(): number {
    // Calculate average time from publish to acknowledge
    // TODO: Implement tracking
    return 0;
  }

  private getTopicDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.topics.forEach((subject, topic) => {
      distribution[topic] = this.getTopicMessageCount(topic);
    });
    return distribution;
  }
}
```

### Health Checks

```typescript
export class AuditEventBus {
  getHealth(): {
    status: 'healthy' | 'degraded' | 'down';
    issues: string[];
  } {
    const issues: string[] = [];

    // Check in-flight queue size
    if (this.inFlight.size > 1000) {
      issues.push(`High in-flight count: ${this.inFlight.size}`);
    }

    // Check dead letter rate
    const dlqRate = this.metrics.deadLettered / this.metrics.published;
    if (dlqRate > 0.01) { // 1% threshold
      issues.push(`High dead letter rate: ${(dlqRate * 100).toFixed(2)}%`);
    }

    // Check topic health
    this.topics.forEach((subject, topic) => {
      if (!subject.observed) {
        issues.push(`No subscribers for topic: ${topic}`);
      }
    });

    return {
      status: issues.length === 0 ? 'healthy' : issues.length < 3 ? 'degraded' : 'down',
      issues
    };
  }
}
```

## Integration with Layer 3 (Audit Collector)

```typescript
// src/app/core/audit/collectors/audit-collector.service.ts

@Injectable({ providedIn: 'root' })
export class AuditCollectorService {
  private auditEventBus = inject(AuditEventBus);

  constructor() {
    this.subscribeToAllTopics();
  }

  private subscribeToAllTopics(): void {
    // Subscribe to user actions
    this.auditEventBus.subscribe('audit.user', async (envelope) => {
      await this.collectUserEvent(envelope.event);
    });

    // Subscribe to AI decisions
    this.auditEventBus.subscribe('audit.ai', async (envelope) => {
      await this.collectAIEvent(envelope.event);
    });

    // Subscribe to security events
    this.auditEventBus.subscribe('audit.security', async (envelope) => {
      await this.collectSecurityEvent(envelope.event);
    });

    // Subscribe to data flow events
    this.auditEventBus.subscribe('audit.data', async (envelope) => {
      await this.collectDataEvent(envelope.event);
    });

    // ... other topics
  }

  private async collectUserEvent(event: AuditEvent): Promise<void> {
    // Process and store user event
    await this.storageService.store(event);
  }

  // ... other collectors
}
```

## Performance Optimization

### Sampling Strategy

```typescript
export class AuditEventBus {
  private samplingRates = {
    'audit.data.query': 0.1,        // Sample 10% of queries
    'audit.performance': 0.05,       // Sample 5% of performance events
    'audit.user': 1.0,               // Sample 100% of user actions
    'audit.security': 1.0,           // Sample 100% of security events
    'audit.ai': 1.0                  // Sample 100% of AI decisions
  };

  publish(event: AuditEvent): Promise<void> {
    const topic = this.getTopicForEvent(event);
    const samplingRate = this.samplingRates[topic] || 1.0;

    // Apply sampling
    if (Math.random() > samplingRate) {
      return Promise.resolve(); // Skip event
    }

    // Publish event
    return this.publishInternal(event);
  }
}
```

### Circuit Breaker

```typescript
export class AuditEventBus {
  private circuitBreaker = {
    failureThreshold: 10,
    failureCount: 0,
    resetTimeoutMs: 60000, // 1 minute
    state: 'closed' as 'closed' | 'open' | 'half-open'
  };

  publish(event: AuditEvent): Promise<void> {
    // Check circuit breaker state
    if (this.circuitBreaker.state === 'open') {
      console.warn('Circuit breaker OPEN: Dropping audit event', event.type);
      return Promise.resolve();
    }

    try {
      return this.publishInternal(event);
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.circuitBreaker.failureCount++;

    if (this.circuitBreaker.failureCount >= this.circuitBreaker.failureThreshold) {
      this.circuitBreaker.state = 'open';
      console.error('Circuit breaker OPENED: Too many failures');

      // Auto-reset after timeout
      setTimeout(() => {
        this.circuitBreaker.state = 'half-open';
        this.circuitBreaker.failureCount = 0;
      }, this.circuitBreaker.resetTimeoutMs);
    }
  }
}
```

## Success Criteria

✅ **Reliability**: 99.9% event delivery rate
✅ **Performance**: <5ms publish latency, <10ms end-to-end
✅ **Scalability**: Handle 10,000 events/second
✅ **Observability**: Real-time metrics dashboard
✅ **Fault Tolerance**: Dead letter queue with manual review
✅ **Topic Coverage**: 11 audit topics with hierarchical routing

## Related Documentation

- [Layer 1: Event Sources](./LAYER_1_EVENT_SOURCES.md) - Event emission
- [Layer 3: Audit Collector](./LAYER_3_AUDIT_COLLECTOR.md) - Event intake
- [Integration Map](../audit-architecture/INTEGRATION_MAP.md) - Layer integration

---

**Status**: Design Complete, Implementation 40% (BlueprintEventBus exists)
**Next Steps**: Extend BlueprintEventBus with audit-specific features
**Owner**: Audit System Team
**Last Updated**: 2025-12-26
