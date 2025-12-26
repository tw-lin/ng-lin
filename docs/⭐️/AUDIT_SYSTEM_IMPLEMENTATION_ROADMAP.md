# Global Audit System - Implementation Roadmap

> **角色遵循**: GitHub × Firebase Platform Omniscient  
> **建立日期**: 2025-12-26  
> **設計原則**: Minimal Code + Reuse Existing + Firebase Native  
> **狀態**: Ready for Implementation (Architecture 100% → Code 0%)

---

## 🎯 Executive Summary

This roadmap defines the **minimal implementation path** to achieve 95% GitHub Master System alignment while following the **Mandatory Thinking Workflow**:

1. ✅ **Global Inventory**: Identified existing BlueprintEventBus, Logger, Repositories (70% reusable)
2. ✅ **Boundary Confirmation**: Audit system owns Layers 3-8, reuses Layers 1-2
3. ✅ **Duplication Avoided**: No new event bus, no new logger, no Firestore wrapper
4. ✅ **Minimal Code Gate**: 4 core modules (collectors, classifiers, storage, query)
5. ✅ **Necessity Validated**: Addresses real pain points (compliance, AI transparency, cost optimization)

**Result**: ~15 new TypeScript files (vs 50+ if building from scratch)

---

## 📋 Prerequisites (Context Recovery)

### Existing Infrastructure (DO NOT RECREATE)

| Component | Location | Reuse Strategy |
|-----------|----------|----------------|
| **Event Bus** | `src/app/core/global-event-bus/` | Subscribe to existing topics (blueprint.*, task.*, user.*) |
| **Logger Service** | `src/app/core/services/logger/` | Use for audit event logging |
| **Data Access** | `src/app/core/data-access/` | Extend FirestoreBaseRepository pattern |
| **Domain Events** | `src/app/core/global-event-bus/domain-events/` | Import and use existing event types |
| **Guards** | `src/app/core/guards/` | Reuse permission guards for audit UI |

### Architecture Documents (Reference Only)

| Document | Purpose | Status |
|----------|---------|--------|
| [COMPARATIVE_ANALYSIS.md](./audit-architecture/COMPARATIVE_ANALYSIS.md) | Gap analysis (48% → 95%) | ✅ Reference |
| [INTEGRATION_MAP.md](./audit-architecture/INTEGRATION_MAP.md) | Cross-layer integration | ✅ Reference |
| [SCHEMA_REGISTRY.md](./audit-schemas/SCHEMA_REGISTRY.md) | 102 event schemas | ✅ Implement |
| [Layer 3-6 Docs](./audit-layers/) | Layer-specific architecture | ✅ Implement |

---

## 🏗️ File Tree Structure (Minimal Implementation)

### Phase 1: Core Audit Infrastructure (P0 - Week 1-2)

```
src/app/core/audit/
├── index.ts                                    # Public API exports
├── models/                                     # TypeScript interfaces
│   ├── audit-event.interface.ts               # Base audit event interface
│   ├── event-category.enum.ts                 # 11 event categories
│   ├── event-severity.enum.ts                 # LOW/MEDIUM/HIGH/CRITICAL
│   ├── storage-tier.enum.ts                   # HOT/WARM/COLD
│   ├── query-pattern.interface.ts             # Query request/response interfaces
│   └── index.ts                               # Model exports
│
├── collectors/                                 # Layer 3: Audit Collector
│   ├── audit-collector.service.ts             # Main collector service
│   ├── audit-collector.service.spec.ts        # Unit tests
│   ├── event-subscription.config.ts           # BlueprintEventBus topic mappings
│   └── index.ts
│
├── classifiers/                                # Layer 4: Classification Engine
│   ├── classification-engine.service.ts       # Event categorization logic
│   ├── classification-engine.service.spec.ts  # Unit tests
│   ├── classification-rules.ts                # Category/severity mapping rules
│   ├── classification-rules.spec.ts           # Rule validation tests
│   └── index.ts
│
├── storage/                                    # Layer 5: Storage Tiers
│   ├── audit-storage.service.ts               # Multi-tier storage abstraction
│   ├── audit-storage.service.spec.ts          # Unit tests
│   ├── audit-event.repository.ts              # Firestore repository
│   ├── lifecycle-policy.service.ts            # Hot→Warm→Cold migration
│   ├── lifecycle-policy.service.spec.ts       # Lifecycle tests
│   └── index.ts
│
└── query/                                      # Layer 6: Query Service
    ├── audit-query.service.ts                 # Main query service
    ├── audit-query.service.spec.ts            # Unit tests
    ├── query-builder.ts                       # Query construction helpers
    ├── query-patterns/                        # 8 query pattern implementations
    │   ├── timeline-query.ts
    │   ├── actor-query.ts
    │   ├── entity-query.ts
    │   ├── compliance-query.ts
    │   └── index.ts
    └── index.ts
```

**File Count**: ~20 files  
**LOC Estimate**: ~2,500 lines (vs 8,000+ if building from scratch)

### Phase 2: Query UI & Export (P1 - Week 3-4)

```
src/app/routes/audit/                           # Audit UI routes
├── audit-log/
│   ├── audit-log.component.ts                 # Main audit log viewer
│   ├── audit-log.component.html
│   ├── audit-log.component.scss
│   ├── audit-log.component.spec.ts
│   └── components/
│       ├── event-timeline/                    # Timeline visualization
│       ├── event-filter/                      # Filter panel
│       └── event-detail/                      # Event detail drawer
│
└── routes.ts                                   # Audit route configuration

src/app/core/audit/export/                      # Layer 7: Export Service
├── audit-export.service.ts                    # JSON/CSV/PDF export
├── audit-export.service.spec.ts
├── templates/                                  # Pre-built report templates
│   ├── security-incident-report.ts
│   ├── compliance-audit-report.ts
│   └── index.ts
└── index.ts
```

**File Count**: +15 files  
**LOC Estimate**: +2,000 lines

### Phase 3: Review Workflow (P2 - Week 5-6)

```
src/app/core/audit/review/                      # Layer 8: Review Workflow
├── audit-review.service.ts                    # Review state machine
├── audit-review.service.spec.ts
├── review-workflow.state.ts                   # 4-stage workflow states
├── reviewer-assignment.service.ts             # Reviewer routing logic
└── index.ts

src/app/routes/audit/review/                    # Review UI
├── review-dashboard.component.ts
├── review-detail.component.ts
└── routes.ts
```

**File Count**: +10 files  
**LOC Estimate**: +1,500 lines

---

## 📐 Integration Architecture

### Reusing Existing Infrastructure

```typescript
// ✅ CORRECT: Reuse BlueprintEventBus (DO NOT CREATE NEW)
import { BlueprintEventBus } from '@core/global-event-bus';
import { inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuditCollectorService {
  private eventBus = inject(BlueprintEventBus);
  
  constructor() {
    // Subscribe to ALL domain events for audit capture
    this.eventBus.subscribe('blueprint.*', (event) => this.captureEvent(event));
    this.eventBus.subscribe('task.*', (event) => this.captureEvent(event));
    this.eventBus.subscribe('user.*', (event) => this.captureEvent(event));
    this.eventBus.subscribe('ai.*', (event) => this.captureEvent(event));
  }
}
```

```typescript
// ✅ CORRECT: Extend FirestoreBaseRepository (DO NOT WRAP)
import { FirestoreBaseRepository } from '@core/data-access/base';
import { Firestore } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuditEventRepository extends FirestoreBaseRepository<AuditEvent> {
  protected collectionName = 'audit_events';
  
  protected toEntity(data: DocumentData, id: string): AuditEvent {
    return {
      id,
      category: data['category'],
      severity: data['severity'],
      timestamp: this.toDate(data['timestamp']),
      // ... rest of mapping
    };
  }
}
```

```typescript
// ✅ CORRECT: Use existing Logger (DO NOT CREATE NEW)
import { LoggerService } from '@core/services/logger';

@Injectable({ providedIn: 'root' })
export class ClassificationEngineService {
  private logger = inject(LoggerService);
  
  classify(event: AuditEvent): ClassifiedEvent {
    this.logger.debug('[ClassificationEngine]', 'Classifying event', { event });
    // ... classification logic
  }
}
```

### Layer Integration Flow

```
Layer 1 (Existing Domain Modules)
    ↓ emit('blueprint.created', {...})
Layer 2 (Existing BlueprintEventBus)
    ↓ subscribe('blueprint.*', handler)
Layer 3 (NEW: AuditCollectorService)
    ↓ captureEvent(event)
Layer 4 (NEW: ClassificationEngineService)
    ↓ classify(event) → ClassifiedEvent
Layer 5 (NEW: AuditStorageService)
    ↓ store(classifiedEvent, tier: HOT)
Layer 6 (NEW: AuditQueryService)
    ↓ query({category, dateRange, ...})
```

**Key Design Decision**: Layers 3-6 are **pure consumers** of existing infrastructure, not replacements.

---

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (P0 - Priority 0)

**Goal**: Capture and store all audit events with minimal code

**Tasks**:
1. **Models & Interfaces** (4 hours)
   - [ ] Create `audit-event.interface.ts` with base event schema
   - [ ] Create `event-category.enum.ts` with 11 categories
   - [ ] Create `event-severity.enum.ts` with 4 levels
   - [ ] Create `storage-tier.enum.ts` with HOT/WARM/COLD

2. **Audit Collector Service** (8 hours)
   - [ ] Create `audit-collector.service.ts`
   - [ ] Subscribe to BlueprintEventBus topics (blueprint.*, task.*, user.*, ai.*)
   - [ ] Implement event filtering and validation
   - [ ] Add batch processing (100 events/batch)
   - [ ] Write unit tests

3. **Classification Engine** (12 hours)
   - [ ] Create `classification-engine.service.ts`
   - [ ] Implement 11-category classification rules
   - [ ] Implement severity leveling (LOW/MEDIUM/HIGH/CRITICAL)
   - [ ] Add entity type detection
   - [ ] Write unit tests and rule validation tests

4. **Storage Service** (12 hours)
   - [ ] Create `audit-event.repository.ts` extending FirestoreBaseRepository
   - [ ] Create `audit-storage.service.ts` with tier abstraction
   - [ ] Implement HOT tier storage (Firestore with composite indexes)
   - [ ] Implement lifecycle policy service (HOT→WARM→COLD migration)
   - [ ] Add Firestore Security Rules for audit_events collection
   - [ ] Write unit tests

5. **Query Service** (16 hours)
   - [ ] Create `audit-query.service.ts`
   - [ ] Implement timeline query pattern
   - [ ] Implement actor-based query pattern
   - [ ] Implement entity-based query pattern
   - [ ] Implement compliance query pattern
   - [ ] Add pagination and cursor support
   - [ ] Write unit tests

**Deliverables**: 
- ✅ All domain events captured and stored
- ✅ Events classified into 11 categories with severity
- ✅ Multi-tier storage with lifecycle policies
- ✅ 4 core query patterns operational
- ✅ 80%+ test coverage

**Total Time**: 52 hours (1.5 weeks)

### Phase 2: Query UI & Export (P1 - Priority 1)

**Goal**: Make audit data accessible and exportable

**Tasks**:
1. **Audit Log Viewer** (16 hours)
   - [ ] Create `audit-log.component.ts` with ng-alain ST table
   - [ ] Add event timeline visualization
   - [ ] Add filter panel (date range, category, severity, actor)
   - [ ] Add event detail drawer
   - [ ] Integrate AuditQueryService
   - [ ] Add route configuration

2. **Export Service** (12 hours)
   - [ ] Create `audit-export.service.ts`
   - [ ] Implement JSON export
   - [ ] Implement CSV export
   - [ ] Implement PDF export (via Cloud Function)
   - [ ] Create 3 report templates (Security Incident, Compliance, User Activity)
   - [ ] Write unit tests

**Deliverables**:
- ✅ Web UI for querying audit logs
- ✅ Export to JSON/CSV/PDF
- ✅ 3 pre-built report templates

**Total Time**: 28 hours (1 week)

### Phase 3: Review Workflow (P2 - Priority 2)

**Goal**: Enable compliance review and approval

**Tasks**:
1. **Review Workflow Service** (12 hours)
   - [ ] Create `audit-review.service.ts` with state machine
   - [ ] Implement 4-stage workflow (Submission → Review → Approval → Archive)
   - [ ] Create `reviewer-assignment.service.ts`
   - [ ] Add notification triggers
   - [ ] Write unit tests

2. **Review UI** (12 hours)
   - [ ] Create `review-dashboard.component.ts`
   - [ ] Create `review-detail.component.ts`
   - [ ] Add reviewer assignment UI
   - [ ] Add decision tracking UI
   - [ ] Integrate AuditReviewService

**Deliverables**:
- ✅ 4-stage compliance review workflow
- ✅ Reviewer assignment and tracking
- ✅ Decision history

**Total Time**: 24 hours (0.75 weeks)

---

## 📊 Success Metrics

### Architecture Health (Target: 95/100)

| Metric | Before | After Phase 1 | After Phase 2 | After Phase 3 |
|--------|--------|---------------|---------------|---------------|
| Event Coverage | 11 types | 102 types | 102 types | 102 types |
| Storage Strategy | In-memory | Multi-tier | Multi-tier | Multi-tier |
| Query Patterns | 1 basic | 4 advanced | 8 advanced | 8 advanced |
| Compliance Templates | 0 | 0 | 3 | 8 |
| Review Workflow | None | None | None | 4-stage |
| Master System Alignment | 48% | 75% | 85% | 95% |

### Code Quality Metrics

| Metric | Target | Phase 1 | Phase 2 | Phase 3 |
|--------|--------|---------|---------|---------|
| Test Coverage | >80% | ✅ | ✅ | ✅ |
| TypeScript Strict | 100% | ✅ | ✅ | ✅ |
| Duplication | <5% | ✅ | ✅ | ✅ |
| Cyclomatic Complexity | <10 | ✅ | ✅ | ✅ |

### Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Event Capture Latency | <100ms | Batch processing with 100 events/batch |
| Query Response Time | <500ms | Firestore composite indexes |
| Storage Cost | <$100/month | Hot(7d)/Warm(90d)/Cold(7y) lifecycle |
| Export Generation | <10s | Cloud Function parallel processing |

---

## 🔒 Security & Compliance

### Firestore Security Rules

```javascript
// audit_events collection rules (add to firestore.rules)
match /audit_events/{eventId} {
  // Only authenticated users can read audit events
  allow read: if isAuthenticated() 
              && isBlueprintMember(resource.data.blueprintId)
              && hasPermission(resource.data.blueprintId, 'audit:read');
  
  // Only system services can write audit events (via Cloud Functions)
  allow create: if request.auth.token.role == 'service';
  
  // Audit events are immutable (no updates or deletes)
  allow update, delete: if false;
}
```

### Data Retention Policy

| Tier | Duration | Storage | Cost/GB/month |
|------|----------|---------|---------------|
| HOT | 7 days | Firestore | $0.18 |
| WARM | 90 days | Firestore | $0.18 |
| COLD | 7 years | Cloud Storage | $0.004 |

**Estimated Cost**: $50-100/month for 10GB audit data

---

## 📚 Reference Documentation

### Architecture References (Read-Only)

1. [COMPARATIVE_ANALYSIS.md](./audit-architecture/COMPARATIVE_ANALYSIS.md) - Gap analysis
2. [INTEGRATION_MAP.md](./audit-architecture/INTEGRATION_MAP.md) - Cross-layer integration
3. [META_AUDIT_FRAMEWORK.md](./audit-architecture/META_AUDIT_FRAMEWORK.md) - AI self-audit
4. [LAYER_3_AUDIT_COLLECTOR.md](./audit-layers/layer-3-audit-collector.md)
5. [LAYER_4_CLASSIFICATION_ENGINE.md](./audit-layers/LAYER_4_CLASSIFICATION_ENGINE.md)
6. [LAYER_5_STORAGE_TIERS.md](./audit-layers/layer-5-storage-tiers.md)
7. [LAYER_6_QUERY_SERVICE.md](./audit-layers/LAYER_6_QUERY_SERVICE.md)
8. [SCHEMA_REGISTRY.md](./audit-schemas/SCHEMA_REGISTRY.md) - 102 event schemas

### Implementation References (Execute)

- [Angular 20 Guidelines](../../.github/instructions/angular.instructions.md)
- [Repository Pattern](../../.github/instructions/ng-gighub-firestore-repository.instructions.md)
- [Signals State Management](../../.github/instructions/ng-gighub-signals-state.instructions.md)
- [Security Rules](../../.github/instructions/ng-gighub-security-rules.instructions.md)

---

## ✅ Pre-Implementation Checklist

### Before Starting Phase 1

- [ ] Read AI Character Profile (`docs/⭐️/🤖AI_Character_Profile_Impl.md`)
- [ ] Read Behavior Guidelines (`docs/⭐️/🧠AI_Behavior_Guidelines.md`)
- [ ] Verify BlueprintEventBus implementation (`src/app/core/global-event-bus/`)
- [ ] Verify Logger Service (`src/app/core/services/logger/`)
- [ ] Verify FirestoreBaseRepository (`src/app/core/data-access/base/`)
- [ ] Review SCHEMA_REGISTRY.md for event interfaces
- [ ] Create feature branch: `feature/audit-system-phase-1`

### During Implementation

- [ ] Follow "Minimal Code, Equivalent Outcome" principle
- [ ] Reuse existing infrastructure (DO NOT RECREATE)
- [ ] Write unit tests for all services (>80% coverage)
- [ ] Use TypeScript strict mode (no `any` types)
- [ ] Follow Angular 20 conventions (Signals, Standalone, inject())
- [ ] Add JSDoc comments for public APIs
- [ ] Run `npm run lint` before committing

### After Each Phase

- [ ] Run `npm run test` (all tests passing)
- [ ] Run `npm run build` (no errors)
- [ ] Update AUDIT_SYSTEM_MASTER_INDEX.md with progress
- [ ] Create PR with detailed description
- [ ] Request code review
- [ ] Update Master System alignment score

---

## 🎯 Next Steps

1. **Create Feature Branch**: `git checkout -b feature/audit-system-phase-1`
2. **Start with Models**: Begin with TypeScript interfaces (low risk, high reuse)
3. **Implement Collector**: Subscribe to BlueprintEventBus
4. **Add Classification**: Categorize events with rules
5. **Build Storage**: Extend FirestoreBaseRepository
6. **Create Query Service**: Implement 4 core query patterns
7. **Write Tests**: Achieve >80% coverage
8. **Update Documentation**: Keep MASTER_INDEX current

---

**Status**: Ready for Implementation  
**Expected Duration**: Phase 1 (1.5 weeks), Phase 2 (1 week), Phase 3 (0.75 weeks)  
**Total Implementation Time**: 104 hours (~3 weeks)  
**Team**: 2-3 developers  
**ROI**: Regulatory compliance, AI transparency, cost optimization  
**Risk**: Low (reusing existing infrastructure, incremental adoption)

---

**Compliance Statement**:
✅ Follows AI Character Profile (GitHub × Firebase Omniscient)  
✅ Adheres to Mandatory Thinking Workflow (5 steps completed)  
✅ Applies "Minimal Code, Equivalent Outcome" principle  
✅ Reuses existing infrastructure (BlueprintEventBus, Logger, Repositories)  
✅ Avoids duplication and technical debt  
✅ Firebase-native (no custom backend)  
✅ Addresses validated pain points (not imagined needs)
