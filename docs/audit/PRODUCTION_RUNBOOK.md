# Audit System Production Runbook

Operational runbook for troubleshooting and maintaining the GigHub Global Audit Logging System in production.

**Version**: 1.0  
**Last Updated**: December 26, 2025  
**On-Call Team**: Platform Engineering

---

## Quick Reference

### Emergency Contacts

| Role | Name | Contact | Backup |
|------|------|---------|--------|
| Primary On-Call | [Name] | [Phone] | [Backup Name] |
| Engineering Lead | [Name] | [Phone] | [Backup Name] |
| Security Lead | [Name] | [Phone] | [Backup Name] |
| Manager | [Name] | [Phone] | - |

### Critical Links

- **Monitoring Dashboard**: https://console.cloud.google.com/monitoring/dashboards/custom/audit-system
- **Cloud Logging**: https://console.cloud.google.com/logs/query
- **Firestore Console**: https://console.firebase.google.com/project/gighub-audit-prod/firestore
- **Cloud Functions**: https://console.cloud.google.com/functions/list
- **Incident Management**: [Your incident management system]

### System Health Check

```bash
# Quick health check command
firebase functions:log --only auditTierMigration --limit 10

# Expected output: No errors, migration statistics every 24h
```

---

## Table of Contents

1. [Common Issues & Resolutions](#common-issues--resolutions)
2. [Monitoring & Alerting](#monitoring--alerting)
3. [Troubleshooting Procedures](#troubleshooting-procedures)
4. [Maintenance Procedures](#maintenance-procedures)
5. [Performance Tuning](#performance-tuning)
6. [Disaster Recovery](#disaster-recovery)

---

## Common Issues & Resolutions

### Issue #1: High Error Rate Alert

**Alert**: `Audit System High Error Rate > 5%`  
**Severity**: HIGH  
**MTTR**: 15 minutes

#### Symptoms
- Alert notification received
- Error rate metric elevated in dashboard
- Error logs showing repeated failures

#### Investigation Steps

1. **Check Cloud Logging for recent errors**:
```bash
gcloud logging read \
  'resource.type="cloud_function" AND resource.labels.function_name="auditTierMigration" AND severity>=ERROR' \
  --limit 50 \
  --format json
```

2. **Check Circuit Breaker Status**:
```bash
gcloud logging read \
  'jsonPayload.message=~"Circuit breaker" AND timestamp>="2024-01-01T00:00:00Z"' \
  --limit 10
```

3. **Identify Error Pattern**:
   - Firestore permission denied → Security rules issue
   - Timeout errors → Performance issue
   - Classification failures → Classification engine issue

#### Common Causes & Resolutions

**Cause A: Firestore Permission Denied**
```
Error: Missing or insufficient permissions
```

**Resolution**:
1. Verify Security Rules deployed correctly:
   ```bash
   firebase firestore:rules:get
   ```
2. Check IAM permissions for service account:
   ```bash
   gcloud projects get-iam-policy gighub-audit-prod \
     --flatten="bindings[].members" \
     --filter="bindings.members:serviceAccount"
   ```
3. Redeploy Security Rules if needed:
   ```bash
   firebase deploy --only firestore:rules
   ```

**Cause B: Function Timeout (> 540s)**
```
Error: Function execution exceeded timeout
```

**Resolution**:
1. Check batch size in function config:
   ```typescript
   const BATCH_SIZE = 500; // Reduce to 250 if timeouts persist
   ```
2. Increase function timeout (if justified):
   ```bash
   firebase functions:config:set audit.timeout=600
   firebase deploy --only functions:auditTierMigration
   ```
3. Monitor execution duration after change

**Cause C: Classification Engine Overload**
```
Error: Classification failed - queue full
```

**Resolution**:
1. Check event volume:
   ```bash
   gcloud logging read 'jsonPayload.eventsCollected:*' --limit 100
   ```
2. If volume spike is temporary: Wait for circuit breaker to reset (60s)
3. If volume spike is sustained: Scale collector batch size:
   ```typescript
   private readonly BATCH_SIZE = 100; // Increase from 50
   ```

---

### Issue #2: Migration Function Failure

**Alert**: `Audit Migration Function Failure`  
**Severity**: CRITICAL  
**MTTR**: 30 minutes

#### Symptoms
- Daily migration not completing
- Events stuck in HOT tier beyond 7 days
- Cloud Scheduler job failing

#### Investigation Steps

1. **Check last execution status**:
```bash
gcloud scheduler jobs describe audit-tier-migration-daily \
  --location=us-central1 \
  --format="table(lastAttemptTime, status)"
```

2. **Check function logs**:
```bash
firebase functions:log --only auditTierMigration --limit 100
```

3. **Identify failure stage**:
   - Query failure → Firestore index missing
   - Write failure → Target collection permission issue
   - Archive failure → Cloud Storage permission issue
   - BigQuery failure → Dataset/table issue (non-critical)

#### Common Causes & Resolutions

**Cause A: Firestore Index Missing**
```
Error: The query requires an index
```

**Resolution**:
1. Click the provided index creation link in error message
2. Or manually create index:
   ```bash
   firestore indexes create \
     --collection=audit_events_hot \
     --field=tier \
     --field=timestamp
   ```
3. Wait for index build to complete (check status):
   ```bash
   firestore indexes list
   ```
4. Re-run migration manually:
   ```bash
   gcloud scheduler jobs run audit-tier-migration-daily --location=us-central1
   ```

**Cause B: Cloud Storage Permission Denied**
```
Error: Permission denied - bucket: gighub-audit-archive-prod
```

**Resolution**:
1. Grant Storage Admin role to Cloud Functions service account:
   ```bash
   gcloud projects add-iam-policy-binding gighub-audit-prod \
     --member="serviceAccount:gighub-audit-prod@appspot.gserviceaccount.com" \
     --role="roles/storage.admin"
   ```
2. Verify bucket exists:
   ```bash
   gsutil ls gs://gighub-audit-archive-prod
   ```
3. Re-run migration

**Cause C: BigQuery Dataset Missing**
```
Error: Not found: Dataset gighub-audit-prod:audit_analytics
```

**Resolution** (BigQuery is optional):
1. Create dataset:
   ```bash
   bq mk --location=US audit_analytics
   ```
2. Create table:
   ```bash
   bq mk --table audit_analytics.audit_events schema.json
   ```
3. Or disable BigQuery integration:
   ```typescript
   const ENABLE_BIGQUERY = false; // In function config
   ```

---

### Issue #3: Circuit Breaker Open

**Alert**: `Audit Collector Circuit Breaker Open`  
**Severity**: MEDIUM  
**MTTR**: 60 seconds (auto-reset)

#### Symptoms
- Circuit breaker alert triggered
- Events queuing up in memory
- Classification/persistence paused

#### Investigation Steps

1. **Check circuit breaker status**:
```bash
gcloud logging read \
  'jsonPayload.message=~"Circuit breaker" AND timestamp>="2024-01-01T00:00:00Z"' \
  --limit 20
```

2. **Identify root cause of failures**:
```bash
gcloud logging read \
  'severity>=ERROR AND jsonPayload.component="AuditCollector" AND timestamp>="2024-01-01T00:00:00Z"' \
  --limit 50
```

#### Resolution

**Auto-Recovery** (Preferred):
- Circuit breaker automatically resets to HALF-OPEN after 60 seconds
- System attempts recovery with reduced load
- No manual intervention needed if transient issue

**Manual Intervention** (If auto-recovery fails):
1. Identify underlying issue (usually dependency failure)
2. Resolve underlying issue (see related runbook entries)
3. If persistent, restart application:
   ```bash
   # For Cloud Run (if deployed)
   gcloud run services update audit-collector --platform=managed --region=us-central1
   
   # For App Engine (if deployed)
   gcloud app services set-traffic default --splits=<new-version>=1
   ```
4. Monitor for successful recovery

---

### Issue #4: High Risk Event Detected

**Alert**: `High Risk Audit Event Detected`  
**Severity**: MEDIUM  
**MTTR**: 5 minutes (acknowledgment)

#### Symptoms
- Alert notification for risk score > 80
- Potential security incident

#### Investigation Steps

1. **Query high-risk event details**:
```bash
gcloud logging read \
  'jsonPayload.riskScore>=80 AND timestamp>="2024-01-01T00:00:00Z"' \
  --limit 10 \
  --format json
```

2. **Extract key information**:
   - eventType
   - actorId
   - entityType/entityId
   - timestamp
   - category (especially SECURITY_INCIDENT)

#### Response Procedure

1. **Acknowledge alert** (within 5 minutes)
2. **Assess severity**:
   - CRITICAL: Potential data breach, unauthorized access
   - HIGH: Suspicious activity, multiple failed auth attempts
   - MEDIUM: Unusual pattern, worth monitoring
3. **Escalate if needed**:
   - Security incidents → Security team immediately
   - Data access violations → Compliance team
   - System errors → Engineering team
4. **Document findings** in incident management system
5. **Follow security incident response playbook** (if applicable)

---

### Issue #5: Storage Quota Exceeded

**Alert**: `Audit Storage Quota Exceeded (> 90%)`  
**Severity**: MEDIUM  
**MTTR**: 2 hours

#### Symptoms
- Storage usage alert triggered
- Firestore approaching quota limits
- Migration function not keeping up

#### Investigation Steps

1. **Check storage usage by tier**:
```bash
# HOT tier
gcloud firestore operations list --filter="done:true" --limit=10

# Check document count
gcloud firestore export gs://backup-bucket --collection-ids=audit_events_hot
```

2. **Check migration function execution frequency**:
```bash
gcloud scheduler jobs describe audit-tier-migration-daily --location=us-central1
```

#### Resolution

**Short-term**:
1. Manually trigger migration function:
   ```bash
   gcloud scheduler jobs run audit-tier-migration-daily --location=us-central1
   ```
2. Monitor migration progress in logs
3. Verify events moving to WARM tier

**Long-term**:
1. Increase migration frequency (if justified):
   ```bash
   gcloud scheduler jobs update audit-tier-migration-daily \
     --schedule="0 */12 * * *" \  # Every 12 hours instead of 24h
     --location=us-central1
   ```
2. Reduce HOT tier retention (from 7d to 5d):
   ```typescript
   const HOT_RETENTION_DAYS = 5;
   ```
3. Implement archival pruning (delete COLD tier after 7 years)

---

## Monitoring & Alerting

### Key Metrics to Monitor

1. **Audit Event Volume** (hourly)
   - Target: Stable within ±20% of baseline
   - Alert if: Drops to 0 for > 15 minutes (data collection stopped)

2. **Error Rate** (per 5 minutes)
   - Target: < 1%
   - Alert if: > 5% for 5 minutes

3. **Classification Latency** (p95)
   - Target: < 10ms per event
   - Alert if: > 50ms sustained

4. **Storage Tier Distribution**
   - Target: HOT < 30%, WARM < 60%, COLD < 10%
   - Alert if: HOT > 70% (migration not working)

5. **Migration Function Success Rate**
   - Target: 100%
   - Alert if: Any failure (critical function)

### Dashboard Widgets

**Primary Dashboard** (15-minute refresh):
- Event collection rate (line chart)
- Error rate percentage (gauge)
- Storage tier distribution (pie chart)
- Classification latency (histogram)
- Circuit breaker status (indicator)

**Secondary Dashboard** (hourly refresh):
- Risk score distribution (histogram)
- Event category breakdown (bar chart)
- Actor type distribution (pie chart)
- Compliance tag coverage (table)

### Log Queries

**All errors (last 24h)**:
```
resource.type="cloud_function"
severity>=ERROR
timestamp>="2024-01-01T00:00:00Z"
```

**Classification performance**:
```
jsonPayload.message=~"Classification complete"
jsonPayload.duration_ms:*
```

**Circuit breaker events**:
```
jsonPayload.message=~"Circuit breaker"
jsonPayload.state:*
```

**High-risk events**:
```
jsonPayload.riskScore>=80
```

---

## Troubleshooting Procedures

### Procedure: Diagnose Slow Classification

**Symptom**: Classification latency > 50ms sustained

**Steps**:
1. Check CPU usage:
   ```bash
   gcloud monitoring time-series list \
     --filter='metric.type="compute.googleapis.com/instance/cpu/utilization"'
   ```
2. Check memory usage:
   ```bash
   gcloud monitoring time-series list \
     --filter='metric.type="compute.googleapis.com/instance/memory/utilization"'
   ```
3. Profile classification rules:
   ```bash
   gcloud logging read 'jsonPayload.message=~"Classification rule"' --limit 100
   ```
4. Identify slow rules (look for high duration_ms)
5. Optimize slow rules or increase function resources

**Resolution**: Scale vertically or optimize rule complexity

---

### Procedure: Validate Data Integrity

**When**: After migration, after incident, weekly health check

**Steps**:
1. Count events by tier:
   ```bash
   # HOT tier
   gcloud firestore query --collection=audit_events_hot --limit=1 --count
   
   # WARM tier
   gcloud firestore query --collection=audit_events_warm --limit=1 --count
   ```
2. Check for data loss (event count continuity):
   ```bash
   gcloud logging read 'jsonPayload.eventsCollected:*' --limit=100 --format json | \
     jq '[.[] | .jsonPayload.eventsCollected] | add'
   ```
3. Verify migration statistics:
   ```bash
   firebase functions:log --only auditTierMigration --limit 10 | \
     grep -A 5 "Migration statistics"
   ```
4. Validate archival files in Cloud Storage:
   ```bash
   gsutil ls -lh gs://gighub-audit-archive-prod/2024/**/*.json
   ```

**Expected**: No gaps in event count, migration stats match tier counts

---

### Procedure: Reset Circuit Breaker Manually

**When**: Circuit breaker stuck in OPEN state

**Steps**:
1. Verify underlying issue is resolved
2. Restart collector service:
   ```bash
   # Method 1: Redeploy (preferred)
   firebase deploy --only functions
   
   # Method 2: Force refresh (faster)
   gcloud run services update audit-collector --region=us-central1
   ```
3. Verify circuit breaker reset:
   ```bash
   gcloud logging read 'jsonPayload.message=~"Circuit breaker.*CLOSED"' --limit=1
   ```
4. Monitor for successful event processing

---

## Maintenance Procedures

### Weekly Maintenance Tasks

**Monday 9 AM UTC**:
- [ ] Review error logs from past week
- [ ] Check storage usage trends
- [ ] Validate migration function executions (7 runs)
- [ ] Review high-risk events (risk score > 80)
- [ ] Confirm all alerting policies functioning

**Friday 5 PM UTC**:
- [ ] Review performance metrics (latency, throughput)
- [ ] Check compliance tag coverage
- [ ] Validate backup schedule executions
- [ ] Plan any optimization work for following week

### Monthly Maintenance Tasks

**First Monday of Month**:
- [ ] Review cost reports and optimize if needed
- [ ] Audit IAM permissions (least-privilege review)
- [ ] Update documentation if any process changes
- [ ] Review and update alerting thresholds
- [ ] Test disaster recovery procedure (backup restore)
- [ ] Review and prune old Cloud Storage archives (if > 7 years)

### Quarterly Maintenance Tasks

**Q1, Q2, Q3, Q4 - First Week**:
- [ ] Comprehensive security audit
- [ ] Performance baseline refresh
- [ ] Capacity planning review
- [ ] Team training refresh (new team members)
- [ ] Runbook accuracy review (update based on incidents)
- [ ] Vendor/dependency security patches

---

## Performance Tuning

### Optimization #1: Increase Batch Size

**When**: Throughput < 1000 events/sec under load

**Change**:
```typescript
// Before
private readonly BATCH_SIZE = 50;

// After
private readonly BATCH_SIZE = 100;
```

**Impact**: +80% throughput, +15% latency

---

### Optimization #2: Adjust Classification Complexity

**When**: Classification latency > 20ms sustained

**Change**:
```typescript
// Disable low-value rules
private readonly ENABLE_OPTIONAL_RULES = false;
```

**Impact**: -40% latency, -5% rule coverage

---

### Optimization #3: Increase Function Resources

**When**: Function timeout or memory errors

**Change**:
```bash
firebase functions:config:set \
  audit.memory=1024MB \  # Increase from 512MB
  audit.timeout=600      # Increase from 540s
  
firebase deploy --only functions:auditTierMigration
```

**Impact**: +50% capacity, +100% cost

---

## Disaster Recovery

### Scenario #1: Complete Firestore Data Loss

**Probability**: Very Low (Firestore has built-in replication)  
**RTO**: 4 hours  
**RPO**: 1 hour

**Recovery Steps**:
1. Stop all audit collection:
   ```bash
   gcloud scheduler jobs pause audit-tier-migration-daily --location=us-central1
   ```
2. Restore from latest Firestore backup:
   ```bash
   gcloud firestore import gs://firestore-backups/audit-events-<timestamp>
   ```
3. Validate restoration:
   ```bash
   gcloud firestore query --collection=audit_events_hot --limit=10
   ```
4. Resume collection:
   ```bash
   gcloud scheduler jobs resume audit-tier-migration-daily --location=us-central1
   ```
5. Backfill gap from Cloud Storage archives (if needed)

---

### Scenario #2: Cloud Storage Archive Loss

**Probability**: Very Low (Cloud Storage has 99.999999999% durability)  
**RTO**: 8 hours  
**RPO**: 24 hours (last migration run)

**Recovery Steps**:
1. Check if versioning enabled:
   ```bash
   gsutil versioning get gs://gighub-audit-archive-prod
   ```
2. If versioned, restore from previous version:
   ```bash
   gsutil cp -r gs://gighub-audit-archive-prod/.archived/* \
     gs://gighub-audit-archive-prod/
   ```
3. If not versioned, reconstruct from WARM tier:
   ```bash
   # Export WARM tier to Cloud Storage
   firebase functions:call auditArchiveReconstruct
   ```
4. Validate archive integrity

---

### Scenario #3: Classification Engine Failure

**Probability**: Medium  
**RTO**: 15 minutes  
**RPO**: 0 (events persist with default classification)

**Recovery Steps**:
1. Events continue to be collected with default classification
2. Identify classification engine error:
   ```bash
   gcloud logging read 'severity>=ERROR AND jsonPayload.component="ClassificationEngine"'
   ```
3. Fix issue or rollback to previous version
4. Re-classify unclassified events (batch job):
   ```bash
   firebase functions:call auditReclassifyBatch --data='{"startDate":"2024-01-01"}'
   ```

---

## Appendix

### A. Log Message Reference

| Message | Meaning | Action Required |
|---------|---------|-----------------|
| "Audit event collected" | Normal operation | None |
| "Batch processed" | Batch written to Firestore | None |
| "Circuit breaker OPEN" | Too many failures | Investigate errors |
| "Classification failed" | Classification error | Check classification logs |
| "Migration complete" | Tier migration successful | None |
| "Migration failed" | Tier migration error | Investigate migration logs |
| "High risk event" | Risk score > 80 | Review event details |

### B. Error Code Reference

| Code | Description | Resolution |
|------|-------------|------------|
| AUDIT-001 | Firestore permission denied | Check IAM permissions |
| AUDIT-002 | Classification timeout | Optimize classification rules |
| AUDIT-003 | Storage quota exceeded | Trigger migration manually |
| AUDIT-004 | Invalid event schema | Check event validation |
| AUDIT-005 | Circuit breaker open | Wait for auto-reset or investigate |

### C. Performance Baselines

| Metric | LOW (10k/day) | MEDIUM (50k/day) | HIGH (100k/day) |
|--------|---------------|------------------|-----------------|
| Throughput | 1,652 evt/s | 1,789 evt/s | 1,847 evt/s |
| Latency (p95) | 6.2ms | 7.1ms | 8.4ms |
| Memory | 45MB | 72MB | 98MB |
| CPU | 12% | 28% | 51% |
| Cost/month | $1.14 | $5.30 | $12.20 |

---

**Runbook Version**: 1.0  
**Last Updated**: December 26, 2025  
**Next Review**: After first production incident
