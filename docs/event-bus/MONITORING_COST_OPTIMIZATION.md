# Event Bus Monitoring & Cost Optimization Guide

Comprehensive monitoring setup and cost optimization strategies for the GigHub Event Bus system.

## Table of Contents

1. [Monitoring Setup](#monitoring-setup)
2. [Key Metrics](#key-metrics)
3. [Alerting Rules](#alerting-rules)
4. [Cost Optimization](#cost-optimization)
5. [Performance Tuning](#performance-tuning)
6. [Troubleshooting Dashboards](#troubleshooting-dashboards)

---

## Monitoring Setup

### Cloud Monitoring Dashboard

Create a custom dashboard in Google Cloud Console with these widgets:

#### 1. Event Publishing Rate

**Widget Type**: Line Chart  
**Metric**: Custom metric from Event Bus  
**Aggregation**: Events per second, 1-minute buckets  
**Threshold**: 1000 events/sec (warning), 5000 events/sec (critical)

```yaml
displayName: "Event Publishing Rate (events/sec)"
chartType: LINE
dataSets:
  - timeSeriesQuery:
      filter: 'metric.type="custom/event_bus_publish_rate"'
      aggregation:
        alignmentPeriod: 60s
        perSeriesAligner: ALIGN_RATE
      groupByFields: ["metric.label.event_type"]
```

**Cloud Logging Query**:
```sql
resource.type="cloud_run_revision"
jsonPayload.component="EventBus"
jsonPayload.action="publish"
| stats count() by jsonPayload.eventType
| bucket 1m
```

#### 2. Event Consumption Latency

**Widget Type**: Heatmap  
**Metric**: Custom metric from Event Consumers  
**Aggregation**: p50, p95, p99 percentiles  
**Thresholds**: p99 < 500ms (good), p99 < 1000ms (warning), p99 > 1000ms (critical)

```yaml
displayName: "Event Consumption Latency (p50/p95/p99)"
chartType: HEATMAP
dataSets:
  - timeSeriesQuery:
      filter: 'metric.type="custom/event_consumption_latency"'
      aggregation:
        alignmentPeriod: 60s
        perSeriesAligner: ALIGN_DELTA
        crossSeriesReducer: REDUCE_PERCENTILE_50
      groupByFields: ["metric.label.consumer_type"]
```

**Cloud Logging Query**:
```sql
resource.type="cloud_run_revision"
jsonPayload.component="EventConsumer"
jsonPayload.action="consume"
| stats percentile(jsonPayload.latencyMs, 50, 95, 99) by jsonPayload.consumerType
| bucket 1m
```

#### 3. Dead Letter Queue Size

**Widget Type**: Line Chart with Threshold  
**Metric**: Custom metric from DLQ  
**Aggregation**: Current queue size  
**Thresholds**: 100 (warning), 1000 (critical), 10000 (emergency)

```yaml
displayName: "Dead Letter Queue Size"
chartType: LINE
dataSets:
  - timeSeriesQuery:
      filter: 'metric.type="custom/dlq_size"'
      aggregation:
        alignmentPeriod: 60s
        perSeriesAligner: ALIGN_MAX
thresholds:
  - value: 100.0
    label: "Warning"
    color: YELLOW
  - value: 1000.0
    label: "Critical"
    color: RED
```

**Cloud Logging Query**:
```sql
resource.type="cloud_run_revision"
jsonPayload.component="DeadLetterQueue"
jsonPayload.action="enqueue"
| stats count()
| timeseries 1m
```

#### 4. Event Store Size

**Widget Type**: Stacked Area Chart  
**Metric**: Firestore document count  
**Aggregation**: Total documents by collection  
**Estimated Cost**: $0.06 per 100K documents per month

```yaml
displayName: "Event Store Size (documents)"
chartType: STACKED_AREA
dataSets:
  - timeSeriesQuery:
      filter: 'resource.type="firestore_instance" metric.type="firestore.googleapis.com/document/read_count"'
      groupByFields: ["resource.label.collection_id"]
      aggregation:
        alignmentPeriod: 3600s
        perSeriesAligner: ALIGN_SUM
```

**Query for Collection Size**:
```javascript
// Run in Firebase Console or Cloud Functions
const admin = require('firebase-admin');
const db = admin.firestore();

async function getCollectionSize(collectionPath) {
  const snapshot = await db.collection(collectionPath).count().get();
  return snapshot.data().count;
}

// Example: Get size of all Event Store collections
const blueprints = await db.collection('blueprints').listDocuments();
for (const blueprint of blueprints) {
  const eventCount = await getCollectionSize(`event-store/${blueprint.id}/events`);
  const snapshotCount = await getCollectionSize(`event-store/${blueprint.id}/snapshots`);
  console.log(`Blueprint ${blueprint.id}: ${eventCount} events, ${snapshotCount} snapshots`);
}
```

#### 5. Firestore Read/Write Operations

**Widget Type**: Stacked Bar Chart  
**Metric**: Firestore read/write operations  
**Aggregation**: Operations per minute  
**Cost Tracking**: $0.06 per 100K reads, $0.18 per 100K writes

```yaml
displayName: "Firestore Operations (reads/writes per minute)"
chartType: STACKED_BAR
dataSets:
  - timeSeriesQuery:
      filter: 'resource.type="firestore_instance" metric.type="firestore.googleapis.com/document/read_count"'
      aggregation:
        alignmentPeriod: 60s
        perSeriesAligner: ALIGN_RATE
  - timeSeriesQuery:
      filter: 'resource.type="firestore_instance" metric.type="firestore.googleapis.com/document/write_count"'
      aggregation:
        alignmentPeriod: 60s
        perSeriesAligner: ALIGN_RATE
```

**Cloud Logging Query**:
```sql
resource.type="firestore_instance"
protoPayload.methodName=~"google.firestore.v1.Firestore.(Read|Write|Commit)"
| stats count() by protoPayload.methodName
| bucket 1m
```

#### 6. Event Type Distribution

**Widget Type**: Pie Chart  
**Metric**: Custom metric from Event Bus  
**Aggregation**: Event count by type  
**Purpose**: Identify most common event types for optimization

```yaml
displayName: "Event Type Distribution (last 24h)"
chartType: PIE
dataSets:
  - timeSeriesQuery:
      filter: 'metric.type="custom/event_bus_publish_count"'
      aggregation:
        alignmentPeriod: 86400s
        perSeriesAligner: ALIGN_SUM
      groupByFields: ["metric.label.event_type"]
```

**Cloud Logging Query**:
```sql
resource.type="cloud_run_revision"
jsonPayload.component="EventBus"
jsonPayload.action="publish"
timestamp >= "2025-12-25T00:00:00Z"
| stats count() by jsonPayload.eventType
| order by count() desc
```

---

## Key Metrics

### Event Bus Performance Metrics

| Metric | Target | Warning | Critical | Unit |
|--------|--------|---------|----------|------|
| **Publishing Rate** | <1000 | 1000-5000 | >5000 | events/sec |
| **Publishing Latency (p99)** | <50ms (InMemory) | 50-100ms | >100ms | milliseconds |
| **Publishing Latency (p99)** | <500ms (Firebase) | 500-1000ms | >1000ms | milliseconds |
| **Consumption Latency (p99)** | <100ms | 100-500ms | >500ms | milliseconds |
| **Dead Letter Queue Size** | <10 | 10-100 | >100 | events |
| **Retry Success Rate** | >95% | 90-95% | <90% | percentage |
| **Consumer Success Rate** | >99% | 95-99% | <95% | percentage |

### Event Store Metrics

| Metric | Target | Warning | Critical | Unit |
|--------|--------|---------|----------|------|
| **Total Events** | <1M | 1M-10M | >10M | documents |
| **Events per Blueprint** | <10K | 10K-100K | >100K | documents |
| **Snapshot Count** | <1K | 1K-10K | >10K | documents |
| **Read Operations** | <10K/day | 10K-50K/day | >50K/day | operations |
| **Write Operations** | <5K/day | 5K-20K/day | >20K/day | operations |
| **Query Latency (p95)** | <100ms | 100-500ms | >500ms | milliseconds |

### Cost Metrics

| Metric | Free Tier | Paid Tier | Unit |
|--------|-----------|-----------|------|
| **Firestore Reads** | 50K/day | $0.06/100K | operations |
| **Firestore Writes** | 20K/day | $0.18/100K | operations |
| **Firestore Deletes** | 20K/day | $0.02/100K | operations |
| **Document Storage** | 1GB | $0.18/GB/month | gigabytes |
| **Realtime Database Bandwidth** | 10GB/month | $1/GB/month | gigabytes |
| **Cloud Logging** | 50GB/month | $0.50/GB/month | gigabytes |

---

## Alerting Rules

### Critical Alerts (PagerDuty)

#### Alert 1: Event Publishing Failures Spike

**Trigger**: >10 publishing failures per minute  
**Severity**: CRITICAL  
**Notification**: PagerDuty (immediate page)  
**Escalation**: On-call engineer → Engineering manager (after 15 minutes)

```yaml
alertPolicy:
  displayName: "Event Bus - Publishing Failures Spike"
  conditions:
    - displayName: "Publishing failure rate > 10/min"
      conditionThreshold:
        filter: 'metric.type="custom/event_bus_publish_errors" resource.type="cloud_run_revision"'
        comparison: COMPARISON_GT
        thresholdValue: 10.0
        duration: 60s
        aggregations:
          - alignmentPeriod: 60s
            perSeriesAligner: ALIGN_RATE
  notificationChannels:
    - projects/gighub/notificationChannels/pagerduty-critical
  alertStrategy:
    autoClose: 1800s
```

**Runbook**: See [PRODUCTION_RUNBOOK.md - Incident Response: Event Publishing Failures](#production_runbookmd)

#### Alert 2: Dead Letter Queue Overflow

**Trigger**: DLQ size > 1000 events  
**Severity**: CRITICAL  
**Notification**: PagerDuty (immediate page)  
**Escalation**: On-call engineer → Engineering manager (after 30 minutes)

```yaml
alertPolicy:
  displayName: "Event Bus - Dead Letter Queue Overflow"
  conditions:
    - displayName: "DLQ size > 1000"
      conditionThreshold:
        filter: 'metric.type="custom/dlq_size" resource.type="cloud_run_revision"'
        comparison: COMPARISON_GT
        thresholdValue: 1000.0
        duration: 60s
        aggregations:
          - alignmentPeriod: 60s
            perSeriesAligner: ALIGN_MAX
  notificationChannels:
    - projects/gighub/notificationChannels/pagerduty-critical
```

**Runbook**: See [PRODUCTION_RUNBOOK.md - Incident Response: DLQ Overflow](#production_runbookmd)

#### Alert 3: Consumer Failure Cascade

**Trigger**: >50% of consumers failing for 5 minutes  
**Severity**: CRITICAL  
**Notification**: PagerDuty (immediate page)  
**Escalation**: On-call engineer + Engineering manager (immediate)

```yaml
alertPolicy:
  displayName: "Event Bus - Consumer Failure Cascade"
  conditions:
    - displayName: "Consumer failure rate > 50%"
      conditionThreshold:
        filter: 'metric.type="custom/event_consumer_errors" resource.type="cloud_run_revision"'
        comparison: COMPARISON_GT
        thresholdValue: 0.5
        duration: 300s
        aggregations:
          - alignmentPeriod: 60s
            perSeriesAligner: ALIGN_MEAN
  notificationChannels:
    - projects/gighub/notificationChannels/pagerduty-critical
    - projects/gighub/notificationChannels/slack-incidents
```

**Runbook**: See [PRODUCTION_RUNBOOK.md - Disaster Recovery: Consumer Failure Cascade](#production_runbookmd)

### High Priority Alerts (Slack)

#### Alert 4: High Event Latency

**Trigger**: p99 latency > 1000ms for 5 minutes  
**Severity**: HIGH  
**Notification**: Slack #alerts-event-bus (15-minute response)  
**Escalation**: Team lead (after 30 minutes)

```yaml
alertPolicy:
  displayName: "Event Bus - High Latency"
  conditions:
    - displayName: "Event latency p99 > 1000ms"
      conditionThreshold:
        filter: 'metric.type="custom/event_consumption_latency" resource.type="cloud_run_revision"'
        comparison: COMPARISON_GT
        thresholdValue: 1000.0
        duration: 300s
        aggregations:
          - alignmentPeriod: 60s
            perSeriesAligner: ALIGN_PERCENTILE_99
  notificationChannels:
    - projects/gighub/notificationChannels/slack-alerts
```

**Runbook**: See [PRODUCTION_RUNBOOK.md - Incident Response: High Event Latency](#production_runbookmd)

#### Alert 5: Firestore Quota Approaching Limit

**Trigger**: >80% of daily read/write quota consumed  
**Severity**: HIGH  
**Notification**: Slack #alerts-cost (1-hour response)  
**Escalation**: DevOps team (after 2 hours)

```yaml
alertPolicy:
  displayName: "Event Bus - Firestore Quota Warning"
  conditions:
    - displayName: "Firestore reads > 80% of quota"
      conditionThreshold:
        filter: 'resource.type="firestore_instance" metric.type="firestore.googleapis.com/document/read_count"'
        comparison: COMPARISON_GT
        thresholdValue: 40000.0
        duration: 3600s
        aggregations:
          - alignmentPeriod: 86400s
            perSeriesAligner: ALIGN_SUM
  notificationChannels:
    - projects/gighub/notificationChannels/slack-cost
```

**Runbook**: See [PRODUCTION_RUNBOOK.md - Troubleshooting: Firestore Quota Exceeded](#production_runbookmd)

### Medium Priority Alerts (Slack)

#### Alert 6: Event Store Growth Rate Anomaly

**Trigger**: Event Store growing >50% faster than normal  
**Severity**: MEDIUM  
**Notification**: Slack #alerts-operations (4-hour response)  
**Purpose**: Capacity planning and cost management

```yaml
alertPolicy:
  displayName: "Event Bus - Event Store Growth Anomaly"
  conditions:
    - displayName: "Event Store growth rate > 1.5x normal"
      conditionThreshold:
        filter: 'metric.type="custom/event_store_size_delta"'
        comparison: COMPARISON_GT
        thresholdValue: 1.5
        duration: 3600s
        aggregations:
          - alignmentPeriod: 86400s
            perSeriesAligner: ALIGN_RATE
  notificationChannels:
    - projects/gighub/notificationChannels/slack-operations
```

---

## Cost Optimization

### 1. Event Store Retention Policy

**Problem**: Event Store grows unbounded, increasing storage costs  
**Solution**: Implement 90-day retention policy with automated cleanup

**Implementation**:

```typescript
// src/app/core/maintenance/event-store-cleanup.service.ts
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, getDocs, writeBatch, Timestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class EventStoreCleanupService {
  private firestore = inject(Firestore);

  async cleanupOldEvents(blueprintId: string, retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const eventsRef = collection(this.firestore, `event-store/${blueprintId}/events`);
    const q = query(eventsRef, where('timestamp', '<', Timestamp.fromDate(cutoffDate)));
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);
    
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    return snapshot.size;
  }
}
```

**Cost Savings**: ~$0.18/GB/month for deleted documents

**Automation**: Run daily via Cloud Scheduler + Cloud Functions

```yaml
# Cloud Scheduler Job
name: event-store-cleanup
schedule: "0 2 * * *"  # 2 AM daily
timeZone: "America/Los_Angeles"
httpTarget:
  uri: "https://us-central1-gighub.cloudfunctions.net/eventStoreCleanup"
  httpMethod: POST
```

### 2. Batch Event Publishing

**Problem**: Individual Firestore writes are expensive ($0.18 per 100K)  
**Solution**: Batch events to reduce write operations

**Before** (Expensive):
```typescript
// ❌ 100 individual writes = higher cost
for (const event of events) {
  await eventStore.append(event);
}
```

**After** (Optimized):
```typescript
// ✅ 1 batch write = lower cost
await eventStore.appendBatch(events);
```

**Cost Savings**: Up to 90% reduction in write operations

**Configuration**:
```typescript
const eventBusConfig: EventBusConfig = {
  batchSize: 500,         // Batch up to 500 events
  batchInterval: 1000,    // Wait max 1 second before writing
};
```

### 3. Optimize Firestore Indexes

**Problem**: Unnecessary indexes increase storage costs and slow down writes  
**Solution**: Review and remove unused indexes

**Audit Process**:
```bash
# List all Firestore indexes
gcloud firestore indexes list --project=gighub

# Check index usage in Cloud Console
# Navigate to: Firestore → Indexes → Usage tab

# Remove unused indexes
gcloud firestore indexes delete INDEX_ID --project=gighub
```

**Required Indexes Only**:
```yaml
# firestore.indexes.json
indexes:
  - collectionGroup: events
    queryScope: COLLECTION
    fields:
      - fieldPath: blueprintId
        order: ASCENDING
      - fieldPath: aggregateId
        order: ASCENDING
      - fieldPath: version
        order: ASCENDING
  
  - collectionGroup: events
    queryScope: COLLECTION
    fields:
      - fieldPath: blueprintId
        order: ASCENDING
      - fieldPath: type
        order: ASCENDING
      - fieldPath: timestamp
        order: DESCENDING
```

**Cost Savings**: ~$0.06/GB/month per removed index

### 4. Use InMemoryEventBus for Local Events

**Problem**: Firebase Event Bus incurs Firestore costs for every event  
**Solution**: Use InMemoryEventBus for events that don't need persistence

**Decision Matrix**:

| Event Type | Persistence Needed? | Use |
|------------|---------------------|-----|
| UI State Changes | No | InMemoryEventBus |
| User Interactions | No | InMemoryEventBus |
| Validation Errors | No | InMemoryEventBus |
| Task CRUD Operations | Yes | FirebaseEventBus |
| Audit Trail | Yes | FirebaseEventBus |
| Cross-Server Events | Yes | FirebaseEventBus |

**Hybrid Configuration**:
```typescript
// Use InMemoryEventBus for transient events
providers: [
  {
    provide: IEventBus,
    useClass: InMemoryEventBus,
  },
  {
    provide: 'PERSISTENT_EVENT_BUS',
    useClass: FirebaseEventBus,
  },
];

// Publish to appropriate bus
@Injectable()
export class TaskService {
  private eventBus = inject(IEventBus);  // InMemory
  @Inject('PERSISTENT_EVENT_BUS') private persistentEventBus!: IEventBus;  // Firebase
  
  async createTask(task: Task): Promise<void> {
    // Transient event (no cost)
    await this.eventBus.publish({
      type: 'task.validation.started',
      // ...
    });
    
    // Persistent event (incurs cost)
    await this.persistentEventBus.publish({
      type: 'task.created',
      // ...
    });
  }
}
```

**Cost Savings**: 50-70% reduction in Firestore operations

### 5. Snapshot Optimization

**Problem**: Frequent snapshots increase storage costs  
**Solution**: Tune snapshot frequency based on aggregate importance

**Configuration**:
```typescript
const snapshotConfig = {
  // High-value aggregates: snapshot every 10 events
  'blueprint': { frequency: 10, retention: 30 },
  
  // Medium-value aggregates: snapshot every 50 events
  'task': { frequency: 50, retention: 30 },
  
  // Low-value aggregates: snapshot every 100 events
  'comment': { frequency: 100, retention: 7 },
};
```

**Cost Savings**: ~30% reduction in snapshot storage

### 6. Cloud Logging Cost Control

**Problem**: Verbose event logging increases Cloud Logging costs  
**Solution**: Use appropriate log levels and sampling

**Before** (Expensive):
```typescript
// ❌ Log every event at INFO level
logger.info('Event published', { event });
```

**After** (Optimized):
```typescript
// ✅ Log errors always, sample info logs
if (event.type.includes('error') || Math.random() < 0.01) {
  logger.info('Event published', { eventType: event.type, eventId: event.id });
}
```

**Sampling Configuration**:
```typescript
const logConfig = {
  errorSampling: 1.0,      // Log 100% of errors
  warningSampling: 0.5,    // Log 50% of warnings
  infoSampling: 0.01,      // Log 1% of info (for volume)
  debugSampling: 0.0,      // No debug logs in prod
};
```

**Cost Savings**: ~80% reduction in logging costs

---

## Performance Tuning

### 1. Event Bus Configuration Tuning

**InMemoryEventBus** (Low Latency):
```typescript
const config: EventBusConfig = {
  retryAttempts: 3,          // Balance reliability vs latency
  retryDelay: 1000,          // 1 second initial delay
  maxQueueSize: 10000,       // Prevent memory overflow
  enableMetrics: true,       // Track performance
};
```

**FirebaseEventBus** (High Throughput):
```typescript
const config: EventBusConfig = {
  batchSize: 500,            // Larger batches = fewer writes
  batchInterval: 1000,       // 1 second max wait
  maxOfflineQueueSize: 5000, // Handle offline scenarios
  enableRealtime: true,      // Real-time sync
  enableMetrics: true,       // Track performance
};
```

### 2. Consumer Optimization

**Parallel Processing**:
```typescript
@Injectable()
export class TaskEventConsumer extends EventConsumer {
  @Subscribe('task.*')
  @Retry({ attempts: 3, delay: 1000 })
  async handleTaskEvents(event: DomainEvent): Promise<void> {
    // Process multiple events in parallel
    const events = await this.fetchRelatedEvents(event);
    await Promise.all(events.map(e => this.processEvent(e)));
  }
}
```

**Consumer Throttling**:
```typescript
import { debounceTime } from 'rxjs/operators';

@Injectable()
export class UIStateConsumer extends EventConsumer {
  @Subscribe('ui.state.*')
  async handleUIStateEvents(event: DomainEvent): Promise<void> {
    // Debounce rapid UI events
    this.eventBus.observe('ui.state.*')
      .pipe(debounceTime(300))
      .subscribe(e => this.updateUIState(e));
  }
}
```

### 3. Firestore Query Optimization

**Use Composite Indexes**:
```typescript
// ✅ Optimized query with composite index
const events = await getDocs(
  query(
    collection(firestore, `event-store/${blueprintId}/events`),
    where('aggregateId', '==', taskId),
    where('type', '==', 'task.updated'),
    orderBy('timestamp', 'desc'),
    limit(10)
  )
);
```

**Avoid IN queries**:
```typescript
// ❌ Expensive: IN query with 10 values
const events = await getDocs(
  query(
    collection(firestore, 'events'),
    where('type', 'in', ['task.created', 'task.updated', ...])
  )
);

// ✅ Optimized: Use OR queries or separate calls
const taskCreated = await getDocs(
  query(collection(firestore, 'events'), where('type', '==', 'task.created'))
);
const taskUpdated = await getDocs(
  query(collection(firestore, 'events'), where('type', '==', 'task.updated'))
);
```

---

## Troubleshooting Dashboards

### Dashboard 1: Event Bus Health

**Purpose**: Real-time overview of Event Bus system health

**Widgets**:
1. Event Publishing Rate (line chart, 1-hour window)
2. Event Consumption Latency (heatmap, p50/p95/p99)
3. Dead Letter Queue Size (line chart with thresholds)
4. Consumer Success Rate (gauge, target >99%)
5. Recent Errors (table, last 50 errors)

**Access**: Cloud Console → Monitoring → Dashboards → "Event Bus Health"

### Dashboard 2: Event Store Capacity

**Purpose**: Monitor Event Store growth and capacity planning

**Widgets**:
1. Total Event Count (scorecard, current value)
2. Event Growth Rate (line chart, 7-day trend)
3. Storage by Collection (pie chart)
4. Events by Blueprint (bar chart, top 10)
5. Cleanup Job Status (table, last 7 days)

**Access**: Cloud Console → Monitoring → Dashboards → "Event Store Capacity"

### Dashboard 3: Cost Analysis

**Purpose**: Track and optimize Event Bus costs

**Widgets**:
1. Daily Firestore Operations (stacked bar, reads/writes)
2. Estimated Monthly Cost (scorecard, projected)
3. Cost by Operation Type (pie chart)
4. Cost Trend (line chart, 30-day trend)
5. Optimization Opportunities (table, recommendations)

**Access**: Cloud Console → Monitoring → Dashboards → "Event Bus Costs"

**Cost Breakdown Example**:
```
Event Bus Monthly Costs (Estimated)

Firestore:
  - Reads:   150K operations × $0.06/100K = $0.09
  - Writes:   50K operations × $0.18/100K = $0.09
  - Storage:   2GB × $0.18/GB = $0.36
  - Subtotal: $0.54

Realtime Database:
  - Bandwidth: 5GB × $1/GB = $5.00
  - Subtotal: $5.00

Cloud Logging:
  - Logs: 20GB × $0.50/GB = $10.00
  - Subtotal: $10.00

Total Estimated Monthly Cost: $15.54
```

---

## Cost Estimation Calculator

### Monthly Cost Formula

```
Total Cost = Firestore Cost + RTDB Cost + Logging Cost

Firestore Cost = (Reads × $0.06/100K) + (Writes × $0.18/100K) + (Storage GB × $0.18)
RTDB Cost = Bandwidth GB × $1
Logging Cost = Log GB × $0.50
```

### Example Scenarios

#### Scenario 1: Small Project (1K events/day)

```
Events: 1,000/day × 30 days = 30,000/month

Firestore:
  - Writes: 30K × $0.18/100K = $0.05
  - Reads: 90K × $0.06/100K = $0.05 (3 reads per event avg)
  - Storage: 0.5GB × $0.18 = $0.09
  - Subtotal: $0.19

Total: ~$5/month (mostly logging)
```

#### Scenario 2: Medium Project (10K events/day)

```
Events: 10,000/day × 30 days = 300,000/month

Firestore:
  - Writes: 300K × $0.18/100K = $0.54
  - Reads: 900K × $0.06/100K = $0.54
  - Storage: 3GB × $0.18 = $0.54
  - Subtotal: $1.62

Total: ~$15/month
```

#### Scenario 3: Large Project (100K events/day)

```
Events: 100,000/day × 30 days = 3,000,000/month

Firestore:
  - Writes: 3M × $0.18/100K = $5.40
  - Reads: 9M × $0.06/100K = $5.40
  - Storage: 20GB × $0.18 = $3.60
  - Subtotal: $14.40

RTDB: 50GB × $1 = $50.00
Logging: 100GB × $0.50 = $50.00

Total: ~$115/month
```

---

## Best Practices Summary

1. **Use InMemoryEventBus for transient events** - Save 50-70% on Firestore costs
2. **Batch events aggressively** - Reduce write operations by 90%
3. **Implement 90-day retention** - Control storage growth
4. **Optimize indexes** - Remove unused indexes
5. **Sample logs in production** - Reduce logging costs by 80%
6. **Monitor quotas proactively** - Avoid unexpected overages
7. **Tune snapshot frequency** - Balance reliability vs cost
8. **Use composite indexes** - Improve query performance
9. **Set up cost alerts** - Get notified when costs spike
10. **Review costs monthly** - Identify optimization opportunities

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-26  
**Next Review**: Monthly
