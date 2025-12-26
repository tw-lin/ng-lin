# Event Bus - Production Runbook

Operational procedures for the ng-lin Event Bus system in production environments.

## Table of Contents

1. [Overview](#overview)
2. [Incident Response](#incident-response)
3. [Maintenance Procedures](#maintenance-procedures)
4. [Troubleshooting](#troubleshooting)
5. [Disaster Recovery](#disaster-recovery)
6. [Monitoring & Alerting](#monitoring--alerting)
7. [Performance Optimization](#performance-optimization)
8. [Security Operations](#security-operations)

---

## Overview

### System Components

| Component | Purpose | Location |
|-----------|---------|----------|
| InMemoryEventBus | Zero-latency local events | `src/app/core/services/in-memory-event-bus.service.ts` |
| FirebaseEventBus | Distributed real-time events | `src/app/core/services/firebase-event-bus.service.ts` |
| Event Store | Persistent event storage | Firestore `/event-store/{blueprintId}/events` |
| Dead Letter Queue | Failed event tracking | In-memory or Firestore |
| Event Consumers | Event handlers | Various services with `@Subscribe` decorators |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Event Publishers                     │
│  (Services publishing domain events via EventBus)       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Event Bus Layer                       │
│  ┌──────────────────────┐  ┌──────────────────────────┐│
│  │  InMemoryEventBus    │  │   FirebaseEventBus       ││
│  │  (0ms latency)       │  │   (300-500ms latency)    ││
│  └──────────────────────┘  └──────────────────────────┘│
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Event Consumers                        │
│  (Services with @Subscribe decorators)                  │
│  - AuditLogService                                      │
│  - AuthAuditService                                     │
│  - PermissionAuditService                               │
│  - TenantValidationService                              │
│  - TenantContextService                                 │
└─────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Event Store                           │
│  (Firestore persistence + Snapshots)                    │
└─────────────────────────────────────────────────────────┘
```

### On-Call Information

**Primary Contact**: DevOps Team  
**Escalation Path**: DevOps → Engineering Lead → CTO  
**Response Times**:
- **CRITICAL**: Immediate (PagerDuty page)
- **HIGH**: 15 minutes (Slack alert)
- **MEDIUM**: 1 hour (Slack alert)
- **LOW**: Next business day

---

## Incident Response

### 1. Event Publishing Failures

**Symptoms**:
- Events not appearing in Event Store
- Publishers receiving errors
- DLQ growing rapidly

**Diagnosis**:

```bash
# Check recent publishing attempts
gcloud logging read "resource.type=\"firestore_database\"
  AND jsonPayload.event_type=\"publish_failed\"
  AND timestamp >= \"$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
  --limit=50 --format=json

# Check Firestore connectivity
firebase database:get /event-store/test-blueprint --project your-project-id

# Check Security Rules
firebase deploy --only firestore:rules --project your-project-id --dry-run
```

**Resolution Steps**:

1. **Verify Firestore connectivity**:
   ```typescript
   // Test connectivity
   const testEvent = {
     type: 'test.connectivity',
     data: { timestamp: new Date().toISOString() }
   };
   await eventBus.publish(testEvent);
   ```

2. **Check Security Rules**:
   - Verify BlueprintMember has `event:create` permission
   - Check multi-tenant isolation rules
   - Test rules with Firebase Emulator

3. **Analyze error logs**:
   ```bash
   # Get detailed error messages
   gcloud logging read "resource.type=\"firestore_database\"
     AND severity=\"ERROR\"
     AND timestamp >= \"$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
     --limit=50
   ```

4. **Temporary mitigation**:
   - Switch to InMemoryEventBus temporarily
   - Queue failed events for later replay
   - Increase retry attempts

5. **Rollback if needed**:
   ```bash
   # Revert to previous deployment
   firebase hosting:channel:deploy previous-version --project your-project-id
   ```

**Post-Incident**:
- Document root cause
- Update monitoring thresholds
- Implement preventive measures
- Schedule post-mortem meeting

---

### 2. Consumer Processing Errors

**Symptoms**:
- Consumers throwing exceptions
- DLQ growing
- Events being retried repeatedly

**Diagnosis**:

```bash
# Check consumer errors
gcloud logging read "resource.type=\"cloud_function\"
  AND jsonPayload.consumer_name IS NOT NULL
  AND severity=\"ERROR\"
  AND timestamp >= \"$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
  --limit=50

# Check DLQ size
# (In-memory DLQ)
console.log('DLQ size:', eventBus.getDeadLetterQueue().length);

# (Firestore DLQ)
gcloud firestore documents list event-store/dlq --project your-project-id
```

**Resolution Steps**:

1. **Identify failing consumer**:
   ```bash
   # Find consumer with most errors
   gcloud logging read "severity=\"ERROR\"
     AND jsonPayload.consumer_name IS NOT NULL" \
     --limit=100 --format=json | \
     jq -r '.[] | .jsonPayload.consumer_name' | sort | uniq -c | sort -rn
   ```

2. **Analyze DLQ events**:
   ```typescript
   // Retrieve DLQ events
   const dlqEvents = eventBus.getDeadLetterQueue();
   console.log('Failed events:', dlqEvents.map(e => ({
     type: e.type,
     error: e.error,
     retryCount: e.retryCount
   })));
   ```

3. **Fix consumer bug**:
   - Review consumer code
   - Add defensive error handling
   - Implement input validation
   - Deploy hotfix

4. **Replay failed events**:
   ```typescript
   // Replay events from DLQ
   const dlq = eventBus.getDeadLetterQueue();
   for (const event of dlq) {
     try {
       await eventBus.publish(event);
       console.log(`Replayed event ${event.id}`);
     } catch (error) {
       console.error(`Failed to replay ${event.id}:`, error);
     }
   }
   ```

5. **Clear DLQ**:
   ```typescript
   // After successful replay
   eventBus.clearDeadLetterQueue();
   ```

**Post-Incident**:
- Update consumer error handling
- Add more detailed logging
- Implement circuit breaker pattern
- Schedule consumer code review

---

### 3. High Event Latency

**Symptoms**:
- Events delayed by >1 second
- User-visible delays in UI
- Performance monitoring alerts

**Diagnosis**:

```bash
# Check event latency
gcloud logging read "resource.type=\"firestore_database\"
  AND jsonPayload.event_latency_ms > 1000
  AND timestamp >= \"$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
  --limit=50

# Check Firestore performance
gcloud monitoring time-series list \
  --filter='metric.type="firestore.googleapis.com/document/write_count"' \
  --interval-start-time="15 minutes ago" \
  --interval-end-time="now"
```

**Resolution Steps**:

1. **Check batching configuration**:
   ```typescript
   // Verify batching is enabled
   const config: FirebaseEventBusConfig = {
     batchSize: 500,          // Should be 100-500
     batchInterval: 1000,     // Should be 500-2000ms
     maxRetries: 3,
     retryDelay: 1000
   };
   ```

2. **Analyze Firestore performance**:
   - Check read/write quotas
   - Review index performance
   - Check collection size

3. **Switch to InMemoryEventBus temporarily**:
   ```typescript
   // Use InMemoryEventBus for low-latency
   import { InMemoryEventBus } from '@core/services';
   
   providers: [
     { provide: IEventBus, useClass: InMemoryEventBus }
   ]
   ```

4. **Optimize queries**:
   ```typescript
   // Add composite indexes for common queries
   // firestore.indexes.json
   {
     "indexes": [
       {
         "collectionGroup": "events",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "blueprintId", "order": "ASCENDING" },
           { "fieldPath": "timestamp", "order": "DESCENDING" }
         ]
       }
     ]
   }
   ```

5. **Deploy optimization**:
   ```bash
   firebase deploy --only firestore:indexes --project your-project-id
   ```

**Post-Incident**:
- Review batching strategy
- Implement adaptive batching
- Add latency monitoring
- Schedule performance tuning

---

### 4. Security Rules Denials

**Symptoms**:
- Permission denied errors
- Events failing to publish
- Audit log showing denials

**Diagnosis**:

```bash
# Check Security Rules denials
gcloud logging read "resource.type=\"firestore_database\"
  AND protoPayload.status.code=7
  AND timestamp >= \"$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
  --limit=50

# Get denied paths
gcloud logging read "protoPayload.status.code=7" \
  --format=json | jq -r '.[] | .protoPayload.resourceName'
```

**Resolution Steps**:

1. **Verify BlueprintMember status**:
   ```typescript
   // Check user permissions
   const memberId = `${userId}_${blueprintId}`;
   const member = await firestore
     .collection('blueprintMembers')
     .doc(memberId)
     .get();
   
   console.log('Member status:', member.data()?.status);
   console.log('Permissions:', member.data()?.permissions);
   ```

2. **Check Security Rules**:
   ```javascript
   // Verify event:create permission
   match /event-store/{blueprintId}/events/{eventId} {
     allow create: if isAuthenticated() &&
                      isBlueprintMember(blueprintId) &&
                      hasPermission(blueprintId, 'event:create');
   }
   ```

3. **Test rules locally**:
   ```bash
   # Start emulator
   firebase emulators:start --only firestore

   # Run rules tests
   npm run test:rules
   ```

4. **Update Security Rules if needed**:
   ```bash
   # Deploy updated rules
   firebase deploy --only firestore:rules --project your-project-id
   ```

5. **Verify fix**:
   ```typescript
   // Test event publishing
   const testEvent = {
     type: 'test.security',
     blueprintId,
     data: { test: true }
   };
   await eventBus.publish(testEvent);
   ```

**Post-Incident**:
- Review permission model
- Update Security Rules tests
- Document common denial patterns
- Schedule security audit

---

### 5. DLQ Overflow

**Symptoms**:
- DLQ size exceeds limit (10,000 events)
- Memory pressure warnings
- Events being dropped

**Diagnosis**:

```bash
# Check DLQ size
gcloud logging read "jsonPayload.dlq_size > 9000
  AND timestamp >= \"$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
  --limit=10

# Analyze failure patterns
gcloud logging read "jsonPayload.dlq_event IS NOT NULL" \
  --format=json | jq -r '.[] | .jsonPayload.dlq_event.type' | \
  sort | uniq -c | sort -rn
```

**Resolution Steps**:

1. **Analyze failure patterns**:
   ```typescript
   // Group events by type
   const dlq = eventBus.getDeadLetterQueue();
   const grouped = dlq.reduce((acc, event) => {
     acc[event.type] = (acc[event.type] || 0) + 1;
     return acc;
   }, {} as Record<string, number>);
   
   console.log('Failure patterns:', grouped);
   ```

2. **Fix root cause**:
   - Identify failing consumer
   - Fix bug or add error handling
   - Deploy hotfix

3. **Implement emergency cleanup**:
   ```typescript
   // Remove old failed events
   const now = Date.now();
   const oldEvents = dlq.filter(e => 
     now - e.timestamp.getTime() > 24 * 60 * 60 * 1000 // 24 hours
   );
   
   // Move to archive
   await archiveDLQEvents(oldEvents);
   
   // Remove from DLQ
   oldEvents.forEach(e => dlq.remove(e.id));
   ```

4. **Retry failed events**:
   ```typescript
   // Retry in batches
   const BATCH_SIZE = 100;
   for (let i = 0; i < dlq.length; i += BATCH_SIZE) {
     const batch = dlq.slice(i, i + BATCH_SIZE);
     await eventBus.publishBatch(batch);
     await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
   }
   ```

5. **Increase DLQ limit if needed**:
   ```typescript
   // Temporary increase
   const config: InMemoryEventBusConfig = {
     maxQueueSize: 20000, // Increased from 10000
     enableDLQ: true,
     maxRetries: 3
   };
   ```

**Post-Incident**:
- Implement DLQ monitoring alerts
- Add automatic cleanup job
- Review retry strategy
- Schedule DLQ architecture review

---

### 6. Event Loss Detection

**Symptoms**:
- Missing events in Event Store
- Gaps in event version numbers
- Data inconsistency reports

**Diagnosis**:

```bash
# Check for missing events
gcloud logging read "jsonPayload.event_loss_detected=true
  AND timestamp >= \"$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
  --limit=10

# Verify Event Store integrity
gcloud firestore export gs://your-backup-bucket/integrity-check
```

**Resolution Steps**:

1. **Check Event Store integrity**:
   ```typescript
   // Verify event sequence
   const events = await firestore
     .collection(`event-store/${blueprintId}/events`)
     .orderBy('version')
     .get();
   
   let expectedVersion = 1;
   const missing: number[] = [];
   
   events.forEach(doc => {
     const version = doc.data().version;
     if (version !== expectedVersion) {
       missing.push(...Array.from(
         { length: version - expectedVersion },
         (_, i) => expectedVersion + i
       ));
     }
     expectedVersion = version + 1;
   });
   
   console.log('Missing versions:', missing);
   ```

2. **Check audit logs**:
   ```bash
   # Find lost events in logs
   gcloud logging read "jsonPayload.event_id IS NOT NULL
     AND jsonPayload.event_version IN (${missing.join(',')})" \
     --limit=100 --format=json
   ```

3. **Restore from backup**:
   ```bash
   # Restore from latest backup
   gcloud firestore import gs://your-backup-bucket/latest-backup \
     --collection-ids=event-store
   ```

4. **Replay missing events**:
   ```typescript
   // Reconstruct from logs
   const missingEvents = await reconstructFromLogs(missing);
   
   // Replay in order
   for (const event of missingEvents) {
     await eventStore.append(event);
   }
   ```

5. **Verify restoration**:
   ```typescript
   // Re-check integrity
   const eventsAfter = await firestore
     .collection(`event-store/${blueprintId}/events`)
     .orderBy('version')
     .get();
   
   console.log('Events count after restore:', eventsAfter.size);
   ```

**Post-Incident**:
- Implement event integrity checks
- Add automatic backup validation
- Review event publishing reliability
- Schedule disaster recovery drill

---

## Maintenance Procedures

### Event Store Cleanup

**Frequency**: Weekly  
**Duration**: 30-60 minutes  
**Prerequisites**: Production access, backup verification

**Procedure**:

1. **Archive old events** (>90 days):
   ```typescript
   const cutoffDate = new Date();
   cutoffDate.setDate(cutoffDate.getDate() - 90);
   
   // Query old events
   const oldEvents = await firestore
     .collection('event-store')
     .where('timestamp', '<', cutoffDate)
     .get();
   
   console.log(`Found ${oldEvents.size} events to archive`);
   ```

2. **Export to Cloud Storage**:
   ```bash
   # Export old events
   gcloud firestore export gs://your-archive-bucket/events-$(date +%Y%m%d) \
     --collection-ids=event-store \
     --project your-project-id
   ```

3. **Verify export**:
   ```bash
   # List exported files
   gsutil ls -lh gs://your-archive-bucket/events-$(date +%Y%m%d)/
   ```

4. **Delete from Firestore**:
   ```typescript
   // Delete in batches
   const BATCH_SIZE = 500;
   let batch = firestore.batch();
   let count = 0;
   
   oldEvents.forEach(doc => {
     batch.delete(doc.ref);
     count++;
     
     if (count === BATCH_SIZE) {
       await batch.commit();
       batch = firestore.batch();
       count = 0;
     }
   });
   
   // Commit remaining
   if (count > 0) {
     await batch.commit();
   }
   ```

5. **Cleanup snapshots**:
   ```typescript
   // Remove old snapshots
   const oldSnapshots = await firestore
     .collection('event-store')
     .where('snapshot', '==', true)
     .where('timestamp', '<', cutoffDate)
     .get();
   
   // Delete snapshots
   const snapshotBatch = firestore.batch();
   oldSnapshots.forEach(doc => snapshotBatch.delete(doc.ref));
   await snapshotBatch.commit();
   ```

**Verification**:
- Check Firestore size reduction
- Verify archive completeness
- Test event restoration from archive

---

### DLQ Management

**Frequency**: Daily  
**Duration**: 15-30 minutes  
**Prerequisites**: Production access

**Procedure**:

1. **Review failed events**:
   ```typescript
   const dlq = eventBus.getDeadLetterQueue();
   console.log(`DLQ size: ${dlq.length}`);
   
   // Group by error type
   const byError = dlq.reduce((acc, event) => {
     const error = event.error?.message || 'unknown';
     acc[error] = (acc[error] || 0) + 1;
     return acc;
   }, {} as Record<string, number>);
   
   console.log('Errors:', byError);
   ```

2. **Retry recoverable failures**:
   ```typescript
   // Retry events that might succeed now
   const retryable = dlq.filter(e => 
     e.retryCount < 5 && 
     isRetryable(e.error)
   );
   
   for (const event of retryable) {
     try {
       await eventBus.publish(event);
       console.log(`Retried ${event.id} successfully`);
     } catch (error) {
       console.error(`Retry failed for ${event.id}:`, error);
     }
   }
   ```

3. **Discard permanent failures**:
   ```typescript
   // Remove events that will never succeed
   const permanent = dlq.filter(e =>
     e.retryCount >= 5 ||
     isPermanentFailure(e.error)
   );
   
   // Archive before discarding
   await archiveDLQEvents(permanent);
   
   // Remove from DLQ
   permanent.forEach(e => dlq.remove(e.id));
   ```

4. **Analyze patterns**:
   ```typescript
   // Find common issues
   const patterns = analyzeDLQPatterns(dlq);
   console.log('Common patterns:', patterns);
   
   // Example output:
   // {
   //   'Permission denied': 45,
   //   'Consumer timeout': 12,
   //   'Invalid event data': 3
   // }
   ```

5. **Update documentation**:
   - Document new error patterns
   - Update troubleshooting guides
   - Share findings with team

**Verification**:
- DLQ size reduced
- Retryable events processed
- Permanent failures archived

---

### Consumer Health Checks

**Frequency**: Daily  
**Duration**: 10-15 minutes  
**Prerequisites**: Production access

**Procedure**:

1. **Check consumer registration**:
   ```typescript
   // List all registered consumers
   const consumers = eventBus.getRegisteredConsumers();
   console.log(`Registered consumers: ${consumers.length}`);
   
   consumers.forEach(consumer => {
     console.log(`- ${consumer.name}: ${consumer.subscriptions.length} subscriptions`);
   });
   ```

2. **Verify subscriptions**:
   ```typescript
   // Check subscription patterns
   consumers.forEach(consumer => {
     consumer.subscriptions.forEach(sub => {
       console.log(`${consumer.name} subscribes to: ${sub.pattern}`);
     });
   });
   ```

3. **Test event handlers**:
   ```typescript
   // Send test events
   const testEvents = [
     { type: 'test.health.check', data: { timestamp: Date.now() } }
   ];
   
   for (const event of testEvents) {
     try {
       await eventBus.publish(event);
       console.log(`Test event published: ${event.type}`);
     } catch (error) {
       console.error(`Failed to publish test event:`, error);
     }
   }
   ```

4. **Check consumer logs**:
   ```bash
   # Verify consumers received test events
   gcloud logging read "jsonPayload.event_type=\"test.health.check\"
     AND timestamp >= \"$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
     --limit=50
   ```

5. **Report findings**:
   - Document any issues
   - Create tickets for failures
   - Update monitoring alerts

**Verification**:
- All consumers healthy
- Test events processed
- No registration issues

---

## Troubleshooting

### Events Not Publishing

**Symptoms**: Events fail to publish, error messages in logs

**Diagnosis**:
```bash
# Check recent errors
gcloud logging read "severity=\"ERROR\"
  AND jsonPayload.operation=\"publish\"
  AND timestamp >= \"$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
  --limit=20
```

**Common Causes & Solutions**:

1. **Firestore permission denied**:
   - Check Security Rules
   - Verify BlueprintMember status
   - Test with Firebase Emulator

2. **Invalid event data**:
   - Validate event schema
   - Check required fields
   - Review event type naming

3. **Network connectivity issues**:
   - Check Firebase status
   - Verify DNS resolution
   - Test with curl/wget

4. **Quota exceeded**:
   - Review Firestore quotas
   - Implement rate limiting
   - Consider batching

---

### Consumers Not Receiving Events

**Symptoms**: Events published but consumers not triggered

**Diagnosis**:
```typescript
// Check consumer registration
const consumers = eventBus.getRegisteredConsumers();
console.log('Registered consumers:', consumers.map(c => c.name));

// Check subscriptions
consumers.forEach(c => {
  console.log(`${c.name} patterns:`, c.subscriptions.map(s => s.pattern));
});
```

**Common Causes & Solutions**:

1. **Pattern mismatch**:
   - Verify wildcard patterns
   - Test pattern matching
   - Update subscription patterns

2. **Consumer not registered**:
   - Check @Subscribe decorator
   - Verify module imports
   - Test consumer initialization

3. **Handler exceptions**:
   - Check consumer logs
   - Add try-catch blocks
   - Implement error handling

---

## Disaster Recovery

### Event Store Corruption

**RTO**: 4 hours  
**RPO**: 1 hour

**Recovery Steps**:

1. **Assess damage**:
   ```bash
   # Check corruption extent
   gcloud firestore export gs://your-backup-bucket/damage-assessment
   ```

2. **Restore from backup**:
   ```bash
   # Find latest valid backup
   gsutil ls -l gs://your-backup-bucket/ | sort -k 2 | tail -n 1
   
   # Restore
   gcloud firestore import gs://your-backup-bucket/BACKUP_DATE
   ```

3. **Rebuild from snapshots**:
   ```typescript
   // Rebuild corrupted aggregates
   const snapshots = await firestore
     .collection('event-store/snapshots')
     .get();
   
   for (const snapshot of snapshots.docs) {
     await rebuildAggregate(snapshot.data());
   }
   ```

4. **Replay missing events**:
   ```typescript
   // Replay from audit logs
   const missingEvents = await reconstructFromAuditLogs();
   for (const event of missingEvents) {
     await eventStore.append(event);
   }
   ```

5. **Verify integrity**:
   ```typescript
   // Check all aggregates
   await verifyEventStoreIntegrity();
   ```

---

### Consumer Failure Cascade

**RTO**: 1 hour  
**RPO**: Real-time

**Recovery Steps**:

1. **Stop event publishing**:
   ```typescript
   // Pause publishing temporarily
   eventBus.pause();
   ```

2. **Identify root cause**:
   - Check consumer logs
   - Analyze stack traces
   - Review recent deployments

3. **Fix and deploy**:
   - Apply hotfix
   - Deploy to production
   - Verify fix

4. **Restart consumers**:
   ```typescript
   // Restart consumer services
   eventBus.resume();
   ```

5. **Replay queued events**:
   ```typescript
   // Process queued events
   const queued = eventBus.getQueuedEvents();
   await eventBus.publishBatch(queued);
   ```

---

## Monitoring & Alerting

### Key Metrics

| Metric | Target | Alert Threshold | Dashboard |
|--------|--------|-----------------|-----------|
| Event publish rate | >100/sec | <10/sec (5 min) | Event Bus Health |
| Event latency (p95) | <500ms | >2000ms (5 min) | Event Bus Performance |
| Consumer success rate | >99% | <95% (5 min) | Consumer Health |
| DLQ size | <100 | >1000 | Event Bus Health |
| Event Store size | <10GB | >50GB | Storage |

### Cloud Logging Queries

**Event publishing rate**:
```
resource.type="firestore_database"
AND jsonPayload.operation="publish"
AND timestamp >= "@daily"
```

**Consumer failures**:
```
severity="ERROR"
AND jsonPayload.consumer_name != ""
AND timestamp >= "@hourly"
```

**High latency events**:
```
jsonPayload.event_latency_ms > 1000
AND timestamp >= "@hourly"
```

---

## Performance Optimization

### Event Batching

```typescript
// Optimize batch size
const config: FirebaseEventBusConfig = {
  batchSize: 500,        // Tune based on load
  batchInterval: 1000,   // Tune based on latency requirements
  maxRetries: 3,
  retryDelay: 1000
};
```

### Query Optimization

```javascript
// Add composite indexes
{
  "indexes": [
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "blueprintId", "order": "ASCENDING" },
        { "fieldPath": "aggregateId", "order": "ASCENDING" },
        { "fieldPath": "version", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## Security Operations

### Audit Event Access

```bash
# Monitor event access
gcloud logging read "protoPayload.methodName=\"google.firestore.v1.Firestore.GetDocument\"
  AND protoPayload.resourceName=~\"event-store\"
  AND timestamp >= \"@daily\"" \
  --limit=100
```

### Review Security Rules

```bash
# Test Security Rules
firebase emulators:start --only firestore
npm run test:rules
```

---

## Contacts

**DevOps Team**: devops@example.com  
**Engineering Lead**: engineering@example.com  
**Security Team**: security@example.com  
**PagerDuty**: https://example.pagerduty.com  
**Slack Channel**: #event-bus-alerts

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-26  
**Next Review**: 2026-03-26
