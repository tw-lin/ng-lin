/**
 * QA Statistics Component
 * 品質統計元件 - 顯示品質管理統計資訊
 *
 * Features:
 * - Display inspection statistics
 * - Show pass rate metrics
 * - Display open issues count
 *
 * Part of QA Module - Feature-based architecture
 * ✅ High Cohesion: Focused on QA statistics display
 * ✅ Low Coupling: Communicates via clear interfaces
 *
 * @module QaStatsComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input, signal, inject, OnInit, effect } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

import { QaStatistics } from '../../qa.model';
import { QaService } from '../../qa.service';

@Component({
  selector: 'app-qa-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule],
  template: `
    <nz-card nzTitle="品質管理" [nzExtra]="extra" class="mb-md">
      <ng-template #extra>
        <button nz-button nzType="link" (click)="refresh()">
          <span nz-icon nzType="reload"></span>
        </button>
      </ng-template>

      <nz-row [nzGutter]="[16, 16]">
        <nz-col [nzXs]="12" [nzSm]="8">
          <nz-card nzSize="small" [nzHoverable]="true">
            <nz-statistic [nzValue]="stats().inspections" nzTitle="品質檢驗" [nzValueStyle]="{ color: '#1890ff' }">
              <ng-template #nzPrefix>
                <span nz-icon nzType="file-search"></span>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="12" [nzSm]="8">
          <nz-card nzSize="small" [nzHoverable]="true">
            <nz-statistic
              [nzValue]="stats().passRate"
              nzTitle="合格率"
              nzSuffix="%"
              [nzValueStyle]="{ color: stats().passRate >= 95 ? '#52c41a' : '#faad14' }"
            >
              <ng-template #nzPrefix>
                <span nz-icon nzType="check-circle"></span>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="24" [nzSm]="8">
          <nz-card nzSize="small" [nzHoverable]="true">
            <nz-statistic
              [nzValue]="stats().openIssues"
              nzTitle="待處理問題"
              [nzValueStyle]="{ color: stats().openIssues > 0 ? '#faad14' : '#52c41a' }"
            >
              <ng-template #nzPrefix>
                <span nz-icon nzType="exclamation-circle"></span>
              </ng-template>
            </nz-statistic>
          </nz-card>
        </nz-col>
      </nz-row>
    </nz-card>
  `,
  styles: [
    `
      .mb-md {
        margin-bottom: 16px;
      }
    `
  ]
})
export class QaStatsComponent implements OnInit {
  blueprintId = input.required<string>();
  private readonly qaService = inject(QaService);

  // State
  stats = signal<QaStatistics>({
    inspections: 0,
    passRate: 0,
    openIssues: 0
  });

  ngOnInit(): void {
    effect(() => {
      const id = this.blueprintId();
      if (id) {
        this.loadStatistics(id);
      }
    });
  }

  /** Load statistics data */
  private async loadStatistics(blueprintId: string): Promise<void> {
    const result = await this.qaService.getStatistics(blueprintId);
    this.stats.set(result);
  }

  /** Refresh statistics */
  refresh(): void {
    this.loadStatistics(this.blueprintId());
  }
}
