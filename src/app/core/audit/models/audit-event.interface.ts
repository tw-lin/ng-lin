import { AuditCategory } from './event-category.enum';
import { AuditLevel } from './event-severity.enum';
import { StorageTier } from './storage-tier.enum';

/**
 * Base Audit Event Interface
 * 
 * Comprehensive audit event structure aligned with GitHub Master System.
 * Supports 102 event types across 11 categories with AI decision tracking.
 * 
 * Core Principles:
 * - Immutable: Events cannot be modified after creation
 * - Tenant-Isolated: All events belong to a single blueprint
 * - Classified: Automatic categorization and risk scoring
 * - Traceable: Complete actor, entity, and context information
 * 
 * @see docs/⭐️/audit-schemas/SCHEMA_REGISTRY.md
 * @see docs/⭐️/audit-layers/LAYER_4_CLASSIFICATION_ENGINE.md
 */
export interface AuditEvent {
  /**
   * Unique event identifier (Firestore document ID)
   * Format: UUID v4
   */
  id: string;
  
  /**
   * Blueprint ID (tenant isolation)
   * All events belong to a single blueprint for multi-tenancy
   */
  blueprintId: string;
  
  /**
   * Event timestamp (ISO 8601 with millisecond precision)
   * When the event occurred (not when it was logged)
   */
  timestamp: Date;
  
  /**
   * Actor information
   * Who performed the action (user, team, partner, AI, or system)
   */
  actor: AuditActor;
  
  /**
   * Event type (hierarchical naming)
   * Format: {category}.{subcategory}.{action}
   * Examples: user.action.login, ai.decision.architectural, data.modification.delete
   */
  eventType: string;
  
  /**
   * Event category (11 categories)
   * Automatically assigned by Classification Engine
   */
  category: AuditCategory;
  
  /**
   * Event severity level (4 levels: LOW, MEDIUM, HIGH, CRITICAL)
   * Automatically assigned by Classification Engine based on risk score
   */
  level: AuditLevel;
  
  /**
   * Target entity information (optional)
   * What resource was affected by the action
   */
  entity?: AuditEntity;
  
  /**
   * Operation type (CRUD + EXECUTE)
   * Automatically inferred by Classification Engine
   */
  operation?: AuditOperation;
  
  /**
   * Change tracking (for DATA_MODIFICATION events)
   * Before/after values for each modified field
   */
  changes?: AuditChange[];
  
  /**
   * Event result
   * Whether the action succeeded, failed, or partially completed
   */
  result: AuditResult;
  
  /**
   * Event description
   * Human-readable description of what happened
   */
  description: string;
  
  /**
   * Error information (for failed events)
   */
  error?: AuditError;
  
  /**
   * Request context (optional)
   * Additional contextual information about the request
   */
  context?: AuditContext;
  
  /**
   * Event metadata (extensible)
   * Additional event-specific data
   */
  metadata?: Record<string, any>;
  
  /**
   * Classification result (Layer 4)
   * Automatically assigned by ClassificationEngineService
   */
  classification: AuditClassification;
  
  /**
   * Storage tier (Layer 5)
   * Current storage tier (HOT, WARM, COLD)
   */
  tier?: StorageTier;
  
  /**
   * Audit metadata
   */
  createdAt: Date;
  updatedAt: Date;
  
  /**
   * Review tracking (Layer 8)
   */
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

/**
 * Actor Information
 * Identifies who performed the action
 */
export interface AuditActor {
  /**
   * Actor unique identifier
   * - User: Firebase UID
   * - Team: Team ID
   * - Partner: Partner ID
   * - AI: AI agent identifier (e.g., 'copilot', 'vertex-ai')
   * - System: Service name (e.g., 'lifecycle-policy', 'backup-service')
   */
  id: string;
  
  /**
   * Actor type
   */
  type: 'user' | 'team' | 'partner' | 'ai' | 'system';
  
  /**
   * Actor display name
   */
  name: string;
  
  /**
   * Actor email (for users only)
   */
  email?: string;
  
  /**
   * AI-specific metadata (for AI actors)
   */
  aiMetadata?: {
    model?: string;
    version?: string;
    confidence?: number;
  };
}

/**
 * Entity Information
 * Identifies what resource was affected
 */
export interface AuditEntity {
  /**
   * Entity unique identifier
   */
  id: string;
  
  /**
   * Entity type (e.g., 'blueprint', 'task', 'contract', 'user')
   */
  type: string;
  
  /**
   * Entity display name
   */
  name: string;
  
  /**
   * Parent entity (optional, for hierarchical resources)
   */
  parent?: {
    id: string;
    type: string;
    name: string;
  };
}

/**
 * Operation Type
 * Standard CRUD + EXECUTE operations
 */
export type AuditOperation = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE';

/**
 * Change Information
 * Tracks field-level changes for DATA_MODIFICATION events
 */
export interface AuditChange {
  /**
   * Field name that changed
   */
  field: string;
  
  /**
   * Previous value (null for CREATE operations)
   */
  oldValue: any;
  
  /**
   * New value (null for DELETE operations)
   */
  newValue: any;
  
  /**
   * Change type (added, modified, removed)
   */
  changeType?: 'added' | 'modified' | 'removed';
}

/**
 * Event Result
 * Indicates the outcome of the action
 */
export type AuditResult = 'success' | 'failure' | 'partial';

/**
 * Error Information
 * Details about failed operations
 */
export interface AuditError {
  /**
   * Error code (e.g., 'PERMISSION_DENIED', 'NOT_FOUND', 'INTERNAL_ERROR')
   */
  code: string;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Stack trace (for exceptions)
   */
  stack?: string;
  
  /**
   * Additional error context
   */
  details?: Record<string, any>;
}

/**
 * Request Context
 * Contextual information about the request
 */
export interface AuditContext {
  /**
   * Request ID (for correlation)
   */
  requestId?: string;
  
  /**
   * Session ID
   */
  sessionId?: string;
  
  /**
   * IP address
   */
  ipAddress?: string;
  
  /**
   * User agent
   */
  userAgent?: string;
  
  /**
   * Source location (URL, service name, etc.)
   */
  source?: string;
  
  /**
   * Additional context data
   */
  data?: Record<string, any>;
}

/**
 * Classification Result
 * Automatically assigned by ClassificationEngineService (Layer 4)
 */
export interface AuditClassification {
  /**
   * Event category (11 categories)
   */
  category: AuditCategory;
  
  /**
   * Event severity level (4 levels)
   */
  level: AuditLevel;
  
  /**
   * Risk score (0-100)
   * Used for anomaly detection and alerting
   */
  riskScore: number;
  
  /**
   * Compliance tags (regulatory frameworks)
   * Examples: GDPR, HIPAA, SOC2, ISO27001, AI_GOVERNANCE
   */
  complianceTags: string[];
  
  /**
   * Auto-review flag
   * True if event requires manual review
   */
  autoReviewRequired: boolean;
  
  /**
   * AI-generated flag
   * True if event was generated by AI agent
   */
  aiGenerated: boolean;
  
  /**
   * Classification timestamp
   */
  classifiedAt: Date;
  
  /**
   * Classification rules applied
   */
  rulesApplied?: string[];
}
