/**
 * Audit Logs Module Configuration
 *
 * Runtime configuration for the audit logs module.
 *
 * @author GigHub Development Team
 * @date 2025-12-13
 */

/**
 * Audit Logs Configuration
 */
export interface AuditLogsConfig {
  /** Enable automatic logging of events */
  autoLogging: boolean;

  /** Log retention period in days */
  retentionDays: number;

  /** Maximum logs per page */
  maxLogsPerPage: number;

  /** Minimum severity level to log */
  minSeverityLevel: 'critical' | 'high' | 'medium' | 'low' | 'info';

  /** Enable batch logging */
  enableBatchLogging: boolean;

  /** Batch size for batch logging */
  batchSize: number;

  /** Enable real-time synchronization */
  enableRealTimeSync: boolean;

  /** Enable log compression for old logs */
  enableCompression: boolean;

  /** Compress logs older than (days) */
  compressAfterDays: number;
}

/**
 * Default Audit Logs Configuration
 */
export const DEFAULT_AUDIT_LOGS_CONFIG: AuditLogsConfig = {
  autoLogging: true,
  retentionDays: 365,
  maxLogsPerPage: 100,
  minSeverityLevel: 'info',
  enableBatchLogging: false,
  batchSize: 50,
  enableRealTimeSync: false,
  enableCompression: false,
  compressAfterDays: 90
};
