/**
 * Audit Collector Service
 * 
 * 審計收集器服務
 * - 自動收集並轉換領域事件為審計事件
 * - 提供便捷的 API 供其他服務手動記錄審計
 * - 整合 AuditLogService 進行持久化
 * - 遵循 docs/⭐️/Global Audit Log.md 規範
 * 
 * @author Global Event Bus Team
 * @version 1.0.0
 */

import { Injectable, inject } from '@angular/core';
import { AuditLogService } from './audit-log.service';
import { DomainEvent } from '../models/base-event';
import {
  AuditEvent,
  AuditEventBuilder,
  AuditLevel,
  AuditCategory,
  AuditChanges
} from '../models/audit-event.model';

/**
 * 審計記錄選項
 */
export interface AuditRecordOptions {
  /** 審計級別 (預設: INFO) */
  level?: AuditLevel;
  /** 審計類別 (預設: BUSINESS_OPERATION) */
  category?: AuditCategory;
  /** 操作結果 (預設: success) */
  result?: 'success' | 'failure' | 'partial';
  /** 錯誤訊息 (如果失敗) */
  errorMessage?: string;
  /** 變更內容 */
  changes?: AuditChanges;
  /** 額外元數據 */
  metadata?: Record<string, unknown>;
  /** IP 位址 */
  ipAddress?: string;
  /** User Agent */
  userAgent?: string;
  /** 是否需要審查 */
  requiresReview?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuditCollectorService {
  private auditLogService = inject(AuditLogService);
  
  constructor() {
    console.log('[AuditCollectorService] Initialized');
  }
  
  /**
   * 從領域事件創建審計事件
   */
  async collectFromDomainEvent(
    domainEvent: DomainEvent<any>,
    options: AuditRecordOptions = {}
  ): Promise<void> {
    const auditEvent = this.createAuditEventFromDomain(domainEvent, options);
    await this.auditLogService.logAuditEvent(auditEvent);
  }
  
  /**
   * 記錄認證操作
   */
  async recordAuth(
    eventId: string,
    eventType: string,
    actor: string,
    action: string,
    options: AuditRecordOptions = {}
  ): Promise<void> {
    const auditEvent = new AuditEventBuilder()
      .withId(`audit-auth-${eventId}`)
      .fromDomainEvent(eventId, eventType, new Date())
      .withLevel(options.level || AuditLevel.INFO)
      .withCategory(AuditCategory.AUTHENTICATION)
      .withActor(actor)
      .withAction(action)
      .withResource('authentication', actor)
      .withResult(options.result || 'success', options.errorMessage)
      .withMetadata(options.metadata || {})
      .withContext(options.ipAddress, options.userAgent)
      .requiresReview(options.requiresReview || false)
      .build();
    
    await this.auditLogService.logAuditEvent(auditEvent);
  }
  
  /**
   * 記錄授權操作
   */
  async recordAuthorization(
    eventId: string,
    eventType: string,
    actor: string,
    action: string,
    resourceType: string,
    resourceId: string,
    options: AuditRecordOptions = {}
  ): Promise<void> {
    const auditEvent = new AuditEventBuilder()
      .withId(`audit-authz-${eventId}`)
      .fromDomainEvent(eventId, eventType, new Date())
      .withLevel(options.level || AuditLevel.INFO)
      .withCategory(AuditCategory.AUTHORIZATION)
      .withActor(actor)
      .withAction(action)
      .withResource(resourceType, resourceId)
      .withResult(options.result || 'success', options.errorMessage)
      .withChanges(options.changes || {})
      .withMetadata(options.metadata || {})
      .withContext(options.ipAddress, options.userAgent)
      .requiresReview(options.requiresReview || false)
      .build();
    
    await this.auditLogService.logAuditEvent(auditEvent);
  }
  
  /**
   * 記錄資料存取
   */
  async recordDataAccess(
    eventId: string,
    eventType: string,
    actor: string,
    action: string,
    resourceType: string,
    resourceId: string,
    tenantId?: string,
    options: AuditRecordOptions = {}
  ): Promise<void> {
    const builder = new AuditEventBuilder()
      .withId(`audit-data-access-${eventId}`)
      .fromDomainEvent(eventId, eventType, new Date())
      .withLevel(options.level || AuditLevel.INFO)
      .withCategory(AuditCategory.DATA_ACCESS)
      .withActor(actor)
      .withAction(action)
      .withResource(resourceType, resourceId)
      .withResult(options.result || 'success', options.errorMessage)
      .withMetadata(options.metadata || {})
      .withContext(options.ipAddress, options.userAgent)
      .requiresReview(options.requiresReview || false);
    
    if (tenantId) {
      builder.withTenant(tenantId);
    }
    
    await this.auditLogService.logAuditEvent(builder.build());
  }
  
  /**
   * 記錄資料修改
   */
  async recordDataModification(
    eventId: string,
    eventType: string,
    actor: string,
    action: string,
    resourceType: string,
    resourceId: string,
    changes: AuditChanges,
    tenantId?: string,
    options: AuditRecordOptions = {}
  ): Promise<void> {
    const builder = new AuditEventBuilder()
      .withId(`audit-data-mod-${eventId}`)
      .fromDomainEvent(eventId, eventType, new Date())
      .withLevel(options.level || AuditLevel.INFO)
      .withCategory(AuditCategory.DATA_MODIFICATION)
      .withActor(actor)
      .withAction(action)
      .withResource(resourceType, resourceId)
      .withResult(options.result || 'success', options.errorMessage)
      .withChanges(changes)
      .withMetadata(options.metadata || {})
      .withContext(options.ipAddress, options.userAgent)
      .requiresReview(options.requiresReview || false);
    
    if (tenantId) {
      builder.withTenant(tenantId);
    }
    
    // 自動標記刪除/移除操作需要審查
    if (action.toLowerCase().includes('delete') || action.toLowerCase().includes('remove')) {
      builder.requiresReview(true);
    }
    
    await this.auditLogService.logAuditEvent(builder.build());
  }
  
  /**
   * 記錄安全事件
   */
  async recordSecurityEvent(
    eventId: string,
    eventType: string,
    actor: string,
    action: string,
    description: string,
    level: AuditLevel = AuditLevel.WARNING,
    options: AuditRecordOptions = {}
  ): Promise<void> {
    const auditEvent = new AuditEventBuilder()
      .withId(`audit-security-${eventId}`)
      .fromDomainEvent(eventId, eventType, new Date())
      .withLevel(level)
      .withCategory(AuditCategory.SECURITY)
      .withActor(actor)
      .withAction(action)
      .withResource('security', eventId)
      .withResult(options.result || 'success', options.errorMessage)
      .withMetadata({ description, ...options.metadata })
      .withContext(options.ipAddress, options.userAgent)
      .requiresReview(true) // 安全事件總是需要審查
      .build();
    
    await this.auditLogService.logAuditEvent(auditEvent);
  }
  
  /**
   * 記錄系統配置變更
   */
  async recordConfigChange(
    eventId: string,
    eventType: string,
    actor: string,
    action: string,
    configKey: string,
    changes: AuditChanges,
    options: AuditRecordOptions = {}
  ): Promise<void> {
    const auditEvent = new AuditEventBuilder()
      .withId(`audit-config-${eventId}`)
      .fromDomainEvent(eventId, eventType, new Date())
      .withLevel(options.level || AuditLevel.WARNING)
      .withCategory(AuditCategory.SYSTEM_CONFIGURATION)
      .withActor(actor)
      .withAction(action)
      .withResource('configuration', configKey)
      .withResult(options.result || 'success', options.errorMessage)
      .withChanges(changes)
      .withMetadata(options.metadata || {})
      .withContext(options.ipAddress, options.userAgent)
      .requiresReview(true) // 配置變更需要審查
      .build();
    
    await this.auditLogService.logAuditEvent(auditEvent);
  }
  
  /**
   * 記錄合規性事件
   */
  async recordComplianceEvent(
    eventId: string,
    eventType: string,
    actor: string,
    action: string,
    resourceType: string,
    resourceId: string,
    complianceType: string,
    options: AuditRecordOptions = {}
  ): Promise<void> {
    const auditEvent = new AuditEventBuilder()
      .withId(`audit-compliance-${eventId}`)
      .fromDomainEvent(eventId, eventType, new Date())
      .withLevel(options.level || AuditLevel.INFO)
      .withCategory(AuditCategory.COMPLIANCE)
      .withActor(actor)
      .withAction(action)
      .withResource(resourceType, resourceId)
      .withResult(options.result || 'success', options.errorMessage)
      .withMetadata({ complianceType, ...options.metadata })
      .withContext(options.ipAddress, options.userAgent)
      .requiresReview(options.requiresReview || false)
      .build();
    
    await this.auditLogService.logAuditEvent(auditEvent);
  }
  
  /**
   * 私有方法: 從領域事件創建審計事件
   */
  private createAuditEventFromDomain(
    domainEvent: DomainEvent<any>,
    options: AuditRecordOptions
  ): AuditEvent {
    const actor = this.extractActor(domainEvent);
    const action = this.extractAction(domainEvent.eventType);
    const resourceType = domainEvent.aggregateType || 'unknown';
    const resourceId = domainEvent.aggregateId || domainEvent.eventId;
    const category = this.determineCategory(domainEvent.eventType);
    
    const builder = new AuditEventBuilder()
      .withId(`audit-${domainEvent.eventId}`)
      .fromDomainEvent(domainEvent.eventId, domainEvent.eventType, domainEvent.timestamp)
      .withLevel(options.level || AuditLevel.INFO)
      .withCategory(options.category || category)
      .withActor(actor)
      .withAction(action)
      .withResource(resourceType, resourceId)
      .withResult(options.result || 'success', options.errorMessage)
      .withMetadata(options.metadata || {});
    
    if (options.changes) {
      builder.withChanges(options.changes);
    }
    
    if (options.ipAddress || options.userAgent) {
      builder.withContext(
        options.ipAddress,
        options.userAgent,
        domainEvent.metadata?.correlationId
      );
    }
    
    if (options.requiresReview !== undefined) {
      builder.requiresReview(options.requiresReview);
    }
    
    return builder.build();
  }
  
  /**
   * 私有方法: 提取執行者
   */
  private extractActor(event: DomainEvent<any>): string {
    return event.payload?.userId || 
           event.payload?.actorId || 
           event.payload?.executedBy ||
           event.metadata?.userId ||
           'system';
  }
  
  /**
   * 私有方法: 提取操作
   */
  private extractAction(eventType: string): string {
    // Extract action from event type (e.g., "user.created" → "created")
    const parts = eventType.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : eventType;
  }
  
  /**
   * 私有方法: 判斷類別
   */
  private determineCategory(eventType: string): AuditCategory {
    const type = eventType.toLowerCase();
    
    if (type.includes('auth.') || type.includes('login') || type.includes('logout')) {
      return AuditCategory.AUTHENTICATION;
    }
    if (type.includes('permission') || type.includes('role')) {
      return AuditCategory.AUTHORIZATION;
    }
    if (type.includes('security') || type.includes('mfa') || type.includes('token')) {
      return AuditCategory.SECURITY;
    }
    if (type.includes('delete') || type.includes('update') || type.includes('create')) {
      return AuditCategory.DATA_MODIFICATION;
    }
    if (type.includes('read') || type.includes('query') || type.includes('fetch')) {
      return AuditCategory.DATA_ACCESS;
    }
    if (type.includes('config') || type.includes('setting')) {
      return AuditCategory.SYSTEM_CONFIGURATION;
    }
    if (type.includes('compliance') || type.includes('audit')) {
      return AuditCategory.COMPLIANCE;
    }
    
    return AuditCategory.BUSINESS_OPERATION;
  }
}
