/**
 * Audit Logs Module Metadata
 *
 * Configuration and metadata for the Audit Logs module.
 * Defines module identity, dependencies, and default configuration.
 *
 * @module AuditLogsModuleMetadata
 * @author GigHub Development Team
 * @date 2025-12-13
 */

import { BlueprintModuleConfiguration } from '@core/blueprint/domain/models';

/**
 * Audit Logs Module Metadata
 */
export const AUDIT_LOGS_MODULE_METADATA = {
  /** Unique module identifier */
  id: 'audit-logs',

  /** Module type identifier */
  moduleType: 'audit-logs',

  /** Display name */
  name: '審計記錄',

  /** English name */
  nameEn: 'Audit Logs',

  /** Module version */
  version: '1.0.0',

  /** Module description */
  description: '審計記錄模組，追蹤和記錄藍圖中的所有重要操作和事件',

  /** English description */
  descriptionEn: 'Audit logging module that tracks and records all significant actions and events within a blueprint',

  /** Module dependencies */
  dependencies: [] as string[],

  /** Default load order */
  defaultOrder: 10,

  /** Module icon (ng-zorro-antd icon name) */
  icon: 'file-protect',

  /** Module color theme */
  color: '#722ed1',

  /** Module category */
  category: 'system',

  /** Tags for filtering */
  tags: ['審計', 'audit', 'logging', 'security', 'compliance'],

  /** Author */
  author: 'GigHub Development Team',

  /** License */
  license: 'Proprietary'
} as const;

/**
 * Default Module Configuration
 *
 * Default settings when the module is first enabled.
 */
export const AUDIT_LOGS_MODULE_DEFAULT_CONFIG: BlueprintModuleConfiguration = {
  features: {
    enableAutoLogging: true,
    enableBatchLogging: false,
    enableRealTimeSync: false,
    enableLogExport: true,
    enableLogSearch: true,
    enableLogFiltering: true,
    enableLogSummary: true,
    enableDetailedView: true,
    enableLogRetention: true,
    enableLogCompression: false
  },

  settings: {
    logRetentionDays: 365,
    maxLogsPerPage: 100,
    enabledCategories: ['blueprint', 'module', 'member', 'permission', 'access', 'system'],
    minSeverityLevel: 'info',
    autoDeleteAfterRetention: false,
    compressOldLogs: false,
    compressAfterDays: 90,
    excludedEventTypes: [],
    includeSystemEvents: true,
    includeUserEvents: true,
    includeApiEvents: true
  },

  ui: {
    icon: 'file-protect',
    color: '#722ed1',
    position: 999, // Load last
    visibility: 'visible'
  },

  permissions: {
    requiredRoles: ['viewer', 'contributor', 'maintainer'],
    allowedActions: ['audit.read', 'audit.export', 'audit.search']
  },

  limits: {
    maxItems: 100000,
    maxStorage: 524288000, // 500MB
    maxRequests: 5000
  }
};

/**
 * Module Permissions
 *
 * Defines permission actions for the Audit Logs module.
 */
export const AUDIT_LOGS_MODULE_PERMISSIONS = {
  READ: 'audit.read',
  EXPORT: 'audit.export',
  SEARCH: 'audit.search',
  DELETE: 'audit.delete', // Restricted
  CONFIGURE: 'audit.configure' // Restricted
} as const;

/**
 * Module Events
 *
 * Events emitted by the Audit Logs module.
 */
export const AUDIT_LOGS_MODULE_EVENTS = {
  LOG_CREATED: 'audit-logs.log_created',
  LOG_BATCH_CREATED: 'audit-logs.log_batch_created',
  LOGS_LOADED: 'audit-logs.logs_loaded',
  LOGS_FILTERED: 'audit-logs.logs_filtered',
  LOGS_EXPORTED: 'audit-logs.logs_exported',
  SUMMARY_GENERATED: 'audit-logs.summary_generated',
  ERROR_OCCURRED: 'audit-logs.error_occurred'
} as const;
