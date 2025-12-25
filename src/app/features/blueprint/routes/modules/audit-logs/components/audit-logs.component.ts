/**
 * Audit Logs Component
 *
 * UI component for displaying and filtering audit logs.
 * Part of the Audit Logs module implementation.
 *
 * @author GigHub Development Team
 * @date 2025-12-13
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpaceModule } from 'ng-zorro-antd/space';

import { AuditLogDocument, AuditCategory } from '../models/audit-log.model';
import { AuditLogsService } from '../services/audit-logs.service';

/**
 * Audit Logs Component
 *
 * Displays audit logs for a blueprint with filtering capabilities.
 *
 * Features:
 * - Display audit logs in table format
 * - Filter by category and resource type
 * - Real-time updates via service
 * - Responsive design
 *
 * Following Occam's Razor: Simple, read-only audit viewer
 * ✅ Modernized with Signal-based state management
 * ✅ Service layer for business logic
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-audit-logs',
  standalone: true,
  imports: [SHARED_IMPORTS, NzSpaceModule, NzEmptyModule],
  template: `
    <!-- Filters -->
    <div class="mb-md" style="display: flex; gap: 8px;">
      <nz-select [(ngModel)]="filterCategory" (ngModelChange)="onFilterChange()" nzPlaceHolder="類別" style="width: 150px" nzAllowClear>
        <nz-option nzLabel="藍圖" nzValue="blueprint"></nz-option>
        <nz-option nzLabel="成員" nzValue="member"></nz-option>
        <nz-option nzLabel="安全性" nzValue="security"></nz-option>
        <nz-option nzLabel="資料" nzValue="data"></nz-option>
        <nz-option nzLabel="系統" nzValue="system"></nz-option>
      </nz-select>

      <nz-select
        [(ngModel)]="filterResourceType"
        (ngModelChange)="onFilterChange()"
        nzPlaceHolder="資源類型"
        style="width: 150px"
        nzAllowClear
      >
        <nz-option nzLabel="藍圖" nzValue="blueprint"></nz-option>
        <nz-option nzLabel="成員" nzValue="member"></nz-option>
        <nz-option nzLabel="任務" nzValue="task"></nz-option>
        <nz-option nzLabel="日誌" nzValue="log"></nz-option>
        <nz-option nzLabel="品質" nzValue="quality"></nz-option>
        <nz-option nzLabel="模組" nzValue="module"></nz-option>
      </nz-select>

      <button nz-button (click)="refresh()">
        <span nz-icon nzType="reload"></span>
        重新整理
      </button>
    </div>

    <!-- Table -->
    @if (auditService.loading()) {
      <nz-spin nzSimple></nz-spin>
    } @else if (auditService.error()) {
      <nz-alert
        nzType="error"
        nzShowIcon
        [nzMessage]="'載入失敗'"
        [nzDescription]="auditService.error()?.message || '無法載入審計記錄'"
        class="mb-md"
      />
    } @else if (!auditService.hasLogs()) {
      <nz-empty nzNotFoundContent="暫無審計記錄"></nz-empty>
    } @else {
      <st #st [data]="auditService.logs()" [columns]="columns" [page]="{ show: true, showSize: true }"></st>
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
export class AuditLogsComponent implements OnInit {
  private readonly message = inject(NzMessageService);
  // Inject the audit logs service
  readonly auditService = inject(AuditLogsService);

  // Input: blueprint ID
  blueprintId = input.required<string>();

  // Filter state
  filterCategory: AuditCategory | null = null;
  filterResourceType: string | null = null;

  // Table columns
  columns: STColumn[] = [
    {
      title: '時間',
      index: 'timestamp',
      type: 'date',
      width: '180px',
      dateFormat: 'yyyy-MM-dd HH:mm:ss'
    },
    {
      title: '事件類型',
      index: 'eventType',
      width: '150px'
    },
    {
      title: '操作',
      index: 'action',
      width: '200px'
    },
    {
      title: '使用者',
      index: 'actorId',
      width: '150px'
    },
    {
      title: '資源類型',
      index: 'resourceType',
      width: '120px'
    },
    {
      title: '資源 ID',
      index: 'resourceId',
      width: '200px'
    },
    {
      title: '詳情',
      width: '100px',
      buttons: [
        {
          text: '檢視',
          type: 'link',
          click: (record: unknown) => this.viewDetails(record as AuditLogDocument)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadLogs();
  }

  /**
   * Load audit logs
   */
  private async loadLogs(): Promise<void> {
    const options = {
      ...(this.filterCategory && { category: this.filterCategory }),
      ...(this.filterResourceType && { resourceType: this.filterResourceType }),
      limit: 100
    };

    try {
      await this.auditService.loadLogs(this.blueprintId(), options);
    } catch (error) {
      this.message.error('載入審計記錄失敗');
    }
  }

  /**
   * Handle filter change
   */
  onFilterChange(): void {
    this.loadLogs();
  }

  /**
   * Refresh logs
   */
  refresh(): void {
    this.loadLogs();
  }

  /**
   * View audit log details
   */
  viewDetails(record: AuditLogDocument): void {
    const log = record;

    // Show details in console (can be enhanced with modal/drawer later)
    console.log('Audit Log Details:', log);
    this.message.info('詳情已輸出到控制台');
  }
}
