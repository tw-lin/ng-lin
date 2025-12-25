/**
 * Blueprint owner type
 * 藍圖擁有者類型
 *
 * Only User and Organization can own blueprints.
 * Teams and Partners are sub-accounts and cannot own blueprints directly.
 */
export enum OwnerType {
  /** 個人用戶 | User-owned blueprint */
  USER = 'user',
  /** 組織 | Organization-owned blueprint */
  ORGANIZATION = 'organization'
}
