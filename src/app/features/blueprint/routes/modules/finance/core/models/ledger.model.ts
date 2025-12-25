/**
 * Ledger Model - 帳務資料模型
 *
 * SETC-067: Ledger & Accounting Service
 *
 * 定義完整的帳務資料結構，支援：
 * - 會計分錄記錄
 * - 科目餘額查詢
 * - 試算表生成
 * - 財務結算
 *
 * @module LedgerModel
 * @author GigHub Development Team
 * @date 2025-12-16
 */

/**
 * 分錄來源類型
 */
export type LedgerSourceType =
  | 'invoice' // 請款單
  | 'payment' // 付款
  | 'adjustment' // 調整
  | 'closing' // 結算
  | 'manual'; // 手動

/**
 * 分錄狀態
 */
export type LedgerEntryStatus =
  | 'draft' // 草稿
  | 'posted' // 已過帳
  | 'reversed'; // 已沖銷

/**
 * 分錄明細行
 */
export interface LedgerLine {
  /** 行 ID */
  id: string;
  /** 科目代碼 */
  accountCode: string;
  /** 科目名稱 */
  accountName: string;
  /** 借方金額 */
  debit: number;
  /** 貸方金額 */
  credit: number;
  /** 說明 */
  description?: string;
}

/**
 * 會計分錄
 */
export interface LedgerEntry {
  /** 唯一 ID */
  id: string;
  /** 藍圖 ID */
  blueprintId: string;
  /** 分錄編號 */
  entryNumber: string;

  // 分錄資訊
  /** 分錄日期 */
  entryDate: Date;
  /** 說明 */
  description: string;
  /** 參考編號 */
  reference?: string;

  // 來源
  /** 來源類型 */
  sourceType: LedgerSourceType;
  /** 來源 ID */
  sourceId?: string;

  // 借貸
  /** 分錄明細 */
  lines: LedgerLine[];
  /** 借方總額 */
  totalDebit: number;
  /** 貸方總額 */
  totalCredit: number;
  /** 是否平衡 */
  isBalanced: boolean;

  // 狀態
  /** 分錄狀態 */
  status: LedgerEntryStatus;
  /** 過帳時間 */
  postedAt?: Date;

  // 期間
  /** 會計年度 */
  fiscalYear: number;
  /** 會計期間 */
  fiscalPeriod: number;

  // 審計
  /** 建立者 */
  createdBy: string;
  /** 建立時間 */
  createdAt: Date;
}

/**
 * 科目餘額
 */
export interface AccountBalance {
  /** 科目代碼 */
  accountCode: string;
  /** 科目名稱 */
  accountName: string;
  /** 借方餘額 */
  debitBalance: number;
  /** 貸方餘額 */
  creditBalance: number;
  /** 淨餘額 */
  netBalance: number;
  /** 截止日期 */
  asOfDate: Date;
}

/**
 * 試算表
 */
export interface TrialBalance {
  /** 藍圖 ID */
  blueprintId: string;
  /** 截止日期 */
  asOfDate: Date;
  /** 科目餘額列表 */
  accounts: AccountBalance[];
  /** 借方總額 */
  totalDebits: number;
  /** 貸方總額 */
  totalCredits: number;
  /** 是否平衡 */
  isBalanced: boolean;
}

/**
 * 期間結算結果
 */
export interface PeriodCloseResult {
  /** 結算期間 */
  period: {
    year: number;
    month: number;
  };
  /** 結算時間 */
  closedAt: Date;
  /** 結算前餘額 */
  openingBalance: number;
  /** 結算後餘額 */
  closingBalance: number;
  /** 本期收入 */
  periodRevenue: number;
  /** 本期支出 */
  periodExpense: number;
  /** 本期淨額 */
  periodNet: number;
  /** 結算分錄 ID */
  closingEntryId?: string;
  /** 成功 */
  success: boolean;
  /** 錯誤訊息 */
  errorMessage?: string;
}

/**
 * 損益表
 */
export interface IncomeStatement {
  /** 藍圖 ID */
  blueprintId: string;
  /** 開始日期 */
  startDate: Date;
  /** 結束日期 */
  endDate: Date;
  /** 收入項目 */
  revenues: Array<{
    accountCode: string;
    accountName: string;
    amount: number;
  }>;
  /** 收入總額 */
  totalRevenue: number;
  /** 支出項目 */
  expenses: Array<{
    accountCode: string;
    accountName: string;
    amount: number;
  }>;
  /** 支出總額 */
  totalExpense: number;
  /** 淨利 */
  netIncome: number;
}

/**
 * 資產負債表
 */
export interface BalanceSheet {
  /** 藍圖 ID */
  blueprintId: string;
  /** 截止日期 */
  asOfDate: Date;
  /** 資產 */
  assets: Array<{
    accountCode: string;
    accountName: string;
    balance: number;
  }>;
  /** 資產總額 */
  totalAssets: number;
  /** 負債 */
  liabilities: Array<{
    accountCode: string;
    accountName: string;
    balance: number;
  }>;
  /** 負債總額 */
  totalLiabilities: number;
  /** 權益 */
  equity: number;
}

/**
 * 請款事件資料 (用於自動分錄)
 */
export interface InvoiceEventData {
  invoiceId: string;
  invoiceNumber: string;
  blueprintId: string;
  invoiceType: 'receivable' | 'payable';
  subtotal: number;
  tax: number;
  totalAmount: number;
  retainageAmount?: number;
}

/**
 * 付款事件資料 (用於自動分錄)
 */
export interface PaymentEventData {
  paymentId: string;
  paymentNumber: string;
  blueprintId: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
}

// ============================================
// DTOs (Data Transfer Objects)
// ============================================

/**
 * 建立分錄 DTO
 */
export interface CreateLedgerEntryDto {
  blueprintId: string;
  entryDate: Date;
  description: string;
  reference?: string;
  sourceType: LedgerSourceType;
  sourceId?: string;
  lines: Array<Omit<LedgerLine, 'id'>>;
  createdBy: string;
}

/**
 * 分錄查詢選項
 */
export interface LedgerQueryOptions {
  sourceType?: LedgerSourceType;
  status?: LedgerEntryStatus;
  fiscalYear?: number;
  fiscalPeriod?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  orderBy?: 'entryDate' | 'createdAt' | 'entryNumber';
  orderDirection?: 'asc' | 'desc';
}

/**
 * 預設會計科目代碼
 */
export const ACCOUNT_CODES = {
  // 資產
  CASH: '1111', // 現金
  BANK: '1121', // 銀行存款
  ACCOUNTS_RECEIVABLE: '1131', // 應收帳款
  PREPAID_EXPENSES: '1141', // 預付費用

  // 負債
  ACCOUNTS_PAYABLE: '2141', // 應付帳款
  RETENTION_PAYABLE: '2191', // 應付保留款
  ACCRUED_EXPENSES: '2151', // 應付費用

  // 權益
  RETAINED_EARNINGS: '3100', // 保留盈餘

  // 收入
  REVENUE: '4100', // 營業收入
  OTHER_INCOME: '4200', // 其他收入

  // 費用
  COST_OF_GOODS_SOLD: '5100', // 銷貨成本
  OPERATING_EXPENSES: '6100', // 營業費用
  LABOR_EXPENSE: '6110', // 人工費用
  MATERIAL_EXPENSE: '6120', // 材料費用
  EQUIPMENT_EXPENSE: '6130', // 設備費用
  SUBCONTRACT_EXPENSE: '6140', // 分包費用
  OTHER_EXPENSE: '6900' // 其他費用
} as const;
