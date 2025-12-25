/**
 * Forecast Display Component
 * 天氣預報顯示組件
 */

import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import type { WeatherForecast } from '../../core/models';
import { formatTemperatureRange, formatRainProbability, formatDate } from '../../shared/utils/formatters';
import { getWeatherIcon } from '../../shared/utils/icons';

@Component({
  selector: 'app-forecast-display',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="forecast-container">
      @if (forecasts() && forecasts().length > 0) {
        <nz-card nzTitle="天氣預報">
          <div class="forecast-grid">
            @for (forecast of forecasts(); track forecast.startTime) {
              <div class="forecast-item">
                <div class="forecast-date">{{ formatDate(forecast.startTime) }}</div>
                <div class="forecast-icon">{{ getWeatherIcon(forecast.weatherCode) }}</div>
                <div class="forecast-desc">{{ forecast.weatherDescription }}</div>
                <div class="forecast-temp">{{ formatTempRange(forecast.temperature.min, forecast.temperature.max) }}</div>
                <div class="forecast-rain">
                  <span nz-icon nzType="cloud" nzTheme="outline"></span>
                  {{ formatRainProb(forecast.rainProbability) }}
                </div>
              </div>
            }
          </div>
        </nz-card>
      } @else {
        <nz-empty nzNotFoundContent="無天氣預報資料" />
      }
    </div>
  `,
  styles: [
    `
      .forecast-container {
        width: 100%;
      }

      .forecast-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 16px;
      }

      .forecast-item {
        padding: 12px;
        border: 1px solid #f0f0f0;
        border-radius: 4px;
        text-align: center;
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
        }
      }

      .forecast-date {
        font-size: 12px;
        color: #8c8c8c;
        margin-bottom: 8px;
      }

      .forecast-icon {
        font-size: 32px;
        margin: 8px 0;
      }

      .forecast-desc {
        font-size: 14px;
        margin: 8px 0;
        color: #595959;
      }

      .forecast-temp {
        font-size: 16px;
        font-weight: 500;
        color: #262626;
        margin: 8px 0;
      }

      .forecast-rain {
        font-size: 12px;
        color: #1890ff;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
      }
    `
  ]
})
export class ForecastDisplayComponent {
  /** 天氣預報資料 */
  forecasts = input<WeatherForecast[]>([]);

  /** 格式化工具 */
  formatDate = formatDate;
  formatRainProb = formatRainProbability;
  getWeatherIcon = getWeatherIcon;

  /**
   * 格式化溫度範圍
   */
  formatTempRange(min: number, max: number): string {
    return formatTemperatureRange(min, max);
  }
}
