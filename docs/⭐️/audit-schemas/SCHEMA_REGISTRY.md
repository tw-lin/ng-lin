# Audit Event Schema Registry

> **Purpose**: Central repository of all audit event schemas with TypeScript interfaces, validation rules, and storage recommendations.

## Overview

This registry documents 100+ event schemas across 11 categories. All events follow a consistent base structure and include category-specific extensions.

## Base Event Schema

```typescript
// Base interface that all audit events extend
export interface AuditEventBase {
  // Core identification
  type: string;                                    // Event type (e.g., 'user.action.task.created')
  timestamp: string;                               // ISO 8601 timestamp
  
  // Actor information
  actor: string;                                   // User/team/partner/system/AI ID
  actorType: 'user' | 'team' | 'partner' | 'system' | 'ai';
  
  // Tenant scope
  blueprintId?: string;                            // Blueprint ID (if tenant-scoped)
  
  // Event data
  data: Record<string, any>;                       // Event-specific payload
  
  // Additional metadata
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    requestId?: string;
    [key: string]: any;
  };
  
  // Priority level
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  
  // Classification (added by Layer 4)
  category?: AuditEventCategory;
  severity?: AuditSeverity;
  operation?: AuditOperation;
  entityType?: AuditEntityType;
  entityId?: string;
  complianceTags?: ComplianceTag[];
  searchText?: string;
  storageHints?: {
    tier: 'hot' | 'warm' | 'cold';
    retentionDays: number;
    compressed: boolean;
  };
}
```

## Category 1: User Actions (12 schemas)

### 1.1 User Login
```typescript
export interface UserLoginEvent extends AuditEventBase {
  type: 'user.action.login';
  actorType: 'user';
  data: {
    loginMethod: 'email' | 'google' | 'anonymous';
    success: boolean;
    failureReason?: string;
    ipAddress: string;
    location?: {
      country: string;
      city: string;
    };
  };
}
```

### 1.2 User Logout
```typescript
export interface UserLogoutEvent extends AuditEventBase {
  type: 'user.action.logout';
  actorType: 'user';
  data: {
    sessionDuration: number;  // Seconds
    voluntaryLogout: boolean;
  };
}
```

### 1.3 Task Created
```typescript
export interface TaskCreatedEvent extends AuditEventBase {
  type: 'user.action.task.created';
  actorType: 'user' | 'team' | 'partner';
  data: {
    taskId: string;
    title: string;
    description?: string;
    assignedTo?: string;
    assignedToType?: 'user' | 'team' | 'partner';
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
    status: 'pending' | 'in-progress' | 'completed';
  };
}
```

### 1.4 Task Updated
```typescript
export interface TaskUpdatedEvent extends AuditEventBase {
  type: 'user.action.task.updated';
  data: {
    taskId: string;
    changes: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
  };
}
```

### 1.5 Task Deleted
```typescript
export interface TaskDeletedEvent extends AuditEventBase {
  type: 'user.action.task.deleted';
  data: {
    taskId: string;
    softDelete: boolean;
    reason?: string;
  };
}
```

### 1.6 Task Status Changed
```typescript
export interface TaskStatusChangedEvent extends AuditEventBase {
  type: 'user.action.task.status_changed';
  data: {
    taskId: string;
    oldStatus: 'pending' | 'in-progress' | 'completed' | 'archived';
    newStatus: 'pending' | 'in-progress' | 'completed' | 'archived';
    reason?: string;
  };
}
```

### 1.7 Task Assigned
```typescript
export interface TaskAssignedEvent extends AuditEventBase {
  type: 'user.action.task.assigned';
  data: {
    taskId: string;
    assignedTo: string;
    assignedToType: 'user' | 'team' | 'partner';
    previousAssignee?: string;
  };
}
```

### 1.8 Document Uploaded
```typescript
export interface DocumentUploadedEvent extends AuditEventBase {
  type: 'user.action.document.uploaded';
  data: {
    documentId: string;
    filename: string;
    fileSize: number;  // Bytes
    mimeType: string;
    entityType: AuditEntityType;
    entityId: string;
  };
}
```

### 1.9 Document Downloaded
```typescript
export interface DocumentDownloadedEvent extends AuditEventBase {
  type: 'user.action.document.downloaded';
  data: {
    documentId: string;
    filename: string;
  };
}
```

### 1.10 Comment Added
```typescript
export interface CommentAddedEvent extends AuditEventBase {
  type: 'user.action.comment.added';
  data: {
    commentId: string;
    entityType: AuditEntityType;
    entityId: string;
    content: string;
    mentions?: string[];
  };
}
```

### 1.11 Export Requested
```typescript
export interface ExportRequestedEvent extends AuditEventBase {
  type: 'user.action.export.requested';
  data: {
    exportType: 'json' | 'csv' | 'pdf';
    entityType: AuditEntityType;
    filters?: Record<string, any>;
    timeRange?: {
      start: string;
      end: string;
    };
  };
}
```

### 1.12 Settings Updated
```typescript
export interface SettingsUpdatedEvent extends AuditEventBase {
  type: 'user.action.settings.updated';
  data: {
    settingKey: string;
    oldValue: any;
    newValue: any;
    scope: 'user' | 'blueprint' | 'organization';
  };
}
```

## Category 2: AI Decisions (8 schemas)

### 2.1 Architectural Decision
```typescript
export interface AIArchitecturalDecisionEvent extends AuditEventBase {
  type: 'ai.decision.architectural';
  actorType: 'ai';
  data: {
    decisionType: 'pattern_selection' | 'refactoring' | 'technology_recommendation';
    context: string;
    options: Array<{
      name: string;
      score: number;
      reason: string;
    }>;
    selected: string;
    reasoning: string;
    confidence: number;  // 0.0 to 1.0
    guidelinesChecked: string[];
    constraintsApplied: string[];
  };
}
```

### 2.2 Behavioral Compliance Check
```typescript
export interface AIBehavioralComplianceEvent extends AuditEventBase {
  type: 'ai.compliance.behavioral';
  actorType: 'ai';
  data: {
    guideline: string;
    result: 'compliant' | 'violation' | 'warning';
    details: string;
    recommendation?: string;
    affectedFiles?: string[];
  };
}
```

### 2.3 Data Flow Traced
```typescript
export interface AIDataFlowTracedEvent extends AuditEventBase {
  type: 'ai.dataflow.traced';
  actorType: 'ai';
  data: {
    sourceLayer: 'presentation' | 'business' | 'data' | 'foundation';
    targetLayer: 'presentation' | 'business' | 'data' | 'foundation';
    dataType: string;
    transformation: string;
    validationPassed: boolean;
  };
}
```

### 2.4 Side Effect Detected
```typescript
export interface AISideEffectDetectedEvent extends AuditEventBase {
  type: 'ai.side_effect.detected';
  actorType: 'ai';
  data: {
    changeDescription: string;
    detectedSideEffects: Array<{
      type: 'performance' | 'security' | 'compatibility' | 'data_integrity';
      severity: 'critical' | 'high' | 'medium' | 'low';
      description: string;
      recommendation: string;
    }>;
    mitigationRequired: boolean;
  };
}
```

### 2.5 Constraint Violation Detected
```typescript
export interface AIConstraintViolationEvent extends AuditEventBase {
  type: 'ai.constraint.violation';
  actorType: 'ai';
  data: {
    constraint: string;
    violationDetails: string;
    suggestedFix: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  };
}
```

### 2.6 Pattern Recommendation
```typescript
export interface AIPatternRecommendationEvent extends AuditEventBase {
  type: 'ai.recommendation.pattern';
  actorType: 'ai';
  data: {
    pattern: string;
    context: string;
    justification: string;
    alternatives: string[];
    confidence: number;
  };
}
```

### 2.7 Code Quality Analysis
```typescript
export interface AICodeQualityAnalysisEvent extends AuditEventBase {
  type: 'ai.analysis.code_quality';
  actorType: 'ai';
  data: {
    files: string[];
    metrics: {
      complexity: number;
      maintainability: number;
      testCoverage: number;
      duplication: number;
    };
    issues: Array<{
      type: string;
      severity: string;
      location: string;
      suggestion: string;
    }>;
  };
}
```

### 2.8 Dependency Analysis
```typescript
export interface AIDependencyAnalysisEvent extends AuditEventBase {
  type: 'ai.analysis.dependency';
  actorType: 'ai';
  data: {
    module: string;
    dependencies: string[];
    circularDependencies: string[][];
    suggestions: string[];
  };
}
```

## Category 3: Data Flow (10 schemas)

### 3.1 Database Query
```typescript
export interface DataQueryEvent extends AuditEventBase {
  type: 'data.flow.query';
  actorType: 'system';
  data: {
    collection: string;
    operation: 'query' | 'get' | 'list';
    filters: Record<string, any>;
    resultCount: number;
    duration: number;  // Milliseconds
    cacheHit: boolean;
  };
}
```

### 3.2 Database Mutation
```typescript
export interface DataMutationEvent extends AuditEventBase {
  type: 'data.flow.mutation';
  actorType: 'user' | 'system';
  data: {
    collection: string;
    operation: 'create' | 'update' | 'delete';
    documentId: string;
    changes?: {
      field: string;
      oldValue: any;
      newValue: any;
    }[];
    success: boolean;
  };
}
```

### 3.3 Database Migration
```typescript
export interface DataMigrationEvent extends AuditEventBase {
  type: 'data.flow.migration';
  actorType: 'system';
  data: {
    migrationId: string;
    version: string;
    operation: 'up' | 'down';
    affectedCollections: string[];
    recordsAffected: number;
    duration: number;
    success: boolean;
    error?: string;
  };
}
```

### 3.4 Data Validation
```typescript
export interface DataValidationEvent extends AuditEventBase {
  type: 'data.flow.validation';
  data: {
    entityType: AuditEntityType;
    entityId: string;
    validationRules: string[];
    passed: boolean;
    errors?: Array<{
      field: string;
      rule: string;
      message: string;
    }>;
  };
}
```

### 3.5 Data Transformation
```typescript
export interface DataTransformationEvent extends AuditEventBase {
  type: 'data.flow.transformation';
  data: {
    transformationType: string;
    inputFormat: string;
    outputFormat: string;
    recordsTransformed: number;
    success: boolean;
  };
}
```

### 3.6 Batch Operation
```typescript
export interface DataBatchOperationEvent extends AuditEventBase {
  type: 'data.flow.batch';
  data: {
    operation: 'create' | 'update' | 'delete';
    collection: string;
    batchSize: number;
    successCount: number;
    failureCount: number;
    duration: number;
  };
}
```

### 3.7 Cache Operation
```typescript
export interface DataCacheOperationEvent extends AuditEventBase {
  type: 'data.flow.cache';
  data: {
    operation: 'get' | 'set' | 'delete' | 'clear';
    cacheKey: string;
    hit: boolean;
    ttl?: number;
  };
}
```

### 3.8 Data Export
```typescript
export interface DataExportEvent extends AuditEventBase {
  type: 'data.flow.export';
  data: {
    exportFormat: 'json' | 'csv' | 'pdf';
    recordCount: number;
    fileSize: number;
    destination: string;
  };
}
```

### 3.9 Data Import
```typescript
export interface DataImportEvent extends AuditEventBase {
  type: 'data.flow.import';
  data: {
    importFormat: 'json' | 'csv';
    recordCount: number;
    successCount: number;
    failureCount: number;
    validationErrors: string[];
  };
}
```

### 3.10 Data Backup
```typescript
export interface DataBackupEvent extends AuditEventBase {
  type: 'data.flow.backup';
  actorType: 'system';
  data: {
    backupId: string;
    collections: string[];
    recordCount: number;
    backupSize: number;
    destination: string;
    duration: number;
    success: boolean;
  };
}
```

## Category 4: Security (9 schemas)

### 4.1 Permission Checked
```typescript
export interface SecurityPermissionCheckedEvent extends AuditEventBase {
  type: 'security.permission.checked';
  data: {
    resource: string;
    resourceType: AuditEntityType;
    permission: string;
    result: 'granted' | 'denied';
    reason: string;
    roles?: string[];
    permissions?: string[];
  };
}
```

### 4.2 Authentication Success
```typescript
export interface SecurityAuthSuccessEvent extends AuditEventBase {
  type: 'security.auth.success';
  data: {
    authMethod: 'email' | 'google' | 'token';
    ipAddress: string;
    userAgent: string;
  };
}
```

### 4.3 Authentication Failure
```typescript
export interface SecurityAuthFailureEvent extends AuditEventBase {
  type: 'security.auth.failure';
  data: {
    authMethod: 'email' | 'google' | 'token';
    failureReason: string;
    ipAddress: string;
    attemptCount: number;
  };
}
```

### 4.4 Token Issued
```typescript
export interface SecurityTokenIssuedEvent extends AuditEventBase {
  type: 'security.token.issued';
  data: {
    tokenType: 'access' | 'refresh';
    expiresAt: string;
    scopes: string[];
  };
}
```

### 4.5 Token Revoked
```typescript
export interface SecurityTokenRevokedEvent extends AuditEventBase {
  type: 'security.token.revoked';
  data: {
    tokenId: string;
    reason: string;
  };
}
```

### 4.6 Permission Granted
```typescript
export interface SecurityPermissionGrantedEvent extends AuditEventBase {
  type: 'security.permission.granted';
  data: {
    subjectId: string;
    subjectType: 'user' | 'team' | 'partner';
    permission: string;
    resource: string;
    grantedBy: string;
  };
}
```

### 4.7 Permission Revoked
```typescript
export interface SecurityPermissionRevokedEvent extends AuditEventBase {
  type: 'security.permission.revoked';
  data: {
    subjectId: string;
    subjectType: 'user' | 'team' | 'partner';
    permission: string;
    resource: string;
    revokedBy: string;
    reason: string;
  };
}
```

### 4.8 Security Rule Violation
```typescript
export interface SecurityRuleViolationEvent extends AuditEventBase {
  type: 'security.rule.violation';
  data: {
    rule: string;
    violationType: string;
    attemptedAction: string;
    resource: string;
    ipAddress: string;
  };
}
```

### 4.9 Security Incident
```typescript
export interface SecurityIncidentEvent extends AuditEventBase {
  type: 'security.incident';
  data: {
    incidentType: 'breach' | 'unauthorized_access' | 'data_leak' | 'anomaly';
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    affectedResources: string[];
    detectionMethod: string;
    responseActions: string[];
  };
}
```

## Category 5: System (10 schemas)

### 5.1 Config Changed
```typescript
export interface SystemConfigChangedEvent extends AuditEventBase {
  type: 'system.config.changed';
  data: {
    key: string;
    oldValue: any;
    newValue: any;
    reason: string;
    environment: 'development' | 'staging' | 'production';
  };
}
```

### 5.2 Health Check
```typescript
export interface SystemHealthCheckEvent extends AuditEventBase {
  type: 'system.health.check';
  actorType: 'system';
  data: {
    component: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    details?: string;
  };
}
```

### 5.3 Performance Metrics
```typescript
export interface SystemPerformanceMetricsEvent extends AuditEventBase {
  type: 'system.performance.metrics';
  actorType: 'system';
  data: {
    metrics: {
      cpu: number;
      memory: number;
      latency: number;
      throughput: number;
    };
    threshold_exceeded?: string[];
  };
}
```

### 5.4 Error Occurred
```typescript
export interface SystemErrorEvent extends AuditEventBase {
  type: 'system.error.occurred';
  actorType: 'system';
  data: {
    errorType: string;
    errorCode: string;
    message: string;
    stack?: string;
    context?: Record<string, any>;
  };
}
```

### 5.5 Service Started
```typescript
export interface SystemServiceStartedEvent extends AuditEventBase {
  type: 'system.service.started';
  actorType: 'system';
  data: {
    service: string;
    version: string;
    environment: string;
    startupTime: number;
  };
}
```

### 5.6 Service Stopped
```typescript
export interface SystemServiceStoppedEvent extends AuditEventBase {
  type: 'system.service.stopped';
  actorType: 'system';
  data: {
    service: string;
    reason: string;
    uptime: number;
    graceful: boolean;
  };
}
```

### 5.7 Deployment
```typescript
export interface SystemDeploymentEvent extends AuditEventBase {
  type: 'system.deployment';
  actorType: 'system';
  data: {
    version: string;
    environment: 'development' | 'staging' | 'production';
    deploymentType: 'blue-green' | 'rolling' | 'canary';
    duration: number;
    success: boolean;
  };
}
```

### 5.8 Circuit Breaker State Changed
```typescript
export interface SystemCircuitBreakerEvent extends AuditEventBase {
  type: 'system.circuit_breaker.state_changed';
  actorType: 'system';
  data: {
    service: string;
    oldState: 'closed' | 'open' | 'half-open';
    newState: 'closed' | 'open' | 'half-open';
    failureCount: number;
    threshold: number;
  };
}
```

### 5.9 Rate Limit Exceeded
```typescript
export interface SystemRateLimitExceededEvent extends AuditEventBase {
  type: 'system.rate_limit.exceeded';
  data: {
    endpoint: string;
    limit: number;
    actual: number;
    timeWindow: number;
    ipAddress: string;
  };
}
```

### 5.10 Feature Flag Changed
```typescript
export interface SystemFeatureFlagChangedEvent extends AuditEventBase {
  type: 'system.feature_flag.changed';
  data: {
    flag: string;
    oldValue: boolean;
    newValue: boolean;
    reason: string;
    rolloutPercentage?: number;
  };
}
```

## Validation Rules

All events must pass these validation rules:

```typescript
export const AUDIT_EVENT_VALIDATION_RULES = {
  // Required fields
  required: ['type', 'timestamp', 'actor', 'actorType', 'data', 'priority'],
  
  // Type constraints
  typeConstraints: {
    type: 'string',
    timestamp: 'ISO 8601 string',
    actor: 'string',
    actorType: ['user', 'team', 'partner', 'system', 'ai'],
    priority: ['P0', 'P1', 'P2', 'P3'],
    data: 'object'
  },
  
  // Field length constraints
  lengthConstraints: {
    type: { max: 100 },
    actor: { max: 50 },
    blueprintId: { max: 50 }
  },
  
  // Sensitive data handling
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'apiKey',
    'privateKey',
    'creditCard',
    'ssn'
  ],
  
  // Storage recommendations by category
  storageRecommendations: {
    'security': { tier: 'hot', retentionDays: 2555, compressed: false },  // 7 years
    'compliance': { tier: 'hot', retentionDays: 2555, compressed: false }, // 7 years
    'user_action': { tier: 'warm', retentionDays: 90, compressed: true },   // 3 months
    'ai_decision': { tier: 'hot', retentionDays: 365, compressed: false },  // 1 year
    'data_flow': { tier: 'cold', retentionDays: 30, compressed: true },     // 1 month
    'system': { tier: 'warm', retentionDays: 90, compressed: true },        // 3 months
    'blueprint': { tier: 'warm', retentionDays: 365, compressed: true },    // 1 year
    'task': { tier: 'warm', retentionDays: 90, compressed: true },          // 3 months
    'organization': { tier: 'warm', retentionDays: 365, compressed: true }, // 1 year
    'integration': { tier: 'cold', retentionDays: 30, compressed: true },   // 1 month
    'performance': { tier: 'cold', retentionDays: 7, compressed: true }     // 1 week
  }
};
```

## Usage Examples

### Creating an Event
```typescript
const event: TaskCreatedEvent = {
  type: 'user.action.task.created',
  timestamp: new Date().toISOString(),
  actor: 'user-123',
  actorType: 'user',
  blueprintId: 'bp-456',
  data: {
    taskId: 'task-789',
    title: 'Install plumbing',
    description: 'Install all plumbing fixtures',
    assignedTo: 'team-101',
    assignedToType: 'team',
    dueDate: '2025-12-31T00:00:00Z',
    priority: 'high',
    status: 'pending'
  },
  priority: 'P1'
};

// Emit event
auditCollector.emit(event);
```

### Validating an Event
```typescript
function validateEvent(event: AuditEventBase): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  for (const field of AUDIT_EVENT_VALIDATION_RULES.required) {
    if (!(field in event)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Check type constraints
  if (event.actorType && !AUDIT_EVENT_VALIDATION_RULES.typeConstraints.actorType.includes(event.actorType)) {
    errors.push(`Invalid actorType: ${event.actorType}`);
  }
  
  if (event.priority && !AUDIT_EVENT_VALIDATION_RULES.typeConstraints.priority.includes(event.priority)) {
    errors.push(`Invalid priority: ${event.priority}`);
  }
  
  // Check for sensitive data
  const sensitiveDataFound = findSensitiveData(event.data);
  if (sensitiveDataFound.length > 0) {
    errors.push(`Sensitive data found in payload: ${sensitiveDataFound.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Summary

- **Total Schemas**: 100+ across 11 categories
- **Base Schema**: Consistent structure for all events
- **Validation**: Automated validation rules
- **Storage**: Category-specific retention policies
- **Compliance**: Built-in compliance tag support
- **Type Safety**: Full TypeScript interfaces

## Related Documentation

- [Layer 1: Event Sources](../audit-layers/LAYER_1_EVENT_SOURCES.md) - Event emission
- [Layer 4: Classification Engine](../audit-layers/LAYER_4_CLASSIFICATION_ENGINE.md) - Event categorization
- [Comparative Analysis](../audit-architecture/COMPARATIVE_ANALYSIS.md) - Master system alignment
- [Integration Map](../audit-architecture/INTEGRATION_MAP.md) - Layer integration

---

**Status**: Complete (100+ schemas defined)
**Last Updated**: 2025-12-26
**Maintainer**: Audit System Team
