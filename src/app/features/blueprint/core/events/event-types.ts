/**
 * Standard Blueprint Event Types
 *
 * Centralized event type definitions for the blueprint system.
 * Ensures consistency and prevents typos in event handling.
 */
export enum BlueprintEventType {
  // ===== Container Lifecycle Events =====
  /** Blueprint container has been initialized */
  CONTAINER_INITIALIZED = 'CONTAINER_INITIALIZED',

  /** Blueprint container is starting */
  CONTAINER_STARTING = 'CONTAINER_STARTING',

  /** Blueprint container has started */
  CONTAINER_STARTED = 'CONTAINER_STARTED',

  /** Blueprint container is stopping */
  CONTAINER_STOPPING = 'CONTAINER_STOPPING',

  /** Blueprint container has stopped */
  CONTAINER_STOPPED = 'CONTAINER_STOPPED',

  /** Blueprint container encountered an error */
  CONTAINER_ERROR = 'CONTAINER_ERROR',

  // ===== Module Lifecycle Events =====
  /** Module has been registered in the registry */
  MODULE_REGISTERED = 'MODULE_REGISTERED',

  /** Module has been initialized */
  MODULE_INITIALIZED = 'MODULE_INITIALIZED',

  /** Module is starting */
  MODULE_STARTING = 'MODULE_STARTING',

  /** Module has started */
  MODULE_STARTED = 'MODULE_STARTED',

  /** Module is ready */
  MODULE_READY = 'MODULE_READY',

  /** Module is stopping */
  MODULE_STOPPING = 'MODULE_STOPPING',

  /** Module has stopped */
  MODULE_STOPPED = 'MODULE_STOPPED',

  /** Module has been disposed */
  MODULE_DISPOSED = 'MODULE_DISPOSED',

  /** Module has been loaded and initialized */
  MODULE_LOADED = 'MODULE_LOADED',

  /** Module has been unloaded */
  MODULE_UNLOADED = 'MODULE_UNLOADED',

  /** Module encountered an error */
  MODULE_ERROR = 'MODULE_ERROR',

  // ===== Blueprint CRUD Events =====
  /** New blueprint created */
  BLUEPRINT_CREATED = 'BLUEPRINT_CREATED',

  /** Blueprint updated */
  BLUEPRINT_UPDATED = 'BLUEPRINT_UPDATED',

  /** Blueprint deleted */
  BLUEPRINT_DELETED = 'BLUEPRINT_DELETED',

  /** Blueprint activated */
  BLUEPRINT_ACTIVATED = 'BLUEPRINT_ACTIVATED',

  /** Blueprint deactivated */
  BLUEPRINT_DEACTIVATED = 'BLUEPRINT_DEACTIVATED',

  // ===== Business Events (Examples from Core Modules) =====
  /** Task created */
  TASK_CREATED = 'TASK_CREATED',

  /** Task updated */
  TASK_UPDATED = 'TASK_UPDATED',

  /** Task completed */
  TASK_COMPLETED = 'TASK_COMPLETED',

  /** Log entry created */
  LOG_CREATED = 'LOG_CREATED',

  /** Quality check requested */
  QUALITY_CHECK_REQUESTED = 'QUALITY_CHECK_REQUESTED',

  /** Quality check completed */
  QUALITY_CHECK_COMPLETED = 'QUALITY_CHECK_COMPLETED',

  // ===== Issue Module Events =====
  /** Issue created manually */
  ISSUE_CREATED = 'ISSUE_CREATED',

  /** Issue updated */
  ISSUE_UPDATED = 'ISSUE_UPDATED',

  /** Issue assigned to user */
  ISSUE_ASSIGNED = 'ISSUE_ASSIGNED',

  /** Issue resolved */
  ISSUE_RESOLVED = 'ISSUE_RESOLVED',

  /** Issue verified */
  ISSUE_VERIFIED = 'ISSUE_VERIFIED',

  /** Issue verification failed */
  ISSUE_VERIFICATION_FAILED = 'ISSUE_VERIFICATION_FAILED',

  /** Issue closed */
  ISSUE_CLOSED = 'ISSUE_CLOSED',

  /** Issues created from acceptance failure */
  ISSUES_CREATED_FROM_ACCEPTANCE = 'ISSUES_CREATED_FROM_ACCEPTANCE',

  /** Issues created from QC failure */
  ISSUES_CREATED_FROM_QC = 'ISSUES_CREATED_FROM_QC',

  /** Issue created from warranty defect */
  ISSUE_CREATED_FROM_WARRANTY = 'ISSUE_CREATED_FROM_WARRANTY',

  /** Issue created from safety incident */
  ISSUE_CREATED_FROM_SAFETY = 'ISSUE_CREATED_FROM_SAFETY',

  // ===== Contract Module Events =====
  /** Contract created */
  CONTRACT_CREATED = 'CONTRACT_CREATED',

  /** Contract updated */
  CONTRACT_UPDATED = 'CONTRACT_UPDATED',

  /** Contract deleted */
  CONTRACT_DELETED = 'CONTRACT_DELETED',

  /** Contract activated */
  CONTRACT_ACTIVATED = 'CONTRACT_ACTIVATED',

  /** Contract completed */
  CONTRACT_COMPLETED = 'CONTRACT_COMPLETED',

  /** Contract terminated */
  CONTRACT_TERMINATED = 'CONTRACT_TERMINATED',

  /** Contract status changed */
  CONTRACT_STATUS_CHANGED = 'CONTRACT_STATUS_CHANGED',

  /** Contract file uploaded */
  CONTRACT_FILE_UPLOADED = 'CONTRACT_FILE_UPLOADED',

  /** Contract file removed */
  CONTRACT_FILE_REMOVED = 'CONTRACT_FILE_REMOVED',

  /** Contract work item added */
  CONTRACT_WORK_ITEM_ADDED = 'CONTRACT_WORK_ITEM_ADDED',

  /** Contract work item updated */
  CONTRACT_WORK_ITEM_UPDATED = 'CONTRACT_WORK_ITEM_UPDATED',

  /** Contract work item deleted */
  CONTRACT_WORK_ITEM_DELETED = 'CONTRACT_WORK_ITEM_DELETED',

  /** Contract work item progress updated */
  CONTRACT_WORK_ITEM_PROGRESS_UPDATED = 'CONTRACT_WORK_ITEM_PROGRESS_UPDATED',

  /** Contract work item linked to task */
  CONTRACT_WORK_ITEM_TASK_LINKED = 'CONTRACT_WORK_ITEM_TASK_LINKED',

  /** Contract work item unlinked from task */
  CONTRACT_WORK_ITEM_TASK_UNLINKED = 'CONTRACT_WORK_ITEM_TASK_UNLINKED',

  // ===== Contract Parsing Events =====
  /** Contract parsing requested */
  CONTRACT_PARSING_REQUESTED = 'CONTRACT_PARSING_REQUESTED',

  /** Contract parsing started */
  CONTRACT_PARSING_STARTED = 'CONTRACT_PARSING_STARTED',

  /** Contract parsing completed */
  CONTRACT_PARSING_COMPLETED = 'CONTRACT_PARSING_COMPLETED',

  /** Contract parsing failed */
  CONTRACT_PARSING_FAILED = 'CONTRACT_PARSING_FAILED',

  /** Contract parsed data confirmed */
  CONTRACT_PARSING_CONFIRMED = 'CONTRACT_PARSING_CONFIRMED'
}
