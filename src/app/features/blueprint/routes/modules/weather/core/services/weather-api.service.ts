/**
 * Weather API Service
 * 中央氣象署 API 服務
 */

import { HttpClient, HttpParams, HttpErrorResponse, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ALLOW_ANONYMOUS } from '@delon/auth';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, retry, timeout, tap } from 'rxjs/operators';

import { CacheService } from './cache.service';
import { CWA_API_CONFIG, CACHE_TTL } from '../config';
import type { CwaApiResponse, WeatherForecast, EarthquakeInfo } from '../models';

@Injectable({ providedIn: 'root' })
export class WeatherApiService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(CacheService);
  private readonly anonymousContext = new HttpContext().set(ALLOW_ANONYMOUS, true);

  /**
   * 取得縣市天氣預報
   */
  getCityForecast(locationName: string): Observable<WeatherForecast[]> {
    const cacheKey = `forecast_${locationName}`;

    // 檢查快取
    const cached = this.cache.get<WeatherForecast[]>(cacheKey);
    if (cached) {
      console.log('[WeatherApi] Cache hit:', cacheKey);
      return of(cached);
    }

    // 檢查 API Key
    if (!CWA_API_CONFIG.apiKey) {
      return throwError(() => new Error('未設定 CWA API Key，請在環境變數中設定'));
    }

    // 呼叫 CWA API - Authorization 參數必須在 URL 中
    const params = new HttpParams().set('Authorization', CWA_API_CONFIG.apiKey).set('locationName', locationName);

    const url = `${CWA_API_CONFIG.baseUrl}/${CWA_API_CONFIG.datasets.cityForecast}`;

    console.log('[WeatherApi] Fetching forecast for:', locationName, 'URL:', url);

    return this.http.get<CwaApiResponse>(url, { params, context: this.anonymousContext }).pipe(
      timeout(CWA_API_CONFIG.timeout),
      retry(CWA_API_CONFIG.retryAttempts),
      map(response => this.transformToWeatherForecast(response)),
      tap(data => {
        this.cache.set(cacheKey, data, CACHE_TTL.forecast);
        console.log('[WeatherApi] Data cached:', cacheKey);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * 取得地震報告
   */
  getEarthquakeReport(limit = 10): Observable<EarthquakeInfo[]> {
    const cacheKey = `earthquake_${limit}`;

    // 檢查快取
    const cached = this.cache.get<EarthquakeInfo[]>(cacheKey);
    if (cached) {
      console.log('[WeatherApi] Cache hit:', cacheKey);
      return of(cached);
    }

    // 檢查 API Key
    if (!CWA_API_CONFIG.apiKey) {
      return throwError(() => new Error('未設定 CWA API Key，請在環境變數中設定'));
    }

    // 呼叫 CWA API
    const params = new HttpParams().set('Authorization', CWA_API_CONFIG.apiKey).set('limit', limit.toString());

    const url = `${CWA_API_CONFIG.baseUrl}/${CWA_API_CONFIG.datasets.earthquakeReport}`;

    console.log('[WeatherApi] Fetching earthquake report, limit:', limit);

    return this.http.get<CwaApiResponse>(url, { params, context: this.anonymousContext }).pipe(
      timeout(CWA_API_CONFIG.timeout),
      retry(CWA_API_CONFIG.retryAttempts),
      map(response => this.transformToEarthquakeInfo(response)),
      tap(data => {
        this.cache.set(cacheKey, data, CACHE_TTL.earthquake);
        console.log('[WeatherApi] Data cached:', cacheKey);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * 轉換 API 回應為天氣預報模型
   */
  private transformToWeatherForecast(response: CwaApiResponse): WeatherForecast[] {
    const forecasts: WeatherForecast[] = [];

    if (!response.records?.location) {
      return forecasts;
    }

    response.records.location.forEach(location => {
      const wxElement = location.weatherElement.find(el => el.elementName === 'Wx');
      const minTElement = location.weatherElement.find(el => el.elementName === 'MinT');
      const maxTElement = location.weatherElement.find(el => el.elementName === 'MaxT');
      const popElement = location.weatherElement.find(el => el.elementName === 'PoP' || el.elementName === 'PoP12h');

      if (wxElement && wxElement.time.length > 0) {
        wxElement.time.forEach((timeData, index) => {
          const minT = minTElement?.time[index];
          const maxT = maxTElement?.time[index];
          const pop = popElement?.time[index];

          forecasts.push({
            locationName: location.locationName,
            startTime: timeData.startTime,
            endTime: timeData.endTime,
            weatherDescription: timeData.parameter.parameterName,
            weatherCode: timeData.parameter.parameterValue,
            temperature: {
              min: minT ? parseInt(minT.parameter.parameterName, 10) : 0,
              max: maxT ? parseInt(maxT.parameter.parameterName, 10) : 0,
              unit: minT?.parameter.parameterUnit || 'C'
            },
            rainProbability: pop ? parseInt(pop.parameter.parameterName, 10) : 0
          });
        });
      }
    });

    return forecasts;
  }

  /**
   * 轉換 API 回應為地震資訊模型
   */
  private transformToEarthquakeInfo(response: CwaApiResponse): EarthquakeInfo[] {
    // 簡化實作，實際需根據 API 回應結構調整
    return [];
  }

  /**
   * 錯誤處理
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = '發生未知錯誤';

    if (error.error instanceof ErrorEvent) {
      // 客戶端或網路錯誤
      errorMessage = `網路錯誤: ${error.error.message}`;
    } else {
      // 後端回傳錯誤
      switch (error.status) {
        case 400:
          errorMessage = '請求參數錯誤';
          break;
        case 401:
          errorMessage = 'API 授權失敗，請檢查 API Key';
          break;
        case 403:
          errorMessage = '無權限存取此資料集';
          break;
        case 404:
          errorMessage = '找不到指定的資料集';
          break;
        case 429:
          errorMessage = '請求過於頻繁，請稍後再試';
          break;
        case 500:
        case 503:
          errorMessage = '氣象署服務暫時無法使用';
          break;
        default:
          errorMessage = `HTTP 錯誤: ${error.status}`;
      }
    }

    console.error('[WeatherApi] Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
