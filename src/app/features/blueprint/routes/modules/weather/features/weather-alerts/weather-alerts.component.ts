/**
 * Weather Alerts Component
 * 氣象警報組件
 */

import { Component, signal, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import type { EarthquakeInfo } from '../../core/models';
import { WeatherApiService } from '../../core/services';

@Component({
  selector: 'app-weather-alerts',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-card nzTitle="地震資訊">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()" nzShowIcon />
      } @else if (earthquakes() && earthquakes().length > 0) {
        <nz-list [nzDataSource]="earthquakes()" nzSize="small">
          <ng-template let-item>
            <nz-list-item>
              <div class="earthquake-item">
                <div class="earthquake-time">{{ formatTime(item.originTime) }}</div>
                <div class="earthquake-info">
                  <span class="magnitude">規模 {{ item.magnitude }}</span>
                  <span class="location">{{ item.epicenterLocation }}</span>
                  <span class="depth">深度 {{ item.depth }}km</span>
                </div>
              </div>
            </nz-list-item>
          </ng-template>
        </nz-list>
      } @else {
        <nz-empty nzNotFoundContent="目前無地震資訊" [nzNotFoundImage]="'simple'" />
      }
    </nz-card>
  `,
  styles: [
    `
      .earthquake-item {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .earthquake-time {
        font-size: 12px;
        color: #8c8c8c;
      }

      .earthquake-info {
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .magnitude {
        font-weight: 600;
        color: #f5222d;
        font-size: 16px;
      }

      .location {
        flex: 1;
        color: #262626;
      }

      .depth {
        font-size: 12px;
        color: #8c8c8c;
      }
    `
  ]
})
export class WeatherAlertsComponent implements OnInit {
  private readonly weatherApi = inject(WeatherApiService);

  /** 地震資料 */
  earthquakes = signal<EarthquakeInfo[]>([]);

  /** 載入狀態 */
  loading = signal(false);

  /** 錯誤訊息 */
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadEarthquakes();
  }

  /**
   * 載入地震資訊
   */
  loadEarthquakes(): void {
    this.loading.set(true);
    this.error.set(null);

    this.weatherApi.getEarthquakeReport(10).subscribe({
      next: data => {
        this.earthquakes.set(data);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.message || '載入地震資訊失敗');
        this.loading.set(false);
      }
    });
  }

  /**
   * 格式化時間
   */
  formatTime(timeString: string): string {
    const date = new Date(timeString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
