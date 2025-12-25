import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

import { LogService } from './log.service';

@Component({
  selector: 'app-log-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule],
  template: `
    <nz-card nzTitle="日誌統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="logService.activityLogs().length" nzTitle="活動記錄" [nzPrefix]="activityIcon" />
          <ng-template #activityIcon>
            <span nz-icon nzType="file-text" style="color: #1890ff;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="logService.systemEvents().length" nzTitle="系統事件" [nzPrefix]="eventIcon" />
          <ng-template #eventIcon>
            <span nz-icon nzType="notification" style="color: #52c41a;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="logService.comments().length" nzTitle="評論" [nzPrefix]="commentIcon" />
          <ng-template #commentIcon>
            <span nz-icon nzType="message" style="color: #faad14;"></span>
          </ng-template>
        </nz-col>
        <nz-col [nzSpan]="6">
          <nz-statistic [nzValue]="logService.attachments().length" nzTitle="附件" [nzPrefix]="attachmentIcon" />
          <ng-template #attachmentIcon>
            <span nz-icon nzType="paper-clip" style="color: #722ed1;"></span>
          </ng-template>
        </nz-col>
      </nz-row>
    </nz-card>

    <nz-card>
      @if (logService.loading()) {
        <nz-spin nzSimple />
      } @else if (logService.error()) {
        <nz-alert nzType="error" nzShowIcon [nzMessage]="logService.error()!.message" />
      } @else {
        <nz-tabset>
          <nz-tab nzTitle="活動記錄">
            @if (logService.activityLogs().length === 0) {
              <nz-empty nzNotFoundContent="暫無活動記錄" />
            } @else {
              <st [data]="logService.activityLogs()" [columns]="activityColumns" />
            }
          </nz-tab>
          <nz-tab nzTitle="系統事件">
            @if (logService.systemEvents().length === 0) {
              <nz-empty nzNotFoundContent="暫無系統事件" />
            } @else {
              <st [data]="logService.systemEvents()" [columns]="eventColumns" />
            }
          </nz-tab>
          <nz-tab nzTitle="評論">
            @if (logService.comments().length === 0) {
              <nz-empty nzNotFoundContent="暫無評論" />
            } @else {
              <st [data]="logService.comments()" [columns]="commentColumns" />
            }
          </nz-tab>
          <nz-tab nzTitle="附件">
            @if (logService.attachments().length === 0) {
              <nz-empty nzNotFoundContent="暫無附件" />
            } @else {
              <st [data]="logService.attachments()" [columns]="attachmentColumns" />
            }
          </nz-tab>
          <nz-tab nzTitle="變更歷史">
            @if (logService.changeHistory().length === 0) {
              <nz-empty nzNotFoundContent="暫無變更歷史" />
            } @else {
              <st [data]="logService.changeHistory()" [columns]="changeHistoryColumns" />
            }
          </nz-tab>
        </nz-tabset>
      }
    </nz-card>
  `
})
export class LogModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();
  readonly logService = inject(LogService);

  activityColumns: STColumn[] = [
    { title: '時間', index: 'timestamp', type: 'date', width: '180px' },
    { title: '操作', index: 'action', width: '150px' },
    { title: '使用者', index: 'userId', width: '150px' },
    { title: '資源', index: 'resourceType', width: '120px' }
  ];

  eventColumns: STColumn[] = [
    { title: '時間', index: 'timestamp', type: 'date', width: '180px' },
    { title: '事件類型', index: 'eventType', width: '150px' },
    { title: '嚴重程度', index: 'severity', width: '100px' }
  ];

  commentColumns: STColumn[] = [
    { title: '時間', index: 'createdAt', type: 'date', width: '180px' },
    { title: '作者', index: 'author', width: '150px' },
    { title: '內容', index: 'content' }
  ];

  attachmentColumns: STColumn[] = [
    { title: '檔名', index: 'fileName' },
    { title: '類型', index: 'fileType', width: '120px' },
    { title: '大小', index: 'fileSize', width: '100px' },
    { title: '上傳時間', index: 'uploadedAt', type: 'date', width: '180px' }
  ];

  changeHistoryColumns: STColumn[] = [
    { title: '時間', index: 'timestamp', type: 'date', width: '180px' },
    { title: '變更類型', index: 'changeType', width: '120px' },
    { title: '欄位', index: 'field', width: '150px' },
    { title: '操作者', index: 'userId', width: '150px' }
  ];

  ngOnInit(): void {
    this.logService.loadAll(this.blueprintId());
  }
}
