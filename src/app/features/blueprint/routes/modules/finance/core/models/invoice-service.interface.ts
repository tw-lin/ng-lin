/**
 * Invoice Service Interface - 請款服務介面定義
 *
 * SETC-024: Invoice Service Expansion Planning
 *
 * 定義完整的請款與付款服務 API 契約
 *
 * @module InvoiceServiceInterface
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import type { Observable } from 'rxjs';

import type {
  Invoice,
  InvoiceStatus,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  GenerateInvoiceData,
  InvoiceInfo,
  PaymentInfo,
  InvoiceSummary,
  InvoiceQueryOptions
} from './invoice.model';

/**
 * 請款服務介面
 *
 * 提供完整的請款與付款管理功能：
 * - CRUD 操作
 * - 自動生成
 * - 狀態管理（審核流程）
 * - 查詢與統計
 */
export interface IInvoiceService {
  // ============================================
  // CRUD 操作
  // ============================================

  /**
   * 建立請款單
   *
   * @param invoice 建立資料
   * @returns 建立的請款單
   */
  create(invoice: CreateInvoiceDto): Promise<Invoice>;

  /**
   * 更新請款單
   *
   * @param id 請款單 ID
   * @param invoice 更新資料
   * @returns 更新後的請款單
   */
  update(id: string, invoice: UpdateInvoiceDto): Promise<Invoice>;

  /**
   * 刪除請款單（僅限草稿狀態）
   *
   * @param id 請款單 ID
   */
  delete(id: string): Promise<void>;

  /**
   * 取得請款單
   *
   * @param blueprintId 藍圖 ID
   * @param id 請款單 ID
   * @returns 請款單或 null
   */
  getById(blueprintId: string, id: string): Promise<Invoice | null>;

  /**
   * 取得藍圖下的所有請款單
   *
   * @param blueprintId 藍圖 ID
   * @param options 查詢選項
   * @returns 請款單列表
   */
  getByBlueprintId(blueprintId: string, options?: InvoiceQueryOptions): Promise<Invoice[]>;

  /**
   * 即時監聽藍圖請款單變更
   *
   * @param blueprintId 藍圖 ID
   * @param options 查詢選項
   * @returns 請款單列表 Observable
   */
  watchByBlueprintId(blueprintId: string, options?: InvoiceQueryOptions): Observable<Invoice[]>;

  // ============================================
  // 自動生成
  // ============================================

  /**
   * 從驗收自動生成請款單（同時生成應收與應付）
   *
   * @param acceptanceId 驗收 ID
   * @returns 生成的請款單（應收）與付款單（應付）
   */
  autoGenerateFromAcceptance(acceptanceId: string): Promise<{
    receivable: Invoice;
    payable: Invoice;
  }>;

  /**
   * 自動生成應收款（向業主請款）
   *
   * @param data 生成資料
   * @returns 應收款請款單
   */
  autoGenerateReceivable(data: GenerateInvoiceData): Promise<Invoice>;

  /**
   * 自動生成應付款（付款給承商）
   *
   * @param data 生成資料
   * @returns 應付款請款單
   */
  autoGeneratePayable(data: GenerateInvoiceData): Promise<Invoice>;

  // ============================================
  // 狀態管理（審核流程）
  // ============================================

  /**
   * 送出請款單（草稿 → 已送出）
   *
   * @param id 請款單 ID
   * @param submittedBy 送出者 ID
   * @returns 更新後的請款單
   */
  submit(id: string, submittedBy: string): Promise<Invoice>;

  /**
   * 核准請款單
   *
   * @param id 請款單 ID
   * @param approvedBy 核准者 ID
   * @param comments 審核意見
   * @returns 更新後的請款單
   */
  approve(id: string, approvedBy: string, comments?: string): Promise<Invoice>;

  /**
   * 退回請款單
   *
   * @param id 請款單 ID
   * @param rejectedBy 退回者 ID
   * @param reason 退回原因
   * @returns 更新後的請款單
   */
  reject(id: string, rejectedBy: string, reason: string): Promise<Invoice>;

  /**
   * 標記為已開票
   *
   * @param id 請款單 ID
   * @param invoiceInfo 開票資訊
   * @returns 更新後的請款單
   */
  markAsInvoiced(id: string, invoiceInfo: InvoiceInfo): Promise<Invoice>;

  /**
   * 標記為已付款
   *
   * @param id 請款單 ID
   * @param paymentInfo 付款資訊
   * @returns 更新後的請款單
   */
  markAsPaid(id: string, paymentInfo: PaymentInfo): Promise<Invoice>;

  /**
   * 標記為部分付款
   *
   * @param id 請款單 ID
   * @param paymentInfo 付款資訊
   * @returns 更新後的請款單
   */
  markAsPartialPaid(id: string, paymentInfo: PaymentInfo): Promise<Invoice>;

  /**
   * 取消請款單
   *
   * @param id 請款單 ID
   * @param cancelledBy 取消者 ID
   * @param reason 取消原因
   * @returns 更新後的請款單
   */
  cancel(id: string, cancelledBy: string, reason: string): Promise<Invoice>;

  // ============================================
  // 查詢
  // ============================================

  /**
   * 取得待審核的請款單（指定審核者）
   *
   * @param blueprintId 藍圖 ID
   * @param userId 審核者 ID
   * @returns 待審核請款單列表
   */
  getPendingApproval(blueprintId: string, userId: string): Promise<Invoice[]>;

  /**
   * 按狀態查詢請款單
   *
   * @param blueprintId 藍圖 ID
   * @param status 狀態
   * @returns 請款單列表
   */
  getByStatus(blueprintId: string, status: InvoiceStatus): Promise<Invoice[]>;

  /**
   * 按日期範圍查詢請款單
   *
   * @param blueprintId 藍圖 ID
   * @param start 開始日期
   * @param end 結束日期
   * @returns 請款單列表
   */
  getByDateRange(blueprintId: string, start: Date, end: Date): Promise<Invoice[]>;

  /**
   * 取得合約相關的請款單
   *
   * @param blueprintId 藍圖 ID
   * @param contractId 合約 ID
   * @returns 請款單列表
   */
  getByContractId(blueprintId: string, contractId: string): Promise<Invoice[]>;

  /**
   * 取得逾期的請款單
   *
   * @param blueprintId 藍圖 ID
   * @returns 逾期請款單列表
   */
  getOverdue(blueprintId: string): Promise<Invoice[]>;

  // ============================================
  // 統計
  // ============================================

  /**
   * 取得請款單摘要統計
   *
   * @param blueprintId 藍圖 ID
   * @returns 摘要統計
   */
  getSummary(blueprintId: string): Promise<InvoiceSummary>;

  /**
   * 計算請款單金額
   *
   * @param invoice 請款單（或部分資料）
   * @returns 計算後的金額資訊
   */
  calculateAmount(invoice: Partial<Invoice>): {
    subtotal: number;
    tax: number;
    total: number;
  };

  // ============================================
  // 工具方法
  // ============================================

  /**
   * 生成請款單號
   *
   * @param blueprintId 藍圖 ID
   * @param type 類型
   * @returns 請款單號
   */
  generateInvoiceNumber(blueprintId: string, type: 'receivable' | 'payable'): Promise<string>;

  /**
   * 檢查狀態轉換是否有效
   *
   * @param currentStatus 當前狀態
   * @param newStatus 目標狀態
   * @returns 是否有效
   */
  isValidStatusTransition(currentStatus: InvoiceStatus, newStatus: InvoiceStatus): boolean;

  /**
   * 取得下一個審核者
   *
   * @param invoice 請款單
   * @returns 下一個審核者 ID 或 null
   */
  getNextApprover(invoice: Invoice): string | null;
}

/**
 * 有效的狀態轉換映射
 *
 * 定義每個狀態可以轉換到的目標狀態
 */
export const VALID_STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['under_review', 'rejected', 'cancelled'],
  under_review: ['approved', 'rejected', 'cancelled'],
  approved: ['invoiced', 'cancelled'],
  rejected: ['draft', 'cancelled'],
  invoiced: ['partial_paid', 'paid', 'cancelled'],
  partial_paid: ['paid', 'cancelled'],
  paid: [], // 終態，不可變更
  cancelled: [] // 終態，不可變更
};

/**
 * 狀態顯示名稱
 */
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: '草稿',
  submitted: '已送出',
  under_review: '審核中',
  approved: '已核准',
  rejected: '已退回',
  invoiced: '已開票',
  partial_paid: '部分付款',
  paid: '已付款',
  cancelled: '已取消'
};

/**
 * 狀態顏色（用於 UI Badge）
 */
export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'default',
  submitted: 'processing',
  under_review: 'processing',
  approved: 'success',
  rejected: 'error',
  invoiced: 'success',
  partial_paid: 'warning',
  paid: 'success',
  cancelled: 'default'
};
