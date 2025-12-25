/**
 * Invoice Model - 請款單/付款單資料模型
 *
 * SETC-024: Invoice Service Expansion Planning
 *
 * 定義完整的請款與付款資料結構，支援：
 * - 應收款（向業主請款）
 * - 應付款（付款給承商）
 * - 多級審核流程
 * - 狀態追蹤
 *
 * @module InvoiceModel
 * @author GigHub Development Team
 * @date 2025-12-16
 */

/**
 * 請款單/付款單狀態
 */
export type InvoiceStatus =
  | 'draft' // 草稿
  | 'submitted' // 已送出
  | 'under_review' // 審核中
  | 'approved' // 已核准
  | 'rejected' // 已退回
  | 'invoiced' // 已開票
  | 'partial_paid' // 部分付款
  | 'paid' // 已付款
  | 'cancelled'; // 已取消

/**
 * 請款單類型
 * - receivable: 應收款（向業主請款）
 * - payable: 應付款（付款給承商）
 */
export type InvoiceType = 'receivable' | 'payable';

/**
 * 付款方式
 */
export type PaymentMethod =
  | 'bank_transfer' // 銀行轉帳
  | 'check' // 支票
  | 'cash' // 現金
  | 'credit_card'; // 信用卡

/**
 * 銀行帳戶資訊
 */
export interface BankAccount {
  /** 銀行名稱 */
  bankName: string;
  /** 分行名稱 */
  branchName: string;
  /** 帳號 */
  accountNumber: string;
  /** 戶名 */
  accountName: string;
}

/**
 * 請款/付款方資訊
 */
export interface PartyInfo {
  /** 組織 ID */
  id: string;
  /** 組織名稱 */
  name: string;
  /** 統一編號 */
  taxId: string;
  /** 地址 */
  address: string;
  /** 聯絡人姓名 */
  contactName: string;
  /** 聯絡電話 */
  contactPhone: string;
  /** 聯絡 Email */
  contactEmail: string;
  /** 銀行帳戶 */
  bankAccount?: BankAccount;
}

/**
 * 請款項目
 */
export interface InvoiceItem {
  /** 項目 ID */
  id: string;
  /** 關聯的合約工項 ID */
  contractWorkItemId: string;
  /** 描述 */
  description: string;
  /** 單位 */
  unit: string;
  /** 數量 */
  quantity: number;
  /** 單價 */
  unitPrice: number;
  /** 金額 (quantity * unitPrice) */
  amount: number;
  /** 完成百分比 */
  completionPercentage: number;
  /** 先前已請款金額 */
  previousBilled: number;
  /** 本次請款金額 */
  currentBilling: number;
}

/**
 * 附件
 */
export interface FileAttachment {
  /** 附件 ID */
  id: string;
  /** 檔案名稱 */
  fileName: string;
  /** 檔案類型 */
  fileType: string;
  /** 檔案大小 (bytes) */
  fileSize: number;
  /** 儲存路徑 */
  storagePath: string;
  /** 下載 URL */
  downloadUrl?: string;
  /** 上傳者 */
  uploadedBy: string;
  /** 上傳時間 */
  uploadedAt: Date;
}

/**
 * 請款單/付款單主資料
 */
export interface Invoice {
  /** 唯一 ID */
  id: string;
  /** 藍圖 ID */
  blueprintId: string;
  /** 請款單號 */
  invoiceNumber: string;

  // 類型
  /** 類型: receivable=應收(向業主請款), payable=應付(付款給承商) */
  invoiceType: InvoiceType;

  // 關聯
  /** 合約 ID */
  contractId: string;
  /** 驗收 ID */
  acceptanceId?: string;
  /** 相關任務 ID 列表 */
  taskIds: string[];

  // 請款項目
  /** 請款項目列表 */
  invoiceItems: InvoiceItem[];

  // 金額計算
  /** 小計（未稅） */
  subtotal: number;
  /** 稅額 */
  tax: number;
  /** 稅率 (%) */
  taxRate: number;
  /** 總計（含稅） */
  total: number;

  // 請款百分比
  /** 請款百分比 */
  billingPercentage: number;

  // 雙方資訊
  /** 開票方（請款方） */
  billingParty: PartyInfo;
  /** 付款方 */
  payingParty: PartyInfo;

  // 狀態
  /** 當前狀態 */
  status: InvoiceStatus;

  // 審核流程
  /** 審核流程 */
  approvalWorkflow: ApprovalWorkflow;

  // 付款資訊
  /** 到期日 */
  dueDate: Date;
  /** 付款日期 */
  paidDate?: Date;
  /** 已付金額 */
  paidAmount?: number;
  /** 付款方式 */
  paymentMethod?: PaymentMethod;

  // 備註
  /** 備註 */
  notes?: string;
  /** 附件 */
  attachments: FileAttachment[];

  // 審計欄位
  /** 建立者 */
  createdBy: string;
  /** 建立時間 */
  createdAt: Date;
  /** 最後更新者 */
  updatedBy?: string;
  /** 最後更新時間 */
  updatedAt: Date;
}

/**
 * 審核者狀態
 */
export type ApproverStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

/**
 * 審核者
 */
export interface Approver {
  /** 審核步驟編號 */
  stepNumber: number;
  /** 審核者 ID */
  userId: string;
  /** 審核者姓名 */
  userName: string;
  /** 角色 */
  role: string;
  /** 審核狀態 */
  status: ApproverStatus;
  /** 審核時間 */
  approvedAt?: Date;
  /** 審核意見 */
  comments?: string;
}

/**
 * 審核動作
 */
export type ApprovalAction = 'submit' | 'approve' | 'reject' | 'return' | 'cancel';

/**
 * 審核歷史記錄
 */
export interface ApprovalHistory {
  /** ID */
  id: string;
  /** 審核步驟編號 */
  stepNumber: number;
  /** 動作 */
  action: ApprovalAction;
  /** 執行者 ID */
  userId: string;
  /** 執行者姓名 */
  userName: string;
  /** 時間戳記 */
  timestamp: Date;
  /** 意見 */
  comments?: string;
  /** 變更前狀態 */
  previousStatus: InvoiceStatus;
  /** 變更後狀態 */
  newStatus: InvoiceStatus;
}

/**
 * 審核流程
 */
export interface ApprovalWorkflow {
  /** 當前步驟 */
  currentStep: number;
  /** 總步驟數 */
  totalSteps: number;
  /** 審核者列表 */
  approvers: Approver[];
  /** 審核歷史 */
  history: ApprovalHistory[];
}

// ============================================
// DTOs (Data Transfer Objects)
// ============================================

/**
 * 建立請款單 DTO
 */
export interface CreateInvoiceDto {
  blueprintId: string;
  invoiceType: InvoiceType;
  contractId: string;
  acceptanceId?: string;
  taskIds: string[];
  invoiceItems: Array<Omit<InvoiceItem, 'id'>>;
  taxRate: number;
  billingPercentage: number;
  billingParty: PartyInfo;
  payingParty: PartyInfo;
  dueDate: Date;
  notes?: string;
  createdBy: string;
}

/**
 * 更新請款單 DTO
 */
export interface UpdateInvoiceDto {
  invoiceItems?: Array<Omit<InvoiceItem, 'id'>>;
  taxRate?: number;
  billingPercentage?: number;
  dueDate?: Date;
  notes?: string;
  updatedBy: string;
}

/**
 * 自動生成請款單資料
 */
export interface GenerateInvoiceData {
  blueprintId: string;
  contractId: string;
  acceptanceId: string;
  taskIds: string[];
  billingParty: PartyInfo;
  payingParty: PartyInfo;
  amount: number;
  percentage: number;
  generatedBy: string;
  generatedAt: Date;
}

/**
 * 開票資訊
 */
export interface InvoiceInfo {
  invoiceDate: Date;
  invoiceRealNumber: string;
  invoiceAmount: number;
  invoicedBy: string;
}

/**
 * 付款資訊
 */
export interface PaymentInfo {
  paidDate: Date;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  paidBy: string;
}

/**
 * 請款單摘要
 */
export interface InvoiceSummary {
  blueprintId: string;
  totalReceivable: number;
  totalPayable: number;
  pendingReceivable: number;
  pendingPayable: number;
  paidReceivable: number;
  paidPayable: number;
  overdueReceivable: number;
  overduePayable: number;
  receivableCount: number;
  payableCount: number;
}

/**
 * 請款單查詢選項
 */
export interface InvoiceQueryOptions {
  invoiceType?: InvoiceType;
  status?: InvoiceStatus;
  contractId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  orderBy?: 'createdAt' | 'dueDate' | 'total';
  orderDirection?: 'asc' | 'desc';
}
