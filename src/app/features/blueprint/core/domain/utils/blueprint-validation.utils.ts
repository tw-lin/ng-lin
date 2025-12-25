/**
 * Blueprint Validation Utilities
 * 藍圖驗證工具函式
 *
 * Provides validation functions for blueprint ownership, membership, and task assignment.
 * These utilities enforce the business rules for blueprint member scoping.
 *
 * @module core/domain/utils
 */

import { OwnerType, BlueprintMemberType } from '../types/blueprint';

// AssigneeType mirrors BlueprintMemberType for task assignment
type AssigneeType = BlueprintMemberType;
const AssigneeType = BlueprintMemberType;

// ============================================================================
// Member Type Validation
// ============================================================================

/**
 * Validate if a member type is allowed for a given blueprint owner type
 * 驗證成員類型是否適用於指定的藍圖擁有者類型
 *
 * Business Rules:
 * - User-owned blueprints: Only USER members allowed (individual collaborators)
 * - Organization-owned blueprints: USER, TEAM, and PARTNER members allowed
 *
 * @param ownerType - The blueprint owner type
 * @param memberType - The member type to validate
 * @returns true if the member type is allowed for the owner type
 *
 * @example
 * ```typescript
 * isValidMemberTypeForOwner(OwnerType.USER, BlueprintMemberType.USER); // true
 * isValidMemberTypeForOwner(OwnerType.USER, BlueprintMemberType.TEAM); // false
 * isValidMemberTypeForOwner(OwnerType.ORGANIZATION, BlueprintMemberType.TEAM); // true
 * ```
 */
export function isValidMemberTypeForOwner(ownerType: OwnerType, memberType: BlueprintMemberType): boolean {
  switch (ownerType) {
    case OwnerType.USER:
      // User-owned blueprints can only have USER members (collaborators)
      return memberType === BlueprintMemberType.USER;

    case OwnerType.ORGANIZATION:
      // Organization-owned blueprints can have all member types
      return true;

    default:
      return false;
  }
}

/**
 * Get allowed member types for a blueprint owner type
 * 取得藍圖擁有者類型允許的成員類型
 *
 * @param ownerType - The blueprint owner type
 * @returns Array of allowed member types
 *
 * @example
 * ```typescript
 * getAllowedMemberTypes(OwnerType.USER); // [BlueprintMemberType.USER]
 * getAllowedMemberTypes(OwnerType.ORGANIZATION);
 * // [BlueprintMemberType.USER, BlueprintMemberType.TEAM, BlueprintMemberType.PARTNER]
 * ```
 */
export function getAllowedMemberTypes(ownerType: OwnerType): BlueprintMemberType[] {
  switch (ownerType) {
    case OwnerType.USER:
      return [BlueprintMemberType.USER];

    case OwnerType.ORGANIZATION:
      return [BlueprintMemberType.USER, BlueprintMemberType.TEAM, BlueprintMemberType.PARTNER];

    default:
      return [];
  }
}

// ============================================================================
// Task Assignment Validation
// ============================================================================

/**
 * Validate if an assignee type is allowed for a given blueprint owner type
 * 驗證指派對象類型是否適用於指定的藍圖擁有者類型
 *
 * This is used for task assignment validation.
 * Rules match the blueprint member type rules since tasks can only be assigned
 * to valid blueprint members.
 *
 * @param ownerType - The blueprint owner type
 * @param assigneeType - The assignee type to validate
 * @returns true if the assignee type is allowed for the owner type
 *
 * @example
 * ```typescript
 * isValidAssigneeTypeForOwner(OwnerType.USER, AssigneeType.USER); // true
 * isValidAssigneeTypeForOwner(OwnerType.USER, AssigneeType.TEAM); // false
 * isValidAssigneeTypeForOwner(OwnerType.ORGANIZATION, AssigneeType.PARTNER); // true
 * ```
 */
export function isValidAssigneeTypeForOwner(ownerType: OwnerType, assigneeType: AssigneeType): boolean {
  // Map assignee type to member type for validation
  const memberTypeMap: Record<AssigneeType, BlueprintMemberType> = {
    [AssigneeType.USER]: BlueprintMemberType.USER,
    [AssigneeType.TEAM]: BlueprintMemberType.TEAM,
    [AssigneeType.PARTNER]: BlueprintMemberType.PARTNER
  };

  const memberType = memberTypeMap[assigneeType];
  return memberType ? isValidMemberTypeForOwner(ownerType, memberType) : false;
}

/**
 * Get allowed assignee types for a blueprint owner type
 * 取得藍圖擁有者類型允許的指派對象類型
 *
 * @param ownerType - The blueprint owner type
 * @returns Array of allowed assignee types for task assignment
 *
 * @example
 * ```typescript
 * getAllowedAssigneeTypes(OwnerType.USER); // [AssigneeType.USER]
 * getAllowedAssigneeTypes(OwnerType.ORGANIZATION);
 * // [AssigneeType.USER, AssigneeType.TEAM, AssigneeType.PARTNER]
 * ```
 */
export function getAllowedAssigneeTypes(ownerType: OwnerType): AssigneeType[] {
  switch (ownerType) {
    case OwnerType.USER:
      return [AssigneeType.USER];

    case OwnerType.ORGANIZATION:
      return [AssigneeType.USER, AssigneeType.TEAM, AssigneeType.PARTNER];

    default:
      return [];
  }
}

/**
 * Validate task assignment data
 * 驗證任務指派資料
 *
 * Ensures that the task assignment is valid for the blueprint's owner type.
 *
 * @param ownerType - The blueprint owner type
 * @param assigneeType - The assignee type being assigned
 * @param assigneeId - The ID of the assignee (optional, for additional validation)
 * @returns Validation result with isValid flag and error message if invalid
 *
 * @example
 * ```typescript
 * const result = validateTaskAssignment(OwnerType.USER, AssigneeType.TEAM);
 * // { isValid: false, error: '個人藍圖只能指派給用戶' }
 * ```
 */
export function validateTaskAssignment(
  ownerType: OwnerType,
  assigneeType?: AssigneeType,
  assigneeId?: string
): { isValid: boolean; error?: string } {
  // If no assignee type specified, validation passes (unassigned task)
  if (!assigneeType) {
    return { isValid: true };
  }

  // Check if assignee type is allowed for this owner type
  if (!isValidAssigneeTypeForOwner(ownerType, assigneeType)) {
    const allowedTypes = getAllowedAssigneeTypes(ownerType);
    const allowedTypesText = allowedTypes
      .map(type => {
        switch (type) {
          case AssigneeType.USER:
            return '用戶';
          case AssigneeType.TEAM:
            return '團隊';
          case AssigneeType.PARTNER:
            return '夥伴';
          default:
            return type;
        }
      })
      .join('、');

    return {
      isValid: false,
      error: ownerType === OwnerType.USER ? '個人藍圖只能指派給用戶' : `此藍圖只能指派給：${allowedTypesText}`
    };
  }

  // If assignee type is valid but no ID provided, that's an error
  if (assigneeType && !assigneeId) {
    return {
      isValid: false,
      error: '必須指定指派對象 ID'
    };
  }

  return { isValid: true };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get display name for owner type
 * 取得擁有者類型顯示名稱
 *
 * @param ownerType - The owner type
 * @returns Display name in Chinese
 */
export function getOwnerTypeDisplayName(ownerType: OwnerType): string {
  switch (ownerType) {
    case OwnerType.USER:
      return '個人';
    case OwnerType.ORGANIZATION:
      return '組織';
    default:
      return '未知';
  }
}

/**
 * Get display name for member type
 * 取得成員類型顯示名稱
 *
 * @param memberType - The member type
 * @returns Display name in Chinese
 */
export function getMemberTypeDisplayName(memberType: BlueprintMemberType): string {
  switch (memberType) {
    case BlueprintMemberType.USER:
      return '用戶';
    case BlueprintMemberType.TEAM:
      return '團隊';
    case BlueprintMemberType.PARTNER:
      return '夥伴';
    default:
      return '未知';
  }
}

/**
 * Get display name for assignee type
 * 取得指派對象類型顯示名稱
 *
 * @param assigneeType - The assignee type
 * @returns Display name in Chinese
 */
export function getAssigneeTypeDisplayName(assigneeType: AssigneeType): string {
  switch (assigneeType) {
    case AssigneeType.USER:
      return '用戶';
    case AssigneeType.TEAM:
      return '團隊';
    case AssigneeType.PARTNER:
      return '夥伴';
    default:
      return '未知';
  }
}
