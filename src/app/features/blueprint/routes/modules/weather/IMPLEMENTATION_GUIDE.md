# 氣象模組實施指南 (Weather Module Implementation Guide)

> 本指南提供詳細的實施步驟與程式碼範例，協助開發者快速實作**完全自主的氣象模組**。

## 📋 目錄

1. [環境準備](#環境準備)
2. [目錄結構建立](#目錄結構建立)
3. [核心層實作](#核心層實作)
4. [共享工具實作](#共享工具實作)
5. [功能組件實作](#功能組件實作)
6. [主協調器實作](#主協調器實作)
7. [測試與驗證](#測試與驗證)

---

## 🔧 環境準備

### 1. 安裝依賴

確認專案已安裝以下依賴：

```json
{
  "@angular/core": "^20.3.0",
  "@angular/common": "^20.3.0",
  "@angular/common/http": "^20.3.0",
  "ng-zorro-antd": "^20.3.1",
  "rxjs": "~7.8.0"
}
```

### 2. 設定 API Key

#### 開發環境

編輯 `src/environments/environment.ts`：

```typescript
export const environment = {
  production: false,
  useHash: true,
  CWA_API_KEY: 'YOUR_DEVELOPMENT_API_KEY',
  // ... 其他配置
};
```

#### 生產環境

編輯 `src/environments/environment.prod.ts`：

```typescript
export const environment = {
  production: true,
  useHash: false,
  CWA_API_KEY: '', // 從環境變數注入
  // ... 其他配置
};
```

**注意**: 不要將實際的 API Key 提交到版本控制！

### 3. 申請 CWA API Key

1. 訪問 [中央氣象署開放資料平臺](https://opendata.cwa.gov.tw/)
2. 註冊會員帳號
3. 申請 API 授權碼
4. 複製授權碼到環境變數

---

## 📁 目錄結構建立

### 執行指令

```bash
cd src/app/routes/blueprint/modules/weather

# 建立核心目錄
mkdir -p core/services core/models core/config

# 建立功能目錄
mkdir -p features/forecast-display
mkdir -p features/location-selector
mkdir -p features/construction-suitability
mkdir -p features/weather-alerts

# 建立共享目錄
mkdir -p shared/utils
```

### 預期結構

```
weather/                                 # 完全自主的氣象模組
├── WEATHER_MODULE_DESIGN.md
├── README.md
├── IMPLEMENTATION_GUIDE.md            # 本文件
├── weather-module-view.component.ts   (待實作)
├── index.ts                           (待實作)
│
├── core/                              # 核心層
│   ├── services/
│   │   ├── weather-api.service.ts
│   │   ├── cache.service.ts
│   │   └── index.ts
│   ├── models/
│   │   ├── weather.model.ts
│   │   ├── api-response.model.ts
│   │   └── index.ts
│   └── config/
│       ├── api.config.ts
│       ├── constants.ts
│       └── index.ts
│
├── features/                          # 功能模組
│   ├── forecast-display/
│   ├── location-selector/
│   ├── construction-suitability/
│   └── weather-alerts/
│
└── shared/                            # 共享工具
    └── utils/
        ├── formatters.ts
        ├── icons.ts
        ├── calculators.ts
        └── index.ts
```

---

## 🏗️ 核心層實作

### 1. API 配置 (core/config/api.config.ts)

```typescript
/**
 * CWA API Configuration
 * 中央氣象署 API 配置
 */

import { environment } from 'src/environments/environment';

export const CWA_API_CONFIG = {
  /** API Base URL */
  baseUrl: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore',
  
  /** API Authorization Key */
  apiKey: environment.CWA_API_KEY,
  
  /** HTTP 請求逾時時間 (毫秒) */
  timeout: 30000,
  
  /** 重試次數 */
  retryAttempts: 3,
  
  /** 資料集 ID */
  datasets: {
    /** 一般天氣預報-今明36小時天氣預報 */
    cityForecast: 'F-C0032-001',
    
    /** 地震報告-顯著有感地震報告 */
    earthquakeReport: 'E-A0016-001',
    
    /** 自動氣象站-氣象觀測資料 */
    weatherStation: 'O-A0001-001'
  }
} as const;
```

### 2. 常數定義 (core/config/constants.ts)

```typescript
/**
 * Weather Module Constants
 * 氣象模組常數
 */

/** 台灣縣市代碼對照表 */
export const COUNTY_CODES: Record<string, string> = {
  '臺北市': '063',
  '新北市': '065',
  '桃園市': '068',
  '臺中市': '066',
  '臺南市': '067',
  '高雄市': '064',
  '基隆市': '010',
  '新竹市': '018',
  '嘉義市': '020',
  '新竹縣': '004',
  '苗栗縣': '005',
  '彰化縣': '007',
  '南投縣': '008',
  '雲林縣': '009',
  '嘉義縣': '010',
  '屏東縣': '013',
  '宜蘭縣': '002',
  '花蓮縣': '015',
  '臺東縣': '014',
  '澎湖縣': '016',
  '金門縣': '017',
  '連江縣': '019'
};

/** 所有縣市名稱列表 */
export const ALL_COUNTIES = Object.keys(COUNTY_CODES);

/** 天氣現象代碼對照表 */
export const WEATHER_CODES: Record<string, string> = {
  '1': '晴',
  '2': '多雲',
  '3': '陰',
  '4': '多雲時晴',
  '5': '多雲時陰',
  '6': '陰時多雲',
  '7': '晴時多雲',
  '8': '陰短暫雨',
  '9': '陰時多雲短暫雨',
  '10': '多雲短暫雨',
  // ... 更多代碼
};

/** 快取時間設定 (毫秒) */
export const CACHE_TTL = {
  /** 天氣預報快取時間: 3 小時 */
  forecast: 3 * 60 * 60 * 1000,
  
  /** 地震資訊快取時間: 5 分鐘 */
  earthquake: 5 * 60 * 1000,
  
  /** 觀測資料快取時間: 10 分鐘 */
  observation: 10 * 60 * 1000
} as const;
```

### 3. 資料模型 (core/models/weather.model.ts)

```typescript
/**
 * Weather Data Models
 * 天氣資料模型
 */

/** 天氣預報資料 */
export interface WeatherForecast {
  /** 地點名稱 */
  locationName: string;
  
  /** 開始時間 (ISO 8601) */
  startTime: string;
  
  /** 結束時間 (ISO 8601) */
  endTime: string;
  
  /** 天氣描述 */
  weatherDescription: string;
  
  /** 天氣現象代碼 */
  weatherCode?: string;
  
  /** 溫度資訊 */
  temperature: {
    min: number;
    max: number;
    unit?: string;
  };
  
  /** 降雨機率 (%) */
  rainProbability: number;
  
  /** 相對濕度 (%) */
  humidity?: number;
  
  /** 風速 (m/s) */
  windSpeed?: number;
}

/** 地震資訊 */
export interface EarthquakeInfo {
  /** 地震編號 */
  earthquakeNo: string;
  
  /** 發震時間 (ISO 8601) */
  originTime: string;
  
  /** 震央位置描述 */
  epicenterLocation: string;
  
  /** 芮氏規模 */
  magnitude: number;
  
  /** 地震深度 (km) */
  depth: number;
  
  /** 報告內容 */
  reportContent?: string;
}

/** 施工適宜度評估 */
export interface ConstructionSuitability {
  /** 評估分數 (0-100) */
  score: number;
  
  /** 適宜度等級 */
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous';
  
  /** 評估因素 */
  factors: {
    rainfall: { value: number; impact: number; description: string };
    temperature: { value: number; impact: number; description: string };
    wind: { value: number; impact: number; description: string };
    weather: { value: string; impact: number; description: string };
  };
  
  /** 建議 */
  recommendations: string[];
  
  /** 警告 */
  warnings: string[];
}
```

### 4. API 回應模型 (core/models/api-response.model.ts)

```typescript
/**
 * CWA API Response Models
 * 中央氣象署 API 回應模型
 */

/** CWA API 標準回應結構 */
export interface CwaApiResponse {
  success: string;
  result?: {
    resource_id: string;
    fields: Array<{ id: string; type: string }>;
  };
  records: CwaRecords;
}

/** CWA 記錄結構 */
export interface CwaRecords {
  datasetDescription?: string;
  location: CwaLocation[];
}

/** CWA 地點資料 */
export interface CwaLocation {
  locationName: string;
  geocode?: string;
  lat?: string;
  lon?: string;
  weatherElement: CwaWeatherElement[];
}

/** CWA 氣象要素 */
export interface CwaWeatherElement {
  elementName: string;
  description?: string;
  time: CwaTimeData[];
}

/** CWA 時間資料 */
export interface CwaTimeData {
  startTime: string;
  endTime: string;
  parameter: CwaParameter;
}

/** CWA 參數 */
export interface CwaParameter {
  parameterName: string;
  parameterValue?: string;
  parameterUnit?: string;
}
```

### 5. 記憶體快取服務 (core/services/cache.service.ts)

```typescript
/**
 * Cache Service
 * 記憶體快取服務
 */

import { Injectable } from '@angular/core';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  
  /**
   * 取得快取資料
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // 檢查是否過期
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * 設定快取資料
   * @param key 快取鍵
   * @param data 資料
   * @param ttl 存活時間 (毫秒)
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }
  
  /**
   * 刪除快取
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * 清除所有快取
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * 清除過期快取
   */
  clearExpired(): number {
    let count = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * 取得快取統計
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
```

### 6. CWA API 服務 (core/services/weather-api.service.ts)

```typescript
/**
 * Weather API Service
 * 中央氣象署 API 服務
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, retry, timeout, tap } from 'rxjs/operators';

import { CacheService } from './cache.service';
import { CWA_API_CONFIG, CACHE_TTL } from '../config';
import type { CwaApiResponse, WeatherForecast, EarthquakeInfo } from '../models';

@Injectable({ providedIn: 'root' })
export class WeatherApiService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(CacheService);
  
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
    
    // 呼叫 CWA API
    const params = new HttpParams()
      .set('Authorization', CWA_API_CONFIG.apiKey)
      .set('locationName', locationName);
    
    const url = `${CWA_API_CONFIG.baseUrl}/${CWA_API_CONFIG.datasets.cityForecast}`;
    
    return this.http.get<CwaApiResponse>(url, { params }).pipe(
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
    
    // 呼叫 CWA API
    const params = new HttpParams()
      .set('Authorization', CWA_API_CONFIG.apiKey)
      .set('limit', limit.toString());
    
    const url = `${CWA_API_CONFIG.baseUrl}/${CWA_API_CONFIG.datasets.earthquakeReport}`;
    
    return this.http.get<CwaApiResponse>(url, { params }).pipe(
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
    // 實作地震資訊轉換邏輯
    // 此處簡化處理，實際需根據 API 回應結構調整
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
```

---

## 🛠️ 共享工具實作

### 1. 格式化工具 (shared/utils/formatters.ts)

```typescript

/**
 * 格式化溫度範圍
 * @param min 最低溫
 * @param max 最高溫
 * @param unit 溫度單位 (預設 'C')
 */
export function formatTemperatureRange(min: number, max: number, unit: string = 'C'): string {
  return `${min}-${max}°${unit}`;
}

/**
 * 格式化時間範圍
 * @param start 開始時間 (ISO 8601)
 * @param end 結束時間 (ISO 8601)
 */
export function formatTimeRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const startTime = startDate.toLocaleTimeString('zh-TW', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const endTime = endDate.toLocaleTimeString('zh-TW', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return `${startTime} - ${endTime}`;
}

/**
 * 格式化日期
 * @param dateString ISO 8601 日期字串
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  });
}

/**
 * 格式化降雨機率
 * @param prob 降雨機率 (0-100)
 */
export function formatRainProbability(prob: number): string {
  return `${prob}%`;
}

/**
 * 格式化施工適宜度等級
 * @param level 適宜度等級
 */
export function formatSuitabilityLevel(
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous'
): string {
  const levelMap = {
    excellent: '優秀',
    good: '良好',
    fair: '尚可',
    poor: '不佳',
    dangerous: '危險'
  };
  return levelMap[level];
}

/**
 * 取得適宜度等級色彩
 * @param level 適宜度等級
 */
export function getSuitabilityColor(
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous'
): string {
  const colorMap = {
    excellent: '#52c41a',  // 綠色
    good: '#1890ff',       // 藍色
    fair: '#faad14',       // 橙色
    poor: '#f5222d',       // 紅色
    dangerous: '#cf1322'   // 暗紅
  };
  return colorMap[level];
}

/**
 * 格式化風速
 * @param speed 風速 (m/s)
 */
export function formatWindSpeed(speed: number): string {
  return `${speed} m/s`;
}

/**
 * 格式化濕度
 * @param humidity 濕度 (%)
 */
export function formatHumidity(humidity: number): string {
  return `${humidity}%`;
}
```

### 2. 圖示映射 (weather-icons.ts)

```typescript
/**
 * Weather Icons
 * 天氣圖示映射工具
 */

/**
 * 根據天氣代碼取得圖示
 * @param weatherCode 天氣現象代碼
 */
export function getWeatherIcon(weatherCode?: string): string {
  if (!weatherCode) return '🌤️';
  
  const iconMap: Record<string, string> = {
    '1': '☀️',    // 晴
    '2': '🌤️',    // 多雲
    '3': '☁️',    // 陰
    '4': '🌤️',    // 多雲時晴
    '5': '🌥️',    // 多雲時陰
    '6': '🌥️',    // 陰時多雲
    '7': '🌤️',    // 晴時多雲
    '8': '🌧️',    // 陰短暫雨
    '9': '🌧️',    // 陰時多雲短暫雨
    '10': '🌦️',   // 多雲短暫雨
    '11': '🌦️',   // 多雲時晴短暫雨
    '12': '🌧️',   // 多雲時陰短暫雨
    '13': '🌦️',   // 晴時多雲短暫雨
    '14': '⛈️',   // 陰短暫陣雨
    '15': '⛈️',   // 陰時多雲短暫陣雨
    '16': '⛈️',   // 多雲短暫陣雨
    '17': '⛈️',   // 多雲時晴短暫陣雨
    '18': '⛈️',   // 多雲時陰短暫陣雨
    '19': '⛈️',   // 晴時多雲短暫陣雨
    '20': '⛈️',   // 陰陣雨或雷雨
    '21': '⛈️',   // 陰時多雲陣雨或雷雨
    '22': '⛈️',   // 多雲陣雨或雷雨
    '23': '⛈️',   // 多雲時晴陣雨或雷雨
    '24': '⛈️',   // 晴時多雲陣雨或雷雨
    '25': '🌨️',   // 陰短暫雨或雪
    '26': '🌨️',   // 陰時多雲短暫雨或雪
    '27': '🌨️',   // 多雲短暫雨或雪
    '28': '🌨️',   // 多雲時陰短暫雨或雪
    '29': '🌧️',   // 陰有雨
    '30': '🌧️',   // 陰時多雲有雨
    '31': '🌧️',   // 多雲有雨
    '32': '🌧️',   // 多雲時陰有雨
    '33': '⛈️',   // 陰有雷陣雨
    '34': '⛈️',   // 陰時多雲有雷陣雨
    '35': '⛈️',   // 多雲有雷陣雨
    '36': '⛈️',   // 多雲時陰有雷陣雨
    '37': '⛈️',   // 晴有雷陣雨
    '38': '🌧️',   // 陰有大雨
    '39': '🌧️',   // 陰有豪雨
    '41': '⛈️',   // 陰有大雷雨
    '42': '☀️'    // 晴
  };
  
  return iconMap[weatherCode] || '🌤️';
}

/**
 * 根據適宜度等級取得圖示
 * @param level 適宜度等級
 */
export function getSuitabilityIcon(
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous'
): string {
  const iconMap = {
    excellent: '✅',  // 優秀
    good: '👍',       // 良好
    fair: '⚠️',       // 尚可
    poor: '❌',       // 不佳
    dangerous: '🚫'   // 危險
  };
  return iconMap[level];
}

/**
 * 根據警報類型取得圖示
 * @param type 警報類型
 */
export function getAlertIcon(type: string): string {
  const iconMap: Record<string, string> = {
    'typhoon': '🌀',        // 颱風
    'heavy_rain': '🌧️',     // 豪雨
    'earthquake': '🏚️',     // 地震
    'other': '⚠️'           // 其他
  };
  return iconMap[type] || '⚠️';
}

/**
 * 根據風速取得圖示
 * @param speed 風速 (m/s)
 */
export function getWindIcon(speed: number): string {
  if (speed < 2) return '💨';      // 微風
  if (speed < 5) return '🍃';      // 輕風
  if (speed < 10) return '🌬️';     // 強風
  return '💨💨';                     // 暴風
}
```

### 3. 匯出檔案 (shared/utils/index.ts)

```typescript
/**
 * Weather Module - Shared Utilities
 */

export * from './weather-formatters';
export * from './weather-icons';
```

### 4. 共享模組匯出 (shared/index.ts)

```typescript
/**
 * Weather Module - Shared Exports
 */

export * from './utils';
```

---

## 🎨 功能組件實作

### 1. 地點選擇器 (LocationSelectorComponent)

#### Component 檔案

**路徑**: `features/location-selector/location-selector.component.ts`

```typescript
/**
 * Location Selector Component
 * 地點選擇器組件
 *
 * 職責: 提供縣市選擇介面，支援搜尋與篩選
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { ALL_COUNTIES } from '@core/blueprint/modules/implementations/climate';

@Component({
  selector: 'app-location-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-select
      [ngModel]="selectedLocation()"
      (ngModelChange)="locationChange.emit($event)"
      nzShowSearch
      nzPlaceHolder="選擇縣市"
      style="width: 200px;"
    >
      @for (county of counties; track county) {
        <nz-option [nzValue]="county" [nzLabel]="county" />
      }
    </nz-select>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class LocationSelectorComponent {
  /**
   * Input: 當前選中的地點
   */
  selectedLocation = input.required<string>();
  
  /**
   * Output: 地點變更事件
   */
  locationChange = output<string>();
  
  /**
   * 可用的縣市列表
   */
  readonly counties = ALL_COUNTIES;
}
```

#### 匯出檔案

**路徑**: `features/location-selector/index.ts`

```typescript
export { LocationSelectorComponent } from './location-selector.component';
```

---

### 2. 天氣預報顯示 (ForecastDisplayComponent)

#### Component 檔案

**路徑**: `features/forecast-display/forecast-display.component.ts`

```typescript
/**
 * Forecast Display Component
 * 天氣預報顯示組件
 *
 * 職責: 顯示天氣預報資料，支援多時段預報展示
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import type { WeatherForecast } from '@core/blueprint/modules/implementations/climate';
import { 
  formatTemperatureRange, 
  formatRainProbability, 
  formatDate,
  getWeatherIcon 
} from '../../shared';

@Component({
  selector: 'app-forecast-display',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    @if (loading()) {
      <div class="loading-container">
        <nz-spin nzSimple />
      </div>
    } @else if (forecasts().length === 0) {
      <nz-empty nzNotFoundContent="暫無天氣資料" />
    } @else {
      <div class="forecast-grid">
        @for (forecast of displayForecasts(); track forecast.startTime) {
          <nz-card 
            class="forecast-card"
            [nzHoverable]="true"
            (click)="forecastSelect.emit(forecast)"
          >
            <div class="forecast-header">
              <span class="forecast-date">{{ formatDate(forecast.startTime) }}</span>
            </div>
            <div class="forecast-icon">
              {{ getWeatherIcon(forecast.weatherCode) }}
            </div>
            <div class="forecast-description">
              {{ forecast.weatherDescription }}
            </div>
            <div class="forecast-temperature">
              {{ formatTempRange(forecast.temperature) }}
            </div>
            <div class="forecast-rain">
              <span nz-icon nzType="cloud" nzTheme="outline"></span>
              {{ formatRain(forecast.rainProbability) }}
            </div>
          </nz-card>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px 0;
    }
    
    .forecast-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }
    
    .forecast-card {
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .forecast-card:hover {
      transform: translateY(-4px);
    }
    
    .forecast-header {
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .forecast-icon {
      font-size: 48px;
      margin: 12px 0;
    }
    
    .forecast-description {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.65);
      margin-bottom: 8px;
    }
    
    .forecast-temperature {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .forecast-rain {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.45);
    }
    
    .forecast-rain span {
      margin-right: 4px;
    }
  `]
})
export class ForecastDisplayComponent {
  /**
   * Input: 預報資料
   */
  forecasts = input.required<WeatherForecast[]>();
  
  /**
   * Input: 載入狀態
   */
  loading = input<boolean>(false);
  
  /**
   * Output: 選中預報事件
   */
  forecastSelect = output<WeatherForecast>();
  
  /**
   * 顯示的預報資料 (限制顯示前6筆)
   */
  displayForecasts = () => {
    return this.forecasts().slice(0, 6);
  };
  
  /**
   * 格式化溫度範圍
   */
  formatTempRange = (temp: WeatherForecast['temperature']) => {
    return formatTemperatureRange(temp.min, temp.max, temp.unit);
  };
  
  /**
   * 格式化降雨機率
   */
  formatRain = (prob: number) => {
    return formatRainProbability(prob);
  };
  
  /**
   * 格式化日期
   */
  formatDate = formatDate;
  
  /**
   * 取得天氣圖示
   */
  getWeatherIcon = getWeatherIcon;
}
```

#### 匯出檔案

**路徑**: `features/forecast-display/index.ts`

```typescript
export { ForecastDisplayComponent } from './forecast-display.component';
```

---

### 3. 施工適宜度評估 (SuitabilityCardComponent)

#### Component 檔案

**路徑**: `features/construction-suitability/suitability-card.component.ts`

```typescript
/**
 * Suitability Card Component
 * 施工適宜度評估卡片組件
 *
 * 職責: 根據天氣資料計算並顯示施工適宜度
 */

import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import type { 
  WeatherForecast, 
  ConstructionSuitability 
} from '@core/blueprint/modules/implementations/climate';
import { CwbWeatherService } from '@core/blueprint/modules/implementations/climate';
import { 
  formatSuitabilityLevel, 
  getSuitabilityColor,
  getSuitabilityIcon 
} from '../../shared';

@Component({
  selector: 'app-suitability-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    @if (forecast(); as fc) {
      <nz-card nzTitle="施工適宜度評估" class="suitability-card">
        <div class="suitability-score">
          <div class="score-circle" [style.border-color]="scoreColor()">
            <span class="score-value">{{ suitability().score }}</span>
            <span class="score-icon">{{ levelIcon() }}</span>
          </div>
          <div class="score-label">
            <nz-tag [nzColor]="scoreColor()">
              {{ levelText() }}
            </nz-tag>
          </div>
        </div>
        
        <nz-divider />
        
        <div class="factors-section">
          <h4>影響因素</h4>
          <nz-list [nzDataSource]="factorsList()" [nzRenderItem]="factorItem">
            <ng-template #factorItem let-item>
              <nz-list-item>
                <div class="factor-item">
                  <span class="factor-name">{{ item.name }}</span>
                  <span class="factor-value">{{ item.value }}</span>
                  <span class="factor-impact" [class.negative]="item.impact < 0">
                    {{ item.impact }}
                  </span>
                </div>
              </nz-list-item>
            </ng-template>
          </nz-list>
        </div>
        
        @if (suitability().recommendations.length > 0) {
          <nz-divider />
          <div class="recommendations-section">
            <h4>建議</h4>
            <ul>
              @for (rec of suitability().recommendations; track rec) {
                <li>{{ rec }}</li>
              }
            </ul>
          </div>
        }
        
        @if (suitability().warnings.length > 0) {
          <nz-divider />
          <div class="warnings-section">
            <h4>警告</h4>
            <nz-alert 
              nzType="warning" 
              nzShowIcon
              [nzMessage]="warningList"
            >
              <ng-template #warningList>
                <ul>
                  @for (warn of suitability().warnings; track warn) {
                    <li>{{ warn }}</li>
                  }
                </ul>
              </ng-template>
            </nz-alert>
          </div>
        }
      </nz-card>
    } @else {
      <nz-card nzTitle="施工適宜度評估">
        <nz-empty nzNotFoundContent="請先選擇地點並載入天氣資料" />
      </nz-card>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .suitability-card {
      margin-bottom: 16px;
    }
    
    .suitability-score {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 0;
    }
    
    .score-circle {
      width: 120px;
      height: 120px;
      border: 4px solid;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    
    .score-value {
      font-size: 36px;
      font-weight: bold;
    }
    
    .score-icon {
      font-size: 24px;
      margin-top: 4px;
    }
    
    .score-label {
      font-size: 16px;
    }
    
    .factors-section h4,
    .recommendations-section h4,
    .warnings-section h4 {
      margin-bottom: 12px;
      font-weight: 500;
    }
    
    .factor-item {
      display: flex;
      justify-content: space-between;
      width: 100%;
      gap: 12px;
    }
    
    .factor-name {
      flex: 1;
    }
    
    .factor-value {
      flex: 1;
      text-align: right;
      color: rgba(0, 0, 0, 0.65);
    }
    
    .factor-impact {
      width: 60px;
      text-align: right;
      font-weight: 500;
    }
    
    .factor-impact.negative {
      color: #f5222d;
    }
    
    .recommendations-section ul,
    .warnings-section ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .recommendations-section li,
    .warnings-section li {
      margin-bottom: 8px;
    }
  `]
})
export class SuitabilityCardComponent {
  private readonly weatherService = inject(CwbWeatherService);
  
  /**
   * Input: 天氣預報資料
   */
  forecast = input<WeatherForecast | null>(null);
  
  /**
   * Computed: 施工適宜度評估
   */
  suitability = computed(() => {
    const fc = this.forecast();
    if (!fc) {
      return this.getEmptySuitability();
    }
    return this.weatherService.calculateConstructionSuitability(fc);
  });
  
  /**
   * Computed: 分數顏色
   */
  scoreColor = computed(() => {
    return getSuitabilityColor(this.suitability().level);
  });
  
  /**
   * Computed: 等級文字
   */
  levelText = computed(() => {
    return formatSuitabilityLevel(this.suitability().level);
  });
  
  /**
   * Computed: 等級圖示
   */
  levelIcon = computed(() => {
    return getSuitabilityIcon(this.suitability().level);
  });
  
  /**
   * Computed: 因素列表
   */
  factorsList = computed(() => {
    const factors = this.suitability().factors;
    return [
      {
        name: '降雨機率',
        value: `${factors.rainfall.value}%`,
        impact: factors.rainfall.impact,
        description: factors.rainfall.description
      },
      {
        name: '溫度',
        value: `${factors.temperature.value}°C`,
        impact: factors.temperature.impact,
        description: factors.temperature.description
      },
      {
        name: '風速',
        value: factors.wind.value ? `${factors.wind.value} m/s` : 'N/A',
        impact: factors.wind.impact,
        description: factors.wind.description
      },
      {
        name: '天氣現象',
        value: factors.weather.value,
        impact: factors.weather.impact,
        description: factors.weather.description
      }
    ];
  });
  
  /**
   * 取得空的施工適宜度評估
   */
  private getEmptySuitability(): ConstructionSuitability {
    return {
      score: 0,
      level: 'dangerous',
      factors: {
        rainfall: { value: 0, impact: 0, description: '' },
        temperature: { value: 0, impact: 0, description: '' },
        wind: { value: 0, impact: 0, description: '' },
        weather: { value: '', impact: 0, description: '' }
      },
      recommendations: [],
      warnings: []
    };
  }
}
```

#### 匯出檔案

**路徑**: `features/construction-suitability/index.ts`

```typescript
export { SuitabilityCardComponent } from './suitability-card.component';
```

---

## 📌 下一步

完整的實作指南包含以下額外章節（因篇幅限制，這裡僅列出大綱）：

### 4. 氣象警報組件 (WeatherAlertsComponent)
- 地震資訊顯示
- 警報列表與詳情
- 即時更新機制

### 5. 主協調器組件 (WeatherModuleViewComponent)
- 狀態管理
- 服務整合
- 事件協調
- 錯誤處理

### 6. 公開 API (index.ts)
- 模組匯出設定
- 公開接口定義

### 7. 單元測試
- 組件測試範例
- 工具函數測試
- Mock 設定

### 8. E2E 測試
- 使用者流程測試
- 整合測試場景

---

## ✅ 實施檢查清單

### 基礎設施
- [ ] API Key 已設定
- [ ] 目錄結構已建立
- [ ] 共享工具已實作

### 功能組件
- [ ] LocationSelectorComponent 已實作
- [ ] ForecastDisplayComponent 已實作
- [ ] SuitabilityCardComponent 已實作
- [ ] WeatherAlertsComponent 已實作

### 整合與測試
- [ ] WeatherModuleViewComponent 已實作
- [ ] 公開 API 已設定
- [ ] 單元測試覆蓋率 > 80%
- [ ] E2E 測試已通過

### 文檔與驗證
- [ ] 程式碼註解完整
- [ ] README 已更新
- [ ] 設計文檔已完成
- [ ] 實施指南已完成

---

**版本**: v1.0.0  
**最後更新**: 2025-12-21  
**狀態**: ✅ 指南完成，等待實施
