# Audit System Integration Map
## Cross-Layer Touchpoints & Data Flow

> **角色定位**: Architecture & Interaction Focus  
> **建立日期**: 2025-12-26  
> **整合模型**: 4-Layer Architecture × 8-Layer Audit Topology

---

## 🎯 Integration Philosophy

The Global Audit System operates as a **horizontal concern** that cuts across all architectural layers:

```
┌────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  (UI Components, User Interactions, State Management)      │
└─────────────────────┬──────────────────────────────────────┘
                      │ ← Audit Touchpoint 1: User Actions
                      ↓
┌────────────────────────────────────────────────────────────┐
│                     BUSINESS LAYER                          │
│  (Services, Facades, Business Logic, Domain Events)        │
└─────────────────────┬──────────────────────────────────────┘
                      │ ← Audit Touchpoint 2: Domain Operations
                      ↓
┌────────────────────────────────────────────────────────────┐
│                       DATA LAYER                            │
│  (Repositories, Firestore Access, Data Transformation)     │
└─────────────────────┬──────────────────────────────────────┘
                      │ ← Audit Touchpoint 3: Data Operations
                      ↓
┌────────────────────────────────────────────────────────────┐
│                    FOUNDATION LAYER                         │
│  (Firebase Services, Event Bus, Auth, Infrastructure)      │
└─────────────────────┬──────────────────────────────────────┘
                      │ ← Audit Touchpoint 4: Infrastructure Events
                      ↓
              [GLOBAL AUDIT SYSTEM]
      (Collector → Classifier → Storage → Query)
```

**Integration Principle**: Audit is **passive & observational** - it doesn't change business logic, only observes and records.

---

## 📐 Layer 1: Foundation Layer Integration

### 1.1 Firebase Services Audit

**Touchpoint**: All Firebase service operations

```
[Firebase Auth]
    ↓ Authentication events
[Event Bus] → auth.user.login, auth.user.logout, auth.mfa.enabled
    ↓ Auto-subscribe
[Audit Collector]

[Firestore]
    ↓ Data access events
[Event Bus] → firestore.read, firestore.write, firestore.delete
    ↓ Auto-subscribe
[Audit Collector]

[Cloud Storage]
    ↓ File operations
[Event Bus] → storage.upload, storage.download, storage.delete
    ↓ Auto-subscribe
[Audit Collector]

[Cloud Functions]
    ↓ Function invocations
[Event Bus] → functions.invoked, functions.error, functions.timeout
    ↓ Auto-subscribe
[Audit Collector]
```

**Event Types Captured**:
| Category | Event Type | Example |
|----------|-----------|---------|
| **Authentication** | auth.* | login, logout, mfa_enable |
| **Data Access** | firestore.read | Collection query, document fetch |
| **Data Modification** | firestore.write, firestore.delete | Create, update, delete documents |
| **File Operations** | storage.* | Upload, download, delete files |
| **Function Execution** | functions.* | Invoked, error, timeout |
| **Security Rules** | security_rules.evaluated | Allow/deny decision |

**Integration Pattern**:
```typescript
// Example: Firebase Auth Integration
FirebaseAuthService (Foundation Layer)
    ↓ User logs in
    publishEvent({
      type: 'auth.user.login',
      actor: user.uid,
      tenantId: user.tenantId,
      metadata: { method: 'email', ip: req.ip }
    })
    ↓
Event Bus (Foundation Layer)
    ↓ Auto-route
Audit Collector (Cross-Cutting)
    ↓ Classify as AUTHENTICATION / INFO
Audit Storage
```

### 1.2 Event Bus Integration

**Touchpoint**: Event Bus as central distribution point

```
[Event Bus Core]
    ├─ All domain events published here
    ├─ Tenant-aware routing
    └─ Event persistence (optional)
    
[Audit Collector]
    └─ Subscribes to '*' (all events)
        ├─ No filtering at source
        ├─ Classification at intake
        └─ Stores enriched audit events
```

**Integration Benefits**:
- ✅ **Zero Coupling**: Business modules don't know audit exists
- ✅ **Complete Coverage**: Can't bypass audit
- ✅ **Resilience**: Audit failure doesn't affect business
- ✅ **Extensibility**: Add new audit rules without changing sources

### 1.3 Infrastructure Configuration Audit

**Touchpoint**: All infrastructure changes

```
[Configuration Changes]
    ├─ Firebase Security Rules modified
    ├─ Firestore indexes created/deleted
    ├─ Cloud Functions deployed
    └─ Environment variables changed
    
[Event Bus] → config.* events
    ↓
[Audit Collector]
    ↓ Classify as SYSTEM_CONFIGURATION / WARNING
[Audit Storage]
```

**Event Types**:
```
config.security_rules.updated
config.firestore_index.created
config.firestore_index.deleted
config.cloud_function.deployed
config.environment_variable.changed
config.api_key.rotated
```

---

## 📊 Layer 2: Data Layer Integration

### 2.1 Repository Pattern Audit

**Touchpoint**: All repository CRUD operations

```
[Repository Base Class]
    ├─ create() → fires data.created event
    ├─ update() → fires data.updated event
    ├─ delete() → fires data.deleted event
    └─ query() → fires data.queried event (if sensitive)
    
[Event Bus]
    ↓ data.* events
[Audit Collector]
    ↓ Classify as DATA_MODIFICATION / INFO-WARNING
[Audit Storage]
```

**Integration Pattern**:
```typescript
// Example: Task Repository
TaskRepository (Data Layer)
    ↓ create(task)
    publishEvent({
      type: 'data.task.created',
      resource: task.id,
      resourceType: 'task',
      actor: currentUser.uid,
      tenantId: task.tenantId,
      change: { before: null, after: task }
    })
    ↓
Event Bus
    ↓
Audit Collector
    ↓ Classify as DATA_MODIFICATION / INFO
Audit Storage
```

**Data Change Tracking**:
```
Change Event Structure:
{
  before: { ... },  // Previous state
  after: { ... },   // New state
  diff: {           // Computed difference
    added: ['field1'],
    removed: ['field2'],
    modified: ['field3']
  }
}
```

### 2.2 Firestore Security Rules Evaluation Audit

**Touchpoint**: Security rules allow/deny decisions

```
[Security Rules Engine]
    ↓ Evaluates every Firestore operation
    ├─ Allow → security.rules.allowed event
    └─ Deny → security.rules.denied event
    
[Event Bus]
    ↓
[Audit Collector]
    ↓ Classify as AUTHORIZATION / INFO-WARNING
    ├─ Allow → INFO
    └─ Deny → WARNING (possible attack)
[Audit Storage]
```

**Event Schema**:
```
{
  type: 'security.rules.denied',
  category: 'AUTHORIZATION',
  level: 'WARNING',
  actor: user.uid,
  resource: 'tasks/task-123',
  operation: 'read',
  reason: 'Missing permission: task:read',
  tenantId: 'org-456'
}
```

**Anomaly Detection**:
- Multiple denials in short time → possible attack
- Unusual access patterns → flag for review
- Privilege escalation attempts → CRITICAL alert

### 2.3 Data Migration Audit

**Touchpoint**: Schema evolution and data transformation

```
[Data Migration Script]
    ↓ Modifies schema or transforms data
[Event Bus] → data.migration.* events
    ↓
[Audit Collector]
    ↓ Classify as DATA_MODIFICATION / WARNING
[Audit Storage]
```

**Event Types**:
```
data.migration.started
data.migration.completed
data.migration.failed
data.migration.rollback
```

---

## 🏗️ Layer 3: Business Layer Integration

### 3.1 Service Layer Audit

**Touchpoint**: All business service operations

```
[Business Services]
    ├─ Task Service → task.* events
    ├─ Repository Service → repo.* events
    ├─ Issue Service → issue.* events
    └─ Organization Service → org.* events
    
[Event Bus]
    ↓ Domain events
[Audit Collector]
    ↓ Classify by domain
[Audit Storage]
```

**Integration Pattern**:
```typescript
// Example: Repository Service
RepositoryService (Business Layer)
    ↓ createRepository(data)
    ├─ Business logic validation
    ├─ Repository.create(data)
    └─ publishEvent({
          type: 'repo.created',
          actor: currentUser.uid,
          resource: repo.id,
          tenantId: repo.tenantId,
          metadata: { visibility: repo.visibility }
        })
    ↓
Event Bus
    ↓
Audit Collector
    ↓ Classify as DATA_MODIFICATION / INFO
Audit Storage
```

**Domain Event Catalog**:
| Domain | Event Types | Category |
|--------|------------|----------|
| **Repository** | repo.created, repo.deleted, repo.visibility_changed | DATA_MODIFICATION |
| **Issue** | issue.created, issue.closed, issue.assigned | BUSINESS_OPERATION |
| **PR** | pr.opened, pr.merged, pr.reviewed | BUSINESS_OPERATION |
| **Organization** | org.member_added, org.settings_updated | AUTHORIZATION / SYSTEM_CONFIGURATION |

### 3.2 Facade Layer Audit

**Touchpoint**: Complex multi-service operations

```
[Facade Layer]
    ↓ Coordinates multiple services
    publishEvent({
      type: 'workflow.completed',
      workflow: 'onboard_new_member',
      steps: [
        { step: 'create_user', status: 'success' },
        { step: 'assign_role', status: 'success' },
        { step: 'send_welcome_email', status: 'success' }
      ]
    })
    ↓
[Event Bus] → workflow.* events
    ↓
[Audit Collector]
    ↓ Classify as BUSINESS_OPERATION / INFO
[Audit Storage]
```

### 3.3 Permission System Integration

**Touchpoint**: Authorization decision points

```
[Permission Service]
    ↓ checkPermission(actor, resource, action)
    ├─ Calculate effective permissions
    ├─ Make decision (allow/deny)
    └─ publishEvent({
          type: 'permission.check',
          decision: 'allow' | 'deny',
          actor: user.uid,
          resource: resource.id,
          action: 'read',
          reason: 'Has role: admin'
        })
    ↓
[Event Bus]
    ↓
[Audit Collector]
    ↓ Classify as AUTHORIZATION / INFO-WARNING
[Audit Storage]
```

**Decision Tracking**:
```
Every authorization check is audited:
  - Who requested access (actor)
  - What they tried to access (resource)
  - What action they attempted (action)
  - Decision outcome (allow/deny)
  - Reason for decision (matched rule)
```

---

## 🖼️ Layer 4: Presentation Layer Integration

### 4.1 User Interaction Audit

**Touchpoint**: All user-initiated actions

```
[UI Components]
    ↓ User clicks button, submits form, navigates
[Component Event Handler]
    ↓ Calls business service
[Service Layer]
    ↓ Publishes domain event
[Event Bus]
    ↓
[Audit Collector]
```

**User Action Examples**:
```
UI Action                    → Domain Event
────────────────────────────────────────────
Click "Create Repository"    → repo.create_initiated
Submit repo form             → repo.created
Click "Delete Issue"         → issue.delete_initiated
Confirm delete dialog        → issue.deleted
Change organization settings → org.settings_updated
```

### 4.2 State Management Audit

**Touchpoint**: Angular Signals state changes

```
[Angular Signals]
    ↓ State mutation via signal.set() or signal.update()
[Component]
    ↓ May trigger domain operation
[Service Layer]
    ↓ Publishes event if significant
[Event Bus]
```

**When to Audit State Changes**:
- ✅ State changes that trigger API calls
- ✅ State changes affecting authorization
- ✅ State changes visible to other users
- ❌ Pure UI state (loading, selected tab, etc.)

### 4.3 Error Boundary Audit

**Touchpoint**: Uncaught errors in UI

```
[ErrorHandler]
    ↓ Catches unhandled exceptions
    publishEvent({
      type: 'ui.error.unhandled',
      error: error.message,
      stack: error.stack,
      actor: currentUser.uid,
      context: {
        route: router.url,
        component: 'TaskListComponent',
        action: 'loadTasks'
      }
    })
    ↓
[Event Bus]
    ↓
[Audit Collector]
    ↓ Classify as SYSTEM_CONFIGURATION / ERROR
[Audit Storage]
```

---

## 🤖 AI Self-Audit Integration (Meta-Layer)

### 5.1 Architectural Decision Audit

**Touchpoint**: AI makes architectural decisions

```
[AI Agent]
    ↓ Analyzes codebase, suggests refactoring
    publishEvent({
      type: 'ai.decision.architectural',
      decision: 'Extract service from component',
      rationale: 'Violates Single Responsibility Principle',
      guideline: '🧠AI_Behavior_Guidelines.md#separation-of-concerns',
      compliance: 'COMPLIANT',
      impact: {
        affected_files: ['user-list.component.ts'],
        estimated_effort: '2 hours'
      }
    })
    ↓
[Event Bus]
    ↓
[Audit Collector]
    ↓ Classify as AI_DECISION / INFO
[Audit Storage]
```

**AI Decision Categories**:
```
ai.decision.architectural   - Refactoring, pattern changes
ai.decision.behavioral      - Guideline interpretation
ai.decision.performance     - Optimization choices
ai.decision.security        - Security trade-offs
ai.decision.firebase        - Firebase-specific choices
```

### 5.2 Behavioral Compliance Audit

**Touchpoint**: AI actions against guidelines

```
[AI Agent]
    ↓ Before taking action, check compliance
[Compliance Checkpoint]
    ├─ Load 🧠AI_Behavior_Guidelines.md
    ├─ Check proposed action against rules
    └─ publishEvent({
          type: 'ai.compliance.check',
          action: 'inject dependency via constructor',
          guideline: 'Use inject() function instead',
          result: 'VIOLATION',
          severity: 'HIGH',
          corrective_action: 'Changed to inject()'
        })
    ↓
[Event Bus]
    ↓
[Audit Collector]
    ↓ Classify as COMPLIANCE / WARNING-CRITICAL
[Audit Storage]
```

**Compliance Check Points**:
1. Before code generation
2. Before refactoring suggestion
3. Before architectural decision
4. After action completion (retrospective)

### 5.3 Data Flow Tracing

**Touchpoint**: AI tracks data movement across layers

```
[AI Agent]
    ↓ Monitors data flow in proposed changes
    publishEvent({
      type: 'ai.dataflow.traced',
      source: 'Presentation Layer (Component)',
      destination: 'Business Layer (Service)',
      data_type: 'User credentials',
      security_check: 'PASSED',
      notes: 'No direct Repository access, follows 3-layer architecture'
    })
    ↓
[Event Bus]
    ↓
[Audit Collector]
    ↓ Classify as DATA_ACCESS / INFO
[Audit Storage]
```

### 5.4 Side Effect Detection

**Touchpoint**: AI detects unintended consequences

```
[AI Agent]
    ↓ After suggesting change, analyze side effects
    publishEvent({
      type: 'ai.side_effect.detected',
      original_action: 'Rename TaskService method',
      side_effects: [
        {
          type: 'breaking_change',
          affected: 'TaskListComponent, TaskDetailComponent',
          severity: 'HIGH',
          mitigation: 'Update all call sites'
        }
      ]
    })
    ↓
[Event Bus]
    ↓
[Audit Collector]
    ↓ Classify as AI_DECISION / WARNING
[Audit Storage]
```

---

## 🔄 End-to-End Integration Flow Example

### Scenario: User Creates a Repository

```
Step 1: Presentation Layer
────────────────────────────
User clicks "Create Repository" button
    ↓
Component calls RepositoryService.createRepository(data)
    ↓ (No audit event yet - just UI action)


Step 2: Business Layer
──────────────────────
RepositoryService.createRepository(data)
    ├─ Validates input
    ├─ Calls RepositoryRepository.create(data)
    └─ publishEvent({
          type: 'repo.created',
          actor: currentUser.uid,
          resource: repo.id,
          tenantId: repo.tenantId
        })
    ↓


Step 3: Data Layer
──────────────────
RepositoryRepository.create(data)
    ├─ Calls Firestore.collection('repositories').add(data)
    └─ (Firestore Security Rules evaluate)
    ↓


Step 4: Foundation Layer
────────────────────────
Event Bus receives 'repo.created' event
    ├─ Routes to all subscribers
    ├─ Notification Service (sends notification)
    ├─ Analytics Service (tracks metric)
    └─ Audit Collector (records audit event)
    ↓


Step 5: Audit System
────────────────────
Audit Collector
    ↓ Receives 'repo.created' event
Classification Engine
    ↓ Categorizes as DATA_MODIFICATION / INFO
Audit Storage
    ↓ Persists to Firestore (warm tier)
Query Service
    ↓ Available for immediate query


Step 6: Real-time Alert (if configured)
────────────────────────────────────────
If repo.visibility = 'public' (sensitive):
    ↓
Audit Collector detects sensitive action
    ↓
Publishes 'audit.alert.triggered'
    ↓
Notification Service sends alert to security team
```

**Audit Record Generated**:
```json
{
  "id": "audit-123",
  "timestamp": "2025-12-26T01:00:00Z",
  "type": "repo.created",
  "category": "DATA_MODIFICATION",
  "level": "INFO",
  "actor": "user-456",
  "actorType": "user",
  "resource": "repo-789",
  "resourceType": "repository",
  "tenantId": "org-012",
  "metadata": {
    "visibility": "public",
    "description": "New project",
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  },
  "requiresReview": true,  // Public repo creation
  "reviewedAt": null,
  "reviewedBy": null
}
```

---

## 📊 Integration Metrics

### Coverage Targets

| Layer | Target Coverage | Current | Gap |
|-------|----------------|---------|-----|
| Foundation Layer | 100% | 60% | 40% |
| Data Layer | 100% | 40% | 60% |
| Business Layer | 100% | 40% | 60% |
| Presentation Layer | 80% | 20% | 60% |
| AI Meta-Layer | 100% | 0% | 100% |

**Priority**: Achieve 90%+ coverage across all layers within Phase 1-2.

### Event Flow Performance

```
Target Performance:
  - Event Bus → Audit Collector: < 10ms
  - Classification Engine: < 20ms
  - Storage Write (async): < 100ms
  - Total Overhead: < 50ms (non-blocking)
  
Resilience:
  - Event Bus failure → Retry with exponential backoff
  - Audit Collector failure → DLQ (Dead Letter Queue)
  - Storage failure → In-memory buffer + retry
```

---

## ✅ Conclusion

The Global Audit System integrates with all architectural layers through a **passive, event-driven approach**:

1. **Foundation Layer**: Captures infrastructure events (Firebase, Event Bus)
2. **Data Layer**: Tracks data operations (CRUD, Security Rules)
3. **Business Layer**: Logs domain events (business operations)
4. **Presentation Layer**: Records user interactions (UI actions)
5. **Meta-Layer**: Audits AI decisions and compliance

**Integration Benefits**:
- ✅ Zero coupling with business logic
- ✅ Complete observability across all layers
- ✅ Compliance-ready audit trail
- ✅ Security incident detection
- ✅ AI governance and transparency

---

**Document Maintained By**: AI Architecture Agent  
**Last Updated**: 2025-12-26  
**Next Review**: After Phase 1 implementation
