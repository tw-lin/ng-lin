# Layer 5: Storage Tiers (Multi-Tier Storage Strategy)
## Hot / Warm / Cold Storage Architecture

> **角色定位**: Architecture & Interaction Focus  
> **層級編號**: Layer 5 of 8  
> **建立日期**: 2025-12-26  
> **核心職責**: Multi-tier audit event storage with lifecycle management

---

## 🎯 Layer Purpose

The Storage Tiers layer provides **cost-optimized, compliant audit storage** through:
1. **Hot Tier**: Real-time access (24 hours) - In-memory cache
2. **Warm Tier**: Active queries (90 days) - Firestore database
3. **Cold Tier**: Long-term archive (7 years) - Cloud Storage

**Core Principle**: Right data, right tier, right cost - optimize for access patterns and compliance requirements.

---

## 📐 Architecture Overview

### Position in 8-Layer Topology

```
Layer 1-4: Event Generation → Classification
              ↓ Classified audit events
┌─────────────────────────────────────────────────┐
│ Layer 5: Storage Tiers ← HERE                   │
│  ┌─────────────────────────────────────────┐   │
│  │ Hot Tier (In-Memory) - 24h              │   │
│  │ - Immediate queries                     │   │
│  │ - <50ms latency                         │   │
│  │ - Most recent events                    │   │
│  └──────────────┬──────────────────────────┘   │
│                 ↓ Age out after 24h             │
│  ┌─────────────────────────────────────────┐   │
│  │ Warm Tier (Firestore) - 90d            │   │
│  │ - Active queries                        │   │
│  │ - <500ms latency                        │   │
│  │ - Indexed, queryable                    │   │
│  └──────────────┬──────────────────────────┘   │
│                 ↓ Archive after 90d             │
│  ┌─────────────────────────────────────────┐   │
│  │ Cold Tier (Cloud Storage) - 7y         │   │
│  │ - Compliance archive                    │   │
│  │ - <5s latency (on-demand)               │   │
│  │ - Compressed Parquet files              │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
              ↓ Query API (Layer 6)
Layer 6-8: Query, Export, Review
```

---

## 🔥 Hot Tier (In-Memory) - 24 Hours

### Purpose & Characteristics

**Use Cases**:
- Real-time dashboard queries
- Live monitoring & alerting
- Immediate compliance checks
- Recent activity views

**Technology**: 
```
Option A: Cloud Run + Redis (Recommended)
  - Persistent across restarts
  - Shared across instances
  - Built-in eviction policies (LRU)
  - Pub/Sub integration for cache invalidation

Option B: Cloud Functions + Memory (Not Recommended)
  - Lost on cold start
  - Not shared across instances
  - Limited by function memory
```

**Data Model**:
```
Redis Key Structure:
  audit:hot:{tenant_id}:{timestamp}:{event_id}

Redis Data Structure:
  - Sorted Set (ZSET) for time-based queries
    Key: audit:hot:{tenant_id}
    Score: timestamp (unix milliseconds)
    Value: event_id
  
  - Hash for event data
    Key: audit:event:{event_id}
    Fields: {type, category, level, actor, resource, metadata, ...}

Indexing:
  - Primary: timestamp (sorted set score)
  - Secondary: category (separate sorted sets)
  - Secondary: level (separate sorted sets)
```

### Lifecycle Management

```
Data Flow:
  Classification Engine → Hot Tier Write
  
Hot Tier Write Process:
  1. Add to sorted set: ZADD audit:hot:{tenant_id} {timestamp} {event_id}
  2. Store event data: HSET audit:event:{event_id} {...fields}
  3. Set TTL: EXPIRE audit:event:{event_id} 86400 (24h)
  4. Add to category index: ZADD audit:hot:category:{category} {timestamp} {event_id}
  5. Add to level index: ZADD audit:hot:level:{level} {timestamp} {event_id}

Eviction:
  - Automatic: Redis TTL evicts after 24h
  - Manual: Background job moves to Warm Tier before eviction
  
Age-Out Process (every 1 hour):
  1. Query events older than 23 hours
  2. Write to Warm Tier (Firestore)
  3. Delete from Hot Tier (after confirm)
```

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Write Latency** | <5ms | In-memory write |
| **Read Latency** | <50ms | In-memory read |
| **Throughput** | 10,000 ops/sec | Read + write combined |
| **Capacity** | 1M events max | ~1GB memory |
| **Availability** | 99.9% | Redis cluster |

---

## ☁️ Warm Tier (Firestore) - 90 Days

### Purpose & Characteristics

**Use Cases**:
- General audit queries
- Compliance reporting
- Investigation & forensics
- Historical analysis

**Technology**: Firestore

**Data Model**:
```
Collection Structure:
  /audit_events/{event_id}
  
Document Schema:
{
  id: string,
  timestamp: Timestamp,
  type: string,
  category: 'AUTHENTICATION' | 'AUTHORIZATION' | ...,
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL',
  
  actor: string,
  actorType: 'user' | 'system' | 'ai',
  
  resource: string | null,
  resourceType: string | null,
  
  tenantId: string,
  tenantName: string,
  
  metadata: {
    ip: string,
    userAgent: string,
    location: {...},
    // ... domain-specific fields
  },
  
  requiresReview: boolean,
  reviewedAt: Timestamp | null,
  reviewedBy: string | null,
  
  createdAt: Timestamp,
  archivedAt: Timestamp | null
}
```

**Indexes** (Critical for Performance):
```
Composite Indexes:
  1. (tenantId, timestamp DESC)
     → Time-based queries per tenant
  
  2. (tenantId, category, timestamp DESC)
     → Category filtering per tenant
  
  3. (tenantId, level, timestamp DESC)
     → Level filtering per tenant
  
  4. (tenantId, type, timestamp DESC)
     → Event type filtering per tenant
  
  5. (tenantId, requiresReview, timestamp DESC)
     → Pending reviews per tenant
  
  6. (tenantId, actor, timestamp DESC)
     → User activity history

Single-Field Indexes:
  - timestamp (DESC) → Global time-based sorting
  - category → Category aggregation
  - level → Severity aggregation
```

### Lifecycle Management

```
Data Flow:
  Hot Tier Age-Out → Warm Tier Write
  
Warm Tier Write Process:
  1. Batch events (50-500 per batch)
  2. Use Firestore batch write:
     batch.set(doc, data)
     batch.commit()
  3. Verify write success
  4. Update Hot Tier (mark as archived)

Eviction:
  - Archive events older than 90 days to Cold Tier
  - Run daily background job (Cloud Scheduler + Cloud Function)

Archive Process (daily at 2 AM):
  1. Query events where timestamp < (now - 90 days)
  2. Export to Parquet files (batched)
  3. Upload to Cloud Storage
  4. Verify upload success
  5. Delete from Firestore (batch delete)
```

### Query Patterns

```
Common Queries:
  1. Recent events by tenant:
     db.collection('audit_events')
       .where('tenantId', '==', tenantId)
       .orderBy('timestamp', 'desc')
       .limit(100)
  
  2. Events by category:
     db.collection('audit_events')
       .where('tenantId', '==', tenantId)
       .where('category', '==', 'AUTHENTICATION')
       .orderBy('timestamp', 'desc')
  
  3. Critical events:
     db.collection('audit_events')
       .where('tenantId', '==', tenantId)
       .where('level', '==', 'CRITICAL')
       .orderBy('timestamp', 'desc')
  
  4. Events requiring review:
     db.collection('audit_events')
       .where('tenantId', '==', tenantId)
       .where('requiresReview', '==', true)
       .orderBy('timestamp', 'desc')
```

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Write Latency** | <100ms | Batch write |
| **Read Latency** | <500ms | Indexed query |
| **Throughput** | 1,000 ops/sec | Read + write combined |
| **Capacity** | Unlimited | Firestore auto-scales |
| **Availability** | 99.95% | Firestore SLA |

---

## 🧊 Cold Tier (Cloud Storage) - 7 Years

### Purpose & Characteristics

**Use Cases**:
- Long-term compliance (SOC2, GDPR, HIPAA)
- Legal hold & forensics
- Historical analysis (rare)
- Disaster recovery

**Technology**: Cloud Storage (Nearline or Coldline class)

**Data Format**: Parquet (columnar, compressed)

**File Structure**:
```
Bucket Organization:
  gs://audit-archive-{project_id}/
    ├─ {tenant_id}/
    │   ├─ year=2025/
    │   │   ├─ month=01/
    │   │   │   ├─ day=01/
    │   │   │   │   └─ audit_events_20250101_000000.parquet
    │   │   │   ├─ day=02/
    │   │   │   └─ ...
    │   │   ├─ month=02/
    │   │   └─ ...
    │   ├─ year=2026/
    │   └─ ...
    └─ _metadata/
        └─ schema.json

Partitioning:
  - By tenant (for data isolation)
  - By year/month/day (for efficient queries)
  - Each file ~100MB-1GB (optimal for BigQuery)
```

**Parquet Schema**:
```
Schema Definition:
{
  "fields": [
    {"name": "id", "type": "STRING"},
    {"name": "timestamp", "type": "TIMESTAMP"},
    {"name": "type", "type": "STRING"},
    {"name": "category", "type": "STRING"},
    {"name": "level", "type": "STRING"},
    {"name": "actor", "type": "STRING"},
    {"name": "actorType", "type": "STRING"},
    {"name": "resource", "type": "STRING"},
    {"name": "resourceType", "type": "STRING"},
    {"name": "tenantId", "type": "STRING"},
    {"name": "metadata", "type": "JSON"},
    {"name": "requiresReview", "type": "BOOLEAN"},
    {"name": "reviewedAt", "type": "TIMESTAMP"},
    {"name": "reviewedBy", "type": "STRING"}
  ]
}

Compression:
  - Codec: SNAPPY (fast) or GZIP (smaller)
  - Compression ratio: ~5x-10x
  - 1M events (~500MB JSON) → ~50MB Parquet
```

### Lifecycle Management

```
Data Flow:
  Warm Tier Archive Job → Cold Tier Write
  
Cold Tier Write Process:
  1. Query Warm Tier (events older than 90 days)
  2. Export to Parquet:
     - Batch: 50,000 events per file
     - Partition: By tenant, year, month, day
  3. Upload to Cloud Storage:
     - Use resumable uploads
     - Verify checksum
  4. Index in metadata catalog
  5. Delete from Warm Tier

Retention Policy:
  - Archive: 7 years (compliance requirement)
  - Delete: After 7 years (unless legal hold)
  - Legal Hold: Flag files for indefinite retention

Delete Process (yearly at 1 AM):
  1. Query files older than 7 years
  2. Check for legal holds
  3. Delete files without holds
  4. Update metadata catalog
```

### Query Strategy

```
On-Demand Query (via BigQuery):
  1. Create BigQuery external table:
     CREATE EXTERNAL TABLE audit_archive
     OPTIONS (
       format = 'PARQUET',
       uris = ['gs://audit-archive-*/tenant123/year=2023/**']
     )
  
  2. Run SQL query:
     SELECT * FROM audit_archive
     WHERE tenantId = 'tenant123'
       AND timestamp BETWEEN '2023-01-01' AND '2023-12-31'
       AND level = 'CRITICAL'
  
  3. Return results (may take 5-30 seconds)

Optimization:
  - Partition pruning: Only scan relevant partitions
  - Column projection: Only read needed columns
  - Predicate pushdown: Filter at storage level
```

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Write Latency** | <5 seconds | Batch archive |
| **Read Latency** | <30 seconds | BigQuery external table |
| **Throughput** | 100 ops/sec | Batch operations only |
| **Capacity** | Petabytes | Cloud Storage unlimited |
| **Availability** | 99.9% | Cloud Storage SLA |

---

## 🔄 Data Lifecycle Diagram

```
Event Generated (Layer 1-4)
        ↓
┌──────────────────────┐
│ Hot Tier (Redis)     │ ← Immediate write (5ms)
│ TTL: 24 hours        │
│ Capacity: 1M events  │
└──────────┬───────────┘
           │ Age out (23h mark)
           ↓
┌──────────────────────┐
│ Warm Tier (Firestore)│ ← Background job (hourly)
│ TTL: 90 days         │
│ Capacity: Unlimited  │
└──────────┬───────────┘
           │ Archive (90d mark)
           ↓
┌──────────────────────┐
│ Cold Tier (GCS)      │ ← Background job (daily)
│ TTL: 7 years         │
│ Capacity: Petabytes  │
└──────────┬───────────┘
           │ Compliance deletion (7y mark)
           ↓
      [Deleted]
```

---

## 💰 Cost Optimization

### Cost Estimates (per 1M events/month)

| Tier | Storage Cost | Query Cost | Total Monthly |
|------|-------------|------------|---------------|
| **Hot (Redis)** | $50 (Cloud Run + Redis) | $0 (included) | $50 |
| **Warm (Firestore)** | $0.18 (1GB stored) | $0.60 (10K queries) | $0.78 |
| **Cold (GCS)** | $0.01 (10GB Nearline) | $0.05 (100 queries) | $0.06 |
| **Total** | | | **$50.84/month** |

**Cost Breakdown**:
```
Hot Tier (24h):
  - Cloud Run: $0.05/hour = $36/month
  - Redis (2GB): $14/month
  - Total: $50/month

Warm Tier (90d):
  - Storage: 1M events × 0.5KB × 90d ÷ 30d = 1.5GB = $0.27/month
  - Reads: 10K queries × $0.06/100K = $0.60/month
  - Writes: 1M writes × $0.18/100K = $1.80/month
  - Total: $2.67/month

Cold Tier (7y):
  - Storage: 1M events/month × 12 months × 7 years × 0.05KB (compressed)
    = 420MB = $0.01/month (Nearline)
  - Reads (rare): 100 queries/month × $0.50/10K = $0.05/month
  - Total: $0.06/month
```

### Optimization Strategies

```
1. Compression:
   ✅ Use Parquet with SNAPPY compression
   ✅ Saves ~90% storage cost in Cold Tier

2. Lifecycle Policies:
   ✅ Auto-delete after 7 years
   ✅ Use Nearline/Coldline storage classes
   ✅ Archive only necessary fields

3. Query Optimization:
   ✅ Use indexes for Warm Tier queries
   ✅ Partition Cold Tier files by tenant/date
   ✅ Cache Hot Tier in Redis

4. Batch Operations:
   ✅ Batch writes to Firestore (500 events/batch)
   ✅ Batch archival to GCS (50K events/file)
   ✅ Reduces write costs by 90%
```

---

## 🔒 Security & Compliance

### Data Encryption

```
Hot Tier (Redis):
  - In-transit: TLS 1.3
  - At-rest: Redis encryption (optional)

Warm Tier (Firestore):
  - In-transit: TLS 1.3
  - At-rest: Google-managed encryption (default)
  - Customer-managed keys (CMEK) available

Cold Tier (Cloud Storage):
  - In-transit: TLS 1.3
  - At-rest: Google-managed encryption (default)
  - Customer-managed keys (CMEK) recommended
```

### Access Control

```
IAM Roles:
  - Audit Writer: Write to Hot/Warm tiers
  - Audit Reader: Read from all tiers
  - Audit Admin: Full access + lifecycle management
  - Audit Archiver: Archive to Cold Tier

Firestore Security Rules:
  - Enforce tenant isolation
  - Read-only for audit events (no updates/deletes)
  - Write-only for audit collector

Cloud Storage IAM:
  - Bucket-level permissions
  - Object versioning enabled
  - Retention policy (7 years)
```

### Compliance Features

```
Immutability:
  - Firestore: No update/delete operations
  - Cloud Storage: Object versioning + retention lock

Audit Trail:
  - Who accessed audit logs (meta-audit)
  - What queries were run
  - When data was archived/deleted

Data Residency:
  - Configure bucket/Firestore location
  - EU, US, or Asia regions supported
```

---

## 📋 Implementation Checklist

### Phase 1: Warm Tier Foundation (P0)
- [ ] Create Firestore collection `audit_events`
- [ ] Define composite indexes (6 indexes)
- [ ] Implement batch write mechanism
- [ ] Test write performance (target: 1000 ops/sec)
- [ ] Implement query API (Layer 6 integration)

### Phase 2: Hot Tier (P1)
- [ ] Deploy Cloud Run + Redis
- [ ] Implement Redis data structures (sorted sets)
- [ ] Implement TTL-based eviction
- [ ] Implement age-out job (hourly)
- [ ] Test read performance (target: <50ms)

### Phase 3: Cold Tier (P1)
- [ ] Create Cloud Storage bucket with lifecycle policy
- [ ] Implement Parquet export (Warm → Cold)
- [ ] Implement daily archive job
- [ ] Create BigQuery external table for queries
- [ ] Test cold tier query performance

### Phase 4: Lifecycle Management (P2)
- [ ] Implement automated archival (90d → Cold)
- [ ] Implement automated deletion (7y → Delete)
- [ ] Legal hold mechanism
- [ ] Monitoring & alerting for lifecycle jobs

---

## ✅ Success Criteria

| Criteria | Target | How to Verify |
|----------|--------|---------------|
| **Warm Tier Availability** | 99.95% | Firestore SLA |
| **Query Performance** | <500ms p95 | Performance monitoring |
| **Storage Cost** | <$3/month per 1M events | Cost tracking |
| **Data Retention** | 7 years | Compliance audit |
| **Archival Success Rate** | >99.9% | Job monitoring |

---

**Document Maintained By**: AI Architecture Agent  
**Last Updated**: 2025-12-26  
**Next Review**: After Phase 1 implementation
