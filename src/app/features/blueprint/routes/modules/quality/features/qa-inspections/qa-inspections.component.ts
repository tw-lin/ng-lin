/**
 * QA Inspections Component
 * 品質檢驗列表元件 - 顯示和管理品質檢驗記錄
 *
 * Features:
 * - Display inspections list with table
 * - Add new inspection
 * - View inspection details
 *
 * Part of QA Module - Feature-based architecture
 * ✅ High Cohesion: Focused on inspection list display and management
 * ✅ Low Coupling: Communicates via clear interfaces
 *
 * @module QaInspectionsComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input, signal, inject, OnInit, effect } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';

import { QaInspection } from '../../qa.model';
import { QaService } from '../../qa.service';

@Component({
  selector: 'app-qa-inspections',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzEmptyModule],
  template: `
    <div class="mb-md" style="display: flex; justify-content: space-between; align-items: center;">
      <span style="color: #666;">記錄品質檢驗結果</span>
      <button nz-button nzType="primary" (click)="addInspection()">
        <span nz-icon nzType="plus"></span>
        新增檢驗
      </button>
    </div>

    @if (loading()) {
      <div style="text-align: center; padding: 24px;">
        <nz-spin nzSimple></nz-spin>
      </div>
    } @else if (inspections().length === 0) {
      <nz-empty nzNotFoundContent="暫無品質檢驗記錄"></nz-empty>
    } @else {
      <st [data]="inspections()" [columns]="columns" />
    }
  `,
  styles: [
    `
      .mb-md {
        margin-bottom: 16px;
      }
    `
  ]
})
export class QaInspectionsComponent implements OnInit {
  private readonly message = inject(NzMessageService);
  private readonly qaService = inject(QaService);

  blueprintId = input.required<string>();

  // State
  loading = signal(false);
  inspections = signal<QaInspection[]>([]);

  // Table columns
  columns: STColumn[] = [
    { title: '檢驗項目', index: 'item', width: 200 },
    { title: '檢驗人', index: 'inspector', width: 120 },
    {
      title: '結果',
      index: 'result',
      width: 100,
      type: 'badge',
      badge: {
        pass: { text: '合格', color: 'success' },
        fail: { text: '不合格', color: 'error' },
        pending: { text: '待確認', color: 'warning' }
      }
    },
    { title: '時間', index: 'inspectedAt', type: 'date', dateFormat: 'yyyy-MM-dd HH:mm', width: 150 },
    {
      title: '操作',
      width: 120,
      buttons: [
        {
          text: '查看',
          click: (record: QaInspection) => this.viewInspection(record)
        }
      ]
    }
  ];

  ngOnInit(): void {
    effect(() => {
      const id = this.blueprintId();
      if (id) {
        this.loadInspections(id);
      }
    });
  }

  /** Load inspections data */
  private async loadInspections(blueprintId: string): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.qaService.listInspections(blueprintId);
      this.inspections.set(data);
    } catch (error) {
      this.message.error('載入品質檢驗失敗');
    } finally {
      this.loading.set(false);
    }
  }

  /** Add new inspection */
  addInspection(): void {
    this.message.info('新增品質檢驗功能開發中');
  }

  /** View inspection details */
  viewInspection(inspection: QaInspection): void {
    this.message.info(`查看檢驗：${inspection.item}`);
  }
}
