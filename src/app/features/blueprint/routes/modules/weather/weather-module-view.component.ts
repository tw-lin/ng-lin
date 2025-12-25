/**
 * Weather Module View Component
 * 氣象模組主協調器
 */

import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import type { WeatherForecast } from './core/models';
import { SuitabilityCardComponent } from './features/construction-suitability';
import { ForecastDisplayComponent } from './features/forecast-display';
import { LocationSelectorComponent } from './features/location-selector';
import { WeatherAlertsComponent } from './features/weather-alerts';
import { WeatherService } from './weather.service';

@Component({
  selector: 'app-weather-module-view',
  standalone: true,
  imports: [SHARED_IMPORTS, LocationSelectorComponent, ForecastDisplayComponent, SuitabilityCardComponent, WeatherAlertsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="weather-module">
      <!-- 標題與地點選擇 -->
      <div class="weather-header">
        <h2 class="weather-title">
          <span nz-icon nzType="cloud" nzTheme="outline"></span>
          氣象資訊
        </h2>
        <div class="weather-selector">
          <app-location-selector [selectedLocation]="selectedLocation()" (locationChange)="onLocationChange($event)" />
          <button nz-button nzType="primary" [nzLoading]="loading()" (click)="loadWeather()">
            <span nz-icon nzType="reload" nzTheme="outline"></span>
            重新載入
          </button>
        </div>
      </div>

      <!-- 載入或錯誤狀態 -->
      @if (loading()) {
        <nz-spin nzSimple nzTip="載入天氣資料中..." />
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()" nzShowIcon nzCloseable (nzOnClose)="error.set(null)" />
      }

      <!-- 天氣資料顯示 -->
      @if (weatherData() && weatherData().length > 0) {
        <div class="weather-content">
          <div class="weather-main">
            <!-- 天氣預報 -->
            <app-forecast-display [forecasts]="weatherData()" />

            <!-- 施工適宜度評估 -->
            <app-suitability-card [forecast]="firstForecast()" />
          </div>

          <div class="weather-side">
            <!-- 地震資訊 -->
            <app-weather-alerts />
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .weather-module {
        padding: 24px;
      }

      .weather-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .weather-title {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;

        [nz-icon] {
          font-size: 28px;
          color: #1890ff;
        }
      }

      .weather-selector {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .weather-content {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 24px;

        @media (max-width: 992px) {
          grid-template-columns: 1fr;
        }
      }

      .weather-main {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .weather-side {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
    `
  ]
})
export class WeatherModuleViewComponent {
  private readonly weatherService = inject(WeatherService);

  /** 選中的地點 */
  selectedLocation = signal<string>('臺北市');

  /** 天氣預報資料 */
  weatherData = this.weatherService.forecasts;
  loading = this.weatherService.loading;
  error = this.weatherService.error;
  firstForecast = this.weatherService.firstForecast;

  /**
   * 處理地點變更
   */
  onLocationChange(location: string): void {
    this.selectedLocation.set(location);
    this.loadWeather();
  }

  /**
   * 載入天氣資料
   */
  loadWeather(): void {
    this.weatherService.loadForecast(this.selectedLocation());
  }
}
