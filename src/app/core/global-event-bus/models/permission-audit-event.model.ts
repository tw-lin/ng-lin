/**
 * Permission Audit Event Model
 *
 * 權限審計事件模型
 * - 追蹤所有權限與角色變更操作
 * - 支援 RBAC 審計追蹤
 * - 遵循 docs/⭐️/Identity & Auth.md 規範
 *
 * @author Global Event Bus Team
 * @version 1.0.0
 */

import { AuditLevel, AuditCategory } from './audit-event.model';

/**
 * 權限操作類型
 */
export enum PermissionActionType {
  /** 授予權限 */
  GRANT = 'GRANT',
  /** 撤銷權限 */
  REVOKE = 'REVOKE',
  /** 更新權限 */
  UPDATE = 'UPDATE'
}

/**
 * 角色操作類型
 */
export enum RoleActionType {
  /** 分配角色 */
  ASSIGN = 'ASSIGN',
  /** 移除角色 */
  UNASSIGN = 'UNASSIGN',
  /** 更新角色 */
  UPDATE = 'UPDATE'
}

/**
 * 權限審計事件基礎介面
 */
export interface PermissionAuditEvent {
  /** 審計事件 ID */
  id: string;
  /** 事件類型 */
  eventType: string;
  /** 事件類別 */
  category: AuditCategory.PERMISSION | AuditCategory.ROLE;
  /** 嚴重級別 */
  level: AuditLevel;
  /** 目標用戶 ID (權限被變更的用戶) */
  targetUserId: string;
  /** 目標用戶 Email */
  targetUserEmail: string;
  /** 執行者 ID (執行變更的用戶) */
  executorId: string;
  /** 執行者 Email */
  executorEmail?: string;
  /** 租戶 ID */
  tenantId: string;
  /** 資源類型 (blueprint, task, organization) */
  resourceType: string;
  /** 資源 ID */
  resourceId: string;
  /** 操作類型 */
  actionType: PermissionActionType | RoleActionType;
  /** 變更前的狀態 */
  previousState: {
    permissions?: string[];
    roles?: string[];
  };
  /** 變更後的狀態 */
  newState: {
    permissions?: string[];
    roles?: string[];
  };
  /** 變更原因 */
  reason?: string;
  /** 事件描述 */
  description: string;
  /** 詳細資料 */
  details: Record<string, any>;
  /** 關聯的事件 ID */
  correlationId?: string;
  /** 事件時間戳 */
  timestamp: Date;
  /** 是否需要審查 */
  requiresReview: boolean;
  /** 標籤 */
  tags: string[];
}

/**
 * 權限授予審計事件
 */
export interface PermissionGrantedAuditEvent extends PermissionAuditEvent {
  category: AuditCategory.PERMISSION;
  actionType: PermissionActionType.GRANT;
  details: {
    /** 授予的權限列表 */
    grantedPermissions: string[];
    /** 授予範圍 (tenant, blueprint, resource) */
    scope: string;
    /** 生效時間 */
    effectiveFrom: Date;
    /** 過期時間 (可選) */
    expiresAt?: Date;
  };
}

/**
 * 權限撤銷審計事件
 */
export interface PermissionRevokedAuditEvent extends PermissionAuditEvent {
  category: AuditCategory.PERMISSION;
  actionType: PermissionActionType.REVOKE;
  level: AuditLevel.WARNING;
  requiresReview: true;
  details: {
    /** 撤銷的權限列表 */
    revokedPermissions: string[];
    /** 撤銷原因 */
    revocationReason: string;
    /** 是否立即生效 */
    immediateEffect: boolean;
  };
}

/**
 * 權限更新審計事件
 */
export interface PermissionUpdatedAuditEvent extends PermissionAuditEvent {
  category: AuditCategory.PERMISSION;
  actionType: PermissionActionType.UPDATE;
  details: {
    /** 新增的權限 */
    addedPermissions: string[];
    /** 移除的權限 */
    removedPermissions: string[];
    /** 保持不變的權限 */
    unchangedPermissions: string[];
  };
}

/**
 * 角色分配審計事件
 */
export interface RoleAssignedAuditEvent extends PermissionAuditEvent {
  category: AuditCategory.ROLE;
  actionType: RoleActionType.ASSIGN;
  details: {
    /** 分配的角色列表 */
    assignedRoles: string[];
    /** 角色所包含的權限 */
    rolePermissions: Record<string, string[]>;
    /** 生效時間 */
    effectiveFrom: Date;
  };
}

/**
 * 角色移除審計事件
 */
export interface RoleUnassignedAuditEvent extends PermissionAuditEvent {
  category: AuditCategory.ROLE;
  actionType: RoleActionType.UNASSIGN;
  level: AuditLevel.WARNING;
  requiresReview: true;
  details: {
    /** 移除的角色列表 */
    unassignedRoles: string[];
    /** 移除原因 */
    unassignmentReason: string;
    /** 受影響的權限 */
    affectedPermissions: string[];
  };
}

/**
 * 角色更新審計事件
 */
export interface RoleUpdatedAuditEvent extends PermissionAuditEvent {
  category: AuditCategory.ROLE;
  actionType: RoleActionType.UPDATE;
  details: {
    /** 新增的角色 */
    addedRoles: string[];
    /** 移除的角色 */
    removedRoles: string[];
    /** 保持不變的角色 */
    unchangedRoles: string[];
  };
}

/**
 * 權限變更差異分析
 */
export interface PermissionChangeDiff {
  /** 新增的權限 */
  added: string[];
  /** 移除的權限 */
  removed: string[];
  /** 保持不變的權限 */
  unchanged: string[];
  /** 總變更數量 */
  totalChanges: number;
}

/**
 * 權限審計事件建構器
 */
export class PermissionAuditEventBuilder {
  /**
   * 從 PermissionChangedEvent 建立審計事件
   */
  static fromPermissionChangedEvent(
    domainEvent: any
  ): PermissionGrantedAuditEvent | PermissionRevokedAuditEvent | PermissionUpdatedAuditEvent {
    const payload = domainEvent.payload;
    const diff = this.calculatePermissionDiff(payload.previousPermissions || [], payload.newPermissions || []);

    const baseEvent = {
      id: domainEvent.id,
      eventType: domainEvent.type,
      category: AuditCategory.PERMISSION,
      level: this.getLevelFromChangeType(payload.changeType),
      targetUserId: payload.userId,
      targetUserEmail: payload.email,
      executorId: payload.executedBy,
      tenantId: payload.tenantId,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      previousState: {
        permissions: payload.previousPermissions
      },
      newState: {
        permissions: payload.newPermissions
      },
      reason: payload.reason,
      description: this.getDescription(payload),
      details: {
        ...payload,
        diff
      },
      correlationId: domainEvent.metadata.correlationId,
      timestamp: domainEvent.timestamp,
      requiresReview: payload.changeType === 'revoke',
      tags: domainEvent.metadata.tags || []
    };

    switch (payload.changeType) {
      case 'grant':
        return {
          ...baseEvent,
          actionType: PermissionActionType.GRANT,
          details: {
            ...baseEvent.details,
            grantedPermissions: diff.added,
            scope: 'resource',
            effectiveFrom: domainEvent.timestamp
          }
        } as PermissionGrantedAuditEvent;

      case 'revoke':
        return {
          ...baseEvent,
          actionType: PermissionActionType.REVOKE,
          level: AuditLevel.WARNING,
          requiresReview: true,
          details: {
            ...baseEvent.details,
            revokedPermissions: diff.removed,
            revocationReason: payload.reason || 'Not specified',
            immediateEffect: true
          }
        } as PermissionRevokedAuditEvent;

      case 'update':
      default:
        return {
          ...baseEvent,
          actionType: PermissionActionType.UPDATE,
          details: {
            ...baseEvent.details,
            addedPermissions: diff.added,
            removedPermissions: diff.removed,
            unchangedPermissions: diff.unchanged
          }
        } as PermissionUpdatedAuditEvent;
    }
  }

  /**
   * 從 RoleChangedEvent 建立審計事件
   */
  static fromRoleChangedEvent(domainEvent: any): RoleAssignedAuditEvent | RoleUnassignedAuditEvent | RoleUpdatedAuditEvent {
    const payload = domainEvent.payload;
    const diff = this.calculateRoleDiff(payload.previousRoles || [], payload.newRoles || []);

    const baseEvent = {
      id: domainEvent.id,
      eventType: domainEvent.type,
      category: AuditCategory.ROLE,
      level: this.getLevelFromChangeType(payload.changeType),
      targetUserId: payload.userId,
      targetUserEmail: payload.email,
      executorId: payload.executedBy,
      tenantId: payload.tenantId,
      resourceType: 'Tenant', // 角色通常在租戶層級
      resourceId: payload.tenantId,
      previousState: {
        roles: payload.previousRoles
      },
      newState: {
        roles: payload.newRoles
      },
      reason: payload.reason,
      description: this.getRoleDescription(payload),
      details: {
        ...payload,
        diff
      },
      correlationId: domainEvent.metadata.correlationId,
      timestamp: domainEvent.timestamp,
      requiresReview: payload.changeType === 'unassign',
      tags: domainEvent.metadata.tags || []
    };

    switch (payload.changeType) {
      case 'assign':
        return {
          ...baseEvent,
          actionType: RoleActionType.ASSIGN,
          details: {
            ...baseEvent.details,
            assignedRoles: diff.added,
            rolePermissions: {}, // 可擴展為包含角色對應的權限
            effectiveFrom: domainEvent.timestamp
          }
        } as RoleAssignedAuditEvent;

      case 'unassign':
        return {
          ...baseEvent,
          actionType: RoleActionType.UNASSIGN,
          level: AuditLevel.WARNING,
          requiresReview: true,
          details: {
            ...baseEvent.details,
            unassignedRoles: diff.removed,
            unassignmentReason: payload.reason || 'Not specified',
            affectedPermissions: [] // 可擴展為包含受影響的權限
          }
        } as RoleUnassignedAuditEvent;

      case 'update':
      default:
        return {
          ...baseEvent,
          actionType: RoleActionType.UPDATE,
          details: {
            ...baseEvent.details,
            addedRoles: diff.added,
            removedRoles: diff.removed,
            unchangedRoles: diff.unchanged
          }
        } as RoleUpdatedAuditEvent;
    }
  }

  /**
   * 計算權限差異
   */
  private static calculatePermissionDiff(previous: string[], current: string[]): PermissionChangeDiff {
    const added = current.filter(p => !previous.includes(p));
    const removed = previous.filter(p => !current.includes(p));
    const unchanged = current.filter(p => previous.includes(p));

    return {
      added,
      removed,
      unchanged,
      totalChanges: added.length + removed.length
    };
  }

  /**
   * 計算角色差異 (複用權限差異計算邏輯)
   */
  private static calculateRoleDiff(previous: string[], current: string[]): PermissionChangeDiff {
    return this.calculatePermissionDiff(previous, current);
  }

  /**
   * 從變更類型獲取嚴重級別
   */
  private static getLevelFromChangeType(changeType: string): AuditLevel {
    if (changeType === 'revoke' || changeType === 'unassign') {
      return AuditLevel.WARNING;
    }
    return AuditLevel.INFO;
  }

  /**
   * 生成權限變更描述
   */
  private static getDescription(payload: any): string {
    const action = payload.changeType;
    const target = payload.email;
    const resource = payload.resourceType;

    return `Permissions ${action} for ${target} on ${resource} (ID: ${payload.resourceId})`;
  }

  /**
   * 生成角色變更描述
   */
  private static getRoleDescription(payload: any): string {
    const action = payload.changeType;
    const target = payload.email;

    return `Roles ${action} for ${target} in tenant ${payload.tenantId}`;
  }
}
