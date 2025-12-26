# Audit System File Tree Structure
## Centralized Discoverability & First-Class Concern

> **角色定位**: Architecture & Interaction Focus  
> **建立日期**: 2025-12-26  
> **設計目標**: Make Audit System immediately visible and centrally discoverable

---

## 🎯 Design Philosophy

The audit system must be treated as a **first-class infrastructure concern**, not buried as a sub-module. The file tree structure should:

1. **Immediate Visibility**: Audit system discoverable at top level
2. **Clear Separation**: Distinct from business modules
3. **Centralized Documentation**: Single source of truth for all audit artifacts
4. **Layered Organization**: Reflect 8-layer audit topology in structure
5. **Schema Registry**: Centralized, versioned event schemas

---

## 📐 Current File Structure (As-Is)

### Current Implementation (Buried Within Event Bus)

```
src/app/core/
├── event-bus/                    ← Audit buried here
│   ├── services/
│   │   ├── audit-log.service.ts         ← Core audit service
│   │   ├── audit-collector.service.ts   ← Collector
│   │   ├── auth-audit.service.ts        ← Auth-specific
│   │   ├── permission-audit.service.ts  ← Permission-specific
│   │   └── audit-auto-subscription.service.ts
│   ├── consumers/
│   │   └── audit-log.consumer.ts        ← Event consumer
│   ├── models/
│   │   ├── audit-event.model.ts         ← Core model
│   │   ├── auth-audit-event.model.ts    ← Auth event model
│   │   └── permission-audit-event.model.ts
│   ├── decorators/
│   │   └── auditable.decorator.ts       ← Method decorator
│   ├── initializers/
│   │   └── audit-auto-subscription.initializer.ts
│   └── examples/
│       ├── global-audit-log-example.component.ts
│       └── auth-audit-integration-example.component.ts
└── services/
    └── (No audit-related services here)

docs/⭐️/
├── Global Audit Log.md                  ← Original design doc
├── Global-Audit-Log-系統拓撲分析與實施路徑.md
└── Global-Audit-Log-系統拆解與對齊方案.md
```

### Problems with Current Structure

| Issue | Impact | Severity |
|-------|--------|----------|
| **Hidden in Event Bus** | Not immediately discoverable | 🔴 High |
| **Scattered Services** | auth-audit.service.ts separate from audit-log.service.ts | 🟡 Medium |
| **No Layer Separation** | All services in flat structure | 🟡 Medium |
| **No Schema Registry** | Event models scattered | 🟡 Medium |
| **Documentation Scattered** | Multiple docs, no central index | 🔴 High |
| **Not First-Class** | Treated as event-bus sub-feature | 🔴 High |

---

## 🏗️ Proposed File Structure (To-Be)

### Option A: Dedicated Top-Level Module (Recommended)

```
src/app/
├── core/
│   ├── audit-system/                    ← NEW: First-class module
│   │   ├── README.md                    ← Quick start guide
│   │   ├── ARCHITECTURE.md              ← System architecture overview
│   │   │
│   │   ├── layer-1-sources/             ← Event Sources (Layer 1)
│   │   │   ├── auth-event-source.ts     ← Auth domain events
│   │   │   ├── repo-event-source.ts     ← Repo domain events
│   │   │   ├── issue-event-source.ts    ← Issue domain events
│   │   │   └── index.ts
│   │   │
│   │   ├── layer-2-event-bus/           ← Event Bus Integration (Layer 2)
│   │   │   ├── audit-event-router.ts    ← Route events to collectors
│   │   │   ├── tenant-aware-publisher.ts ← Tenant-aware event publishing
│   │   │   └── index.ts
│   │   │
│   │   ├── layer-3-collectors/          ← Audit Collectors (Layer 3)
│   │   │   ├── audit-collector.service.ts        ← Main collector
│   │   │   ├── auth-audit-collector.ts           ← Auth event collector
│   │   │   ├── data-audit-collector.ts           ← Data operation collector
│   │   │   ├── business-audit-collector.ts       ← Business event collector
│   │   │   ├── ai-audit-collector.ts             ← AI decision collector
│   │   │   └── index.ts
│   │   │
│   │   ├── layer-4-classification/      ← Classification Engine (Layer 4)
│   │   │   ├── event-classifier.service.ts       ← Main classifier
│   │   │   ├── category-rules.ts                 ← Category rules
│   │   │   ├── level-rules.ts                    ← Level rules
│   │   │   ├── tenant-enricher.ts                ← Add tenant context
│   │   │   └── index.ts
│   │   │
│   │   ├── layer-5-storage/             ← Storage Tiers (Layer 5)
│   │   │   ├── audit-storage.service.ts          ← Main storage service
│   │   │   ├── hot-tier.service.ts               ← In-memory (24h)
│   │   │   ├── warm-tier.service.ts              ← Firestore (90d)
│   │   │   ├── cold-tier.service.ts              ← Cloud Storage (7y)
│   │   │   ├── tier-manager.service.ts           ← Lifecycle management
│   │   │   └── index.ts
│   │   │
│   │   ├── layer-6-query/               ← Query Service (Layer 6)
│   │   │   ├── audit-query.service.ts            ← Main query service
│   │   │   ├── query-builder.ts                  ← Query DSL
│   │   │   ├── filter-engine.ts                  ← Multi-dimensional filtering
│   │   │   ├── tenant-isolation.ts               ← Tenant filter enforcement
│   │   │   └── index.ts
│   │   │
│   │   ├── layer-7-export/              ← Export Service (Layer 7)
│   │   │   ├── audit-export.service.ts           ← Main export service
│   │   │   ├── json-exporter.ts                  ← JSON format
│   │   │   ├── csv-exporter.ts                   ← CSV format
│   │   │   ├── pdf-exporter.ts                   ← PDF report
│   │   │   ├── scheduled-report.service.ts       ← Automated reports
│   │   │   └── index.ts
│   │   │
│   │   ├── layer-8-review/              ← Review Workflow (Layer 8)
│   │   │   ├── audit-review.service.ts           ← Review workflow
│   │   │   ├── reviewer-assignment.ts            ← Auto-assign reviewers
│   │   │   ├── decision-tracking.ts              ← Track review decisions
│   │   │   ├── sla-monitor.ts                    ← Review SLA monitoring
│   │   │   └── index.ts
│   │   │
│   │   ├── schemas/                     ← Event Schemas (Centralized)
│   │   │   ├── README.md                         ← Schema registry index
│   │   │   ├── base/
│   │   │   │   ├── audit-event.model.ts          ← Base event model
│   │   │   │   ├── audit-metadata.model.ts       ← Metadata structure
│   │   │   │   └── index.ts
│   │   │   ├── user-actions/
│   │   │   │   ├── auth-event.model.ts           ← Auth events
│   │   │   │   ├── permission-event.model.ts     ← Permission events
│   │   │   │   └── index.ts
│   │   │   ├── data-operations/
│   │   │   │   ├── data-access-event.model.ts    ← Read events
│   │   │   │   ├── data-modify-event.model.ts    ← Write events
│   │   │   │   └── index.ts
│   │   │   ├── business-events/
│   │   │   │   ├── repo-event.model.ts           ← Repo events
│   │   │   │   ├── issue-event.model.ts          ← Issue events
│   │   │   │   ├── pr-event.model.ts             ← PR events
│   │   │   │   └── index.ts
│   │   │   └── ai-events/
│   │   │       ├── ai-decision-event.model.ts    ← AI decisions
│   │   │       ├── compliance-event.model.ts     ← Compliance checks
│   │   │       ├── dataflow-event.model.ts       ← Data flow tracing
│   │   │       └── index.ts
│   │   │
│   │   ├── decorators/                  ← Utility Decorators
│   │   │   ├── auditable.decorator.ts            ← Method audit decorator
│   │   │   ├── requires-review.decorator.ts      ← Flag for review
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/                       ← Shared Utilities
│   │   │   ├── tenant-context.ts                 ← Tenant resolution
│   │   │   ├── event-enricher.ts                 ← Add metadata
│   │   │   ├── anonymizer.ts                     ← GDPR anonymization
│   │   │   └── index.ts
│   │   │
│   │   ├── testing/                     ← Test Utilities
│   │   │   ├── audit-test-harness.ts             ← Test helpers
│   │   │   ├── mock-audit-service.ts             ← Mock service
│   │   │   └── index.ts
│   │   │
│   │   ├── examples/                    ← Usage Examples
│   │   │   ├── basic-usage.example.ts
│   │   │   ├── auth-integration.example.ts
│   │   │   ├── query-api.example.ts
│   │   │   └── export-report.example.ts
│   │   │
│   │   └── index.ts                     ← Main barrel export
│   │
│   ├── event-bus/                ← Event Bus (no audit here)
│   │   ├── services/
│   │   │   └── blueprint-event-bus.service.ts
│   │   ├── models/
│   │   └── ...
│   │
│   └── services/
│       └── (Other core services)
│
└── features/
    └── (Business features)

docs/⭐️/
├── AUDIT_SYSTEM_MASTER_INDEX.md         ← Central hub (NEW)
├── audit-architecture/                  ← Architecture docs (NEW)
│   ├── COMPARATIVE_ANALYSIS.md
│   ├── INTEGRATION_MAP.md
│   ├── FILE_TREE_STRUCTURE.md           ← This doc
│   └── META_AUDIT_FRAMEWORK.md
├── audit-layers/                        ← Layer-by-layer docs (NEW)
│   ├── layer-1-event-sources.md
│   ├── layer-2-event-bus.md
│   ├── layer-3-audit-collector.md
│   ├── layer-4-classification-engine.md
│   ├── layer-5-storage-tiers.md
│   ├── layer-6-query-service.md
│   ├── layer-7-export-service.md
│   └── layer-8-review-workflow.md
├── audit-schemas/                       ← Schema registry (NEW)
│   ├── SCHEMA_REGISTRY.md
│   ├── user-action-events.md
│   ├── ai-decision-events.md
│   ├── data-flow-events.md
│   └── compliance-events.md
└── (Existing architecture docs)
```

---

## 📊 Structure Comparison

| Aspect | Current (As-Is) | Proposed (To-Be) | Improvement |
|--------|----------------|------------------|-------------|
| **Discoverability** | Hidden in `event-bus/` | Top-level `core/audit-system/` | ✅ Immediate visibility |
| **Layer Organization** | Flat service structure | 8 folders matching 8 layers | ✅ Clear topology |
| **Schema Management** | Scattered models | Centralized `schemas/` | ✅ Single registry |
| **Documentation** | Multiple scattered docs | Central index + organized folders | ✅ Central hub |
| **Code Navigation** | Must search for audit files | Clear folder per concern | ✅ Predictable paths |
| **Testing** | No dedicated test utilities | `testing/` folder with harness | ✅ Easy testing |
| **Examples** | 2 examples in event-bus | 4+ examples in `examples/` | ✅ Better learning |
| **Separation** | Mixed with event-bus | Standalone module | ✅ Clear boundary |

---

## 🔄 Migration Strategy

### Phase 1: Create New Structure (Non-Breaking)

```bash
# Create new audit-system module structure
mkdir -p src/app/core/audit-system/{layer-1-sources,layer-2-event-bus,layer-3-collectors,layer-4-classification,layer-5-storage,layer-6-query,layer-7-export,layer-8-review,schemas,decorators,utils,testing,examples}

# Create subdirectories for schemas
mkdir -p src/app/core/audit-system/schemas/{base,user-actions,data-operations,business-events,ai-events}
```

### Phase 2: Copy & Adapt Existing Files

```bash
# Copy models to schemas/
cp src/app/core/event-bus/models/audit-event.model.ts \
   src/app/core/audit-system/schemas/base/

cp src/app/core/event-bus/models/auth-audit-event.model.ts \
   src/app/core/audit-system/schemas/user-actions/auth-event.model.ts

# Copy services to appropriate layers
cp src/app/core/event-bus/services/audit-collector.service.ts \
   src/app/core/audit-system/layer-3-collectors/

cp src/app/core/event-bus/services/audit-log.service.ts \
   src/app/core/audit-system/layer-6-query/audit-query.service.ts

# Copy decorators
cp src/app/core/event-bus/decorators/auditable.decorator.ts \
   src/app/core/audit-system/decorators/
```

### Phase 3: Update Imports (Gradual)

```typescript
// Old import
import { AuditEvent } from '@core/event-bus/models/audit-event.model';

// New import (with re-export for backward compatibility)
import { AuditEvent } from '@core/audit-system/schemas/base';

// Re-export in old location (temporary)
// src/app/core/event-bus/models/audit-event.model.ts
export { AuditEvent } from '@core/audit-system/schemas/base';
```

### Phase 4: Update Documentation Links

```markdown
# Update all docs to reference new structure
docs/⭐️/AUDIT_SYSTEM_MASTER_INDEX.md
docs/⭐️/audit-architecture/*.md
docs/⭐️/audit-layers/*.md
.github/instructions/*.md
```

### Phase 5: Deprecate Old Paths (After 1-2 Versions)

```typescript
// Mark as deprecated
/**
 * @deprecated Use @core/audit-system/schemas/base instead
 */
export { AuditEvent } from '@core/audit-system/schemas/base';
```

### Phase 6: Remove Old Structure (Breaking Change)

```bash
# After all imports updated, remove old structure
rm -rf src/app/core/event-bus/services/audit-*
rm -rf src/app/core/event-bus/models/*-audit-*
```

---

## 📋 Barrel Exports (index.ts)

### Main Module Export

```typescript
// src/app/core/audit-system/index.ts
export * from './schemas';
export * from './layer-3-collectors';
export * from './layer-4-classification';
export * from './layer-5-storage';
export * from './layer-6-query';
export * from './layer-7-export';
export * from './layer-8-review';
export * from './decorators';
export * from './utils';
```

### Schema Registry Export

```typescript
// src/app/core/audit-system/schemas/index.ts
export * from './base';
export * from './user-actions';
export * from './data-operations';
export * from './business-events';
export * from './ai-events';
```

### Usage Example

```typescript
// Consuming code
import {
  AuditEvent,
  AuthEvent,
  AuditCollectorService,
  AuditQueryService,
  Auditable
} from '@core/audit-system';

// Clean, simple imports from centralized module
```

---

## 🎯 Discoverability Enhancements

### 1. README Files at Each Level

```markdown
# src/app/core/audit-system/README.md

# Global Audit System

First-class infrastructure concern providing end-to-end audit traceability.

## Quick Links
- [Master Index](../../../../docs/⭐️/AUDIT_SYSTEM_MASTER_INDEX.md)
- [Architecture](../../../../docs/⭐️/audit-architecture/)
- [Examples](./examples/)

## Structure
- `layer-3-collectors/` - Event intake (Layer 3)
- `layer-4-classification/` - Event categorization (Layer 4)
- `layer-5-storage/` - Multi-tier storage (Layer 5)
- `layer-6-query/` - Query API (Layer 6)
- `layer-7-export/` - Export service (Layer 7)
- `layer-8-review/` - Review workflow (Layer 8)
- `schemas/` - Event schemas (centralized)

## Usage
See [examples/](./examples/) for common patterns.
```

### 2. Visual Structure Diagram in Code

```typescript
/**
 * Global Audit System - 8-Layer Topology
 * 
 * ┌─────────────────────────────────────────────────┐
 * │ Layer 1: Event Sources (Business Modules)       │
 * └─────────────┬───────────────────────────────────┘
 *               ↓
 * ┌─────────────────────────────────────────────────┐
 * │ Layer 2: Event Bus (Distribution Center)        │
 * └─────────────┬───────────────────────────────────┘
 *               ↓
 * ┌─────────────────────────────────────────────────┐
 * │ Layer 3: Audit Collector (Event Intake) ← HERE  │
 * └─────────────┬───────────────────────────────────┘
 *               ↓
 * ... (rest of layers)
 */
```

### 3. AGENTS.md Documentation

```markdown
# src/app/core/audit-system/AGENTS.md

# Audit System Agent Guidelines

## For Development Agents
When working with audit system:
1. **Read Master Index First**: docs/⭐️/AUDIT_SYSTEM_MASTER_INDEX.md
2. **Understand Layer**: Check which layer your change affects
3. **Update Schemas**: Any new event type → add to schemas/
4. **Test with Harness**: Use testing/audit-test-harness.ts

## For Architecture Agents
When analyzing audit system:
1. **Check Integration Map**: docs/⭐️/audit-architecture/INTEGRATION_MAP.md
2. **Verify Layer Boundaries**: Each layer has clear responsibility
3. **Review Comparative Analysis**: vs GitHub Master System

## For Security Agents
When auditing security:
1. **Tenant Isolation**: Verify queries enforce tenantId filter
2. **Immutability**: Audit events must never be modified/deleted
3. **Access Control**: Who can query audit logs?
```

---

## ✅ Benefits of Proposed Structure

### 1. Immediate Discoverability
```
Developer opens `src/app/core/` → Sees `audit-system/` immediately
✅ No need to search through subdirectories
✅ Clear that audit is first-class concern
```

### 2. Predictable Paths
```
Need to add new event schema? → Go to audit-system/schemas/
Need to modify query logic? → Go to audit-system/layer-6-query/
Need to add collector? → Go to audit-system/layer-3-collectors/
```

### 3. Easy Navigation
```
File tree matches 8-layer topology exactly
✅ Layer 3 = folder layer-3-collectors
✅ Layer 4 = folder layer-4-classification
✅ No mental mapping needed
```

### 4. Centralized Documentation
```
All audit docs under docs/⭐️/audit-*/
✅ AUDIT_SYSTEM_MASTER_INDEX.md is single entry point
✅ audit-architecture/ for high-level docs
✅ audit-layers/ for layer-specific docs
✅ audit-schemas/ for schema docs
```

### 5. Easier Testing
```
Dedicated testing/ folder with:
✅ audit-test-harness.ts (setup test env)
✅ mock-audit-service.ts (mock service)
✅ No need to find test utilities scattered across project
```

---

## 🚧 Implementation Timeline

### Week 1: Phase 1-2 (Structure Creation)
- ✅ Create new folder structure
- ✅ Copy existing files to new locations
- ✅ Create README files at each level
- ✅ Create barrel exports (index.ts)

### Week 2: Phase 3-4 (Migration & Documentation)
- Update imports gradually (feature by feature)
- Update all documentation links
- Add deprecation warnings to old paths
- Test that both old and new paths work

### Week 3: Phase 5 (Stabilization)
- Monitor for any import issues
- Update examples to use new paths
- Update AGENTS.md guidelines
- Finalize migration plan

### Week 4+: Phase 6 (Cleanup)
- Remove old structure (breaking change)
- Announce deprecation removal
- Update version number (major bump)

---

## 📊 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Discoverability Time** | < 30 seconds | Time for new dev to find audit system |
| **Navigation Depth** | ≤ 3 clicks | From root to any audit file |
| **Documentation Coverage** | 100% | All layers have corresponding docs |
| **Import Path Length** | ≤ 40 chars | `@core/audit-system/schemas/base` |
| **Test Utility Findability** | < 1 minute | Time to find audit test harness |

---

## ✅ Conclusion

The proposed file tree structure:
1. ✅ Makes audit system **immediately visible** at top level
2. ✅ Reflects **8-layer topology** in folder organization
3. ✅ Provides **centralized schema registry**
4. ✅ Organizes **documentation hierarchically**
5. ✅ Treats audit as **first-class infrastructure concern**

**Recommendation**: Implement Option A (Dedicated Top-Level Module) to maximize discoverability and architectural clarity.

---

**Document Maintained By**: AI Architecture Agent  
**Last Updated**: 2025-12-26  
**Next Review**: After Phase 1-2 migration
