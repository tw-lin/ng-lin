/**
 * 系統事件類型 - 完整列舉
 *
 * 統一的事件類型定義，確保所有模組使用相同的事件命名規範。
 * 命名規範: [module].[action] (例如: task.created, contract.activated)
 *
 * @remarks
 * 此列舉整合了所有模組的事件類型，按模組分類：
 * - Contract: 合約相關事件
 * - Task: 任務相關事件
 * - Log: 日誌相關事件
 * - QC: 品質檢驗事件
 * - Acceptance: 驗收事件
 * - Issue: 問題事件
 * - Finance: 財務事件
 * - Warranty: 保固事件
 * - Blueprint: 藍圖事件
 * - System: 系統事件
 */
export enum SystemEventType {
  // ===== Contract Events =====
  /** 合約建立 */
  CONTRACT_CREATED = 'contract.created',
  /** 合約更新 */
  CONTRACT_UPDATED = 'contract.updated',
  /** 合約刪除 */
  CONTRACT_DELETED = 'contract.deleted',
  /** 合約生效 */
  CONTRACT_ACTIVATED = 'contract.activated',
  /** 合約完成 */
  CONTRACT_COMPLETED = 'contract.completed',
  /** 合約終止 */
  CONTRACT_TERMINATED = 'contract.terminated',
  /** 合約狀態變更 */
  CONTRACT_STATUS_CHANGED = 'contract.status_changed',
  /** 合約工項建立 */
  CONTRACT_WORK_ITEM_CREATED = 'contract.work_item.created',
  /** 合約工項更新 */
  CONTRACT_WORK_ITEM_UPDATED = 'contract.work_item.updated',
  /** 合約工項刪除 */
  CONTRACT_WORK_ITEM_DELETED = 'contract.work_item.deleted',
  /** 合約工項進度更新 */
  CONTRACT_WORK_ITEM_PROGRESS_UPDATED = 'contract.work_item.progress_updated',
  /** 合約工項連結任務 */
  CONTRACT_WORK_ITEM_TASK_LINKED = 'contract.work_item.task_linked',
  /** 合約工項解除任務連結 */
  CONTRACT_WORK_ITEM_TASK_UNLINKED = 'contract.work_item.task_unlinked',
  /** 合約檔案上傳 */
  CONTRACT_FILE_UPLOADED = 'contract.file.uploaded',
  /** 合約檔案移除 */
  CONTRACT_FILE_REMOVED = 'contract.file.removed',
  /** 合約解析請求 */
  CONTRACT_PARSING_REQUESTED = 'contract.parsing.requested',
  /** 合約解析開始 */
  CONTRACT_PARSING_STARTED = 'contract.parsing.started',
  /** 合約解析完成 */
  CONTRACT_PARSING_COMPLETED = 'contract.parsing.completed',
  /** 合約解析失敗 */
  CONTRACT_PARSING_FAILED = 'contract.parsing.failed',
  /** 合約解析資料確認 */
  CONTRACT_PARSING_CONFIRMED = 'contract.parsing.confirmed',

  // ===== Task Events =====
  /** 任務建立 */
  TASK_CREATED = 'task.created',
  /** 任務更新 */
  TASK_UPDATED = 'task.updated',
  /** 任務刪除 */
  TASK_DELETED = 'task.deleted',
  /** 任務指派 */
  TASK_ASSIGNED = 'task.assigned',
  /** 任務開始 */
  TASK_STARTED = 'task.started',
  /** 任務完成 ⭐ 觸發日誌建立 */
  TASK_COMPLETED = 'task.completed',
  /** 任務取消 */
  TASK_CANCELLED = 'task.cancelled',
  /** 任務進度更新 */
  TASK_PROGRESS_UPDATED = 'task.progress_updated',
  /** 任務狀態變更 */
  TASK_STATUS_CHANGED = 'task.status_changed',

  // ===== Log Events =====
  /** 日誌建立 ⭐ 觸發 QC 建立 */
  LOG_CREATED = 'log.created',
  /** 日誌更新 */
  LOG_UPDATED = 'log.updated',
  /** 日誌刪除 */
  LOG_DELETED = 'log.deleted',
  /** 日誌核准 */
  LOG_APPROVED = 'log.approved',

  // ===== QA/QC Events =====
  /** QC 檢驗建立 */
  QC_INSPECTION_CREATED = 'qc.inspection_created',
  /** QC 檢驗開始 */
  QC_INSPECTION_STARTED = 'qc.inspection_started',
  /** QC 檢驗通過 ⭐ 觸發驗收 */
  QC_INSPECTION_PASSED = 'qc.inspection_passed',
  /** QC 檢驗失敗 ⭐ 觸發缺失單 */
  QC_INSPECTION_FAILED = 'qc.inspection_failed',
  /** QC 缺失建立 */
  QC_DEFECT_CREATED = 'qc.defect_created',
  /** QC 缺失解決 */
  QC_DEFECT_RESOLVED = 'qc.defect_resolved',
  /** QC 複驗完成 */
  QC_REINSPECTION_COMPLETED = 'qc.reinspection_completed',

  // ===== Acceptance Events =====
  /** 驗收申請建立 */
  ACCEPTANCE_REQUEST_CREATED = 'acceptance.request_created',
  /** 驗收排程 */
  ACCEPTANCE_INSPECTION_SCHEDULED = 'acceptance.inspection_scheduled',
  /** 驗收檢驗完成 */
  ACCEPTANCE_INSPECTION_COMPLETED = 'acceptance.inspection_completed',
  /** 驗收通過 ⭐ 觸發請款/保固 */
  ACCEPTANCE_FINALIZED = 'acceptance.finalized',
  /** 驗收拒絕 */
  ACCEPTANCE_REJECTED = 'acceptance.rejected',
  /** 驗收複驗 */
  ACCEPTANCE_REINSPECTION = 'acceptance.reinspection',

  // ===== Issue Events =====
  /** 問題建立 */
  ISSUE_CREATED = 'issue.created',
  /** 問題更新 */
  ISSUE_UPDATED = 'issue.updated',
  /** 問題指派 */
  ISSUE_ASSIGNED = 'issue.assigned',
  /** 問題解決 */
  ISSUE_RESOLVED = 'issue.resolved',
  /** 問題驗證 */
  ISSUE_VERIFIED = 'issue.verified',
  /** 問題驗證失敗 */
  ISSUE_VERIFICATION_FAILED = 'issue.verification_failed',
  /** 問題關閉 */
  ISSUE_CLOSED = 'issue.closed',
  /** 從驗收失敗建立問題 */
  ISSUE_CREATED_FROM_ACCEPTANCE = 'issue.created_from_acceptance',
  /** 從 QC 失敗建立問題 */
  ISSUE_CREATED_FROM_QC = 'issue.created_from_qc',
  /** 從保固缺失建立問題 */
  ISSUE_CREATED_FROM_WARRANTY = 'issue.created_from_warranty',
  /** 從安全事故建立問題 */
  ISSUE_CREATED_FROM_SAFETY = 'issue.created_from_safety',

  // ===== Finance Events =====
  /** 請款單生成 */
  INVOICE_GENERATED = 'invoice.generated',
  /** 請款單提交 */
  INVOICE_SUBMITTED = 'invoice.submitted',
  /** 請款單核准 */
  INVOICE_APPROVED = 'invoice.approved',
  /** 請款單拒絕 */
  INVOICE_REJECTED = 'invoice.rejected',
  /** 請款單已收款 */
  INVOICE_PAID = 'invoice.paid',
  /** 付款單生成 */
  PAYMENT_GENERATED = 'payment.generated',
  /** 付款單提交 */
  PAYMENT_SUBMITTED = 'payment.submitted',
  /** 付款單核准 */
  PAYMENT_APPROVED = 'payment.approved',
  /** 付款完成 */
  PAYMENT_COMPLETED = 'payment.completed',
  /** 付款拒絕 */
  PAYMENT_REJECTED = 'payment.rejected',

  // ===== Warranty Events =====
  /** 保固期開始 */
  WARRANTY_PERIOD_STARTED = 'warranty.period_started',
  /** 保固缺失回報 */
  WARRANTY_DEFECT_REPORTED = 'warranty.defect_reported',
  /** 保固維修完成 */
  WARRANTY_REPAIR_COMPLETED = 'warranty.repair_completed',
  /** 保固期到期 */
  WARRANTY_PERIOD_EXPIRED = 'warranty.period_expired',
  /** 保固結案 */
  WARRANTY_CLOSED = 'warranty.closed',

  // ===== Blueprint Events =====
  /** 藍圖建立 */
  BLUEPRINT_CREATED = 'blueprint.created',
  /** 藍圖更新 */
  BLUEPRINT_UPDATED = 'blueprint.updated',
  /** 藍圖刪除 */
  BLUEPRINT_DELETED = 'blueprint.deleted',
  /** 藍圖歸檔 */
  BLUEPRINT_ARCHIVED = 'blueprint.archived',
  /** 藍圖啟用 */
  BLUEPRINT_ACTIVATED = 'blueprint.activated',
  /** 藍圖停用 */
  BLUEPRINT_DEACTIVATED = 'blueprint.deactivated',

  // ===== Module Lifecycle Events =====
  /** 模組載入 */
  MODULE_LOADED = 'module.loaded',
  /** 模組卸載 */
  MODULE_UNLOADED = 'module.unloaded',
  /** 模組錯誤 */
  MODULE_ERROR = 'module.error',
  /** 模組就緒 */
  MODULE_READY = 'module.ready',

  // ===== Container Lifecycle Events =====
  /** 容器初始化 */
  CONTAINER_INITIALIZED = 'container.initialized',
  /** 容器啟動 */
  CONTAINER_STARTED = 'container.started',
  /** 容器停止 */
  CONTAINER_STOPPED = 'container.stopped',
  /** 容器錯誤 */
  CONTAINER_ERROR = 'container.error',

  // ===== System Events =====
  /** 系統錯誤 */
  SYSTEM_ERROR = 'system.error',
  /** 系統警告 */
  SYSTEM_WARNING = 'system.warning',
  /** 系統資訊 */
  SYSTEM_INFO = 'system.info'
}

/**
 * 事件類型到模組名稱的映射
 *
 * @param eventType - 事件類型
 * @returns 模組名稱
 */
export function getModuleFromEventType(eventType: SystemEventType | string): string {
  const typeStr = String(eventType);
  const parts = typeStr.split('.');
  return parts[0] || 'unknown';
}

/**
 * 檢查是否為自動觸發事件
 *
 * @param eventType - 事件類型
 * @returns 是否為自動觸發事件
 */
export function isAutoTriggerEvent(eventType: SystemEventType): boolean {
  const autoTriggerEvents = [
    SystemEventType.TASK_COMPLETED,
    SystemEventType.LOG_CREATED,
    SystemEventType.QC_INSPECTION_PASSED,
    SystemEventType.QC_INSPECTION_FAILED,
    SystemEventType.ACCEPTANCE_FINALIZED
  ];
  return autoTriggerEvents.includes(eventType);
}
