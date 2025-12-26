# Meta-Audit Framework
## AI Self-Auditing & Behavioral Compliance

> **角色定位**: Architecture & Interaction Focus  
> **建立日期**: 2025-12-26  
> **核心目的**: Enable AI agent to audit its own decisions, actions, and compliance with behavioral guidelines

---

## 🎯 Framework Purpose

The Meta-Audit Framework enables the AI agent to:
1. **Self-Monitor**: Track all architectural decisions and actions
2. **Verify Compliance**: Check adherence to behavioral guidelines
3. **Trace Data Flow**: Monitor data movement across architectural layers
4. **Detect Side Effects**: Identify unintended consequences
5. **Log Rationale**: Document reasoning behind every decision
6. **Enable Transparency**: Make AI decision-making visible and auditable

**Core Principle**: The AI agent must be as observable and accountable as human developers.

---

## 📐 AI Self-Audit Event Taxonomy

### Event Category Hierarchy

```
ai.* (AI Meta-Events)
├── ai.decision.*          - Architectural & design decisions
│   ├── ai.decision.architectural
│   ├── ai.decision.performance
│   ├── ai.decision.security
│   └── ai.decision.firebase
│
├── ai.compliance.*        - Behavioral guideline adherence
│   ├── ai.compliance.check
│   ├── ai.compliance.violation
│   └── ai.compliance.exemption
│
├── ai.dataflow.*          - Cross-layer data movement analysis
│   ├── ai.dataflow.traced
│   ├── ai.dataflow.violation
│   └── ai.dataflow.anomaly
│
├── ai.side_effect.*       - Unintended consequence detection
│   ├── ai.side_effect.detected
│   ├── ai.side_effect.mitigated
│   └── ai.side_effect.escalated
│
└── ai.action.*            - AI-generated actions
    ├── ai.action.code_generated
    ├── ai.action.refactoring_suggested
    └── ai.action.analysis_completed
```

---

## 🔍 Event Type Specifications

### 1. AI Decision Events

#### ai.decision.architectural

**Purpose**: Log architectural design decisions

**Event Structure**:
```
{
  type: 'ai.decision.architectural',
  category: 'AI_DECISION',
  level: 'INFO',
  timestamp: '2025-12-26T01:00:00Z',
  
  decision: {
    title: 'Extract service from component',
    type: 'refactoring' | 'pattern_introduction' | 'dependency_change',
    scope: ['UserListComponent', 'UserService'],
    
    rationale: {
      problem: 'Component has business logic (SRP violation)',
      guideline: '🧠AI_Behavior_Guidelines.md#separation-of-concerns',
      principle: 'Single Responsibility Principle',
      alternatives_considered: [
        {
          option: 'Keep logic in component',
          rejected_reason: 'Violates architecture principles'
        },
        {
          option: 'Use inline service',
          rejected_reason: 'Not reusable'
        }
      ],
      selected: 'Extract to dedicated service',
      justification: 'Aligns with 3-layer architecture, improves testability'
    },
    
    impact: {
      affected_files: ['user-list.component.ts', 'user.service.ts'],
      breaking_change: false,
      estimated_effort: '2 hours',
      risk_level: 'LOW'
    },
    
    compliance: {
      status: 'COMPLIANT',
      guidelines_checked: [
        '🧠AI_Behavior_Guidelines.md#three-layer-architecture',
        '🧠AI_Behavior_Guidelines.md#dependency-injection'
      ],
      violations: []
    }
  },
  
  metadata: {
    agent_version: 'v1.0.0',
    context: 'User requested refactoring'
  }
}
```

**Trigger Points**:
- Before suggesting any refactoring
- Before introducing new architectural pattern
- Before changing dependency structure

#### ai.decision.performance

**Purpose**: Log performance optimization decisions

**Event Structure**:
```
{
  type: 'ai.decision.performance',
  category: 'AI_DECISION',
  level: 'INFO',
  
  decision: {
    title: 'Add memoization to computed signal',
    optimization_type: 'caching' | 'lazy_loading' | 'indexing',
    
    rationale: {
      problem: 'Expensive computation runs on every render',
      measured_impact: 'Average render time: 150ms',
      target_improvement: 'Target: <50ms',
      approach: 'Use Angular computed() signal with memo',
      trade_offs: {
        pros: ['Faster renders', 'Better UX'],
        cons: ['Slightly more memory', 'Complexity +1']
      }
    },
    
    expected_outcome: {
      render_time: '<50ms',
      memory_increase: '+2KB',
      code_complexity: 'Minimal increase'
    }
  }
}
```

#### ai.decision.security

**Purpose**: Log security-related decisions

**Event Structure**:
```
{
  type: 'ai.decision.security',
  category: 'AI_DECISION',
  level: 'WARNING',
  
  decision: {
    title: 'Enforce tenant isolation in query',
    security_concern: 'cross_tenant_data_leakage' | 'auth_bypass' | 'injection',
    
    rationale: {
      threat: 'Query missing tenantId filter allows cross-tenant access',
      severity: 'HIGH',
      guideline: 'firestore.rules + application-level double-check',
      mitigation: 'Auto-inject tenant filter in all queries',
      fallback: 'Reject query if tenant context missing'
    },
    
    impact: {
      scope: 'All repository queries',
      breaking_change: true,
      deployment_requirement: 'Requires Firestore Security Rules update'
    }
  }
}
```

#### ai.decision.firebase

**Purpose**: Log Firebase-specific design decisions

**Event Structure**:
```
{
  type: 'ai.decision.firebase',
  category: 'AI_DECISION',
  level: 'INFO',
  
  decision: {
    title: 'Use Cloud Pub/Sub instead of direct Event Bus',
    firebase_service: 'cloud_pubsub' | 'cloud_functions' | 'firestore',
    
    rationale: {
      requirement: 'Decouple audit collector from event publishers',
      firebase_constraint: 'No long-running processes in Cloud Functions',
      chosen_approach: 'Cloud Pub/Sub with Cloud Functions trigger',
      firebase_alternatives: [
        {
          option: 'Firestore realtime listeners',
          rejected: 'Not suitable for event bus pattern'
        },
        {
          option: 'Direct service calls',
          rejected: 'Tight coupling, not event-driven'
        }
      ],
      cost_consideration: 'Pub/Sub: $0.40 per million messages'
    }
  }
}
```

---

### 2. AI Compliance Events

#### ai.compliance.check

**Purpose**: Log behavioral guideline compliance checks

**Event Structure**:
```
{
  type: 'ai.compliance.check',
  category: 'COMPLIANCE',
  level: 'INFO',
  
  compliance: {
    checkpoint: 'pre_code_generation' | 'post_analysis' | 'pre_decision',
    guidelines_file: '🧠AI_Behavior_Guidelines.md',
    
    checks: [
      {
        rule: 'Use inject() for dependency injection',
        section: '🧠AI_Behavior_Guidelines.md#dependency-injection',
        status: 'PASS',
        evidence: 'Code uses inject(TaskService), not constructor injection'
      },
      {
        rule: 'No FirebaseService wrapper',
        section: '🧠AI_Behavior_Guidelines.md#firebase-integration',
        status: 'PASS',
        evidence: 'Directly injects Firestore from @angular/fire'
      },
      {
        rule: 'Use Signals for state management',
        section: '🧠AI_Behavior_Guidelines.md#state-management',
        status: 'PASS',
        evidence: 'State managed with signal() and computed()'
      }
    ],
    
    overall_status: 'COMPLIANT',
    violations: []
  },
  
  metadata: {
    proposed_action: 'Generate TaskService',
    action_approved: true
  }
}
```

#### ai.compliance.violation

**Purpose**: Log detected violations with corrective action

**Event Structure**:
```
{
  type: 'ai.compliance.violation',
  category: 'COMPLIANCE',
  level: 'WARNING' | 'CRITICAL',
  
  violation: {
    rule: 'No constructor injection',
    section: '🧠AI_Behavior_Guidelines.md#dependency-injection',
    detected_in: 'UserListComponent',
    
    violation_detail: {
      code: 'constructor(private taskService: TaskService) {}',
      reason: 'Uses constructor injection instead of inject() function',
      severity: 'HIGH',
      impact: 'Violates Angular 20 best practices'
    },
    
    corrective_action: {
      action_taken: 'CORRECTED',
      fix: 'Changed to: private taskService = inject(TaskService);',
      timestamp: '2025-12-26T01:00:00Z',
      verified: true
    }
  },
  
  metadata: {
    auto_corrected: true,
    manual_review_required: false
  }
}
```

#### ai.compliance.exemption

**Purpose**: Log approved guideline exemptions

**Event Structure**:
```
{
  type: 'ai.compliance.exemption',
  category: 'COMPLIANCE',
  level: 'WARNING',
  
  exemption: {
    rule: 'All repositories extend FirestoreBaseRepository',
    section: '🧠AI_Behavior_Guidelines.md#repository-pattern',
    
    reason: {
      justification: 'Special-purpose repository for Cloud Storage, not Firestore',
      context: 'StorageRepository handles file uploads, not document CRUD',
      alternative_approach: 'Implements custom BaseRepository for Cloud Storage',
      approved_by: 'user_request' | 'architectural_principle',
      documented_in: 'storage-repository.md'
    },
    
    conditions: [
      'Must document why exemption is necessary',
      'Must still follow naming conventions',
      'Must implement equivalent error handling'
    ],
    
    expires: null,  // Permanent exemption
    review_date: '2026-Q1'
  }
}
```

---

### 3. AI Data Flow Events

#### ai.dataflow.traced

**Purpose**: Log data movement across architectural layers

**Event Structure**:
```
{
  type: 'ai.dataflow.traced',
  category: 'DATA_ACCESS',
  level: 'INFO',
  
  dataflow: {
    flow_id: 'flow-123',
    trace_type: 'layer_crossing' | 'service_call' | 'event_propagation',
    
    path: [
      {
        layer: 'PRESENTATION',
        component: 'TaskListComponent',
        action: 'User clicks Create Task button',
        data: { task: { title: 'New Task' } },
        timestamp: '2025-12-26T01:00:00.000Z'
      },
      {
        layer: 'BUSINESS',
        service: 'TaskService.createTask()',
        action: 'Validates input, calls repository',
        data: { task: { title: 'New Task', tenantId: 'org-123' } },
        transformation: 'Added tenantId from context',
        timestamp: '2025-12-26T01:00:00.050Z'
      },
      {
        layer: 'DATA',
        repository: 'TaskRepository.create()',
        action: 'Persists to Firestore',
        data: { task: { id: 'task-456', ... } },
        transformation: 'Added id, timestamps',
        timestamp: '2025-12-26T01:00:00.100Z'
      },
      {
        layer: 'FOUNDATION',
        firestore: 'collection(tasks).add()',
        action: 'Firestore write',
        security_rules: 'EVALUATED: ALLOW',
        timestamp: '2025-12-26T01:00:00.150Z'
      }
    ],
    
    security_checks: [
      {
        checkpoint: 'Service layer',
        check: 'User has task:create permission',
        result: 'PASS'
      },
      {
        checkpoint: 'Firestore Security Rules',
        check: 'isBlueprintMember() && hasPermission()',
        result: 'ALLOW'
      }
    ],
    
    compliance: {
      three_layer_architecture: 'COMPLIANT',
      no_layer_skipping: 'COMPLIANT',
      security_checks: 'PASSED'
    }
  }
}
```

#### ai.dataflow.violation

**Purpose**: Log detected architectural violations in data flow

**Event Structure**:
```
{
  type: 'ai.dataflow.violation',
  category: 'DATA_ACCESS',
  level: 'CRITICAL',
  
  violation: {
    type: 'layer_skipping' | 'direct_firestore_access' | 'missing_security_check',
    
    detected: {
      source: 'TaskListComponent (Presentation Layer)',
      action: 'Directly injects TaskRepository',
      target: 'TaskRepository (Data Layer)',
      violation: 'Skipped Business Layer (Service)',
      severity: 'HIGH'
    },
    
    correct_pattern: {
      source: 'TaskListComponent',
      should_call: 'TaskService (Business Layer)',
      then_calls: 'TaskRepository (Data Layer)',
      rationale: 'Enforces 3-layer architecture separation'
    },
    
    corrective_action: {
      action: 'Refactor component to inject TaskService',
      status: 'PENDING',
      manual_intervention_required: true
    }
  }
}
```

---

### 4. AI Side Effect Events

#### ai.side_effect.detected

**Purpose**: Log unintended consequences of proposed changes

**Event Structure**:
```
{
  type: 'ai.side_effect.detected',
  category: 'AI_DECISION',
  level: 'WARNING',
  
  side_effect: {
    original_action: {
      type: 'refactoring',
      description: 'Rename TaskService.getTasks() to TaskService.loadTasks()',
      scope: ['task.service.ts']
    },
    
    detected_effects: [
      {
        effect_type: 'breaking_change',
        affected: [
          'TaskListComponent',
          'TaskDetailComponent',
          'DashboardComponent'
        ],
        severity: 'HIGH',
        description: '3 components call getTasks(), will break after rename',
        mitigation: 'Update all call sites before renaming',
        auto_fixable: true
      },
      {
        effect_type: 'test_failure',
        affected: [
          'task.service.spec.ts',
          'task-list.component.spec.ts'
        ],
        severity: 'MEDIUM',
        description: '2 test files reference old method name',
        mitigation: 'Update test mocks',
        auto_fixable: true
      },
      {
        effect_type: 'documentation_outdated',
        affected: ['docs/services/task-service.md'],
        severity: 'LOW',
        description: 'Documentation references old method name',
        mitigation: 'Update documentation',
        auto_fixable: false
      }
    ],
    
    analysis: {
      total_affected_files: 6,
      auto_fixable_count: 5,
      manual_intervention_count: 1,
      estimated_effort: '30 minutes',
      risk_level: 'MEDIUM'
    }
  }
}
```

#### ai.side_effect.mitigated

**Purpose**: Log successful mitigation of side effects

**Event Structure**:
```
{
  type: 'ai.side_effect.mitigated',
  category: 'AI_DECISION',
  level: 'INFO',
  
  mitigation: {
    original_side_effect_id: 'side-effect-123',
    
    actions_taken: [
      {
        action: 'Updated TaskListComponent.ts',
        type: 'code_change',
        status: 'COMPLETED',
        timestamp: '2025-12-26T01:00:00Z'
      },
      {
        action: 'Updated TaskDetailComponent.ts',
        type: 'code_change',
        status: 'COMPLETED',
        timestamp: '2025-12-26T01:00:01Z'
      },
      {
        action: 'Updated test files',
        type: 'test_change',
        status: 'COMPLETED',
        timestamp: '2025-12-26T01:00:02Z'
      }
    ],
    
    verification: {
      build_status: 'PASSED',
      test_status: 'PASSED',
      lint_status: 'PASSED',
      manual_review: 'PENDING'
    },
    
    residual_effects: [
      {
        effect: 'Documentation still references old name',
        severity: 'LOW',
        requires_manual_update: true
      }
    ]
  }
}
```

---

### 5. AI Action Events

#### ai.action.code_generated

**Purpose**: Log all code generation actions

**Event Structure**:
```
{
  type: 'ai.action.code_generated',
  category: 'AI_DECISION',
  level: 'INFO',
  
  action: {
    generation_type: 'new_file' | 'modification' | 'refactoring',
    
    target: {
      file: 'src/app/core/services/task.service.ts',
      lines: [1, 50],
      operation: 'CREATE' | 'UPDATE' | 'DELETE'
    },
    
    rationale: {
      user_request: 'Create TaskService for business logic',
      design_decision: 'Extracted from TaskListComponent',
      guidelines_followed: [
        '🧠AI_Behavior_Guidelines.md#three-layer-architecture',
        '🧠AI_Behavior_Guidelines.md#dependency-injection'
      ]
    },
    
    code_metrics: {
      lines_added: 50,
      lines_removed: 0,
      cyclomatic_complexity: 3,
      test_coverage: 'TBD'
    },
    
    compliance_check: {
      status: 'COMPLIANT',
      auto_verified: true
    }
  }
}
```

---

## 🔄 Integration with Existing Audit System

### How Meta-Audit Events Flow

```
[AI Agent]
    ↓ Makes decision / takes action
    ↓ Generates ai.* event
[Event Bus]
    ↓ Routes to subscribers
    ├─> [Audit Collector] ← Logs to audit system
    ├─> [Notification Service] ← Alerts on violations
    └─> [Compliance Monitor] ← Tracks compliance metrics
```

### Storage Strategy

```
ai.* events stored in same audit system:
  - Hot Tier (24h): Recent AI decisions, compliance checks
  - Warm Tier (90d): Historical analysis, pattern detection
  - Cold Tier (7y): Long-term compliance records
```

### Query API Enhancement

```
New query filters for ai.* events:
  - getAIDecisions(timeRange): All architectural decisions
  - getComplianceViolations(severity): Filter by severity
  - getDataFlowTraces(flowId): Track specific data flow
  - getSideEffects(actionId): Find side effects of action
```

---

## 📊 Compliance Dashboard (Conceptual)

### Real-Time Metrics

```
AI Behavioral Compliance:
  ├─ Guidelines Checked: 1,234
  ├─ Compliant Actions: 1,180 (95.6%)
  ├─ Violations Detected: 54 (4.4%)
  │   ├─ Auto-Corrected: 50 (92.6%)
  │   └─ Manual Review: 4 (7.4%)
  └─ Exemptions Granted: 12

Data Flow Analysis:
  ├─ Traces Recorded: 567
  ├─ Layer Violations: 3 (0.5%)
  ├─ Security Checks Passed: 564 (99.5%)
  └─ Average Flow Time: 120ms

Side Effect Detection:
  ├─ Effects Detected: 89
  ├─ Auto-Mitigated: 78 (87.6%)
  ├─ Manual Intervention: 11 (12.4%)
  └─ Unmitigated: 0 (0%)
```

### Trend Analysis

```
Compliance Trend (Last 30 Days):
  Week 1: 92.1% compliant
  Week 2: 94.3% compliant
  Week 3: 95.8% compliant
  Week 4: 96.2% compliant
  → Improving trend ✅

Top Violations:
  1. Constructor injection (15 occurrences)
  2. Missing tenant filter (8 occurrences)
  3. Direct Firestore access (5 occurrences)
```

---

## 🧪 Testing Meta-Audit Framework

### Test Scenarios

```
1. Decision Logging:
   ✅ AI suggests refactoring → ai.decision.architectural event logged
   ✅ Event includes rationale, alternatives, selected approach
   
2. Compliance Check:
   ✅ AI generates code → pre-generation compliance check
   ✅ Violation detected → auto-corrected → ai.compliance.violation logged
   
3. Data Flow Tracing:
   ✅ User action → trace across 4 layers → ai.dataflow.traced event
   ✅ Layer skipping detected → ai.dataflow.violation event
   
4. Side Effect Detection:
   ✅ Method rename proposed → detects 3 breaking changes
   ✅ Auto-fixes 2, flags 1 for manual review
```

### Verification Commands

```bash
# Query AI decisions
curl /api/audit/query?type=ai.decision.*&timeRange=24h

# Check compliance rate
curl /api/audit/metrics/compliance

# Get recent violations
curl /api/audit/query?type=ai.compliance.violation&level=CRITICAL

# Trace data flow
curl /api/audit/query?type=ai.dataflow.traced&flowId=flow-123
```

---

## ✅ Success Criteria

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Decision Logging** | 100% | All AI decisions logged |
| **Compliance Rate** | ≥95% | Compliant actions / total actions |
| **Auto-Correction Rate** | ≥90% | Auto-fixed violations / total violations |
| **Data Flow Coverage** | ≥80% | Traced flows / total flows |
| **Side Effect Detection** | ≥85% | Detected / actual side effects |

---

## 🚀 Implementation Phases

### Phase 1: Event Type Definition (Week 1)
- Define all ai.* event schemas
- Create event models in schemas/ai-events/
- Update Event Bus to route ai.* events

### Phase 2: Decision Logging (Week 2)
- Integrate with AI decision points
- Log architectural, performance, security, firebase decisions
- Test logging completeness

### Phase 3: Compliance Framework (Week 3)
- Implement pre-action compliance checks
- Auto-correction mechanism
- Violation logging and alerting

### Phase 4: Data Flow Tracing (Week 3-4)
- Trace data across 4 layers
- Detect layer violations
- Log security checkpoint results

### Phase 5: Side Effect Detection (Week 4)
- Analyze proposed changes for side effects
- Auto-mitigation where possible
- Flag for manual review

### Phase 6: Dashboard & Reporting (Week 5)
- Build compliance dashboard
- Real-time metrics display
- Trend analysis and reporting

---

## 📋 Conclusion

The Meta-Audit Framework enables **complete transparency and accountability** for AI agent actions:

1. ✅ **Every AI decision is logged** with rationale and alternatives
2. ✅ **Behavioral compliance is verified** before and after actions
3. ✅ **Data flow is traced** across all architectural layers
4. ✅ **Side effects are detected** and mitigated proactively
5. ✅ **AI actions are auditable** just like human developer actions

**Key Benefit**: Establishes trust in AI-generated code through complete observability and adherence to behavioral guidelines.

---

**Document Maintained By**: AI Architecture Agent  
**Last Updated**: 2025-12-26  
**Next Review**: After Phase 1 implementation
