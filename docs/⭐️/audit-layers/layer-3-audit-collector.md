# Layer 3: Audit Collector (Event Intake)
## Event Subscription & Intake Layer

> **角色定位**: Architecture & Interaction Focus  
> **層級編號**: Layer 3 of 8  
> **建立日期**: 2025-12-26  
> **核心職責**: Subscribe to Event Bus, filter events, enrich metadata, forward to Classification Engine

---

## 🎯 Layer Purpose

The Audit Collector is the **event intake gateway** that:
1. **Subscribes** to all events from Event Bus (wildcard `'*'` pattern)
2. **Filters** events based on audit relevance (not all events need auditing)
3. **Enriches** events with additional metadata (IP, location, user-agent)
4. **Routes** enriched events to Classification Engine (Layer 4)

**Core Principle**: Passive observer - never modifies event payloads, only enriches metadata.

---

## 📐 Architecture Overview

### Position in 8-Layer Topology

```
Layer 1: Event Sources (Business Modules)
              ↓ Publish domain events
Layer 2: Event Bus (Distribution Center)
              ↓ Broadcast to all subscribers
┌─────────────────────────────────────────────────┐
│ Layer 3: Audit Collector (Event Intake) ← HERE │
│  - Subscribe to '*' pattern                     │
│  - Filter auditable events                      │
│  - Enrich with metadata                         │
│  - Forward to Classification Engine             │
└─────────────────────────────────────────────────┘
              ↓ Enriched events
Layer 4: Classification Engine
              ↓ Categorized events
Layer 5-8: Storage, Query, Export, Review
```

### Collector Types (Domain-Specific)

```
[Event Bus]
    ↓ Broadcasts all events
    ├─> [Auth Audit Collector]         ← Filters auth.* events
    ├─> [Data Audit Collector]         ← Filters firestore.*, repo.*, data.*
    ├─> [Business Audit Collector]     ← Filters issue.*, pr.*, org.*
    ├─> [AI Audit Collector]           ← Filters ai.* events
    └─> [System Audit Collector]       ← Filters config.*, system.* events
    
All collectors forward to:
    ↓
[Classification Engine (Layer 4)]
```

---

## 🔄 Collector Workflow

### 1. Event Subscription

**Subscription Pattern**:
```
Event Bus exposes:
  subscribe(pattern: string, callback: (event: DomainEvent) => void)

Audit Collector subscribes:
  eventBus.subscribe('*', (event) => {
    if (shouldAudit(event)) {
      enrichAndForward(event);
    }
  })
```

**Subscription Scope**:
- ✅ Subscribe to ALL events (wildcard `'*'`)
- ✅ Single subscription per collector type
- ✅ Auto-reconnect on failure
- ❌ No manual event filtering at source

### 2. Event Filtering

**Filtering Logic**:
```
shouldAudit(event: DomainEvent): boolean {
  // Rule 1: Must have tenant context
  if (!event.tenantId) {
    log.warn('Event missing tenantId, skipping audit', event);
    return false;
  }
  
  // Rule 2: Check event type against audit rules
  const auditRules = getAuditRules();
  const shouldAudit = auditRules.some(rule => 
    matchesPattern(event.type, rule.pattern) && rule.enabled
  );
  
  // Rule 3: Respect explicit noAudit flag
  if (event.metadata?.noAudit === true) {
    return false;
  }
  
  return shouldAudit;
}
```

**Audit Rules Configuration**:
```
Audit Rules Table (Firestore):
{
  pattern: 'auth.*',
  enabled: true,
  priority: 'HIGH',
  minLevel: 'INFO'
},
{
  pattern: 'repo.*',
  enabled: true,
  priority: 'HIGH',
  minLevel: 'INFO'
},
{
  pattern: 'ui.click.*',
  enabled: false,  // Too noisy
  priority: 'LOW',
  minLevel: 'DEBUG'
}
```

### 3. Event Enrichment

**Enrichment Process**:
```
enrichEvent(event: DomainEvent): EnrichedAuditEvent {
  return {
    ...event,  // Original event payload
    
    // Audit-specific metadata
    audit_metadata: {
      ingested_at: new Date(),
      collector_id: 'auth-audit-collector',
      collector_version: 'v1.0.0',
      
      // User context enrichment
      actor_context: {
        ip_address: getCurrentIP(),
        user_agent: getCurrentUserAgent(),
        location: getGeoLocation(),
        session_id: getCurrentSessionId()
      },
      
      // Tenant context enrichment
      tenant_context: {
        tenant_id: event.tenantId,
        tenant_name: getTenantName(event.tenantId),
        tenant_tier: getTenantTier(event.tenantId)
      },
      
      // System context enrichment
      system_context: {
        environment: process.env.NODE_ENV,
        platform: 'firebase',
        region: 'us-central1'
      }
    }
  };
}
```

**Enrichment Sources**:
| Data | Source | Example |
|------|--------|---------|
| **IP Address** | HTTP Request Headers | `192.168.1.1` |
| **User Agent** | HTTP Request Headers | `Mozilla/5.0 ...` |
| **Geo Location** | IP Geolocation API | `US, California, San Francisco` |
| **Session ID** | Auth Token / Cookie | `session-abc-123` |
| **Tenant Name** | Firestore /organizations/{id} | `Acme Corp` |
| **Tenant Tier** | Firestore /organizations/{id}/subscription | `enterprise` |

### 4. Forward to Classification Engine

**Routing Logic**:
```
forwardToClassifier(enrichedEvent: EnrichedAuditEvent): void {
  // Publish to internal event stream for Classification Engine
  classificationQueue.publish({
    type: 'audit.event.collected',
    payload: enrichedEvent,
    metadata: {
      collector: 'auth-audit-collector',
      timestamp: new Date()
    }
  });
}
```

---

## 🏗️ Collector Types (Domain-Specific)

### 1. Auth Audit Collector

**Responsibility**: Capture authentication & authorization events

**Event Patterns**:
```
Subscribes to:
  - auth.user.login
  - auth.user.logout
  - auth.login.failed
  - auth.password.changed
  - auth.mfa.enabled
  - auth.token.refreshed
  - auth.session.expired
  - auth.permission.changed
  - auth.role.changed
```

**Enrichment Specifics**:
```
Additional metadata for auth events:
  - Failed login attempts count (last 24h)
  - Login location history
  - MFA status
  - Last password change date
```

### 2. Data Audit Collector

**Responsibility**: Capture data access & modification events

**Event Patterns**:
```
Subscribes to:
  - firestore.read
  - firestore.write
  - firestore.delete
  - data.*.created
  - data.*.updated
  - data.*.deleted
  - security_rules.denied
```

**Enrichment Specifics**:
```
Additional metadata for data events:
  - Collection name
  - Document ID
  - Field-level changes (diff)
  - Security rules evaluation result
```

### 3. Business Audit Collector

**Responsibility**: Capture business domain events

**Event Patterns**:
```
Subscribes to:
  - repo.* (created, deleted, visibility_changed)
  - issue.* (opened, closed, assigned, commented)
  - pr.* (opened, merged, reviewed)
  - org.* (member_added, settings_updated)
  - team.* (created, member_added)
```

**Enrichment Specifics**:
```
Additional metadata for business events:
  - Resource visibility (public/private)
  - Affected user count
  - Workflow stage (draft, in-review, completed)
```

### 4. AI Audit Collector

**Responsibility**: Capture AI decision & compliance events

**Event Patterns**:
```
Subscribes to:
  - ai.decision.*
  - ai.compliance.*
  - ai.dataflow.*
  - ai.side_effect.*
  - ai.action.*
```

**Enrichment Specifics**:
```
Additional metadata for AI events:
  - AI agent version
  - Guideline files checked
  - Compliance status
  - Decision confidence score
```

### 5. System Audit Collector

**Responsibility**: Capture system configuration & error events

**Event Patterns**:
```
Subscribes to:
  - config.* (security_rules.updated, index.created)
  - system.* (error, warning, performance_degradation)
  - functions.* (invoked, error, timeout)
```

**Enrichment Specifics**:
```
Additional metadata for system events:
  - System health metrics
  - Resource utilization
  - Error stack trace
```

---

## 📊 Performance Characteristics

### Target Metrics

| Metric | Target | Current | Priority |
|--------|--------|---------|----------|
| **Event Processing Time** | <10ms | TBD | 🔴 P0 |
| **Enrichment Overhead** | <5ms | TBD | 🟡 P1 |
| **Filter Accuracy** | 100% | TBD | 🔴 P0 |
| **Memory Usage** | <50MB | TBD | 🟡 P2 |
| **Error Rate** | <0.1% | TBD | 🔴 P0 |

### Scalability Considerations

```
Throughput Targets:
  - Low Volume: 10 events/sec (startup, small org)
  - Medium Volume: 100 events/sec (growing org)
  - High Volume: 1000 events/sec (enterprise org)
  - Peak Volume: 5000 events/sec (spike during deployments)

Scaling Strategy:
  - Horizontal: Multiple collector instances (Cloud Functions)
  - Partitioning: One collector per tenant (if needed)
  - Batching: Process events in batches of 10-50
  - Async Processing: Non-blocking enrichment
```

---

## 🔒 Security & Reliability

### Tenant Isolation

```
Enforcement Points:
  1. Event Bus ensures tenantId present
  2. Collector validates tenantId format
  3. Enrichment queries scoped to tenant
  4. Classification Engine double-checks tenant
```

### Error Handling

```
Error Scenarios:
  1. Event missing tenantId
     → Log warning, skip audit, continue
  
  2. Enrichment API fails (geo lookup)
     → Log error, use fallback data, continue
  
  3. Classification Queue full
     → Retry with exponential backoff
     → DLQ (Dead Letter Queue) after 3 retries
  
  4. Collector crashes
     → Event Bus auto-retries delivery
     → New collector instance picks up
```

### Monitoring

```
Key Metrics to Track:
  - Events received (per collector)
  - Events filtered out (per rule)
  - Events enriched successfully
  - Events forwarded to classifier
  - Enrichment API failures
  - Average processing time
  - Queue depth
```

---

## 🧪 Testing Strategy

### Unit Tests

```
Test Coverage:
  ✅ shouldAudit() logic with all rule combinations
  ✅ enrichEvent() with mock enrichment sources
  ✅ forwardToClassifier() routing logic
  ✅ Error handling for each failure mode
```

### Integration Tests

```
Test Scenarios:
  ✅ End-to-end: Event Bus → Collector → Classifier
  ✅ Multi-collector: Multiple collectors process different events
  ✅ Tenant isolation: Events from Tenant A not visible to Tenant B
  ✅ Performance: 1000 events/sec sustained load
```

### Load Tests

```
Load Test Plan:
  - Simulate 5000 events/sec for 10 minutes
  - Verify no dropped events
  - Verify processing time <10ms p95
  - Verify memory usage <100MB
```

---

## 📋 Implementation Checklist

### Phase 1: Core Collector (P0)
- [ ] Implement Event Bus subscription with wildcard pattern
- [ ] Implement filtering logic with audit rules
- [ ] Implement basic enrichment (IP, user-agent, timestamp)
- [ ] Implement routing to Classification Engine
- [ ] Unit tests for core logic

### Phase 2: Domain Collectors (P1)
- [ ] Auth Audit Collector
- [ ] Data Audit Collector
- [ ] Business Audit Collector
- [ ] AI Audit Collector
- [ ] System Audit Collector

### Phase 3: Advanced Enrichment (P1)
- [ ] Geo-location lookup
- [ ] Tenant context enrichment
- [ ] Session tracking
- [ ] Historical data enrichment

### Phase 4: Production Readiness (P2)
- [ ] Error handling & retry logic
- [ ] Dead Letter Queue (DLQ)
- [ ] Monitoring & alerting
- [ ] Load testing & optimization
- [ ] Documentation & examples

---

## ✅ Success Criteria

| Criteria | Target | How to Verify |
|----------|--------|---------------|
| **Event Coverage** | 100% of auditable events | Query Event Bus metrics |
| **Filter Accuracy** | 0% false positives/negatives | Manual review of sampled events |
| **Enrichment Completeness** | 100% required fields populated | Schema validation |
| **Processing Speed** | <10ms p95 | Performance monitoring |
| **Reliability** | 99.9% uptime | Monitoring dashboard |

---

## 📚 Related Documentation

- **Layer 2**: [Event Bus (Distribution Center)](./layer-2-event-bus.md)
- **Layer 4**: [Classification Engine](./layer-4-classification-engine.md)
- **Integration**: [Integration Map - Data Layer](../audit-architecture/INTEGRATION_MAP.md#layer-2-data-layer-integration)

---

**Document Maintained By**: AI Architecture Agent  
**Last Updated**: 2025-12-26  
**Next Review**: After Phase 1 implementation
