/**
 * Approval Dialog Component - 審核對話框
 *
 * SETC-030: Invoice/Payment UI Components
 *
 * 提供請款/付款單審核操作介面：
 * - 顯示單據資訊
 * - 核准/退回選擇
 * - 審核意見輸入
 *
 * @module ApprovalDialogComponent
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

import type { Invoice } from '../../core/models';

/**
 * 審核對話框輸入資料
 */
export interface ApprovalDialogData {
  invoice: Invoice;
}

/**
 * 審核對話框元件
 */
@Component({
  selector: 'app-approval-dialog',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './approval-dialog.component.html'
})
export class ApprovalDialogComponent {
  private readonly modalRef = inject(NzModalRef);
  private readonly message = inject(NzMessageService);

  /** 輸入資料 */
  readonly data: ApprovalDialogData = inject(NZ_MODAL_DATA);

  /** 審核結果 */
  approvalResult: 'approve' | 'reject' = 'approve';

  /** 審核意見 */
  comments = '';

  /** 提交中狀態 */
  submitting = signal(false);

  /** 狀態顏色對應 */
  private statusColors: Record<string, string> = {
    draft: 'default',
    submitted: 'processing',
    under_review: 'warning',
    approved: 'success',
    rejected: 'error',
    invoiced: 'cyan',
    partial_paid: 'orange',
    paid: 'green',
    cancelled: 'default'
  };

  /** 狀態標籤對應 */
  private statusLabels: Record<string, string> = {
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

  /** 取得狀態顏色 */
  getStatusColor(status: string): string {
    return this.statusColors[status] ?? 'default';
  }

  /** 取得狀態標籤 */
  getStatusLabel(status: string): string {
    return this.statusLabels[status] ?? status;
  }

  /** 是否可提交 */
  canSubmit(): boolean {
    if (this.approvalResult === 'reject' && !this.comments.trim()) {
      return false;
    }
    return true;
  }

  /** 取消 */
  cancel(): void {
    this.modalRef.close(false);
  }

  /** 確認審核 */
  async confirm(): Promise<void> {
    if (!this.canSubmit()) {
      this.message.warning('退回時必須填寫原因');
      return;
    }

    this.submitting.set(true);

    try {
      // MVP: 模擬 API 呼叫
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (this.approvalResult === 'approve') {
        this.message.success('審核通過');
      } else {
        this.message.success('已退回');
      }

      this.modalRef.close({
        result: this.approvalResult,
        comments: this.comments
      });
    } catch (error) {
      this.message.error('操作失敗，請稍後再試');
    } finally {
      this.submitting.set(false);
    }
  }
}
