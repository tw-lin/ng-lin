# Audit System Deployment Guide

Complete step-by-step deployment guide for the GigHub Global Audit Logging System.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Frontend Deployment](#frontend-deployment)
4. [Cloud Functions Deployment](#cloud-functions-deployment)
5. [Firestore Security Rules](#firestore-security-rules)
6. [Monitoring & Alerting](#monitoring--alerting)
7. [Validation & Testing](#validation--testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

```bash
# Node.js 18+ and npm
node --version  # v18.0.0 or higher
npm --version   # 9.0.0 or higher

# Firebase CLI
npm install -g firebase-tools
firebase --version  # 12.0.0 or higher

# Angular CLI
npm install -g @angular/cli
ng version  # 20.0.0 or higher

# Google Cloud SDK (for Cloud Functions)
gcloud --version  # 450.0.0 or higher
```

### Firebase Project Setup

```bash
# 1. Create Firebase project (if not exists)
firebase projects:create gighub-audit-prod

# 2. Login to Firebase
firebase login

# 3. Select project
firebase use gighub-audit-prod

# 4. Enable required services
gcloud services enable \
  firestore.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudscheduler.googleapis.com \
  storage-component.googleapis.com \
  bigquery.googleapis.com
```

### Environment Configuration

Create `.env` files for each environment:

**.env.development**
```bash
FIREBASE_PROJECT_ID=gighub-audit-dev
FIREBASE_REGION=us-central1
FIRESTORE_EMULATOR_HOST=localhost:8080
LOG_LEVEL=debug
```

**.env.production**
```bash
FIREBASE_PROJECT_ID=gighub-audit-prod
FIREBASE_REGION=us-central1
LOG_LEVEL=info
```

---

## Environment Setup

### 1. Install Dependencies

```bash
# Frontend dependencies
npm install

# Cloud Functions dependencies (if using functions)
cd functions
npm install
cd ..
```

### 2. Firestore Setup

```bash
# Create Firestore database (if not exists)
firebase firestore:databases:create --location=us-central1

# Create indexes
firebase deploy --only firestore:indexes
```

**firestore.indexes.json**:
```json
{
  "indexes": [
    {
      "collectionGroup": "audit_events_hot",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "audit_events_hot",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "actorId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "audit_events_hot",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "audit_events_hot",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "level", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "audit_events_hot",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "entityType", "order": "ASCENDING" },
        { "fieldPath": "entityId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "audit_events_warm",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### 3. Cloud Storage Setup

```bash
# Create bucket for COLD tier archives
gsutil mb -l us-central1 gs://gighub-audit-archive-prod

# Set lifecycle policy (optional - manual deletion preferred)
gsutil lifecycle set lifecycle.json gs://gighub-audit-archive-prod
```

**lifecycle.json** (7-year retention):
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 2555
        }
      }
    ]
  }
}
```

### 4. BigQuery Setup

```bash
# Create dataset
bq mk --dataset --location=US gighub_audit_prod

# Create table
bq mk --table \
  gighub_audit_prod.audit_events \
  bigquery-schema.json
```

**bigquery-schema.json**:
```json
[
  {"name": "event_id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "event_type", "type": "STRING", "mode": "REQUIRED"},
  {"name": "tenant_id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "blueprint_id", "type": "STRING", "mode": "NULLABLE"},
  {"name": "timestamp", "type": "TIMESTAMP", "mode": "REQUIRED"},
  {"name": "actor_type", "type": "STRING", "mode": "REQUIRED"},
  {"name": "actor_id", "type": "STRING", "mode": "REQUIRED"},
  {"name": "actor_name", "type": "STRING", "mode": "NULLABLE"},
  {"name": "entity_type", "type": "STRING", "mode": "NULLABLE"},
  {"name": "entity_id", "type": "STRING", "mode": "NULLABLE"},
  {"name": "category", "type": "STRING", "mode": "REQUIRED"},
  {"name": "level", "type": "STRING", "mode": "REQUIRED"},
  {"name": "risk_score", "type": "INTEGER", "mode": "NULLABLE"},
  {"name": "compliance_tags", "type": "STRING", "mode": "REPEATED"},
  {"name": "tier", "type": "STRING", "mode": "REQUIRED"},
  {"name": "operation_type", "type": "STRING", "mode": "NULLABLE"},
  {"name": "outcome", "type": "STRING", "mode": "NULLABLE"},
  {"name": "description", "type": "STRING", "mode": "NULLABLE"},
  {"name": "metadata", "type": "JSON", "mode": "NULLABLE"}
]
```

---

## Frontend Deployment

### 1. Build Application

```bash
# Development build
npm run build

# Production build (optimized)
npm run build:prod

# Verify build
ls -lh dist/
```

### 2. Deploy to Firebase Hosting

```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Preview before deploy
firebase hosting:channel:deploy preview
```

### 3. Verify Deployment

```bash
# Get hosting URL
firebase hosting:sites:get gighub-audit-prod

# Test endpoints
curl https://gighub-audit-prod.web.app
```

---

## Cloud Functions Deployment

### 1. Configure Cloud Function

**functions/src/index.ts**:
```typescript
import * as functions from 'firebase-functions';
import { auditTierMigration } from './audit/audit-tier-migration';

// Export Cloud Function
exports.auditTierMigration = auditTierMigration;
```

### 2. Deploy Cloud Function

```bash
# Deploy all functions
cd functions
npm run deploy

# Deploy specific function
firebase deploy --only functions:auditTierMigration

# Check deployment status
firebase functions:log --only auditTierMigration
```

### 3. Create Cloud Scheduler Job

```bash
# Create scheduler job
gcloud scheduler jobs create pubsub audit-tier-migration-trigger \
  --schedule="0 2 * * *" \
  --time-zone="UTC" \
  --topic="audit-tier-migration" \
  --message-body='{"trigger":"scheduled"}' \
  --location=us-central1

# Verify scheduler
gcloud scheduler jobs list --location=us-central1

# Manual trigger (for testing)
gcloud scheduler jobs run audit-tier-migration-trigger --location=us-central1
```

### 4. Monitor Cloud Function

```bash
# View logs
gcloud logging read "resource.type=cloud_function AND resource.labels.function_name=auditTierMigration" --limit 50

# Check execution count
gcloud monitoring time-series list \
  --filter='metric.type="cloudfunctions.googleapis.com/function/execution_count"'

# Check errors
gcloud logging read "resource.type=cloud_function AND severity>=ERROR" --limit 20
```

---

## Firestore Security Rules

### 1. Update Security Rules

**firestore.rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isTenantMember(tenantId) {
      let memberId = request.auth.uid + '_' + tenantId;
      return exists(/databases/$(database)/documents/blueprintMembers/$(memberId));
    }
    
    function hasPermission(tenantId, permission) {
      let memberId = request.auth.uid + '_' + tenantId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return permission in member.data.permissions;
    }
    
    // HOT tier audit events
    match /audit_events_hot/{eventId} {
      allow read: if isAuthenticated() &&
                     isTenantMember(resource.data.tenantId) &&
                     hasPermission(resource.data.tenantId, 'audit:read');
      
      allow create: if isAuthenticated() &&
                       isTenantMember(request.resource.data.tenantId) &&
                       hasPermission(request.resource.data.tenantId, 'audit:write');
      
      allow update, delete: if false;  // Immutable
    }
    
    // WARM tier audit events
    match /audit_events_warm/{eventId} {
      allow read: if isAuthenticated() &&
                     isTenantMember(resource.data.tenantId) &&
                     hasPermission(resource.data.tenantId, 'audit:read');
      
      allow create: if false;  // Only via Admin SDK
      allow update, delete: if false;  // Immutable
    }
  }
}
```

### 2. Deploy Security Rules

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Test security rules (emulator)
firebase emulators:start --only firestore
npm run test:emulator
```

### 3. Validate Security Rules

```bash
# Run security rules tests
npm run test:security-rules

# Manual validation
firebase firestore:security-rules:test
```

---

## Monitoring & Alerting

### 1. Cloud Monitoring Setup

```bash
# Create alert policies
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Audit Migration Failures" \
  --condition-display-name="High error rate" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=300s \
  --condition-filter='resource.type="cloud_function" AND metric.type="cloudfunctions.googleapis.com/function/execution_count" AND metric.label.status="error"'
```

### 2. Dashboard Creation

Create custom dashboard in Cloud Console:

**Metrics to Monitor**:
- Migration function execution count
- Migration function error rate
- Migration function duration
- Events migrated per day
- Storage bucket size
- BigQuery table size
- Firestore read/write operations

### 3. Log-Based Metrics

```bash
# Create log-based metric for migration statistics
gcloud logging metrics create audit_migration_stats \
  --description="Audit tier migration statistics" \
  --log-filter='resource.type="cloud_function" AND jsonPayload.stats.migratedHotToWarm>0'
```

### 4. Alerting Rules

**Alert on**:
- Migration failures (> 3 in 1 hour)
- High error rate (> 5% of events)
- Function timeout (> 9 minutes)
- BigQuery insertion failures
- Storage write failures

---

## Validation & Testing

### 1. Smoke Tests

```bash
# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance

# Run with emulator
npm run test:emulator
```

### 2. End-to-End Testing

```typescript
// Test complete audit flow
describe('Audit System E2E', () => {
  it('should record, classify, store, and query events', async () => {
    // 1. Record event
    const event = await collectorService.recordAuditEvent({
      eventType: 'user.login',
      actorType: 'user',
      actorId: 'test-user-001'
    });
    
    // 2. Verify classification
    expect(event.category).toBe(EventCategory.AUTH);
    expect(event.riskScore).toBeGreaterThan(0);
    
    // 3. Verify storage
    const stored = await repository.findById(event.eventId);
    expect(stored).toBeTruthy();
    
    // 4. Verify query
    const results = await queryService.getTimeline(
      event.tenantId,
      new Date(Date.now() - 60000),
      new Date()
    );
    expect(results.find(e => e.eventId === event.eventId)).toBeTruthy();
  });
});
```

### 3. Production Validation

```bash
# 1. Deploy to staging first
firebase use gighub-audit-staging
firebase deploy

# 2. Run validation tests
npm run test:e2e -- --config=staging

# 3. Monitor for 24 hours
# 4. Deploy to production
firebase use gighub-audit-prod
firebase deploy
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Migration Function Timeout

**Symptoms**: Function times out after 9 minutes

**Solutions**:
```bash
# 1. Check batch size (reduce if needed)
# 2. Increase timeout (max 540s for HTTP functions)
# 3. Increase memory allocation
firebase functions:config:set \
  migration.timeout=540 \
  migration.memory=1024
```

#### Issue 2: Firestore Permission Denied

**Symptoms**: "PERMISSION_DENIED" errors in logs

**Solutions**:
```bash
# 1. Verify security rules deployment
firebase deploy --only firestore:rules

# 2. Check user permissions
# 3. Verify BlueprintMember documents
```

#### Issue 3: BigQuery Insert Failures

**Symptoms**: Events not appearing in BigQuery

**Solutions**:
```bash
# 1. Check dataset and table exist
bq ls gighub_audit_prod

# 2. Verify schema matches
bq show gighub_audit_prod.audit_events

# 3. Check service account permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/bigquery.dataEditor"
```

#### Issue 4: High Costs

**Symptoms**: Unexpected Firebase bill

**Solutions**:
```bash
# 1. Check Firestore read/write operations
gcloud monitoring time-series list \
  --filter='metric.type="firestore.googleapis.com/document/write_count"'

# 2. Optimize indexes (remove unused)
# 3. Implement rate limiting
# 4. Review retention policies
```

### Debug Commands

```bash
# View recent logs
firebase functions:log --only auditTierMigration --lines 100

# Check function status
firebase functions:list

# View Firestore stats
gcloud firestore indexes list

# Check Cloud Storage usage
gsutil du -sh gs://gighub-audit-archive-prod

# BigQuery storage
bq show --format=prettyjson gighub_audit_prod.audit_events
```

---

## Production Checklist

Before going to production:

### Security
- [ ] Security Rules deployed and tested
- [ ] Service accounts have least-privilege permissions
- [ ] Secrets stored in Secret Manager (not hardcoded)
- [ ] HTTPS enforced for all endpoints
- [ ] Rate limiting configured

### Performance
- [ ] Firestore indexes created
- [ ] Cloud Function memory optimized (512MB recommended)
- [ ] Batch sizes tuned for workload
- [ ] Monitoring dashboards created
- [ ] Alerting rules configured

### Reliability
- [ ] Integration tests passing
- [ ] Performance tests passing
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] On-call rotation established

### Compliance
- [ ] Data retention policies configured (7/90/2555 days)
- [ ] Compliance tags validated (GDPR, HIPAA, etc.)
- [ ] Audit log immutability enforced
- [ ] Access controls reviewed
- [ ] Privacy policy updated

### Cost Optimization
- [ ] Cost estimates reviewed
- [ ] Budget alerts configured
- [ ] Lifecycle policies enabled
- [ ] Unused resources cleaned up
- [ ] Cost monitoring dashboard created

---

## Cost Estimates

### Monthly Costs (Production)

| Volume | Firestore | Cloud Storage | BigQuery | Cloud Functions | Total |
|--------|-----------|---------------|----------|-----------------|-------|
| LOW (10k events/day) | $0.60 | $0.10 | $0.20 | $0.24 | **$1.14** |
| MEDIUM (50k events/day) | $3.00 | $0.50 | $1.00 | $0.80 | **$5.30** |
| HIGH (100k events/day) | $6.00 | $1.20 | $2.00 | $3.00 | **$12.20** |

**Cost Reduction**: 68-85% vs single-tier storage

---

## Support & Resources

- **Documentation**: `/docs/audit/`
- **API Reference**: `/docs/audit/API_REFERENCE.md`
- **Architecture**: `/docs/⭐️/audit-layers/`
- **GitHub Issues**: [Report issues](https://github.com/ac484/ng-lin/issues)
- **Firebase Console**: [View logs and metrics](https://console.firebase.google.com)

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-26  
**Phase**: Phase 1 Complete  
**Maintainer**: Audit System Team
