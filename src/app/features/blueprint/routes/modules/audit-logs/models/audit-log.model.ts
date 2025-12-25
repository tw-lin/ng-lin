/**
 * Audit Log Data Models
 *
 * Firestore persistence models for Audit Log subcollection.
 * Audit logs track all significant actions within a blueprint.
 *
 * Collection path: blueprints/{blueprintId}/audit-logs/{logId}
 */

import { Timestamp } from '@angular/fire/firestore';

/**
 * Audit Log Document (Firestore)
 *
 * Records an auditable action or event in the system.
 */
export interface AuditLogDocument {
  /** Document ID (auto-generated) */
  readonly id?: string;

  /** Blueprint ID this log belongs to */
  blueprintId: string;

  /** Event type (action performed) */
  eventType: AuditEventType;

  /** Event category for grouping */
  category: AuditCategory;

  /** Severity level */
  severity: AuditSeverity;

  /** User who performed the action */
  actorId: string;

  /** Actor type (user/system/service) */
  actorType: ActorType;

  /** Target resource type */
  resourceType: string;

  /** Target resource ID */
  resourceId?: string;

  /** Action description */
  action: string;

  /** Detailed message */
  message: string;

  /** Change details (before/after) */
  changes?: AuditChange[];

  /** Additional context */
  context?: AuditContext;

  /** Metadata for filtering and analysis */
  metadata?: Record<string, unknown>;

  /** IP address of actor */
  ipAddress?: string;

  /** User agent */
  userAgent?: string;

  /** Request ID for tracing */
  requestId?: string;

  /** Timestamp when event occurred */
  timestamp: Timestamp | Date;

  /** Status of the action */
  status: AuditStatus;

  /** Error details (if failed) */
  error?: AuditError;
}

/**
 * Audit Event Type
 *
 * Standard event types for audit logging.
 */
export enum AuditEventType {
  // Blueprint events
  BLUEPRINT_CREATED = 'blueprint.created',
  BLUEPRINT_UPDATED = 'blueprint.updated',
  BLUEPRINT_DELETED = 'blueprint.deleted',
  BLUEPRINT_RESTORED = 'blueprint.restored',
  BLUEPRINT_PUBLISHED = 'blueprint.published',
  BLUEPRINT_ARCHIVED = 'blueprint.archived',

  // Module events
  MODULE_ADDED = 'module.added',
  MODULE_REMOVED = 'module.removed',
  MODULE_ENABLED = 'module.enabled',
  MODULE_DISABLED = 'module.disabled',
  MODULE_CONFIGURED = 'module.configured',
  MODULE_REGISTERED = 'module.registered',
  MODULE_UNREGISTERED = 'module.unregistered',
  MODULE_STARTED = 'module.started',
  MODULE_STOPPED = 'module.stopped',
  MODULE_ERROR = 'module.error',

  // Configuration events
  CONFIG_CREATED = 'config.created',
  CONFIG_UPDATED = 'config.updated',
  CONFIG_ACTIVATED = 'config.activated',
  CONFIG_ARCHIVED = 'config.archived',

  // Task events
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_DELETED = 'task.deleted',
  TASK_STATUS_CHANGED = 'task.status_changed',
  TASK_ASSIGNED = 'task.assigned',
  TASK_COMPLETED = 'task.completed',

  // Log events
  LOG_CREATED = 'log.created',
  LOG_UPDATED = 'log.updated',
  LOG_DELETED = 'log.deleted',

  // Member events
  MEMBER_ADDED = 'member.added',
  MEMBER_REMOVED = 'member.removed',
  MEMBER_ROLE_CHANGED = 'member.role_changed',
  MEMBER_PERMISSIONS_CHANGED = 'member.permissions_changed',

  // Permission events
  PERMISSION_GRANTED = 'permission.granted',
  PERMISSION_REVOKED = 'permission.revoked',
  ROLE_CREATED = 'role.created',
  ROLE_UPDATED = 'role.updated',
  ROLE_DELETED = 'role.deleted',

  // Access events
  ACCESS_GRANTED = 'access.granted',
  ACCESS_DENIED = 'access.denied',
  LOGIN = 'access.login',
  LOGOUT = 'access.logout',

  // System events
  SYSTEM_ERROR = 'system.error',
  SYSTEM_WARNING = 'system.warning',
  SYSTEM_INFO = 'system.info'
}

/**
 * Audit Category
 */
export enum AuditCategory {
  BLUEPRINT = 'blueprint',
  MODULE = 'module',
  CONFIG = 'config',
  MEMBER = 'member',
  PERMISSION = 'permission',
  ACCESS = 'access',
  DATA = 'data',
  SYSTEM = 'system'
}

/**
 * Audit Severity
 */
export enum AuditSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

/**
 * Actor Type
 */
export enum ActorType {
  USER = 'user',
  SYSTEM = 'system',
  SERVICE = 'service',
  API = 'api'
}

/**
 * Audit Status
 */
export enum AuditStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
  PENDING = 'pending'
}

/**
 * Audit Change
 *
 * Represents a before/after change.
 */
export interface AuditChange {
  /** Field that changed */
  field: string;

  /** Previous value */
  oldValue: unknown;

  /** New value */
  newValue: unknown;

  /** Change type */
  changeType: 'created' | 'updated' | 'deleted';
}

/**
 * Audit Context
 *
 * Additional context information.
 */
export interface AuditContext {
  /** Module that triggered the event */
  module?: string;

  /** Feature or component */
  feature?: string;

  /** Parent resource */
  parentResource?: {
    type: string;
    id: string;
  };

  /** Related resources */
  relatedResources?: Array<{
    type: string;
    id: string;
  }>;

  /** Session ID */
  sessionId?: string;

  /** Geographic location */
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

/**
 * Audit Error
 *
 * Error information when action fails.
 */
export interface AuditError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Error stack trace */
  stackTrace?: string;

  /** Error details */
  details?: Record<string, unknown>;
}

/**
 * Create Audit Log Data
 */
export interface CreateAuditLogData {
  blueprintId: string;
  eventType: AuditEventType;
  category: AuditCategory;
  severity: AuditSeverity;
  actorId: string;
  actorType: ActorType;
  resourceType: string;
  resourceId?: string;
  action: string;
  message: string;
  changes?: AuditChange[];
  context?: AuditContext;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  status: AuditStatus;
  error?: AuditError;
}

/**
 * Audit Log Query Options
 */
export interface AuditLogQueryOptions {
  /** Filter by event type */
  eventType?: AuditEventType | AuditEventType[];

  /** Filter by category */
  category?: AuditCategory;

  /** Filter by severity */
  severity?: AuditSeverity;

  /** Filter by actor */
  actorId?: string;

  /** Filter by resource type */
  resourceType?: string;

  /** Filter by resource ID */
  resourceId?: string;

  /** Filter by status */
  status?: AuditStatus;

  /** Start date for time range */
  startDate?: Date;

  /** End date for time range */
  endDate?: Date;

  /** Limit results */
  limit?: number;

  /** Pagination cursor */
  cursor?: string;

  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Audit Log Summary
 *
 * Statistical summary of audit logs.
 */
export interface AuditLogSummary {
  total: number;
  byCategory: Record<AuditCategory, number>;
  bySeverity: Record<AuditSeverity, number>;
  byStatus: Record<AuditStatus, number>;
  recentErrors: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}
