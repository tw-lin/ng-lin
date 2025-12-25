import { Injectable, inject, signal } from '@angular/core';
import { take } from 'rxjs/operators';

import type { WeatherForecast } from './core/models';
import { WeatherRepository } from './weather.repository';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly repository = inject(WeatherRepository);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly forecasts = signal<WeatherForecast[]>([]);
  readonly firstForecast = signal<WeatherForecast | null>(null);

  loadForecast(location: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.repository
      .getCityForecast(location)
      .pipe(take(1))
      .subscribe({
        next: data => {
          this.forecasts.set(data);
          this.firstForecast.set(data.length > 0 ? data[0] : null);
          this.loading.set(false);
        },
        error: err => {
          this.error.set(err?.message || '載入天氣資料失敗');
          this.loading.set(false);
        }
      });
  }
}
