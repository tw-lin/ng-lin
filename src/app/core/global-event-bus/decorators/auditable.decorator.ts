/**
 * @Auditable Decorator
 * 
 * 方法級別審計裝飾器
 * - 自動記錄方法呼叫到審計日誌
 * - 捕獲方法參數與返回值
 * - 記錄執行時間與結果
 * - 遵循 docs/⭐️/Global Audit Log.md 規範
 * 
 * @author Global Event Bus Team
 * @version 1.0.0
 */

import { inject } from '@angular/core';
import { AuditCollectorService, AuditRecordOptions } from '../services/audit-collector.service';
import { AuditLevel, AuditCategory, AuditChanges } from '../models/audit-event.model';

/**
 * @Auditable 裝飾器選項
 */
export interface AuditableOptions {
  /** 操作描述 */
  action?: string;
  /** 資源類型 */
  resourceType?: string;
  /** 審計級別 */
  level?: AuditLevel;
  /** 審計類別 */
  category?: AuditCategory;
  /** 是否需要審查 */
  requiresReview?: boolean;
  /** 是否記錄參數 */
  logArgs?: boolean;
  /** 是否記錄返回值 */
  logResult?: boolean;
  /** 是否記錄執行時間 */
  logDuration?: boolean;
  /** 參數轉換函數 (提取資源 ID) */
  extractResourceId?: (...args: any[]) => string;
  /** 參數轉換函數 (提取執行者) */
  extractActor?: (...args: any[]) => string;
  /** 變更提取函數 */
  extractChanges?: (args: any[], result: any) => AuditChanges;
}

/**
 * @Auditable 方法裝飾器
 * 
 * 自動記錄方法呼叫到審計日誌
 * 
 * @example
 * ```typescript
 * @Auditable({
 *   action: 'delete_repository',
 *   resourceType: 'repository',
 *   level: AuditLevel.WARNING,
 *   requiresReview: true
 * })
 * async deleteRepository(repoId: string): Promise<void> {
 *   // ... implementation
 * }
 * ```
 */
export function Auditable(options: AuditableOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      
      // 取得 AuditCollectorService 實例
      // Note: This requires the service to be available in the injection context
      let auditCollector: AuditCollectorService;
      try {
        auditCollector = inject(AuditCollectorService);
      } catch (error) {
        console.warn('[Auditable] Cannot inject AuditCollectorService, audit logging disabled');
        return originalMethod.apply(this, args);
      }
      
      // 準備審計資訊
      const action = options.action || `${propertyKey}`;
      const resourceType = options.resourceType || target.constructor.name.toLowerCase();
      const resourceId = options.extractResourceId ? 
        options.extractResourceId(...args) : 
        (args[0]?.id || args[0] || 'unknown');
      const actor = options.extractActor ? 
        options.extractActor(...args) : 
        'current-user'; // TODO: Get from AuthService
      
      const eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const eventType = `${resourceType}.${action}`;
      
      try {
        // 執行原始方法
        const result = await originalMethod.apply(this, args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // 準備元數據
        const metadata: Record<string, unknown> = {};
        if (options.logArgs) {
          metadata.arguments = args;
        }
        if (options.logResult && result !== undefined) {
          metadata.result = result;
        }
        if (options.logDuration) {
          metadata.durationMs = duration.toFixed(2);
        }
        
        // 提取變更 (如果有提供)
        let changes: AuditChanges | undefined;
        if (options.extractChanges) {
          changes = options.extractChanges(args, result);
        }
        
        // 記錄審計
        const recordOptions: AuditRecordOptions = {
          level: options.level || AuditLevel.INFO,
          category: options.category || AuditCategory.BUSINESS_OPERATION,
          result: 'success',
          changes,
          metadata,
          requiresReview: options.requiresReview
        };
        
        // 根據類別選擇適當的記錄方法
        if (options.category === AuditCategory.DATA_MODIFICATION || changes) {
          await auditCollector.recordDataModification(
            eventId,
            eventType,
            actor,
            action,
            resourceType,
            resourceId,
            changes || {},
            undefined,
            recordOptions
          );
        } else if (options.category === AuditCategory.DATA_ACCESS) {
          await auditCollector.recordDataAccess(
            eventId,
            eventType,
            actor,
            action,
            resourceType,
            resourceId,
            undefined,
            recordOptions
          );
        } else if (options.category === AuditCategory.AUTHENTICATION) {
          await auditCollector.recordAuth(
            eventId,
            eventType,
            actor,
            action,
            recordOptions
          );
        } else if (options.category === AuditCategory.AUTHORIZATION) {
          await auditCollector.recordAuthorization(
            eventId,
            eventType,
            actor,
            action,
            resourceType,
            resourceId,
            recordOptions
          );
        } else if (options.category === AuditCategory.SECURITY) {
          await auditCollector.recordSecurityEvent(
            eventId,
            eventType,
            actor,
            action,
            `Method: ${propertyKey}`,
            options.level || AuditLevel.WARNING,
            recordOptions
          );
        } else {
          // 使用通用的資料修改記錄
          await auditCollector.recordDataModification(
            eventId,
            eventType,
            actor,
            action,
            resourceType,
            resourceId,
            changes || {},
            undefined,
            recordOptions
          );
        }
        
        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // 記錄失敗的審計
        const metadata: Record<string, unknown> = {};
        if (options.logArgs) {
          metadata.arguments = args;
        }
        if (options.logDuration) {
          metadata.durationMs = duration.toFixed(2);
        }
        metadata.error = error instanceof Error ? error.message : String(error);
        
        const recordOptions: AuditRecordOptions = {
          level: AuditLevel.ERROR,
          category: options.category || AuditCategory.BUSINESS_OPERATION,
          result: 'failure',
          errorMessage: error instanceof Error ? error.message : String(error),
          metadata,
          requiresReview: true // 失敗操作總是需要審查
        };
        
        await auditCollector.recordDataModification(
          eventId,
          eventType,
          actor,
          action,
          resourceType,
          resourceId,
          {},
          undefined,
          recordOptions
        );
        
        // 重新拋出錯誤
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * @TrackPermission 裝飾器
 * 
 * 專門用於追蹤權限相關操作的裝飾器
 * 
 * @example
 * ```typescript
 * @TrackPermission({
 *   action: 'grant_permission',
 *   requiresReview: true
 * })
 * async grantPermission(userId: string, permission: string): Promise<void> {
 *   // ... implementation
 * }
 * ```
 */
export function TrackPermission(options: Omit<AuditableOptions, 'category'> = {}) {
  return Auditable({
    ...options,
    category: AuditCategory.AUTHORIZATION,
    level: options.level || AuditLevel.WARNING,
    requiresReview: options.requiresReview ?? true
  });
}

/**
 * @TrackDataModification 裝飾器
 * 
 * 專門用於追蹤資料修改操作的裝飾器
 * 
 * @example
 * ```typescript
 * @TrackDataModification({
 *   action: 'update_user_profile',
 *   extractChanges: (args, result) => ({
 *     before: args[0],
 *     after: result
 *   })
 * })
 * async updateProfile(userId: string, data: ProfileData): Promise<Profile> {
 *   // ... implementation
 * }
 * ```
 */
export function TrackDataModification(options: Omit<AuditableOptions, 'category'> = {}) {
  return Auditable({
    ...options,
    category: AuditCategory.DATA_MODIFICATION,
    logArgs: options.logArgs ?? true,
    logResult: options.logResult ?? false
  });
}

/**
 * @TrackSecurityEvent 裝飾器
 * 
 * 專門用於追蹤安全事件的裝飾器
 * 
 * @example
 * ```typescript
 * @TrackSecurityEvent({
 *   action: 'disable_mfa',
 *   level: AuditLevel.CRITICAL
 * })
 * async disableMFA(userId: string): Promise<void> {
 *   // ... implementation
 * }
 * ```
 */
export function TrackSecurityEvent(options: Omit<AuditableOptions, 'category'> = {}) {
  return Auditable({
    ...options,
    category: AuditCategory.SECURITY,
    level: options.level || AuditLevel.WARNING,
    requiresReview: true // 安全事件總是需要審查
  });
}
