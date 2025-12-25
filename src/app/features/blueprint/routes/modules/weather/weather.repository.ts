import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import type { WeatherForecast, EarthquakeInfo } from './core/models';
import { WeatherApiService } from './core/services';

@Injectable({ providedIn: 'root' })
export class WeatherRepository {
  private readonly api = inject(WeatherApiService);

  getCityForecast(locationName: string): Observable<WeatherForecast[]> {
    return this.api.getCityForecast(locationName);
  }

  getEarthquakeReport(limit = 10): Observable<EarthquakeInfo[]> {
    return this.api.getEarthquakeReport(limit);
  }
}
