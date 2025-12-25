/**
 * Issue List Component
 * 問題列表元件
 *
 * Purpose: Display issues in a table with actions
 * Features: ST table, filtering, sorting, action buttons
 *
 * Architecture: Feature Component (High Cohesion)
 * - Receives issues array via input signal
 * - Emits events for user actions (view, edit, delete)
 * - Self-contained table configuration
 */

import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { STColumn, STChange } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import { IssueLifecycleService } from '../../issue-lifecycle.service';
import type { Issue } from '../../issues.model';

@Component({
  selector: 'app-issue-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzEmptyModule],
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else if (issues().length === 0) {
      <nz-empty nzNotFoundContent="暫無問題記錄">
        <ng-template #nzNotFoundFooter>
          <button nz-button nzType="primary" (click)="emptyStateCreate.emit()">
            <span nz-icon nzType="plus"></span>
            新增第一筆問題
          </button>
        </ng-template>
      </nz-empty>
    } @else {
      <st
        [data]="issues()"
        [columns]="columns"
        [loading]="loading()"
        [page]="{ front: true, show: true }"
        (change)="handleTableChange($event)"
      />
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class IssueListComponent {
  private readonly lifecycleService = inject(IssueLifecycleService);

  /**
   * Input signals
   */
  issues = input.required<Issue[]>();
  loading = input<boolean>(false);

  /**
   * Output events
   */
  issueView = output<Issue>();
  issueEdit = output<Issue>();
  issueDelete = output<Issue>();
  emptyStateCreate = output<void>();

  /**
   * Table columns configuration
   */
  columns: STColumn[] = [
    { title: '編號', index: 'issueNumber', width: 120 },
    { title: '標題', index: 'title' },
    {
      title: '來源',
      index: 'source',
      width: 100,
      type: 'tag',
      tag: {
        manual: { text: '手動', color: 'default' },
        acceptance: { text: '驗收', color: 'blue' },
        qc: { text: 'QC', color: 'cyan' },
        warranty: { text: '保固', color: 'orange' },
        safety: { text: '安全', color: 'red' }
      }
    },
    {
      title: '嚴重度',
      index: 'severity',
      width: 100,
      type: 'tag',
      tag: {
        critical: { text: '嚴重', color: 'error' },
        major: { text: '重要', color: 'warning' },
        minor: { text: '輕微', color: 'default' }
      }
    },
    {
      title: '狀態',
      index: 'status',
      width: 100,
      type: 'badge',
      badge: {
        open: { text: '待處理', color: 'warning' },
        in_progress: { text: '處理中', color: 'processing' },
        resolved: { text: '已解決', color: 'success' },
        verified: { text: '已驗證', color: 'success' },
        closed: { text: '已關閉', color: 'default' }
      }
    },
    { title: '位置', index: 'location', width: 150 },
    { title: '建立時間', index: 'createdAt', type: 'date', width: 150 },
    {
      title: '操作',
      width: 180,
      buttons: [
        {
          text: '查看',
          icon: 'eye',
          click: record => this.issueView.emit(record as Issue)
        },
        {
          text: '編輯',
          icon: 'edit',
          iif: record => this.lifecycleService.canEdit(record as Issue),
          click: record => this.issueEdit.emit(record as Issue)
        },
        {
          text: '刪除',
          icon: 'delete',
          type: 'del',
          pop: {
            title: '確定要刪除此問題嗎？',
            okType: 'danger'
          },
          iif: record => this.lifecycleService.canDelete(record as Issue),
          click: record => this.issueDelete.emit(record as Issue)
        }
      ]
    }
  ];

  /**
   * Handle table change events
   */
  handleTableChange(event: STChange): void {
    if (event.type === 'click') {
      // Handle row click if needed
    }
  }
}
