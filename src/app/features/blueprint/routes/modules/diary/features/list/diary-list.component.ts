/**
 * Diary List Component
 * 日誌列表功能元件
 *
 * Main component for diary list feature
 * Orchestrates statistics, filters, and table sub-components
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, input, output } from '@angular/core';
import { STChange } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';

import { Diary } from '../../diary.model';
import { DiaryFiltersComponent } from './components/diary-filters.component';
import { DiaryStatisticsComponent, DiaryStatistics } from './components/diary-statistics.component';
import { DiaryTableComponent } from './components/diary-table.component';

@Component({
  selector: 'app-diary-list',
  standalone: true,
  imports: [SHARED_IMPORTS, DiaryStatisticsComponent, DiaryFiltersComponent, DiaryTableComponent],
  template: `
    <nz-card [nzTitle]="'工地施工日誌'" [nzExtra]="headerExtra">
      <!-- Statistics -->
      <app-diary-statistics [statistics]="statistics()" />

      <!-- Table -->
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()!" nzShowIcon />
      } @else {
        <app-diary-table
          [diaries]="diaries()"
          [loading]="loading()"
          (viewDiary)="viewDiary.emit($event)"
          (editDiary)="editDiary.emit($event)"
          (deleteDiary)="deleteDiary.emit($event)"
          (tableChange)="tableChange.emit($event)"
        />
      }

      <ng-template #headerExtra>
        <app-diary-filters (refresh)="refresh.emit()" (create)="create.emit()" />
      </ng-template>
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class DiaryListComponent {
  // Inputs
  diaries = input.required<Diary[]>();
  statistics = input.required<DiaryStatistics>();
  loading = input<boolean>(false);
  error = input<string | null>(null);

  // Outputs
  create = output<void>();
  refresh = output<void>();
  viewDiary = output<Diary>();
  editDiary = output<Diary>();
  deleteDiary = output<Diary>();
  tableChange = output<STChange>();
}
