/**
 * Financial Summary Model - 財務摘要資料模型
 *
 * SETC-029: Payment Status Tracking Service
 *
 * 定義財務相關的進度追蹤和摘要資料結構
 *
 * @module FinancialSummaryModel
 * @author GigHub Development Team
 * @date 2025-12-16
 */

/**
 * 請款進度
 */
export interface BillingProgress {
  /** 任務 ID */
  taskId: string;
  /** 總可請款金額 */
  totalBillable: number;
  /** 已請款金額（已核准） */
  billedAmount: number;
  /** 已收款金額 */
  paidAmount: number;
  /** 請款進度百分比 */
  billingPercentage: number;
  /** 收款進度百分比 */
  collectionPercentage: number;
}

/**
 * 付款進度
 */
export interface PaymentProgress {
  /** 任務 ID */
  taskId: string;
  /** 總應付金額 */
  totalPayable: number;
  /** 已核准金額 */
  approvedAmount: number;
  /** 已付款金額 */
  paidAmount: number;
  /** 核准進度百分比 */
  approvalPercentage: number;
  /** 付款進度百分比 */
  paymentPercentage: number;
}

/**
 * 任務付款狀態快照
 */
export interface TaskPaymentStatusSnapshot {
  /** 進度百分比 */
  percentage: number;
  /** 已核准金額 */
  approvedAmount: number;
  /** 已付款金額 */
  paidAmount: number;
}

/**
 * 任務請款狀態快照
 */
export interface TaskBillingStatusSnapshot {
  /** 進度百分比 */
  percentage: number;
  /** 已請款金額 */
  billedAmount: number;
  /** 已收款金額 */
  collectedAmount: number;
}

/**
 * 應收款摘要
 */
export interface ReceivableSummary {
  /** 總應收金額 */
  total: number;
  /** 已收金額 */
  collected: number;
  /** 待收金額 */
  pending: number;
  /** 收款率 (%) */
  collectionRate: number;
}

/**
 * 應付款摘要
 */
export interface PayableSummary {
  /** 總應付金額 */
  total: number;
  /** 已付金額 */
  paid: number;
  /** 待付金額 */
  pending: number;
  /** 付款率 (%) */
  paymentRate: number;
}

/**
 * 藍圖財務摘要
 */
export interface FinancialSummary {
  /** 藍圖 ID */
  blueprintId: string;
  /** 應收款摘要 */
  receivables: ReceivableSummary;
  /** 應付款摘要 */
  payables: PayableSummary;
  /** 毛利（收款 - 付款） */
  grossProfit: number;
  /** 毛利率 (%) */
  grossProfitMargin: number;
  /** 統計時間 */
  asOf: Date;

  // === 擴展欄位 (用於 FinanceDashboardComponent) ===

  /** 已請款總額 */
  totalBilled: number;
  /** 已收款金額 */
  totalReceived: number;
  /** 待收款金額 */
  pendingReceivable: number;
  /** 逾期應收款 */
  overdueReceivable: number;
  /** 應收款請款單數 */
  receivableInvoiceCount: number;
  /** 已收款請款單數 */
  paidReceivableCount: number;
  /** 逾期請款單數 */
  overdueInvoiceCount: number;
  /** 總應付金額 */
  totalPayable: number;
  /** 已付款金額 */
  totalPaid: number;
  /** 應收帳款餘額 */
  accountsReceivableBalance: number;
  /** 應付帳款餘額 */
  accountsPayableBalance: number;
  /** 本月請款 */
  monthlyBilled: number;
  /** 本月收款 */
  monthlyReceived: number;
}

/**
 * 承商付款摘要
 */
export interface ContractorPaymentSummary {
  /** 承商 ID */
  contractorId: string;
  /** 承商名稱 */
  contractorName: string;
  /** 總應付金額 */
  totalPayable: number;
  /** 已付金額 */
  paidAmount: number;
  /** 待付金額 */
  pendingAmount: number;
  /** 付款單數量 */
  paymentCount: number;
}

/**
 * 逾期款項摘要
 */
export interface OverdueSummary {
  /** 藍圖 ID */
  blueprintId: string;
  /** 逾期應收款數量 */
  overdueReceivableCount: number;
  /** 逾期應收款金額 */
  overdueReceivableAmount: number;
  /** 逾期應付款數量 */
  overduePayableCount: number;
  /** 逾期應付款金額 */
  overduePayableAmount: number;
  /** 統計時間 */
  asOf: Date;
}

/**
 * 月度財務統計
 */
export interface MonthlyFinancialStats {
  /** 年 */
  year: number;
  /** 月 */
  month: number;
  /** 應收金額 */
  receivableAmount: number;
  /** 收款金額 */
  collectedAmount: number;
  /** 應付金額 */
  payableAmount: number;
  /** 付款金額 */
  paidAmount: number;
  /** 淨現金流 */
  netCashFlow: number;
}
