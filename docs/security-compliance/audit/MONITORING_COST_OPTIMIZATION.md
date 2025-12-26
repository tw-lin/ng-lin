# Audit System Monitoring & Cost Optimization Guide

Comprehensive monitoring setup and cost optimization strategies for the GigHub Global Audit Logging System.

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

#### 1. Audit Event Volume

**Widget Type**: Line Chart  
**Metric**: `custom/audit_events_collected`  
**Aggregation**: Sum, 1-hour buckets  
**Filters**: `tier=HOT`

```yaml
displayName: "Audit Events Collected (Hourly)"
chartType: LINE
dataSets:
  - timeSeriesQuery:
      filter: 'metric.type="custom/audit_events_collected" resource.type="global"'
      aggregation:
        alignmentPeriod: 3600s
        perSeriesAligner: ALIGN_SUM
```

#### 2. Migration Function Execution

**Widget Type**: Stacked Bar Chart  
**Metric**: `cloudfunctions.googleapis.com/function/execution_count`  
**Filters**: `function_name=auditTierMigration`  
**Group By**: `status`

```yaml
displayName: "Migration Function Executions"
chartType: STACKED_BAR
dataSets:
  - timeSeriesQuery:
      filter: 'metric.type="cloudfunctions.googleapis.com/function/execution_count" resource.labels.function_name="auditTierMigration"'
      groupByFields: ["metric.label.status"]
```

#### 3. Storage Tier Distribution

**Widget Type**: Pie Chart  
**Custom Metric**: `audit_storage_distribution`  
**Group By**: `tier`

```yaml
displayName: "Storage Tier Distribution"
chartType: PIE
dataSets:
  - timeSeriesQuery:
      filter: 'metric.type="custom/audit_storage_distribution"'
      groupByFields: ["metric.label.tier"]
```

#### 4. Risk Score Distribution

**Widget Type**: Histogram  
**Custom Metric**: `audit_risk_scores`  
**Buckets**: 0-25, 26-50, 51-75, 76-100

```yaml
displayName: "Risk Score Distribution"
chartType: HISTOGRAM
dataSets:
  - timeSeriesQuery:
      filter: 'metric.type="custom/audit_risk_scores"'
```

#### 5. Classification Engine Performance

**Widget Type**: Line Chart  
**Metric**: `custom/classification_duration_ms`  
**Aggregation**: Percentile (50th, 95th, 99th)

```yaml
displayName: "Classification Engine Latency (ms)"
chartType: LINE
dataSets:
  - timeSeriesQuery:
      filter: 'metric.type="custom/classification_duration_ms"'
      aggregation:
        alignmentPeriod: 60s
        perSeriesAligner: ALIGN_DELTA
        crossSeriesReducer: REDUCE_PERCENTILE_50
```

---

## Key Metrics

### Application Metrics

#### 1. Event Collection Rate

```typescript
// Metric definition
{
  name: 'audit_events_collected',
  type: 'CUMULATIVE',
  unit: 'events',
  labels: {
    tier: 'HOT|WARM|COLD',
    category: 'AUTH|AUTHZ|USER_ACTION|...',
    level: 'LOW|MEDIUM|HIGH|CRITICAL'
  }
}

// Implementation
const eventsCollected = new Counter({
  name: 'audit_events_collected',
  help: 'Total number of audit events collected',
  labelNames: ['tier', 'category', 'level']
});

eventsCollected.inc({ tier: 'HOT', category: 'AUTH', level: 'LOW' });
```

#### 2. Classification Performance

```typescript
// Metric definition
{
  name: 'classification_duration_ms',
  type: 'DISTRIBUTION',
  unit: 'milliseconds',
  labels: {
    event_type: string,
    batch_size: number
  }
}

// Implementation
const classificationDuration = new Histogram({
  name: 'classification_duration_ms',
  help: 'Classification engine processing time',
  labelNames: ['event_type', 'batch_size'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500]
});

const start = Date.now();
// ... classification logic
classificationDuration.observe(
  { event_type: 'user.login', batch_size: 50 },
  Date.now() - start
);
```

#### 3. Storage Operations

```typescript
// Metric definition
{
  name: 'storage_operations',
  type: 'COUNTER',
  unit: 'operations',
  labels: {
    operation: 'read|write|delete',
    tier: 'HOT|WARM|COLD',
    success: 'true|false'
  }
}
```

#### 4. Circuit Breaker State

```typescript
// Metric definition
{
  name: 'circuit_breaker_state',
  type: 'GAUGE',
  unit: 'state',
  labels: {
    component: 'collector|repository|query',
    state: 'CLOSED|OPEN|HALF_OPEN'
  }
}
```

### Infrastructure Metrics

#### 1. Firestore Operations

```bash
# Read operations (per minute)
gcloud monitoring time-series list \
  --filter='metric.type="firestore.googleapis.com/document/read_count"' \
  --aggregation='{"alignmentPeriod":"60s","perSeriesAligner":"ALIGN_RATE"}'

# Write operations (per minute)
gcloud monitoring time-series list \
  --filter='metric.type="firestore.googleapis.com/document/write_count"' \
  --aggregation='{"alignmentPeriod":"60s","perSeriesAligner":"ALIGN_RATE"}'
```

#### 2. Cloud Storage

```bash
# Storage usage (GB)
gsutil du -sh gs://gighub-audit-archive-prod

# Object count
gsutil ls -r gs://gighub-audit-archive-prod | wc -l
```

#### 3. BigQuery

```bash
# Table size
bq show --format=prettyjson gighub_audit_prod.audit_events | jq '.numBytes'

# Row count
bq query --use_legacy_sql=false \
  'SELECT COUNT(*) FROM `gighub_audit_prod.audit_events`'
```

#### 4. Cloud Function

```bash
# Execution count
gcloud monitoring time-series list \
  --filter='metric.type="cloudfunctions.googleapis.com/function/execution_count" AND resource.labels.function_name="auditTierMigration"'

# Execution time (ms)
gcloud monitoring time-series list \
  --filter='metric.type="cloudfunctions.googleapis.com/function/execution_times"'

# Memory usage (MB)
gcloud monitoring time-series list \
  --filter='metric.type="cloudfunctions.googleapis.com/function/user_memory_bytes"'
```

---

## Alerting Rules

### Critical Alerts (P0)

#### 1. Migration Function Failures

```yaml
displayName: "Audit Migration Function Failures"
conditions:
  - displayName: "High error rate"
    conditionThreshold:
      filter: 'metric.type="cloudfunctions.googleapis.com/function/execution_count" resource.labels.function_name="auditTierMigration" metric.labels.status="error"'
      comparison: COMPARISON_GT
      thresholdValue: 3
      duration: 300s
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_SUM
notificationChannels: [EMAIL_CHANNEL, SLACK_CHANNEL]
alertStrategy:
  autoClose: 3600s
```

#### 2. Circuit Breaker Open

```yaml
displayName: "Audit Collector Circuit Breaker Open"
conditions:
  - displayName: "Circuit breaker in OPEN state"
    conditionThreshold:
      filter: 'metric.type="custom/circuit_breaker_state" metric.labels.state="OPEN"'
      comparison: COMPARISON_GT
      thresholdValue: 0
      duration: 60s
notificationChannels: [EMAIL_CHANNEL, PAGERDUTY_CHANNEL]
alertStrategy:
  autoClose: 1800s
```

#### 3. Storage Write Failures

```yaml
displayName: "High Firestore Write Failure Rate"
conditions:
  - displayName: "Write failures > 5%"
    conditionThreshold:
      filter: 'metric.type="firestore.googleapis.com/document/write_count" metric.labels.status="error"'
      comparison: COMPARISON_GT
      thresholdValue: 0.05  # 5%
      duration: 300s
notificationChannels: [EMAIL_CHANNEL]
```

### Warning Alerts (P1)

#### 4. High Event Volume

```yaml
displayName: "Unexpected High Event Volume"
conditions:
  - displayName: "Event rate > 2x baseline"
    conditionThreshold:
      filter: 'metric.type="custom/audit_events_collected"'
      comparison: COMPARISON_GT
      thresholdValue: 2000  # events/minute
      duration: 600s
notificationChannels: [EMAIL_CHANNEL]
alertStrategy:
  autoClose: 3600s
```

#### 5. Slow Classification

```yaml
displayName: "Classification Engine Slow"
conditions:
  - displayName: "P95 latency > 50ms"
    conditionThreshold:
      filter: 'metric.type="custom/classification_duration_ms"'
      comparison: COMPARISON_GT
      thresholdValue: 50
      duration: 300s
      aggregations:
        - alignmentPeriod: 60s
          crossSeriesReducer: REDUCE_PERCENTILE_95
notificationChannels: [SLACK_CHANNEL]
```

### Informational Alerts (P2)

#### 6. Storage Tier Imbalance

```yaml
displayName: "Storage Tier Imbalance"
conditions:
  - displayName: "HOT tier > 80% of total"
    conditionThreshold:
      filter: 'metric.type="custom/audit_storage_distribution" metric.labels.tier="HOT"'
      comparison: COMPARISON_GT
      thresholdValue: 0.8
      duration: 3600s
notificationChannels: [EMAIL_CHANNEL]
alertStrategy:
  autoClose: 86400s
```

---

## Cost Optimization

### Firestore Cost Optimization

#### 1. Index Optimization

```bash
# List all indexes
firebase firestore:indexes

# Remove unused indexes
# Analyze query patterns and remove indexes not being used

# Composite indexes only when needed
# Avoid over-indexing
```

**Best Practices**:
- Create composite indexes only for actual queries
- Remove indexes when queries change
- Use single-field indexes when possible
- Monitor index usage via Cloud Console

#### 2. Batch Operations

```typescript
// ✅ Good: Batch writes
const batch = db.batch();
events.forEach(event => {
  const ref = db.collection('audit_events_hot').doc();
  batch.set(ref, event);
});
await batch.commit();

// ❌ Bad: Individual writes
for (const event of events) {
  await db.collection('audit_events_hot').add(event);
}
```

**Savings**: Batch operations count as single write, reducing costs by up to 90% for bulk operations.

#### 3. Read Optimization

```typescript
// ✅ Good: Limit results
const query = db.collection('audit_events_hot')
  .where('tenantId', '==', tenantId)
  .orderBy('timestamp', 'desc')
  .limit(100);

// ❌ Bad: Unlimited results
const query = db.collection('audit_events_hot')
  .where('tenantId', '==', tenantId)
  .orderBy('timestamp', 'desc');
```

**Savings**: Reading 100 documents instead of 10,000 reduces read costs by 99%.

#### 4. Tier Migration Timing

```typescript
// Optimal configuration
const MIGRATION_CONFIG = {
  hotRetentionDays: 7,   // Minimal HOT tier retention
  warmRetentionDays: 90, // Balance between cost and access
  coldRetentionYears: 7  // Long-term compliance
};
```

**Cost Impact**:
- HOT tier: $0.18/GB-month + $0.06/100K reads
- WARM tier: $0.18/GB-month + $0.06/100K reads (same as HOT, but fewer reads)
- COLD tier: $0.026/GB-month (Cloud Storage)

**Savings**: Moving 90% of events to COLD tier saves ~68% on storage costs.

### Cloud Storage Cost Optimization

#### 1. Storage Class Selection

```bash
# Use Standard class for frequent access (first 90 days in COLD)
gsutil lifecycle set lifecycle-standard.json gs://bucket

# Archive class after 1 year (reduced cost, higher retrieval cost)
gsutil lifecycle set lifecycle-archive.json gs://bucket
```

**lifecycle-archive.json**:
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "ARCHIVE"
        },
        "condition": {
          "age": 365
        }
      }
    ]
  }
}
```

**Cost Comparison**:
- Standard: $0.026/GB-month
- Archive: $0.0012/GB-month
- **Savings**: 95% after 1 year

#### 2. Compression

```typescript
// Compress JSON before upload
import * as zlib from 'zlib';

const compressed = zlib.gzipSync(JSON.stringify(events));
await bucket.file(`archive-${date}.json.gz`).save(compressed);
```

**Savings**: 70-80% compression ratio for JSON data.

### BigQuery Cost Optimization

#### 1. Partitioning

```sql
-- Create partitioned table
CREATE TABLE `gighub_audit_prod.audit_events_partitioned`
PARTITION BY DATE(timestamp)
CLUSTER BY tenant_id, category
AS SELECT * FROM `gighub_audit_prod.audit_events`;
```

**Savings**: Queries scan only relevant partitions, reducing costs by 90%+ for date-range queries.

#### 2. Materialized Views

```sql
-- Create materialized view for common aggregations
CREATE MATERIALIZED VIEW `gighub_audit_prod.daily_stats`
PARTITION BY DATE(date)
AS
SELECT
  DATE(timestamp) as date,
  tenant_id,
  category,
  COUNT(*) as event_count,
  AVG(risk_score) as avg_risk_score
FROM `gighub_audit_prod.audit_events`
GROUP BY DATE(timestamp), tenant_id, category;
```

**Savings**: Materialized views pre-compute results, reducing query costs by 80%+.

#### 3. Query Optimization

```sql
-- ✅ Good: Specific columns, partition filter
SELECT event_id, event_type, timestamp
FROM `gighub_audit_prod.audit_events`
WHERE DATE(timestamp) BETWEEN '2025-01-01' AND '2025-01-31'
  AND tenant_id = 'tenant-123';

-- ❌ Bad: SELECT *, no partition filter
SELECT *
FROM `gighub_audit_prod.audit_events`
WHERE tenant_id = 'tenant-123';
```

**Savings**: Specific columns + partition filter reduces scan size by 95%+.

### Cloud Functions Cost Optimization

#### 1. Memory Allocation

```yaml
# functions/index.ts
export const auditTierMigration = functions
  .runWith({
    memory: '512MB',  # Optimal for batch processing
    timeoutSeconds: 540
  })
  .pubsub.schedule('0 2 * * *')
  .onRun(async (context) => {
    // Migration logic
  });
```

**Cost**: $0.000000925/GB-second  
**Optimization**: Use minimum memory required (512MB vs 2GB saves 75%)

#### 2. Execution Frequency

```typescript
// Daily execution at low-traffic time
schedule: '0 2 * * *'  // 2 AM UTC

// Avoid unnecessary executions
if (eventsToMigrate.length === 0) {
  logger.info('No events to migrate, skipping');
  return;
}
```

**Savings**: Skip empty runs saves 100% of that execution cost.

---

## Performance Tuning

### Classification Engine Tuning

#### 1. Batch Size Optimization

```typescript
// Test different batch sizes
const BATCH_SIZES = [10, 50, 100, 200, 500];
const results = [];

for (const batchSize of BATCH_SIZES) {
  const events = generateEvents(batchSize);
  const start = performance.now();
  classificationEngine.classifyBatch(events);
  const duration = performance.now() - start;
  results.push({ batchSize, duration, perEvent: duration / batchSize });
}

// Find optimal batch size (lowest per-event time)
const optimal = results.reduce((min, curr) =>
  curr.perEvent < min.perEvent ? curr : min
);
```

**Optimal**: 50-100 events per batch (< 10ms per event)

#### 2. Rule Caching

```typescript
// Cache classification rules (computed once)
private readonly ruleCache = new Map<string, ClassificationRule>();

classify(event: AuditEvent): ClassifiedAuditEvent {
  const cacheKey = event.eventType;
  if (!this.ruleCache.has(cacheKey)) {
    const rule = this.findMatchingRule(event.eventType);
    this.ruleCache.set(cacheKey, rule);
  }
  return this.applyRule(event, this.ruleCache.get(cacheKey)!);
}
```

**Improvement**: 40-50% faster classification

### Query Performance Tuning

#### 1. Index Usage

```typescript
// ✅ Good: Uses index
const query = db.collection('audit_events_hot')
  .where('tenantId', '==', tenantId)  // Indexed
  .where('category', '==', category)  // Indexed
  .orderBy('timestamp', 'desc')       // Indexed
  .limit(100);

// ❌ Bad: No index, full collection scan
const query = db.collection('audit_events_hot')
  .where('metadata.customField', '==', value);  // Not indexed
```

#### 2. Pagination

```typescript
// ✅ Good: Cursor-based pagination
let lastDoc = null;
const pageSize = 100;

async function getNextPage() {
  let query = db.collection('audit_events_hot')
    .where('tenantId', '==', tenantId)
    .orderBy('timestamp', 'desc')
    .limit(pageSize);
  
  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }
  
  const snapshot = await query.get();
  lastDoc = snapshot.docs[snapshot.docs.length - 1];
  return snapshot.docs.map(doc => doc.data());
}
```

**Performance**: Constant time per page (O(1) vs O(n) for offset-based)

---

## Troubleshooting Dashboards

### Dashboard 1: System Health Overview

**Widgets**:
1. Event collection rate (last 24h)
2. Classification engine latency (P50, P95, P99)
3. Storage operations (read/write/delete)
4. Circuit breaker state
5. Error rate by component

**Use Case**: Daily health check

### Dashboard 2: Cost Analysis

**Widgets**:
1. Firestore read/write operations (cost estimate)
2. Cloud Storage usage (GB)
3. BigQuery scan size (TB)
4. Cloud Functions invocations
5. Total estimated monthly cost

**Use Case**: Weekly cost review

### Dashboard 3: Performance Metrics

**Widgets**:
1. Classification throughput (events/sec)
2. Query latency by pattern
3. Batch processing duration
4. Memory usage
5. CPU utilization

**Use Case**: Performance tuning

### Dashboard 4: Security & Compliance

**Widgets**:
1. High-risk events (last 7 days)
2. Compliance events by framework (GDPR, HIPAA)
3. Failed access attempts
4. Anomalies detected
5. Security incidents

**Use Case**: Security review

---

## Cost Estimates & Projections

### Current Costs (per month)

| Volume | Events/Day | Firestore | Storage | BigQuery | Functions | **Total** |
|--------|------------|-----------|---------|----------|-----------|-----------|
| LOW | 10,000 | $0.60 | $0.10 | $0.20 | $0.24 | **$1.14** |
| MEDIUM | 50,000 | $3.00 | $0.50 | $1.00 | $0.80 | **$5.30** |
| HIGH | 100,000 | $6.00 | $1.20 | $2.00 | $3.00 | **$12.20** |

### Cost Reduction Strategies

| Strategy | Savings | Implementation |
|----------|---------|----------------|
| Tier migration (7/90/2555 days) | 68-85% | ✅ Implemented |
| Index optimization | 20-30% | Quarterly review |
| Batch operations | 80-90% | ✅ Implemented |
| Query optimization | 50-70% | Ongoing |
| Compression | 70-80% | ✅ Implemented |
| Partition pruning | 90%+ | ✅ Implemented |

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-26  
**Phase**: Phase 1 Complete  
**Maintainer**: Audit System Team
