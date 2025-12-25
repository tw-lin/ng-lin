/**
 * Blueprint status enumeration
 * 藍圖狀態列舉
 */
export enum BlueprintStatus {
  /** 草稿 | Draft blueprint not yet activated */
  DRAFT = 'draft',
  /** 啟用 | Active blueprint in use */
  ACTIVE = 'active',
  /** 已封存 | Archived blueprint (soft deleted) */
  ARCHIVED = 'archived'
}
