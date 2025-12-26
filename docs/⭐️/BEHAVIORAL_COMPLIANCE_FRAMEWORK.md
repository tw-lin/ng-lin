# Behavioral Compliance Framework
## AI Self-Monitoring & Guideline Adherence

> **角色定位**: Architecture & Interaction Focus  
> **建立日期**: 2025-12-26  
> **核心目的**: Ensure AI agent consistently operates within defined behavioral guidelines and architectural constraints

---

## 🎯 Framework Purpose

The Behavioral Compliance Framework ensures the AI agent:
1. **Knows the Rules**: Loads and understands behavioral guidelines before acting
2. **Checks Compliance**: Validates proposed actions against guidelines
3. **Auto-Corrects**: Fixes violations automatically when possible
4. **Escalates**: Flags complex violations for human review
5. **Audits Itself**: Logs all compliance checks for transparency
6. **Learns Patterns**: Improves over time from compliance history

**Core Principle**: The AI must be as accountable as human developers for following project standards.

---

## 📐 Framework Architecture

### Compliance Check Pipeline

```
┌─────────────────────────────────────────────────────────┐
│               AI Decision Point (Trigger)                │
│  - Before code generation                                │
│  - Before refactoring                                    │
│  - Before architectural decision                         │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│          Step 1: Load Behavioral Guidelines              │
│  - 🧠AI_Behavior_Guidelines.md                          │
│  - .github/copilot-instructions.md                      │
│  - Project-specific rules                                │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│        Step 2: Extract Applicable Rules                  │
│  - Match rules to action context                         │
│  - Prioritize by severity (P0 > P1 > P2)                │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│          Step 3: Validate Proposed Action                │
│  - Check each rule against proposed action               │
│  - Identify violations (with evidence)                   │
└────────────────────┬────────────────────────────────────┘
                     ↓
                 ┌───┴───┐
                 │       │
         Compliant?   Violation?
                 │       │
         ┌───────┴─┐ ┌──┴──────┐
         │         │ │         │
         ↓         │ │         ↓
┌──────────────┐   │ │   ┌──────────────────┐
│ Step 4A:     │   │ │   │ Step 4B:         │
│ Proceed      │   │ │   │ Auto-Correct     │
│ with Action  │   │ │   │ (if possible)    │
└──────┬───────┘   │ │   └─────────┬────────┘
       │           │ │             │
       │           │ │             ↓
       │           │ │   ┌──────────────────┐
       │           │ │   │ Step 4C:         │
       │           │ │   │ Escalate         │
       │           │ │   │ (if complex)     │
       │           │ │   └─────────┬────────┘
       │           │ │             │
       └───────────┴─┴─────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│         Step 5: Log Compliance Check Event               │
│  - Event type: ai.compliance.check                       │
│  - Result: COMPLIANT | VIOLATION | CORRECTED            │
│  - Forward to Audit System (Layer 3)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Behavioral Guidelines Sources

### Primary Sources (Authoritative)

```
1. 🧠AI_Behavior_Guidelines.md
   - Core behavioral rules
   - Firebase-only constraint
   - Three-layer architecture
   - No FirebaseService wrapper
   - Use inject(), not constructor
   - Use Signals, not BehaviorSubject

2. .github/copilot-instructions.md
   - Result Pattern for async
   - Repository pattern requirements
   - Security Rules enforcement
   - Multi-tenancy via Blueprint

3. .github/rules/architectural-principles.md
   - System design principles
   - Layer separation rules
   - Dependency flow constraints
```

### Secondary Sources (Contextual)

```
4. .github/instructions/*.instructions.md
   - Angular 20 conventions
   - Firebase integration patterns
   - ng-alain component usage
   - Security rules design

5. docs/⭐️/*.md
   - Project-specific architecture
   - Domain models
   - Event Bus patterns
   - Audit system design
```

### Rule Priority System

```
Priority Levels:
  - P0 (Critical): Must never violate (e.g., no FirebaseService)
  - P1 (High): Should not violate (e.g., use inject())
  - P2 (Medium): Recommended (e.g., code comments)
  - P3 (Low): Nice-to-have (e.g., consistent naming)

Violation Response:
  - P0: Block action, require correction
  - P1: Auto-correct if possible, else block
  - P2: Warn, allow with documented reason
  - P3: Log, allow
```

---

## 🔍 Compliance Check Types

### 1. Pre-Action Checks (Proactive)

**Trigger**: Before AI generates code, suggests refactoring, or makes architectural decision

**Process**:
```
loadGuidelines()
  ↓
extractApplicableRules(actionContext)
  ↓
validateProposedAction(action, rules)
  ↓
if (violations.length > 0) {
  if (autoCorrectPossible) {
    applyAutoCorrection()
    logComplianceEvent('CORRECTED')
  } else {
    blockAction()
    logComplianceEvent('VIOLATION')
    escalateToHuman()
  }
} else {
  proceedWithAction()
  logComplianceEvent('COMPLIANT')
}
```

**Example Checks**:
| Rule | Check Logic | Auto-Correct? |
|------|-------------|---------------|
| **No FirebaseService** | Search code for `inject(FirebaseService)` | ✅ Yes (replace with `inject(Firestore)`) |
| **Use inject()** | Search for `constructor(private service: ...)` | ✅ Yes (convert to `inject()`) |
| **Use Signals** | Search for `new BehaviorSubject()` | ✅ Yes (replace with `signal()`) |
| **Three-layer** | Check component doesn't inject Repository | ⚠️ Partial (suggest Service) |
| **Security Rules** | Verify Firestore rules exist for collection | ❌ No (requires manual review) |

### 2. Post-Action Checks (Retrospective)

**Trigger**: After AI completes code generation or refactoring

**Process**:
```
analyzeGeneratedCode()
  ↓
detectViolations(code, guidelines)
  ↓
if (violations.length > 0) {
  if (criticalViolations) {
    rollbackChanges()
    logComplianceEvent('BLOCKED')
  } else {
    flagForReview()
    logComplianceEvent('WARNING')
  }
} else {
  markAsVerified()
  logComplianceEvent('VERIFIED')
}
```

**Example Checks**:
- Did generated code introduce `any` types?
- Did generated code skip layers (UI → Repository)?
- Did generated code add dependencies without checking security advisories?
- Did generated code modify protected files (🤖AI_Character_Profile_Impl.md)?

### 3. Continuous Monitoring (Passive)

**Trigger**: Background process scanning codebase

**Process**:
```
scanCodebase()
  ↓
detectPatterns(antipatterns, violations)
  ↓
prioritizeIssues(severity)
  ↓
if (criticalIssuesFound) {
  alertHuman()
  logComplianceEvent('DRIFT_DETECTED')
} else {
  scheduleFix()
  logComplianceEvent('MAINTENANCE_NEEDED')
}
```

**Monitored Patterns**:
- Creeping use of deprecated patterns
- Accumulation of technical debt
- Drift from architectural standards
- Consistency across modules

---

## 🛠️ Auto-Correction Mechanisms

### Correctable Violations (High Confidence)

```
1. Constructor Injection → inject()
   Before: constructor(private taskService: TaskService) {}
   After:  private taskService = inject(TaskService);
   
2. @Input/@Output → input()/output()
   Before: @Input() task!: Task;
   After:  task = input.required<Task>();
   
3. *ngIf/*ngFor → @if/@for
   Before: <div *ngIf="loading">Loading...</div>
   After:  @if (loading()) { <div>Loading...</div> }
   
4. BehaviorSubject → signal()
   Before: private tasks = new BehaviorSubject<Task[]>([]);
   After:  private tasks = signal<Task[]>([]);
   
5. FirebaseService → Direct Firestore
   Before: private firebase = inject(FirebaseService);
   After:  private firestore = inject(Firestore);
```

### Partial Corrections (Medium Confidence)

```
6. Layer Skipping (Component → Repository)
   Detection: Component injects Repository directly
   Suggestion: Create intermediate Service
   Action: Generate Service template, require human to complete
   
7. Missing Tenant Filter
   Detection: Firestore query without tenantId filter
   Suggestion: Add where('tenant_id', '==', tenantId)
   Action: Insert filter, flag for verification
```

### Non-Correctable (Manual Review Required)

```
8. Security Rules Missing
   Detection: New Firestore collection without rules
   Action: Cannot auto-generate (requires domain knowledge)
   Escalation: Create placeholder rules, require human review
   
9. Business Logic in Wrong Layer
   Detection: Repository contains if/else business logic
   Action: Cannot auto-refactor (requires understanding intent)
   Escalation: Flag for manual refactoring
```

---

## 📊 Compliance Metrics & Reporting

### Real-Time Dashboard (Conceptual)

```
Compliance Health Score: 95.6%

Breakdown by Priority:
  - P0 (Critical): 100% compliant ✅ (0 violations)
  - P1 (High):     96.2% compliant ✅ (54 violations, 50 auto-corrected)
  - P2 (Medium):   93.1% compliant ⚠️ (127 warnings)
  - P3 (Low):      88.4% compliant ℹ️ (243 suggestions)

Top Violations (Last 30 Days):
  1. Constructor injection (15 occurrences) → 15 auto-corrected
  2. Missing tenant filter (8 occurrences) → 6 auto-corrected, 2 escalated
  3. Direct Firestore access (5 occurrences) → 5 escalated

Trend:
  - Week 1: 92.1% → Week 2: 94.3% → Week 3: 95.8% → Week 4: 96.2%
  - Improving trend ✅ (+4.1% in 4 weeks)
```

### Periodic Reports

```
Weekly Compliance Report:
  - New violations detected: 12
  - Auto-corrected: 10 (83.3%)
  - Escalated: 2 (16.7%)
  - Remaining issues: 4 (from previous weeks)
  - Action items:
    1. Review escalated violations
    2. Update guidelines if patterns emerge
    3. Improve auto-correction logic

Monthly Compliance Audit:
  - Overall compliance: 95.6%
  - P0 critical rules: 100% adherence
  - Auto-correction rate: 87.6%
  - Average time to fix: 2.3 hours
  - Drift indicators: None detected
```

---

## 🚨 Escalation Workflow

### Escalation Triggers

```
Escalate to Human When:
  1. Critical violation (P0) cannot be auto-corrected
  2. Security-sensitive decision required
  3. Business logic ambiguity
  4. Architectural pattern conflict
  5. Multiple rules conflict with each other
```

### Escalation Process

```
Detect Violation
      ↓
  Auto-Correct?
      ↓ NO
Create Escalation Ticket:
  - Violation type
  - Affected file(s)
  - Rule violated
  - Suggested fix (if any)
  - Urgency (P0/P1/P2)
      ↓
Notify Human via:
  - GitHub Issue (auto-created)
  - Pull Request comment
  - Slack/Email alert (if critical)
      ↓
Human Reviews & Decides:
  - Approve AI suggestion
  - Provide alternative fix
  - Grant exemption (with justification)
      ↓
Log Decision:
  - ai.compliance.escalated
  - Decision outcome
  - Rationale
```

---

## 🧪 Testing Compliance Framework

### Test Scenarios

```
1. Pre-Action Check (Positive):
   - AI proposes: Use inject() for DI
   - Check: Compliant with guidelines ✅
   - Result: Proceed with action
   
2. Pre-Action Check (Negative - Auto-Correct):
   - AI proposes: Use constructor injection
   - Check: Violates P1 rule ❌
   - Auto-Correct: Change to inject() ✅
   - Result: Proceed with corrected action
   
3. Pre-Action Check (Negative - Escalate):
   - AI proposes: Skip Business layer (UI → Repository)
   - Check: Violates P0 rule ❌
   - Auto-Correct: Not possible (requires Service)
   - Result: Block action, escalate to human
   
4. Post-Action Check (Drift Detection):
   - Background scan detects 5 uses of constructor injection
   - Check: Gradual drift from guidelines ⚠️
   - Result: Flag for cleanup, schedule fix
```

### Compliance Test Suite

```bash
# Run compliance checks on codebase
npm run compliance:check

# Auto-fix correctable violations
npm run compliance:fix

# Generate compliance report
npm run compliance:report

# Test specific rule
npm run compliance:test -- --rule "no-firebase-service"
```

---

## 📋 Implementation Checklist

### Phase 1: Rule Loading & Parsing (Week 1)
- [ ] Load 🧠AI_Behavior_Guidelines.md
- [ ] Load .github/copilot-instructions.md
- [ ] Parse rules into structured format
- [ ] Categorize by priority (P0/P1/P2/P3)
- [ ] Unit tests for rule parsing

### Phase 2: Pre-Action Checks (Week 2)
- [ ] Implement compliance check pipeline
- [ ] Integrate with AI decision points
- [ ] Implement auto-correction for top 5 violations
- [ ] Log ai.compliance.* events
- [ ] Unit tests for each rule check

### Phase 3: Post-Action & Continuous Monitoring (Week 3)
- [ ] Implement post-action verification
- [ ] Implement background codebase scanner
- [ ] Drift detection logic
- [ ] Integration tests

### Phase 4: Escalation & Reporting (Week 4)
- [ ] Implement escalation workflow
- [ ] Auto-create GitHub issues for escalations
- [ ] Build compliance dashboard (metrics)
- [ ] Weekly/monthly report generation
- [ ] End-to-end tests

---

## ✅ Success Criteria

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **P0 Compliance** | 100% | No P0 violations |
| **Overall Compliance** | ≥95% | (Compliant actions / total actions) |
| **Auto-Correction Rate** | ≥85% | (Auto-fixed / total violations) |
| **Escalation Response Time** | <4 hours | Time to human review |
| **Drift Detection** | ≥90% | (Detected drift / actual drift) |

---

## 🔄 Continuous Improvement

### Learning from Violations

```
After Each Violation:
  1. Analyze root cause
  2. Update guidelines if ambiguous
  3. Improve auto-correction logic
  4. Add test case to prevent regression
  5. Share pattern with team
```

### Guideline Evolution

```
Quarterly Review:
  1. Analyze violation patterns
  2. Identify frequently violated rules
  3. Assess if rules are too strict/loose
  4. Update guidelines based on learnings
  5. Communicate changes to team
```

---

## 📚 Related Documentation

- **AI Character**: [🤖AI_Character_Profile_Impl.md](./🤖AI_Character_Profile_Impl.md)
- **Behavioral Guidelines**: [🧠AI_Behavior_Guidelines.md](./🧠AI_Behavior_Guidelines.md)
- **Meta-Audit Framework**: [audit-architecture/META_AUDIT_FRAMEWORK.md](./audit-architecture/META_AUDIT_FRAMEWORK.md)
- **Copilot Instructions**: [.github/copilot-instructions.md](../.github/copilot-instructions.md)

---

**Document Maintained By**: AI Architecture Agent  
**Last Updated**: 2025-12-26  
**Next Review**: After Phase 1 implementation
