/**
 * Budget Model - 預算資料模型
 *
 * SETC-066: Budget Management Service
 *
 * 定義完整的預算資料結構，支援：
 * - 預算編列與分類
 * - 預算執行追蹤
 * - 預算預警機制
 * - 預算變更管理
 *
 * @module BudgetModel
 * @author GigHub Development Team
 * @date 2025-12-16
 */

/**
 * 預算狀態
 */
export type BudgetStatus =
  | 'draft' // 草稿
  | 'active' // 進行中
  | 'frozen' // 凍結
  | 'closed'; // 結案

/**
 * 預算類別
 */
export type BudgetCategory =
  | 'labor' // 人工
  | 'material' // 材料
  | 'equipment' // 設備
  | 'subcontract' // 分包
  | 'overhead' // 管理費
  | 'contingency' // 預備金
  | 'other'; // 其他

/**
 * 預算項目
 */
export interface BudgetItem {
  /** 項目 ID */
  id: string;
  /** 項目代碼 */
  code: string;
  /** 項目名稱 */
  name: string;
  /** 項目描述 */
  description?: string;
  /** 預算金額 */
  budgetAmount: number;
  /** 已支出金額 */
  spentAmount: number;
  /** 剩餘金額 */
  remainingAmount: number;
  /** 類別 */
  category?: BudgetCategory;
}

/**
 * 預算主資料
 */
export interface Budget {
  /** 唯一 ID */
  id: string;
  /** 藍圖 ID */
  blueprintId: string;
  /** 預算編號 */
  budgetNumber: string;

  // 基本資訊
  /** 預算名稱 */
  name: string;
  /** 預算描述 */
  description?: string;
  /** 預算類別 */
  category: BudgetCategory;
  /** 會計年度 */
  fiscalYear: number;

  // 金額
  /** 預算總額 */
  totalAmount: number;
  /** 已分配金額 */
  allocatedAmount: number;
  /** 已支出金額 */
  spentAmount: number;
  /** 剩餘金額 */
  remainingAmount: number;

  // 項目
  /** 預算項目列表 */
  items: BudgetItem[];

  // 狀態
  /** 預算狀態 */
  status: BudgetStatus;
  /** 執行率 (%) */
  utilizationRate: number;

  // 閾值
  /** 預警閾值 (%) */
  warningThreshold: number;
  /** 警示閾值 (%) */
  criticalThreshold: number;

  // 期間
  /** 開始日期 */
  startDate: Date;
  /** 結束日期 */
  endDate: Date;

  // 審計
  /** 建立者 */
  createdBy: string;
  /** 建立時間 */
  createdAt: Date;
  /** 最後更新時間 */
  updatedAt: Date;
}

/**
 * 預算變更請求
 */
export interface BudgetChangeRequest {
  /** 變更 ID */
  id: string;
  /** 預算 ID */
  budgetId: string;
  /** 變更類型 */
  changeType: 'increase' | 'decrease' | 'transfer';
  /** 變更金額 */
  amount: number;
  /** 變更原因 */
  reason: string;
  /** 來源項目 ID (轉移時) */
  fromItemId?: string;
  /** 目標項目 ID (轉移時) */
  toItemId?: string;
  /** 狀態 */
  status: 'pending' | 'approved' | 'rejected';
  /** 申請者 */
  requestedBy: string;
  /** 申請時間 */
  requestedAt: Date;
  /** 審核者 */
  approvedBy?: string;
  /** 審核時間 */
  approvedAt?: Date;
  /** 拒絕原因 */
  rejectionReason?: string;
}

/**
 * 支出記錄
 */
export interface ExpenseRecord {
  /** 記錄 ID */
  id: string;
  /** 預算 ID */
  budgetId: string;
  /** 預算項目 ID */
  budgetItemId: string;
  /** 金額 */
  amount: number;
  /** 描述 */
  description: string;
  /** 來源 (請款單、付款單等) */
  sourceType: 'invoice' | 'payment' | 'manual';
  /** 來源 ID */
  sourceId?: string;
  /** 記錄者 */
  recordedBy: string;
  /** 記錄時間 */
  recordedAt: Date;
}

/**
 * 預算摘要
 */
export interface BudgetSummary {
  /** 藍圖 ID */
  blueprintId: string;
  /** 預算總額 */
  totalBudget: number;
  /** 已支出總額 */
  totalSpent: number;
  /** 剩餘總額 */
  totalRemaining: number;
  /** 整體執行率 */
  overallUtilization: number;
  /** 按類別統計 */
  byCategory: Record<string, CategoryBudget>;
  /** 預警列表 */
  alerts: BudgetAlert[];
}

/**
 * 類別預算統計
 */
export interface CategoryBudget {
  /** 預算總額 */
  totalBudget: number;
  /** 已支出 */
  totalSpent: number;
  /** 剩餘 */
  totalRemaining: number;
}

/**
 * 預算預警
 */
export interface BudgetAlert {
  /** 預算 ID */
  budgetId: string;
  /** 預算名稱 */
  budgetName: string;
  /** 預警類型 */
  alertType: 'warning' | 'critical' | 'exceeded';
  /** 執行率 */
  utilizationRate: number;
  /** 訊息 */
  message: string;
}

/**
 * 預算閾值設定
 */
export interface BudgetThreshold {
  /** 預警閾值 (%) */
  warningThreshold: number;
  /** 警示閾值 (%) */
  criticalThreshold: number;
}

// ============================================
// DTOs (Data Transfer Objects)
// ============================================

/**
 * 建立預算 DTO
 */
export interface CreateBudgetDto {
  blueprintId: string;
  name: string;
  description?: string;
  category: BudgetCategory;
  fiscalYear: number;
  items?: Array<Omit<BudgetItem, 'id' | 'spentAmount' | 'remainingAmount'>>;
  warningThreshold?: number;
  criticalThreshold?: number;
  startDate: Date;
  endDate: Date;
  createdBy: string;
}

/**
 * 更新預算 DTO
 */
export interface UpdateBudgetDto {
  name?: string;
  description?: string;
  category?: BudgetCategory;
  status?: BudgetStatus;
  warningThreshold?: number;
  criticalThreshold?: number;
  endDate?: Date;
}

/**
 * 預算查詢選項
 */
export interface BudgetQueryOptions {
  category?: BudgetCategory;
  status?: BudgetStatus;
  fiscalYear?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'name' | 'utilizationRate';
  orderDirection?: 'asc' | 'desc';
}
