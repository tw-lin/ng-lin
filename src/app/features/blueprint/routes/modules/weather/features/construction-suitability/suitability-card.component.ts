/**
 * Construction Suitability Card Component
 * 施工適宜度評估組件
 */

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import type { WeatherForecast } from '../../core/models';
import { calculateConstructionSuitability } from '../../shared/utils/calculators';
import { formatSuitabilityLevel, getSuitabilityColor } from '../../shared/utils/formatters';
import { getSuitabilityIcon } from '../../shared/utils/icons';

@Component({
  selector: 'app-suitability-card',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (suitability(); as suit) {
      <nz-card nzTitle="施工適宜度評估">
        <div class="suitability-content">
          <!-- 評分顯示 -->
          <div class="score-display">
            <div class="score-icon">{{ getSuitabilityIcon(suit.level) }}</div>
            <div class="score-value" [style.color]="getSuitabilityColor(suit.level)">
              {{ suit.score }}
            </div>
            <div class="score-label">{{ formatLevel(suit.level) }}</div>
          </div>

          <!-- 評估因素 -->
          <nz-divider nzText="評估因素" />
          <div class="factors-list">
            <div class="factor-item">
              <span class="factor-label">降雨機率:</span>
              <span class="factor-value">{{ suit.factors.rainfall.value }}% ({{ suit.factors.rainfall.description }})</span>
            </div>
            <div class="factor-item">
              <span class="factor-label">溫度:</span>
              <span class="factor-value"
                >{{ suit.factors.temperature.value.toFixed(1) }}°C ({{ suit.factors.temperature.description }})</span
              >
            </div>
            @if (suit.factors.wind.value > 0) {
              <div class="factor-item">
                <span class="factor-label">風速:</span>
                <span class="factor-value">{{ suit.factors.wind.value }}m/s ({{ suit.factors.wind.description }})</span>
              </div>
            }
            <div class="factor-item">
              <span class="factor-label">天氣:</span>
              <span class="factor-value">{{ suit.factors.weather.value }} ({{ suit.factors.weather.description }})</span>
            </div>
          </div>

          <!-- 建議 -->
          @if (suit.recommendations.length > 0) {
            <nz-divider nzText="建議" />
            <nz-alert nzType="info" nzShowIcon [nzMessage]="recommendationsTemplate" />
            <ng-template #recommendationsTemplate>
              <ul class="suggestion-list">
                @for (rec of suit.recommendations; track $index) {
                  <li>{{ rec }}</li>
                }
              </ul>
            </ng-template>
          }

          <!-- 警告 -->
          @if (suit.warnings.length > 0) {
            <nz-divider nzText="警告" />
            <nz-alert nzType="warning" nzShowIcon [nzMessage]="warningsTemplate" />
            <ng-template #warningsTemplate>
              <ul class="suggestion-list">
                @for (warning of suit.warnings; track $index) {
                  <li>{{ warning }}</li>
                }
              </ul>
            </ng-template>
          }
        </div>
      </nz-card>
    } @else {
      <nz-empty nzNotFoundContent="無施工適宜度評估資料" />
    }
  `,
  styles: [
    `
      .suitability-content {
        padding: 8px;
      }

      .score-display {
        text-align: center;
        padding: 24px 0;
      }

      .score-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      .score-value {
        font-size: 48px;
        font-weight: bold;
        line-height: 1;
        margin-bottom: 8px;
      }

      .score-label {
        font-size: 16px;
        color: #8c8c8c;
      }

      .factors-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .factor-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: #fafafa;
        border-radius: 4px;
      }

      .factor-label {
        font-weight: 500;
        color: #595959;
      }

      .factor-value {
        color: #262626;
      }

      .suggestion-list {
        margin: 0;
        padding-left: 20px;

        li {
          margin: 4px 0;
        }
      }
    `
  ]
})
export class SuitabilityCardComponent {
  /** 天氣預報資料 */
  forecast = input<WeatherForecast | null>(null);

  /** 計算施工適宜度 */
  suitability = computed(() => {
    const f = this.forecast();
    return f ? calculateConstructionSuitability(f) : null;
  });

  /** 格式化工具 */
  formatLevel = formatSuitabilityLevel;
  getSuitabilityColor = getSuitabilityColor;
  getSuitabilityIcon = getSuitabilityIcon;
}
