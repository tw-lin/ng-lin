import { ModuleType } from '@core/blueprint/domain/types';

import { BlueprintStatus } from './blueprint-status.enum';
import { OwnerType } from './owner-type.enum';

/**
 * Blueprint member type enumeration
 * 藍圖成員類型列舉
 *
 * Defines the type of entity that is a member of a blueprint
 */
export enum BlueprintMemberType {
  /** Individual user account */
  USER = 'user',
  /** Internal team (organization sub-account) */
  TEAM = 'team',
  /** External partner (organization sub-account) */
  PARTNER = 'partner'
}

/**
 * Blueprint role enumeration (system roles)
 * 藍圖系統角色列舉
 */
export enum BlueprintRole {
  /** 檢視者 - 唯讀訪問 | Viewer role */
  VIEWER = 'viewer',
  /** 貢獻者 - 可編輯內容 | Contributor role */
  CONTRIBUTOR = 'contributor',
  /** 維護者 - 管理與編輯權限 | Maintainer role */
  MAINTAINER = 'maintainer'
}

/**
 * Blueprint business role enumeration
 * 藍圖業務角色列舉
 */
export enum BlueprintBusinessRole {
  PROJECT_MANAGER = 'project_manager',
  SITE_SUPERVISOR = 'site_supervisor',
  ENGINEER = 'engineer',
  QUALITY_INSPECTOR = 'quality_inspector',
  ARCHITECT = 'architect',
  CONTRACTOR = 'contractor',
  CLIENT = 'client'
}

/**
 * Team access levels for blueprint
 * 藍圖團隊訪問層級
 */
export enum BlueprintTeamAccess {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

/**
 * Blueprint entity interface
 * 藍圖實體介面
 */
export interface Blueprint {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;

  // Ownership
  ownerId: string;
  ownerType: OwnerType;

  // Visibility and status
  isPublic: boolean;
  status: BlueprintStatus;
  enabledModules: ModuleType[];

  // Metadata
  metadata?: Record<string, unknown>;

  // Audit fields
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

/**
 * Blueprint member interface
 * 藍圖成員介面
 *
 * Represents a member of a blueprint, which can be a user, team, or partner.
 * Member type availability depends on blueprint owner:
 * - User-owned blueprints: Only USER members allowed
 * - Organization-owned blueprints: USER, TEAM, and PARTNER members allowed
 */
export interface BlueprintMember {
  id: string;
  blueprintId: string;

  /**
   * Member type - determines what this member represents
   * 成員類型 - 決定此成員代表什麼
   */
  memberType: BlueprintMemberType;

  /**
   * Account ID - references the user/team/partner entity
   * 帳戶 ID - 參考用戶/團隊/夥伴實體
   * - For USER: references user account ID
   * - For TEAM: references team ID
   * - For PARTNER: references partner ID
   */
  accountId: string;

  /**
   * Display name of the member
   * 成員顯示名稱
   */
  accountName?: string;

  role: BlueprintRole;
  businessRole?: BlueprintBusinessRole;

  /**
   * Is this member external to the organization?
   * 此成員是否為組織外部成員？
   * - USER members: Can be internal or external
   * - TEAM members: Always internal (false)
   * - PARTNER members: Always external (true)
   */
  isExternal: boolean;

  permissions?: {
    canManageMembers?: boolean;
    canManageSettings?: boolean;
    canExportData?: boolean;
    canDeleteBlueprint?: boolean;
    customPermissions?: string[];
  };
  metadata?: Record<string, unknown>;
  grantedBy: string;
  grantedAt: Date | string;
}

/**
 * Blueprint team role interface
 * 藍圖團隊角色介面
 */
export interface BlueprintTeamRole {
  id: string;
  blueprintId: string;
  teamId: string;
  access: BlueprintTeamAccess;
  metadata?: Record<string, unknown>;
  grantedBy: string;
  grantedAt: Date | string;
}

/**
 * Blueprint creation request
 * 藍圖建立請求
 */
export interface CreateBlueprintRequest {
  name: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  ownerId: string;
  ownerType: OwnerType;
  isPublic?: boolean;
  enabledModules?: ModuleType[];
  metadata?: Record<string, unknown>;
  createdBy: string;
}

/**
 * Blueprint update payload
 * 藍圖更新資料
 */
export type UpdateBlueprintRequest = Partial<Omit<Blueprint, 'id' | 'createdAt' | 'createdBy'>>;

/**
 * Blueprint query options
 * 藍圖查詢選項
 */
export interface BlueprintQueryOptions {
  ownerId?: string;
  ownerType?: OwnerType;
  status?: BlueprintStatus;
  isPublic?: boolean;
  includeDeleted?: boolean;
}

// ============================================================================
// Note: Validation utility functions have been moved to @core/domain/utils
// Import from '@core' for validation functions:
// - isValidMemberTypeForOwner()
// - getAllowedMemberTypes()
// - isValidAssigneeTypeForOwner()
// - getAllowedAssigneeTypes()
// - validateTaskAssignment()
// ============================================================================
