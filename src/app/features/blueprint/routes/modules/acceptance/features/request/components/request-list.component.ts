/**
 * Request List Component
 * 驗收申請列表
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';

import { AcceptanceRecord } from '../../../acceptance.model';
import { AcceptanceStatusBadgeComponent } from '../../../shared';

@Component({
  selector: 'app-request-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, AcceptanceStatusBadgeComponent],
  template: `
    <nz-card nzTitle="驗收申請列表">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else {
        <st [data]="requests()" [columns]="columns" />
      }
    </nz-card>

    <!-- Hidden template for status badge rendering -->
    <ng-template #statusBadge let-record>
      <app-acceptance-status-badge [status]="record.status" />
    </ng-template>
  `,
  styles: []
})
export class RequestListComponent {
  requests = input.required<AcceptanceRecord[]>();
  loading = input<boolean>(false);

  view = output<AcceptanceRecord>();
  edit = output<AcceptanceRecord>();
  delete = output<AcceptanceRecord>();

  columns: STColumn[] = [
    { title: '申請項目', index: 'title', width: '30%' },
    {
      title: '狀態',
      index: 'status',
      width: '120px',
      render: 'statusBadge',
      renderTitle: 'statusBadgeTitle'
    },
    { title: '申請人', index: 'createdBy', width: '120px' },
    { title: '申請時間', index: 'createdAt', type: 'date', width: '180px' },
    {
      title: '操作',
      width: 200,
      buttons: [
        {
          text: '查看',
          click: record => this.view.emit(record as AcceptanceRecord)
        },
        {
          text: '編輯',
          click: record => this.edit.emit(record as AcceptanceRecord)
        },
        {
          text: '刪除',
          pop: true,
          popTitle: '確定要刪除此申請嗎？',
          click: record => this.delete.emit(record as AcceptanceRecord)
        }
      ]
    }
  ];
}
