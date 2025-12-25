import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { ErrorTrackingService } from '@core/services/error-tracking.service';
import { PerformanceMonitoringService } from '@core/services/performance-monitoring.service';
import { SHARED_IMPORTS } from '@shared';

/**
 * Monitoring Dashboard Component
 * 監控儀表板元件
 */
@Component({
  selector: 'app-monitoring-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <page-header [title]="'系統監控儀表板'">
      <ng-template #action>
        <button nz-button (click)="refreshData()">
          <span nz-icon nzType="reload"></span>
          重新整理
        </button>
      </ng-template>
    </page-header>

    <nz-card nzTitle="效能指標" class="mb-md">
      <p>效能監控資訊</p>
    </nz-card>

    <nz-card nzTitle="錯誤追蹤">
      <p>錯誤追蹤資訊</p>
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mb-md {
        margin-bottom: 16px;
      }
    `
  ]
})
export class MonitoringDashboardComponent implements OnInit {
  readonly performanceMonitoring = inject(PerformanceMonitoringService);
  readonly errorTracking = inject(ErrorTrackingService);

  ngOnInit(): void {
    if (!this.performanceMonitoring.isMonitoring()) {
      this.performanceMonitoring.startMonitoring();
    }
    if (!this.errorTracking.isTracking()) {
      this.errorTracking.startTracking();
    }
  }

  refreshData(): void {
    console.log('Data refreshed');
  }
}
