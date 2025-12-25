/**
 * Global Audit Event Model
 * 
 * 全域審計事件模型
 * - 統一所有審計事件的結構
 * - 支援多種審計級別與類別
 * - 包含完整的操作上下文
 * - 遵循 docs/⭐️/Global Audit Log.md 規範
 * 
 * @author Global Event Bus Team
 * @version 1.0.0
 */

/**
 * 審計級別
 */
export enum AuditLevel {
  /** 資訊性事件 */
  INFO = 'INFO',
  /** 警告事件 */
  WARNING = 'WARNING',
  /** 錯誤事件 */
  ERROR = 'ERROR',
  /** 嚴重事件 */
  CRITICAL = 'CRITICAL'
}

/**
 * 審計類別
 */
export enum AuditCategory {
  /** 認證相關 */
  AUTHENTICATION = 'AUTHENTICATION',
  /** 授權相關 */
  AUTHORIZATION = 'AUTHORIZATION',
  /** 資料存取 */
  DATA_ACCESS = 'DATA_ACCESS',
  /** 資料修改 */
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  /** 系統配置 */
  SYSTEM_CONFIGURATION = 'SYSTEM_CONFIGURATION',
  /** 安全事件 */
  SECURITY = 'SECURITY',
  /** 合規性 */
  COMPLIANCE = 'COMPLIANCE',
  /** 業務操作 */
  BUSINESS_OPERATION = 'BUSINESS_OPERATION'
}

/**
 * 審計事件基礎介面
 */
export interface AuditEvent {
  /** 審計事件 ID (唯一識別) */
  readonly id: string;
  /** 關聯的領域事件 ID */
  readonly eventId: string;
  /** 事件類型 */
  readonly eventType: string;
  /** 發生時間 */
  readonly timestamp: Date;
  /** 審計級別 */
  readonly level: AuditLevel;
  /** 審計類別 */
  readonly category: AuditCategory;
  
  /** 執行者 (用戶 ID) */
  readonly actor: string;
  /** 租戶 ID (多租戶隔離) */
  readonly tenantId?: string;
  
  /** 操作描述 */
  readonly action: string;
  /** 資源類型 (如: repository, issue, user) */
  readonly resourceType: string;
  /** 資源 ID */
  readonly resourceId: string;
  /** 資源名稱 (可選，用於顯示) */
  readonly resourceName?: string;
  
  /** 操作結果 (success, failure, partial) */
  readonly result: 'success' | 'failure' | 'partial';
  /** 錯誤訊息 (如果失敗) */
  readonly errorMessage?: string;
  
  /** 變更內容 (before/after snapshot) */
  readonly changes?: AuditChanges;
  /** 額外元數據 */
  readonly metadata?: Record<string, unknown>;
  
  /** IP 位址 */
  readonly ipAddress?: string;
  /** User Agent */
  readonly userAgent?: string;
  /** 關聯 ID (追蹤跨系統操作) */
  readonly correlationId?: string;
  
  /** 是否需要審查 */
  readonly requiresReview: boolean;
  /** 是否已審查 */
  readonly reviewed: boolean;
  /** 審查者 ID (如果已審查) */
  readonly reviewedBy?: string;
  /** 審查時間 */
  readonly reviewedAt?: Date;
  /** 審查備註 */
  readonly reviewNotes?: string;
}

/**
 * 審計變更記錄
 */
export interface AuditChanges {
  /** 變更前的值 */
  before?: Record<string, unknown>;
  /** 變更後的值 */
  after?: Record<string, unknown>;
  /** 變更的欄位列表 */
  modifiedFields?: string[];
  /** 變更摘要 */
  summary?: string;
}

/**
 * 審計事件建構器
 */
export class AuditEventBuilder {
  private event: Partial<AuditEvent> = {
    level: AuditLevel.INFO,
    category: AuditCategory.BUSINESS_OPERATION,
    result: 'success',
    requiresReview: false,
    reviewed: false
  };
  
  withId(id: string): this {
    this.event.id = id;
    return this;
  }
  
  fromDomainEvent(eventId: string, eventType: string, timestamp: Date): this {
    this.event.eventId = eventId;
    this.event.eventType = eventType;
    this.event.timestamp = timestamp;
    return this;
  }
  
  withLevel(level: AuditLevel): this {
    this.event.level = level;
    return this;
  }
  
  withCategory(category: AuditCategory): this {
    this.event.category = category;
    return this;
  }
  
  withActor(actor: string): this {
    this.event.actor = actor;
    return this;
  }
  
  withTenant(tenantId: string): this {
    this.event.tenantId = tenantId;
    return this;
  }
  
  withAction(action: string): this {
    this.event.action = action;
    return this;
  }
  
  withResource(resourceType: string, resourceId: string, resourceName?: string): this {
    this.event.resourceType = resourceType;
    this.event.resourceId = resourceId;
    if (resourceName) {
      this.event.resourceName = resourceName;
    }
    return this;
  }
  
  withResult(result: 'success' | 'failure' | 'partial', errorMessage?: string): this {
    this.event.result = result;
    if (errorMessage) {
      this.event.errorMessage = errorMessage;
    }
    return this;
  }
  
  withChanges(changes: AuditChanges): this {
    this.event.changes = changes;
    return this;
  }
  
  withMetadata(metadata: Record<string, unknown>): this {
    this.event.metadata = metadata;
    return this;
  }
  
  withContext(ipAddress?: string, userAgent?: string, correlationId?: string): this {
    this.event.ipAddress = ipAddress;
    this.event.userAgent = userAgent;
    this.event.correlationId = correlationId;
    return this;
  }
  
  requiresReview(required: boolean = true): this {
    this.event.requiresReview = required;
    return this;
  }
  
  markAsReviewed(reviewedBy: string, notes?: string): this {
    this.event.reviewed = true;
    this.event.reviewedBy = reviewedBy;
    this.event.reviewedAt = new Date();
    this.event.reviewNotes = notes;
    return this;
  }
  
  build(): AuditEvent {
    if (!this.event.id || !this.event.eventId || !this.event.eventType || 
        !this.event.timestamp || !this.event.actor || !this.event.action || 
        !this.event.resourceType || !this.event.resourceId) {
      throw new Error('Missing required audit event fields');
    }
    return this.event as AuditEvent;
  }
}

/**
 * 審計事件查詢條件
 */
export interface AuditEventQuery {
  /** 租戶 ID */
  tenantId?: string;
  /** 執行者 */
  actor?: string;
  /** 資源類型 */
  resourceType?: string;
  /** 資源 ID */
  resourceId?: string;
  /** 審計級別 */
  level?: AuditLevel;
  /** 審計類別 */
  category?: AuditCategory;
  /** 操作結果 */
  result?: 'success' | 'failure' | 'partial';
  /** 只顯示需要審查的 */
  requiresReviewOnly?: boolean;
  /** 只顯示已審查的 */
  reviewedOnly?: boolean;
  /** 時間範圍 - 開始 */
  startTime?: Date;
  /** 時間範圍 - 結束 */
  endTime?: Date;
  /** 分頁 - 每頁數量 */
  limit?: number;
  /** 分頁 - 偏移量 */
  offset?: number;
}

/**
 * 審計事件統計
 */
export interface AuditEventStatistics {
  /** 總審計事件數 */
  totalEvents: number;
  /** 各級別事件數 */
  byLevel: Record<AuditLevel, number>;
  /** 各類別事件數 */
  byCategory: Record<AuditCategory, number>;
  /** 成功操作數 */
  successCount: number;
  /** 失敗操作數 */
  failureCount: number;
  /** 需要審查的事件數 */
  requiresReviewCount: number;
  /** 已審查的事件數 */
  reviewedCount: number;
  /** 最後更新時間 */
  lastUpdated: Date;
}
