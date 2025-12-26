/**
 * Audit Classification Engine Service
 *
 * 審計分類引擎服務
 * - Integrates with existing AuditCollectorService and AuditLogService
 * - Automatically classifies audit events based on GitHub Master System patterns
 * - Supports 11-category taxonomy with severity leveling
 * - Firebase-native, minimal code approach (extends existing infrastructure)
 *
 * Integration Strategy:
 * - REUSES: AuditLevel, AuditCategory enums from existing audit-event.model.ts
 * - EXTENDS: AuditCollectorService with classification logic
 * - NO NEW EVENT BUS: Uses existing BlueprintEventBus infrastructure
 *
 * Follows: docs/⭐️/🤖AI_Character_Profile_Impl.md (Minimal Code, Equivalent Outcome)
 * Follows: docs/⭐️/🧠AI_Behavior_Guidelines.md (5-Step Mandatory Workflow)
 *
 * @author Audit System Team
 * @version 1.0.0 - Classification Layer (Layer 4)
 */

import { Injectable, inject } from '@angular/core';
import { AuditLevel, AuditCategory, AuditEvent } from '../../event-bus/models/audit-event.model';

/**
 * Classification Result
 * 增強的審計事件，包含分類後的元數據
 */
export interface ClassifiedAuditEvent extends AuditEvent {
  /** 風險評分 (0-100, 越高越危險) */
  riskScore: number;
  /** 是否需要自動審查 */
  autoReviewRequired: boolean;
  /** 合規標籤 (GDPR, HIPAA, SOC2, ISO27001) */
  complianceTags: string[];
  /** AI 決策標記 (如果是 AI 生成的事件) */
  aiGenerated?: boolean;
  /** 操作類型 (CREATE, READ, UPDATE, DELETE, EXECUTE) */
  operationType?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE';
}

/**
 * Classification Rule
 * 分類規則定義
 */
interface ClassificationRule {
  /** 規則名稱 */
  name: string;
  /** 匹配條件 (eventType pattern) */
  pattern: RegExp;
  /** 目標類別 */
  category: AuditCategory;
  /** 目標級別 */
  level: AuditLevel;
  /** 風險評分 */
  riskScore: number;
  /** 合規標籤 */
  complianceTags: string[];
  /** 是否需要審查 */
  requiresReview: boolean;
  /** 操作類型 */
  operationType?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE';
}

@Injectable({ providedIn: 'root' })
export class ClassificationEngineService {
  /**
   * GitHub Master System 對齊的分類規則
   * 11-category taxonomy with severity leveling
   */
  private readonly classificationRules: ClassificationRule[] = [
    // ===== AUTHENTICATION (認證) =====
    {
      name: 'User Login Success',
      pattern: /^(user|auth)\.(login|signin|authenticated)$/i,
      category: AuditCategory.AUTHENTICATION,
      level: AuditLevel.INFO,
      riskScore: 10,
      complianceTags: ['GDPR', 'SOC2'],
      requiresReview: false,
      operationType: 'EXECUTE'
    },
    {
      name: 'User Login Failure',
      pattern: /^(user|auth)\.(login\.failed|signin\.failed|auth\.failed)$/i,
      category: AuditCategory.AUTHENTICATION,
      level: AuditLevel.WARNING,
      riskScore: 40,
      complianceTags: ['GDPR', 'SOC2', 'ISO27001'],
      requiresReview: true
    },
    {
      name: 'User Logout',
      pattern: /^(user|auth)\.(logout|signout)$/i,
      category: AuditCategory.AUTHENTICATION,
      level: AuditLevel.INFO,
      riskScore: 5,
      complianceTags: ['GDPR'],
      requiresReview: false
    },
    {
      name: 'Password Changed',
      pattern: /^(user|auth|password)\.(changed|updated|reset)$/i,
      category: AuditCategory.AUTHENTICATION,
      level: AuditLevel.WARNING,
      riskScore: 50,
      complianceTags: ['GDPR', 'SOC2', 'ISO27001'],
      requiresReview: true,
      operationType: 'UPDATE'
    },
    {
      name: 'MFA Enabled/Disabled',
      pattern: /^(user|auth|mfa)\.(enabled|disabled|toggled)$/i,
      category: AuditCategory.AUTHENTICATION,
      level: AuditLevel.CRITICAL,
      riskScore: 80,
      complianceTags: ['GDPR', 'SOC2', 'ISO27001'],
      requiresReview: true,
      operationType: 'UPDATE'
    },

    // ===== AUTHORIZATION (授權) =====
    {
      name: 'Permission Granted',
      pattern: /^permission\.(granted|assigned|added)$/i,
      category: AuditCategory.AUTHORIZATION,
      level: AuditLevel.WARNING,
      riskScore: 60,
      complianceTags: ['GDPR', 'SOC2', 'ISO27001'],
      requiresReview: true,
      operationType: 'CREATE'
    },
    {
      name: 'Permission Revoked',
      pattern: /^permission\.(revoked|removed|deleted)$/i,
      category: AuditCategory.AUTHORIZATION,
      level: AuditLevel.CRITICAL,
      riskScore: 70,
      complianceTags: ['GDPR', 'SOC2', 'ISO27001'],
      requiresReview: true,
      operationType: 'DELETE'
    },
    {
      name: 'Role Assigned',
      pattern: /^role\.(assigned|granted|added)$/i,
      category: AuditCategory.ROLE,
      level: AuditLevel.WARNING,
      riskScore: 65,
      complianceTags: ['GDPR', 'SOC2', 'ISO27001'],
      requiresReview: true,
      operationType: 'CREATE'
    },
    {
      name: 'Role Unassigned',
      pattern: /^role\.(unassigned|revoked|removed)$/i,
      category: AuditCategory.ROLE,
      level: AuditLevel.CRITICAL,
      riskScore: 75,
      complianceTags: ['GDPR', 'SOC2', 'ISO27001'],
      requiresReview: true,
      operationType: 'DELETE'
    },

    // ===== DATA ACCESS (資料存取) =====
    {
      name: 'Data Read',
      pattern: /^(data|resource|entity)\.(read|fetched|queried|viewed)$/i,
      category: AuditCategory.DATA_ACCESS,
      level: AuditLevel.INFO,
      riskScore: 15,
      complianceTags: ['GDPR', 'HIPAA'],
      requiresReview: false,
      operationType: 'READ'
    },
    {
      name: 'PII Data Access',
      pattern: /^(pii|sensitive|personal)\.(read|accessed|exported)$/i,
      category: AuditCategory.DATA_ACCESS,
      level: AuditLevel.WARNING,
      riskScore: 55,
      complianceTags: ['GDPR', 'HIPAA', 'SOC2'],
      requiresReview: true,
      operationType: 'READ'
    },

    // ===== DATA MODIFICATION (資料修改) =====
    {
      name: 'Data Created',
      pattern: /^(data|resource|entity|blueprint|task|org)\.(created|added)$/i,
      category: AuditCategory.DATA_MODIFICATION,
      level: AuditLevel.INFO,
      riskScore: 20,
      complianceTags: ['GDPR', 'SOC2'],
      requiresReview: false,
      operationType: 'CREATE'
    },
    {
      name: 'Data Updated',
      pattern: /^(data|resource|entity|blueprint|task|org)\.(updated|modified|changed)$/i,
      category: AuditCategory.DATA_MODIFICATION,
      level: AuditLevel.INFO,
      riskScore: 30,
      complianceTags: ['GDPR', 'SOC2'],
      requiresReview: false,
      operationType: 'UPDATE'
    },
    {
      name: 'Data Deleted',
      pattern: /^(data|resource|entity|blueprint|task|org)\.(deleted|removed)$/i,
      category: AuditCategory.DATA_MODIFICATION,
      level: AuditLevel.CRITICAL,
      riskScore: 85,
      complianceTags: ['GDPR', 'HIPAA', 'SOC2', 'ISO27001'],
      requiresReview: true,
      operationType: 'DELETE'
    },

    // ===== SECURITY (安全事件) =====
    {
      name: 'Security Rules Violation',
      pattern: /^security\.(violation|denied|blocked)$/i,
      category: AuditCategory.SECURITY,
      level: AuditLevel.CRITICAL,
      riskScore: 95,
      complianceTags: ['GDPR', 'HIPAA', 'SOC2', 'ISO27001'],
      requiresReview: true
    },
    {
      name: 'Suspicious Activity',
      pattern: /^security\.(suspicious|anomaly|unusual)$/i,
      category: AuditCategory.SECURITY,
      level: AuditLevel.CRITICAL,
      riskScore: 90,
      complianceTags: ['SOC2', 'ISO27001'],
      requiresReview: true
    },
    {
      name: 'Token Generated/Revoked',
      pattern: /^token\.(generated|created|revoked|expired)$/i,
      category: AuditCategory.SECURITY,
      level: AuditLevel.WARNING,
      riskScore: 45,
      complianceTags: ['SOC2', 'ISO27001'],
      requiresReview: true,
      operationType: 'CREATE'
    },

    // ===== AI DECISIONS (AI 決策 - NEW) =====
    {
      name: 'AI Architectural Decision',
      pattern: /^ai\.decision\.(architectural|refactoring|pattern)$/i,
      category: AuditCategory.BUSINESS_OPERATION,
      level: AuditLevel.INFO,
      riskScore: 25,
      complianceTags: ['AI_GOVERNANCE'],
      requiresReview: true,
      operationType: 'EXECUTE'
    },
    {
      name: 'AI Behavioral Compliance',
      pattern: /^ai\.(compliance|guideline|behavior)$/i,
      category: AuditCategory.COMPLIANCE,
      level: AuditLevel.WARNING,
      riskScore: 35,
      complianceTags: ['AI_GOVERNANCE'],
      requiresReview: true
    },
    {
      name: 'AI Data Flow Traced',
      pattern: /^ai\.dataflow\.(traced|transformed|validated)$/i,
      category: AuditCategory.DATA_ACCESS,
      level: AuditLevel.INFO,
      riskScore: 20,
      complianceTags: ['AI_GOVERNANCE'],
      requiresReview: false,
      operationType: 'READ'
    },
    {
      name: 'AI Side Effect Detected',
      pattern: /^ai\.side_effect\.(detected|warning|mitigated)$/i,
      category: AuditCategory.BUSINESS_OPERATION,
      level: AuditLevel.WARNING,
      riskScore: 50,
      complianceTags: ['AI_GOVERNANCE'],
      requiresReview: true
    },

    // ===== SYSTEM CONFIGURATION (系統配置) =====
    {
      name: 'Config Changed',
      pattern: /^(system|config|settings)\.(changed|updated)$/i,
      category: AuditCategory.SYSTEM_CONFIGURATION,
      level: AuditLevel.WARNING,
      riskScore: 60,
      complianceTags: ['SOC2', 'ISO27001'],
      requiresReview: true,
      operationType: 'UPDATE'
    },
    {
      name: 'Feature Flag Toggled',
      pattern: /^feature\.(enabled|disabled|toggled)$/i,
      category: AuditCategory.SYSTEM_CONFIGURATION,
      level: AuditLevel.WARNING,
      riskScore: 55,
      complianceTags: ['SOC2'],
      requiresReview: true,
      operationType: 'UPDATE'
    },

    // ===== COMPLIANCE (合規性) =====
    {
      name: 'Compliance Check',
      pattern: /^compliance\.(check|audit|verified)$/i,
      category: AuditCategory.COMPLIANCE,
      level: AuditLevel.INFO,
      riskScore: 10,
      complianceTags: ['GDPR', 'HIPAA', 'SOC2', 'ISO27001'],
      requiresReview: false
    },
    {
      name: 'Policy Violation',
      pattern: /^policy\.(violation|breach|failed)$/i,
      category: AuditCategory.COMPLIANCE,
      level: AuditLevel.CRITICAL,
      riskScore: 100,
      complianceTags: ['GDPR', 'HIPAA', 'SOC2', 'ISO27001'],
      requiresReview: true
    },

    // ===== BUSINESS OPERATION (業務操作) =====
    {
      name: 'Blueprint Lifecycle',
      pattern: /^blueprint\.(created|updated|archived|deleted)$/i,
      category: AuditCategory.BUSINESS_OPERATION,
      level: AuditLevel.INFO,
      riskScore: 30,
      complianceTags: ['SOC2'],
      requiresReview: false,
      operationType: 'CREATE'
    },
    {
      name: 'Task Lifecycle',
      pattern: /^task\.(created|updated|completed|deleted)$/i,
      category: AuditCategory.BUSINESS_OPERATION,
      level: AuditLevel.INFO,
      riskScore: 15,
      complianceTags: [],
      requiresReview: false,
      operationType: 'CREATE'
    },
    {
      name: 'Organization Lifecycle',
      pattern: /^org\.(created|updated|deleted)$/i,
      category: AuditCategory.BUSINESS_OPERATION,
      level: AuditLevel.WARNING,
      riskScore: 50,
      complianceTags: ['GDPR', 'SOC2'],
      requiresReview: true,
      operationType: 'CREATE'
    }
  ];

  constructor() {
    console.log('[ClassificationEngineService] Initialized with', this.classificationRules.length, 'classification rules');
  }

  /**
   * 分類審計事件 (核心方法)
   *
   * @param event - 原始審計事件
   * @returns 分類後的審計事件
   */
  classify(event: AuditEvent): ClassifiedAuditEvent {
    // Find matching rule
    const rule = this.findMatchingRule(event.eventType);

    if (!rule) {
      // Fallback to default classification
      return this.applyDefaultClassification(event);
    }

    // Apply classification rule
    return {
      ...event,
      // Override with rule-based classification
      category: rule.category,
      level: rule.level,
      // Add classification metadata
      riskScore: this.calculateRiskScore(rule, event),
      autoReviewRequired: rule.requiresReview || this.isHighRiskAction(event.action),
      complianceTags: rule.complianceTags,
      aiGenerated: this.isAIGeneratedEvent(event.eventType),
      operationType: rule.operationType || this.inferOperationType(event.action)
    };
  }

  /**
   * 批次分類
   */
  classifyBatch(events: AuditEvent[]): ClassifiedAuditEvent[] {
    return events.map(event => this.classify(event));
  }

  /**
   * 取得風險評分統計
   */
  getRiskStatistics(events: ClassifiedAuditEvent[]): {
    averageRisk: number;
    highRiskCount: number;
    criticalCount: number;
    reviewRequiredCount: number;
  } {
    const total = events.length;
    if (total === 0) {
      return {
        averageRisk: 0,
        highRiskCount: 0,
        criticalCount: 0,
        reviewRequiredCount: 0
      };
    }

    const totalRisk = events.reduce((sum, e) => sum + e.riskScore, 0);
    const highRiskCount = events.filter(e => e.riskScore >= 70).length;
    const criticalCount = events.filter(e => e.level === AuditLevel.CRITICAL).length;
    const reviewRequiredCount = events.filter(e => e.autoReviewRequired).length;

    return {
      averageRisk: Math.round(totalRisk / total),
      highRiskCount,
      criticalCount,
      reviewRequiredCount
    };
  }

  /**
   * 私有方法: 尋找匹配的規則
   */
  private findMatchingRule(eventType: string): ClassificationRule | null {
    for (const rule of this.classificationRules) {
      if (rule.pattern.test(eventType)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * 私有方法: 應用預設分類
   */
  private applyDefaultClassification(event: AuditEvent): ClassifiedAuditEvent {
    return {
      ...event,
      riskScore: 20,
      autoReviewRequired: false,
      complianceTags: [],
      aiGenerated: this.isAIGeneratedEvent(event.eventType),
      operationType: this.inferOperationType(event.action)
    };
  }

  /**
   * 私有方法: 計算風險評分 (可根據上下文調整)
   */
  private calculateRiskScore(rule: ClassificationRule, event: AuditEvent): number {
    let baseScore = rule.riskScore;

    // Adjust based on result
    if (event.result === 'failure') {
      baseScore += 10;
    }

    // Adjust based on actor type (if available in metadata)
    const actorType = event.metadata?.['actorType'];
    if (actorType === 'ai' || actorType === 'system') {
      baseScore += 5;
    }

    // Cap at 100
    return Math.min(baseScore, 100);
  }

  /**
   * 私有方法: 檢查是否為高風險操作
   */
  private isHighRiskAction(action: string): boolean {
    const highRiskKeywords = ['delete', 'remove', 'revoke', 'disable', 'admin', 'owner', 'superuser', 'password', 'mfa', 'token'];

    const actionLower = action.toLowerCase();
    return highRiskKeywords.some(keyword => actionLower.includes(keyword));
  }

  /**
   * 私有方法: 檢查是否為 AI 生成的事件
   */
  private isAIGeneratedEvent(eventType: string): boolean {
    return eventType.toLowerCase().startsWith('ai.');
  }

  /**
   * 私有方法: 推斷操作類型
   */
  private inferOperationType(action: string): 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE' | undefined {
    const actionLower = action.toLowerCase();

    if (actionLower.includes('create') || actionLower.includes('add')) {
      return 'CREATE';
    }
    if (actionLower.includes('read') || actionLower.includes('fetch') || actionLower.includes('query')) {
      return 'READ';
    }
    if (actionLower.includes('update') || actionLower.includes('modify') || actionLower.includes('change')) {
      return 'UPDATE';
    }
    if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return 'DELETE';
    }
    if (actionLower.includes('execute') || actionLower.includes('run') || actionLower.includes('trigger')) {
      return 'EXECUTE';
    }

    return undefined;
  }
}
