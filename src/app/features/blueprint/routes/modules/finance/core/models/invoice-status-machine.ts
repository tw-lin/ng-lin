/**
 * Invoice Status Machine - 請款單狀態機
 *
 * SETC-026: Invoice Approval Workflow
 *
 * 管理請款單狀態轉換規則，確保狀態轉換合法性。
 *
 * 狀態流程:
 * - draft → submitted, cancelled
 * - submitted → under_review, approved, rejected
 * - under_review → approved, rejected
 * - approved → invoiced, cancelled
 * - rejected → draft
 * - invoiced → partial_paid, paid
 * - partial_paid → paid
 * - paid → (終態)
 * - cancelled → (終態)
 *
 * @module InvoiceStatusMachine
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import type { InvoiceStatus } from './invoice.model';

/**
 * 狀態轉換錯誤
 */
export class InvoiceStatusError extends Error {
  constructor(
    message: string,
    public readonly details: {
      from: InvoiceStatus;
      to: InvoiceStatus;
      allowed: InvoiceStatus[];
    }
  ) {
    super(message);
    this.name = 'InvoiceStatusError';
  }
}

/**
 * 狀態轉換規則映射
 */
const STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['under_review', 'approved', 'rejected'],
  under_review: ['approved', 'rejected'],
  approved: ['invoiced', 'cancelled'],
  rejected: ['draft'],
  invoiced: ['partial_paid', 'paid'],
  partial_paid: ['paid'],
  paid: [],
  cancelled: []
};

/**
 * 狀態顯示名稱（繁體中文）
 */
export const STATUS_DISPLAY_NAMES: Record<InvoiceStatus, string> = {
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
 * 請款單狀態機
 *
 * 提供狀態轉換驗證和查詢功能
 */
export class InvoiceStateMachine {
  /**
   * 檢查是否可以從一個狀態轉換到另一個狀態
   *
   * @param from - 當前狀態
   * @param to - 目標狀態
   * @returns 是否可以轉換
   */
  static canTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
    return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /**
   * 取得指定狀態的所有可用轉換
   *
   * @param status - 當前狀態
   * @returns 可轉換的狀態列表
   */
  static getAvailableTransitions(status: InvoiceStatus): InvoiceStatus[] {
    return STATUS_TRANSITIONS[status] ?? [];
  }

  /**
   * 驗證狀態轉換，若無效則拋出錯誤
   *
   * @param from - 當前狀態
   * @param to - 目標狀態
   * @throws InvoiceStatusError 當轉換無效時
   */
  static validateTransition(from: InvoiceStatus, to: InvoiceStatus): void {
    if (!this.canTransition(from, to)) {
      throw new InvoiceStatusError(`Invalid status transition: ${from} → ${to}`, { from, to, allowed: STATUS_TRANSITIONS[from] });
    }
  }

  /**
   * 檢查是否為終態（無法再轉換）
   *
   * @param status - 狀態
   * @returns 是否為終態
   */
  static isTerminalStatus(status: InvoiceStatus): boolean {
    return STATUS_TRANSITIONS[status]?.length === 0;
  }

  /**
   * 檢查是否為待審核狀態
   *
   * @param status - 狀態
   * @returns 是否為待審核狀態
   */
  static isPendingApproval(status: InvoiceStatus): boolean {
    return status === 'submitted' || status === 'under_review';
  }

  /**
   * 檢查是否為可編輯狀態
   *
   * @param status - 狀態
   * @returns 是否可編輯
   */
  static isEditable(status: InvoiceStatus): boolean {
    return status === 'draft' || status === 'rejected';
  }

  /**
   * 取得狀態的顯示名稱
   *
   * @param status - 狀態
   * @returns 顯示名稱
   */
  static getDisplayName(status: InvoiceStatus): string {
    return STATUS_DISPLAY_NAMES[status] ?? status;
  }
}
