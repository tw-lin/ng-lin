# Layer 4: Classification Engine (Event Categorization)

> **Purpose**: Classify and enrich audit events with metadata, categories, severity levels, and compliance mappings for efficient querying and analysis.

## Overview

Layer 4 is the **classification layer** that transforms raw audit events into structured, categorized data ready for storage and analysis. It applies business rules, severity scoring, and compliance tagging to every event.

## Classification Taxonomy

### 1. Event Categories (11 Primary)

```typescript
export enum AuditEventCategory {
  USER_ACTION = 'user_action',
  AI_DECISION = 'ai_decision',
  DATA_FLOW = 'data_flow',
  SECURITY = 'security',
  SYSTEM = 'system',
  COMPLIANCE = 'compliance',
  BLUEPRINT = 'blueprint',
  TASK = 'task',
  ORGANIZATION = 'organization',
  INTEGRATION = 'integration',
  PERFORMANCE = 'performance'
}
```

### 2. Severity Levels

```typescript
export enum AuditSeverity {
  CRITICAL = 'critical',  // Security breaches, data loss, system failures
  HIGH = 'high',          // Permission denials, failed operations, compliance violations
  MEDIUM = 'medium',      // User actions, AI decisions, data mutations
  LOW = 'low',            // Data queries, system events, performance metrics
  INFO = 'info'           // Debug events, detailed traces
}
```

### 3. Compliance Tags

```typescript
export enum ComplianceTag {
  GDPR = 'gdpr',                    // EU General Data Protection Regulation
  HIPAA = 'hipaa',                  // US Health Insurance Portability and Accountability Act
  SOC2 = 'soc2',                    // Service Organization Control 2
  ISO27001 = 'iso27001',            // Information Security Management
  PCI_DSS = 'pci_dss',              // Payment Card Industry Data Security Standard
  CCPA = 'ccpa',                    // California Consumer Privacy Act
  FERPA = 'ferpa',                  // Family Educational Rights and Privacy Act
  SOX = 'sox',                      // Sarbanes-Oxley Act
  NIST = 'nist',                    // National Institute of Standards and Technology
  INTERNAL_POLICY = 'internal'      // Organization-specific policies
}
```

### 4. Entity Types

```typescript
export enum AuditEntityType {
  USER = 'user',
  TEAM = 'team',
  PARTNER = 'partner',
  BLUEPRINT = 'blueprint',
  TASK = 'task',
  ORGANIZATION = 'organization',
  PERMISSION = 'permission',
  ROLE = 'role',
  CONFIG = 'config',
  INTEGRATION = 'integration'
}
```

### 5. Operation Types

```typescript
export enum AuditOperation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  LOGIN = 'login',
  LOGOUT = 'logout',
  GRANT = 'grant',
  REVOKE = 'revoke',
  ARCHIVE = 'archive',
  RESTORE = 'restore',
  EXPORT = 'export',
  IMPORT = 'import'
}
```

## Classification Rules Engine

### Rule Structure

```typescript
export interface ClassificationRule {
  id: string;
  name: string;
  description: string;
  condition: (event: AuditEvent) => boolean;
  enrichment: (event: AuditEvent) => Partial<ClassifiedAuditEvent>;
  priority: number; // Higher priority rules evaluated first
}

export interface ClassifiedAuditEvent extends AuditEvent {
  // Original fields from AuditEvent
  type: string;
  timestamp: string;
  actor: string;
  actorType: string;
  blueprintId?: string;
  data: any;
  metadata?: any;
  priority: 'P0' | 'P1' | 'P2' | 'P3';

  // Classification enrichment
  category: AuditEventCategory;
  severity: AuditSeverity;
  operation?: AuditOperation;
  entityType?: AuditEntityType;
  entityId?: string;
  complianceTags: ComplianceTag[];
  
  // Additional metadata
  classification: {
    ruleId: string;
    ruleName: string;
    confidence: number; // 0.0 to 1.0
    timestamp: string;
  };
  
  // Searchable text
  searchText: string;
  
  // Storage hints
  storageHints: {
    tier: 'hot' | 'warm' | 'cold';
    retentionDays: number;
    compressed: boolean;
  };
}
```

### Example Rules

```typescript
// src/app/core/audit/classifiers/classification-rules.ts

export const CLASSIFICATION_RULES: ClassificationRule[] = [
  // Rule 1: Security - Permission Denied
  {
    id: 'rule_security_permission_denied',
    name: 'Security - Permission Denied',
    description: 'Classify permission denial events as critical security events',
    priority: 100,
    condition: (event) => 
      event.type.includes('permission') && 
      event.data?.result === 'denied',
    enrichment: (event) => ({
      category: AuditEventCategory.SECURITY,
      severity: AuditSeverity.CRITICAL,
      operation: AuditOperation.READ, // Attempted read
      entityType: AuditEntityType.PERMISSION,
      complianceTags: [ComplianceTag.SOC2, ComplianceTag.ISO27001],
      storageHints: {
        tier: 'hot',
        retentionDays: 2555, // 7 years for security events
        compressed: false
      },
      searchText: `permission denied ${event.actor} ${event.data?.resource}`
    })
  },

  // Rule 2: User Action - Task Created
  {
    id: 'rule_user_task_created',
    name: 'User Action - Task Created',
    description: 'Classify task creation as medium severity user action',
    priority: 50,
    condition: (event) => 
      event.type === 'user.action.task.created',
    enrichment: (event) => ({
      category: AuditEventCategory.USER_ACTION,
      severity: AuditSeverity.MEDIUM,
      operation: AuditOperation.CREATE,
      entityType: AuditEntityType.TASK,
      entityId: event.data?.taskId,
      complianceTags: [ComplianceTag.INTERNAL_POLICY],
      storageHints: {
        tier: 'warm',
        retentionDays: 90,
        compressed: true
      },
      searchText: `task created ${event.actor} ${event.data?.title}`
    })
  },

  // Rule 3: AI Decision - Architectural
  {
    id: 'rule_ai_architectural_decision',
    name: 'AI Decision - Architectural',
    description: 'Classify AI architectural decisions as high severity',
    priority: 80,
    condition: (event) => 
      event.type === 'ai.decision.architectural',
    enrichment: (event) => ({
      category: AuditEventCategory.AI_DECISION,
      severity: AuditSeverity.HIGH,
      operation: AuditOperation.EXECUTE,
      entityType: AuditEntityType.CONFIG,
      complianceTags: [ComplianceTag.INTERNAL_POLICY, ComplianceTag.SOC2],
      storageHints: {
        tier: 'hot',
        retentionDays: 365, // 1 year for AI decisions
        compressed: false
      },
      searchText: `ai architectural decision ${event.data?.selected} ${event.data?.reasoning}`
    })
  },

  // Rule 4: Data Flow - Query
  {
    id: 'rule_data_query',
    name: 'Data Flow - Query',
    description: 'Classify database queries as low severity data flow',
    priority: 30,
    condition: (event) => 
      event.type === 'data.flow.query',
    enrichment: (event) => ({
      category: AuditEventCategory.DATA_FLOW,
      severity: AuditSeverity.LOW,
      operation: AuditOperation.READ,
      entityType: event.data?.collection as AuditEntityType,
      complianceTags: [ComplianceTag.GDPR, ComplianceTag.SOC2],
      storageHints: {
        tier: 'cold',
        retentionDays: 30,
        compressed: true
      },
      searchText: `query ${event.data?.collection} ${event.data?.filters}`
    })
  },

  // Rule 5: Compliance - Guideline Violation
  {
    id: 'rule_compliance_violation',
    name: 'Compliance - Guideline Violation',
    description: 'Classify guideline violations as high severity compliance events',
    priority: 90,
    condition: (event) => 
      event.type.includes('compliance') && 
      event.data?.result === 'violation',
    enrichment: (event) => ({
      category: AuditEventCategory.COMPLIANCE,
      severity: AuditSeverity.HIGH,
      complianceTags: [ComplianceTag.INTERNAL_POLICY, ComplianceTag.SOC2],
      storageHints: {
        tier: 'hot',
        retentionDays: 365,
        compressed: false
      },
      searchText: `compliance violation ${event.data?.guideline} ${event.data?.details}`
    })
  },

  // Rule 6: System - Config Change
  {
    id: 'rule_system_config_changed',
    name: 'System - Config Change',
    description: 'Classify config changes as medium severity system events',
    priority: 50,
    condition: (event) => 
      event.type === 'system.config.changed',
    enrichment: (event) => ({
      category: AuditEventCategory.SYSTEM,
      severity: AuditSeverity.MEDIUM,
      operation: AuditOperation.UPDATE,
      entityType: AuditEntityType.CONFIG,
      complianceTags: [ComplianceTag.SOC2],
      storageHints: {
        tier: 'warm',
        retentionDays: 180,
        compressed: true
      },
      searchText: `config changed ${event.data?.key} ${event.data?.oldValue} ${event.data?.newValue}`
    })
  },

  // Default Rule (lowest priority)
  {
    id: 'rule_default',
    name: 'Default Classification',
    description: 'Default classification for unmatched events',
    priority: 1,
    condition: () => true, // Always matches
    enrichment: (event) => ({
      category: AuditEventCategory.SYSTEM,
      severity: AuditSeverity.INFO,
      complianceTags: [],
      storageHints: {
        tier: 'cold',
        retentionDays: 30,
        compressed: true
      },
      searchText: `${event.type} ${event.actor} ${JSON.stringify(event.data)}`
    })
  }
];
```

## Classification Engine Service

```typescript
// src/app/core/audit/classifiers/classification-engine.service.ts

@Injectable({ providedIn: 'root' })
export class ClassificationEngineService {
  private rules: ClassificationRule[];
  private logger = inject(LoggerService);

  constructor() {
    this.rules = this.loadRules();
  }

  /**
   * Classify an audit event by applying classification rules
   */
  classify(event: AuditEvent): ClassifiedAuditEvent {
    // Sort rules by priority (descending)
    const sortedRules = this.rules.sort((a, b) => b.priority - a.priority);

    // Find first matching rule
    const matchedRule = sortedRules.find(rule => rule.condition(event));

    if (!matchedRule) {
      this.logger.warn('No classification rule matched event', { type: event.type });
      throw new Error(`No classification rule for event: ${event.type}`);
    }

    // Apply enrichment
    const enrichment = matchedRule.enrichment(event);

    // Build classified event
    const classified: ClassifiedAuditEvent = {
      ...event,
      category: enrichment.category!,
      severity: enrichment.severity!,
      operation: enrichment.operation,
      entityType: enrichment.entityType,
      entityId: enrichment.entityId,
      complianceTags: enrichment.complianceTags || [],
      classification: {
        ruleId: matchedRule.id,
        ruleName: matchedRule.name,
        confidence: 1.0, // Rule-based classification has 100% confidence
        timestamp: new Date().toISOString()
      },
      searchText: enrichment.searchText || this.generateDefaultSearchText(event),
      storageHints: enrichment.storageHints || this.getDefaultStorageHints(enrichment.severity!)
    };

    this.logger.debug('Event classified', {
      type: event.type,
      category: classified.category,
      severity: classified.severity,
      rule: matchedRule.name
    });

    return classified;
  }

  /**
   * Batch classify multiple events
   */
  classifyBatch(events: AuditEvent[]): ClassifiedAuditEvent[] {
    return events.map(event => this.classify(event));
  }

  /**
   * Generate default search text from event
   */
  private generateDefaultSearchText(event: AuditEvent): string {
    const parts = [
      event.type,
      event.actor,
      event.blueprintId,
      JSON.stringify(event.data)
    ];
    return parts.filter(Boolean).join(' ');
  }

  /**
   * Get default storage hints based on severity
   */
  private getDefaultStorageHints(severity: AuditSeverity): ClassifiedAuditEvent['storageHints'] {
    switch (severity) {
      case AuditSeverity.CRITICAL:
        return { tier: 'hot', retentionDays: 2555, compressed: false }; // 7 years
      case AuditSeverity.HIGH:
        return { tier: 'hot', retentionDays: 365, compressed: false }; // 1 year
      case AuditSeverity.MEDIUM:
        return { tier: 'warm', retentionDays: 90, compressed: true }; // 3 months
      case AuditSeverity.LOW:
        return { tier: 'cold', retentionDays: 30, compressed: true }; // 1 month
      case AuditSeverity.INFO:
        return { tier: 'cold', retentionDays: 7, compressed: true }; // 1 week
    }
  }

  /**
   * Load classification rules
   */
  private loadRules(): ClassificationRule[] {
    return CLASSIFICATION_RULES;
  }

  /**
   * Add custom rule at runtime
   */
  addRule(rule: ClassificationRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove rule by ID
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  /**
   * Get all rules
   */
  getRules(): ClassificationRule[] {
    return [...this.rules];
  }
}
```

## ML-Based Classification (Future Enhancement)

### Training Data Collection

```typescript
// Collect training data from manually classified events
export interface ClassificationTrainingData {
  eventType: string;
  features: {
    actorType: string;
    hasBlueprint: boolean;
    dataKeys: string[];
    metadataKeys: string[];
  };
  label: {
    category: AuditEventCategory;
    severity: AuditSeverity;
  };
}

// Future: Train ML model for auto-classification
export class MLClassificationService {
  private model: any; // TensorFlow.js model

  async train(data: ClassificationTrainingData[]): Promise<void> {
    // Train model on historical data
  }

  async predict(event: AuditEvent): Promise<{
    category: AuditEventCategory;
    severity: AuditSeverity;
    confidence: number;
  }> {
    // Predict classification with confidence score
  }
}
```

## Integration with Layer 3 (Collector) and Layer 5 (Storage)

```typescript
// src/app/core/audit/collectors/audit-collector.service.ts

@Injectable({ providedIn: 'root' })
export class AuditCollectorService {
  private classificationEngine = inject(ClassificationEngineService);
  private storageService = inject(AuditStorageService);

  async collect(event: AuditEvent): Promise<void> {
    // Step 1: Classify event (Layer 4)
    const classified = this.classificationEngine.classify(event);

    // Step 2: Route to appropriate storage tier (Layer 5)
    await this.storageService.store(classified);
  }
}
```

## Classification Metrics

```typescript
export interface ClassificationMetrics {
  totalClassified: number;
  byCategory: Record<AuditEventCategory, number>;
  bySeverity: Record<AuditSeverity, number>;
  byRule: Record<string, number>;
  avgClassificationTimeMs: number;
  ruleEfficiency: Array<{
    ruleId: string;
    ruleName: string;
    matchRate: number; // Percentage of events matched
    avgTimeMs: number;
  }>;
}

export class ClassificationEngineService {
  private metrics: ClassificationMetrics = {
    totalClassified: 0,
    byCategory: {} as any,
    bySeverity: {} as any,
    byRule: {},
    avgClassificationTimeMs: 0,
    ruleEfficiency: []
  };

  classify(event: AuditEvent): ClassifiedAuditEvent {
    const startTime = performance.now();

    // ... classification logic ...

    const duration = performance.now() - startTime;
    this.updateMetrics(classified, duration);

    return classified;
  }

  private updateMetrics(event: ClassifiedAuditEvent, duration: number): void {
    this.metrics.totalClassified++;
    this.metrics.byCategory[event.category] = (this.metrics.byCategory[event.category] || 0) + 1;
    this.metrics.bySeverity[event.severity] = (this.metrics.bySeverity[event.severity] || 0) + 1;
    this.metrics.byRule[event.classification.ruleId] = 
      (this.metrics.byRule[event.classification.ruleId] || 0) + 1;

    // Update average classification time
    const totalTime = this.metrics.avgClassificationTimeMs * (this.metrics.totalClassified - 1);
    this.metrics.avgClassificationTimeMs = (totalTime + duration) / this.metrics.totalClassified;
  }

  getMetrics(): ClassificationMetrics {
    return { ...this.metrics };
  }
}
```

## Rule Validation & Testing

```typescript
// Test suite for classification rules
describe('ClassificationEngine', () => {
  let engine: ClassificationEngineService;

  beforeEach(() => {
    engine = new ClassificationEngineService();
  });

  it('should classify permission denied as critical security event', () => {
    const event: AuditEvent = {
      type: 'security.permission.denied',
      timestamp: new Date().toISOString(),
      actor: 'user-123',
      actorType: 'user',
      blueprintId: 'bp-456',
      data: { result: 'denied', resource: 'task-789' },
      priority: 'P0'
    };

    const classified = engine.classify(event);

    expect(classified.category).toBe(AuditEventCategory.SECURITY);
    expect(classified.severity).toBe(AuditSeverity.CRITICAL);
    expect(classified.storageHints.tier).toBe('hot');
    expect(classified.storageHints.retentionDays).toBe(2555); // 7 years
  });

  it('should classify task creation as medium user action', () => {
    const event: AuditEvent = {
      type: 'user.action.task.created',
      timestamp: new Date().toISOString(),
      actor: 'user-123',
      actorType: 'user',
      blueprintId: 'bp-456',
      data: { taskId: 'task-789', title: 'Test Task' },
      priority: 'P1'
    };

    const classified = engine.classify(event);

    expect(classified.category).toBe(AuditEventCategory.USER_ACTION);
    expect(classified.severity).toBe(AuditSeverity.MEDIUM);
    expect(classified.operation).toBe(AuditOperation.CREATE);
    expect(classified.entityType).toBe(AuditEntityType.TASK);
  });

  it('should apply default rule for unknown events', () => {
    const event: AuditEvent = {
      type: 'unknown.event.type',
      timestamp: new Date().toISOString(),
      actor: 'system',
      actorType: 'system',
      data: {},
      priority: 'P3'
    };

    const classified = engine.classify(event);

    expect(classified.category).toBe(AuditEventCategory.SYSTEM);
    expect(classified.severity).toBe(AuditSeverity.INFO);
    expect(classified.classification.ruleId).toBe('rule_default');
  });
});
```

## Success Criteria

✅ **Coverage**: 100% of events classified (no unclassified events)
✅ **Accuracy**: >95% rule match accuracy
✅ **Performance**: <2ms average classification time
✅ **Extensibility**: Easy to add new rules without code changes
✅ **Compliance**: All compliance-relevant events tagged correctly
✅ **Metrics**: Real-time classification metrics available

## Related Documentation

- [Layer 3: Audit Collector](./LAYER_3_AUDIT_COLLECTOR.md) - Event intake
- [Layer 5: Storage Tiers](./LAYER_5_STORAGE_TIERS.md) - Tiered storage
- [Schema Registry](../audit-schemas/SCHEMA_REGISTRY.md) - Event schemas
- [Compliance Framework](../BEHAVIORAL_COMPLIANCE_FRAMEWORK.md) - Compliance rules

---

**Status**: Design Complete, Implementation 0%
**Next Steps**: Implement ClassificationEngineService with initial rule set
**Owner**: Audit System Team
**Last Updated**: 2025-12-26
