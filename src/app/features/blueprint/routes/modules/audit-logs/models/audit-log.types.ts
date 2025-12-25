/**
 * Audit log entity type
 * 審計記錄實體類型
 */
export type AuditEntityType = 'blueprint' | 'member' | 'task' | 'log' | 'quality' | 'module';

/**
 * Audit operation type
 * 審計操作類型
 */
export type AuditOperation = 'create' | 'update' | 'delete' | 'access' | 'permission_grant';

/**
 * Audit log interface
 * 審計記錄介面
 */
export interface AuditLog {
  id: string;
  blueprintId: string;
  entityType: AuditEntityType;
  entityId: string;
  operation: AuditOperation;
  userId: string;
  userName?: string;
  timestamp: Date | string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    context?: string;
    [key: string]: unknown;
  };
}

/**
 * Audit query options
 * 審計查詢選項
 */
export interface AuditQueryOptions {
  entityType?: AuditEntityType;
  operation?: AuditOperation;
  userId?: string;
  from?: Date | string;
  to?: Date | string;
  limit?: number;
}
