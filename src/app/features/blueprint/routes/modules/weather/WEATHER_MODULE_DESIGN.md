# 氣象模組設計文檔 (Weather Module Design)

## 📋 專案資訊

- **模組名稱**: Weather Module (氣象模組)
- **路徑**: `src/app/routes/blueprint/modules/weather`
- **API 來源**: [中央氣象署開放資料平臺](https://opendata.cwa.gov.tw/dist/opendata-swagger.html)
- **環境變數**: `CWA_API_KEY`
- **設計原則**: 高內聚性、低耦合性、可擴展性、單一職責、極簡主義
- **架構模式**: Feature-Based Architecture (功能導向架構)

---

## 🎯 設計目標

### 核心原則

1. **高內聚性 (High Cohesion)**
   - 每個功能模組專注於單一業務領域
   - 功能相關的代碼組織在一起
   - 減少跨功能的依賴
   - **完全自有化內聚在 `src/app/routes/blueprint/modules/weather`**

2. **低耦合性 (Low Coupling)**
   - 模組間透過明確接口通訊
   - 避免直接依賴其他模組的實現細節
   - 使用事件機制解耦模組間互動
   - **不依賴專案其他模組 (如 Climate Module)**

3. **可擴展性 (Extensibility)**
   - 新增功能不影響現有功能
   - 支援插件式功能擴展
   - 配置驅動的功能開關

4. **單一職責 (Single Responsibility)**
   - 每個組件只負責一個職責
   - 組件職責明確且易於理解
   - 避免上帝組件

5. **極簡主義 (Minimalism)**
   - 只實作必要功能
   - 避免過度設計
   - 代碼簡潔易讀
   - **只與 API 交互顯示天氣，不存數據庫**

### 技術約束

- ✅ **完全自主實作** - 不依賴專案現有的 Climate Module
- ✅ **直接 API 呼叫** - 不透過 Firebase Functions，直接從前端呼叫 CWA API
- ✅ **環境變數配置** - API Key 使用環境變數 `CWA_API_KEY`
- ✅ **純展示功能** - 只與 API 交互顯示天氣資料，不存儲到 Firestore
- ✅ **Angular 20 現代化** - Signals, Standalone Components, inject()
- ✅ **模組內部三層** - UI Components → Services → API Models (全部在 weather 目錄內)

---

## 📐 模組架構設計

### 整體架構圖 (完全自有化內聚)

```
weather/                                 # 完全自主的氣象模組
├── weather-module-view.component.ts    # 主協調器 (Orchestrator)
├── index.ts                             # 公開 API
├── WEATHER_MODULE_DESIGN.md            # 設計文檔
│
├── core/                                # 核心層 (模組內部)
│   ├── services/                       # 業務服務
│   │   ├── weather-api.service.ts      # CWA API 封裝服務
│   │   ├── cache.service.ts            # 快取服務 (記憶體快取)
│   │   └── index.ts
│   │
│   ├── models/                         # 資料模型
│   │   ├── weather.model.ts            # 天氣資料模型
│   │   ├── api-response.model.ts       # API 回應模型
│   │   └── index.ts
│   │
│   └── config/                         # 配置
│       ├── api.config.ts               # API 配置
│       ├── constants.ts                # 常數定義
│       └── index.ts
│
├── features/                            # 功能模組 (Feature Modules)
│   ├── forecast-display/               # 天氣預報顯示
│   │   ├── forecast-display.component.ts
│   │   └── index.ts
│   │
│   ├── location-selector/              # 地點選擇器
│   │   ├── location-selector.component.ts
│   │   └── index.ts
│   │
│   ├── construction-suitability/       # 施工適宜度評估
│   │   ├── suitability-card.component.ts
│   │   └── index.ts
│   │
│   └── weather-alerts/                 # 氣象警報
│       ├── weather-alerts.component.ts
│       └── index.ts
│
└── shared/                              # 共享工具
    ├── utils/
    │   ├── formatters.ts               # 格式化工具
    │   ├── icons.ts                    # 圖示映射
    │   ├── calculators.ts              # 計算工具 (施工適宜度)
    │   └── index.ts
    └── index.ts
```

---

## 🧩 功能模組設計 (Feature-Based Design)

### 1. 主協調器 (Main Orchestrator)

**檔案**: `weather-module-view.component.ts`

**職責**:
- 統籌所有功能模組
- 管理共享狀態
- 處理頂層業務邏輯
- 協調功能間通訊

**接口**:

```typescript
interface WeatherModuleViewComponent {
  // Input
  blueprintId: InputSignal<string>;           // 藍圖 ID
  
  // State
  selectedLocation: WritableSignal<string>;   // 選中的地點
  weatherData: Signal<WeatherForecast[]>;     // 天氣資料
  loading: Signal<boolean>;                   // 載入狀態
  error: Signal<string | null>;              // 錯誤訊息
  
  // Methods
  loadWeather(): Promise<void>;              // 載入天氣資料
  onLocationChange(location: string): void;  // 地點變更處理
}
```

**依賴**:
- ✅ `WeatherApiService` (模組內部服務 `core/services/weather-api.service.ts`)
- ✅ Feature Components (forecast-display, location-selector, etc.)

---

### 2. 天氣預報顯示 (Forecast Display)

**檔案**: `features/forecast-display/forecast-display.component.ts`

**職責**:
- 顯示天氣預報資料
- 支援多時段預報展示
- 視覺化天氣資訊

**接口**:

```typescript
interface ForecastDisplayComponent {
  // Inputs
  forecasts: InputSignal<WeatherForecast[]>;  // 預報資料
  loading: InputSignal<boolean>;              // 載入狀態
  
  // Outputs
  forecastSelect: OutputEmitterRef<WeatherForecast>;  // 選中預報事件
}
```

**UI 元素**:
- 天氣卡片列表 (使用 nz-card)
- 時段標籤 (今天、明天、後天)
- 溫度範圍顯示
- 降雨機率指示器
- 天氣圖示

**資料來源**:
- 輸入資料由父組件提供
- 不直接呼叫 Service

---

### 3. 地點選擇器 (Location Selector)

**檔案**: `features/location-selector/location-selector.component.ts`

**職責**:
- 提供縣市選擇介面
- 支援搜尋與篩選
- 記住使用者偏好

**接口**:

```typescript
interface LocationSelectorComponent {
  // Inputs
  selectedLocation: InputSignal<string>;      // 當前選中地點
  availableLocations: InputSignal<string[]>;  // 可用地點列表
  
  // Outputs
  locationChange: OutputEmitterRef<string>;   // 地點變更事件
}
```

**UI 元素**:
- 下拉選單 (nz-select)
- 搜尋框 (支援模糊搜尋)
- 常用地點快捷選項

**資料來源**:
- 縣市列表來自 `COUNTY_CODES` 常數
- 不需要 API 呼叫

---

### 4. 施工適宜度評估 (Construction Suitability)

**檔案**: `features/construction-suitability/suitability-card.component.ts`

**職責**:
- 根據天氣資料計算施工適宜度
- 顯示評估結果與建議
- 提供警告訊息

**接口**:

```typescript
interface SuitabilityCardComponent {
  // Inputs
  forecast: InputSignal<WeatherForecast>;     // 當前預報
  
  // Computed
  suitability: Signal<ConstructionSuitability>;  // 計算的適宜度
}
```

**計算邏輯**:
- 使用 `CwbWeatherService.calculateConstructionSuitability()`
- 在 component 內使用 `computed()` 計算

**UI 元素**:
- 分數指示器 (0-100)
- 等級徽章 (excellent/good/fair/poor/dangerous)
- 影響因素列表
- 建議與警告訊息

---

### 5. 氣象警報 (Weather Alerts)

**檔案**: `features/weather-alerts/weather-alerts.component.ts`

**職責**:
- 顯示重要氣象警報
- 地震資訊快訊
- 異常天氣通知

**接口**:

```typescript
interface WeatherAlertsComponent {
  // Inputs
  location: InputSignal<string>;              // 關注地點
  
  // State
  alerts: Signal<WeatherAlert[]>;             // 警報列表
  earthquakes: Signal<EarthquakeInfo[]>;      // 地震資訊
  
  // Outputs
  alertClick: OutputEmitterRef<WeatherAlert>; // 警報點擊事件
}
```

**資料來源**:
- 地震資訊: `CwbWeatherService.getEarthquakeReport()`
- 在 component 內管理狀態

**UI 元素**:
- 警報通知欄 (nz-alert)
- 地震資訊卡片
- 詳細資訊抽屜

---

## 🔧 共享工具 (Shared Utilities)

### 格式化工具 (weather-formatters.ts)

```typescript
export const WeatherFormatters = {
  // 格式化溫度
  formatTemperature(temp: number, unit: string = 'C'): string,
  
  // 格式化時間範圍
  formatTimeRange(start: string, end: string): string,
  
  // 格式化降雨機率
  formatRainProbability(prob: number): string,
  
  // 格式化適宜度等級
  formatSuitabilityLevel(level: string): string
};
```

### 圖示映射 (weather-icons.ts)

```typescript
export const WeatherIcons = {
  // 根據天氣代碼取得圖示
  getWeatherIcon(weatherCode: string): string,
  
  // 根據適宜度等級取得圖示
  getSuitabilityIcon(level: string): string,
  
  // 根據警報類型取得圖示
  getAlertIcon(type: string): string
};
```

---

## 🔗 資料流設計 (Data Flow)

### 架構圖 (完全自有化內聚)

```
┌─────────────────────────────────────────────────────────────┐
│          Weather Module View (Orchestrator)                 │
│                                                              │
│  State:                                                      │
│  - selectedLocation: signal()                               │
│  - weatherData: signal()                                    │
│  - loading: signal()                                        │
│  - error: signal()                                          │
│                                                              │
│  Service Injection:                                         │
│  - weatherApiService (模組內部服務)                        │
└─────────────────────────────────────────────────────────────┘
        │                    │                    │
        ↓                    ↓                    ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Location    │    │  Forecast    │    │ Suitability  │
│  Selector    │    │  Display     │    │    Card      │
│              │    │              │    │              │
│  [Event Out] │    │  [Data In]   │    │  [Data In]   │
│   location   │    │  forecasts   │    │   forecast   │
│   Change     │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘

┌─────────────────────────────────────────────────────────────┐
│              WeatherApiService (模組內部)                   │
│                                                              │
│  - getCityForecast(location): Observable<WeatherForecast[]>│
│  - getEarthquakeReport(): Observable<EarthquakeInfo[]>     │
│  - Cache Management (記憶體快取, 3小時 TTL)                │
│  - Error Handling & Retry Logic                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│          中央氣象署開放資料平臺 API                         │
│          https://opendata.cwa.gov.tw/api/v1/rest/datastore │
└─────────────────────────────────────────────────────────────┘
```

### 資料流程

1. **初始化階段**
   - WeatherModuleView 注入 `WeatherApiService` (模組內部服務)
   - WeatherApiService 從環境變數載入 `CWA_API_KEY`
   - 初始化記憶體快取

2. **載入資料**
   - 使用者選擇地點 → LocationSelector 發出事件
   - WeatherModuleView 接收事件 → 更新 selectedLocation signal
   - 呼叫 `weatherApiService.getCityForecast(location)`
   - WeatherApiService 檢查記憶體快取
   - 若無快取或過期，發送 HTTP 請求到 CWA API
   - 解析 API 回應，轉換為內部 WeatherForecast 模型
   - 更新 weatherData signal

3. **展示資料**
   - ForecastDisplay 接收 weatherData
   - SuitabilityCard 接收第一筆 forecast，使用內部計算工具計算適宜度
   - WeatherAlerts 獨立呼叫 `weatherApiService.getEarthquakeReport()`

4. **錯誤處理**
   - API 錯誤 → WeatherApiService 重試機制 (最多 3 次)
   - 更新 error signal
   - UI 顯示錯誤訊息 (nz-alert)
   - 提供重試按鈕

5. **快取策略**
   - 記憶體快取 (Map 結構)
   - 天氣預報: 3 小時 TTL
   - 地震資訊: 5 分鐘 TTL
   - 自動清理過期快取

---

## 📦 API 整合設計 (完全自主實作)

### CWA API 直接整合

**整合方式** - 模組內自行實作 API 服務:

```typescript
// core/services/weather-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, retry, timeout, tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { CWA_API_CONFIG } from '../config/api.config';
import type { CwaApiResponse, WeatherForecast } from '../models';

@Injectable({ providedIn: 'root' })
export class WeatherApiService {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(CacheService);
  private readonly apiKey = CWA_API_CONFIG.apiKey; // 從環境變數注入
  
  /**
   * 取得縣市天氣預報
   */
  getCityForecast(locationName: string): Observable<WeatherForecast[]> {
    const cacheKey = `forecast_${locationName}`;
    
    // 檢查快取
    const cached = this.cache.get<WeatherForecast[]>(cacheKey);
    if (cached) {
      return of(cached);
    }
    
    // 呼叫 CWA API
    const params = new HttpParams()
      .set('Authorization', this.apiKey)
      .set('locationName', locationName);
    
    return this.http.get<CwaApiResponse>(
      `${CWA_API_CONFIG.baseUrl}/F-C0032-001`,
      { params }
    ).pipe(
      timeout(30000),
      retry(3),
      map(response => this.transformToWeatherForecast(response)),
      tap(data => this.cache.set(cacheKey, data, 3 * 60 * 60 * 1000)), // 3小時
      catchError(this.handleError)
    );
  }
  
  /**
   * 取得地震報告
   */
  getEarthquakeReport(limit = 10): Observable<EarthquakeInfo[]> {
    const cacheKey = `earthquake_${limit}`;
    
    const cached = this.cache.get<EarthquakeInfo[]>(cacheKey);
    if (cached) {
      return of(cached);
    }
    
    const params = new HttpParams()
      .set('Authorization', this.apiKey)
      .set('limit', limit.toString());
    
    return this.http.get<CwaApiResponse>(
      `${CWA_API_CONFIG.baseUrl}/E-A0016-001`,
      { params }
    ).pipe(
      timeout(30000),
      retry(3),
      map(response => this.transformToEarthquakeInfo(response)),
      tap(data => this.cache.set(cacheKey, data, 5 * 60 * 1000)), // 5分鐘
      catchError(this.handleError)
    );
  }
  
  /**
   * 轉換 API 回應為內部模型
   */
  private transformToWeatherForecast(response: CwaApiResponse): WeatherForecast[] {
    // 轉換邏輯...
    return [];
  }
  
  /**
   * 錯誤處理
   */
  private handleError(error: any): Observable<never> {
    console.error('Weather API Error:', error);
    return throwError(() => new Error('載入天氣資料失敗'));
  }
}
```

### 記憶體快取服務

```typescript
// core/services/cache.service.ts
import { Injectable } from '@angular/core';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

### CWA API 端點配置

```typescript
// core/config/api.config.ts
import { environment } from 'src/environments/environment';

export const CWA_API_CONFIG = {
  baseUrl: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore',
  apiKey: environment.CWA_API_KEY,
  timeout: 30000,
  retryAttempts: 3,
  
  // 資料集 ID
  datasets: {
    cityForecast: 'F-C0032-001',      // 一般天氣預報-今明36小時天氣預報
    earthquakeReport: 'E-A0016-001',   // 地震報告
    weatherStation: 'O-A0001-001'      // 自動氣象站-氣象觀測資料
  }
} as const;
```

### 資料模型定義

```typescript
// core/models/weather.model.ts
export interface WeatherForecast {
  locationName: string;
  startTime: string;
  endTime: string;
  weatherDescription: string;
  temperature: {
    min: number;
    max: number;
  };
  rainProbability: number;
}

export interface EarthquakeInfo {
  earthquakeNo: string;
  originTime: string;
  epicenterLocation: string;
  magnitude: number;
  depth: number;
}

// core/models/api-response.model.ts
export interface CwaApiResponse {
  success: string;
  records: {
    location: Array<{
      locationName: string;
      weatherElement: Array<{
        elementName: string;
        time: Array<{
          startTime: string;
          endTime: string;
          parameter: {
            parameterName: string;
            parameterValue?: string;
          };
        }>;
      }>;
    }>;
  };
}
```

### 環境變數配置

**位置**: `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  CWA_API_KEY: 'YOUR_API_KEY_HERE',  // 從環境變數注入
  // ... 其他配置
};
```

### API 端點說明

| 端點 | 資料集 ID | 用途 | 更新頻率 |
|------|-----------|------|----------|
| 一般天氣預報 | F-C0032-001 | 36小時天氣預報 | 每3小時 |
| 地震報告 | E-A0016-001 | 顯著有感地震報告 | 即時 |
| 自動氣象站 | O-A0001-001 | 即時觀測資料 | 每10分鐘 |

### 完全自主的優勢

1. ✅ **零外部依賴** - 不依賴專案其他模組
2. ✅ **獨立維護** - 模組內部可自由演進
3. ✅ **輕量化** - 只實作需要的功能
4. ✅ **快速部署** - 複製整個 weather 目錄即可移植
5. ✅ **測試隔離** - 單獨測試，不影響其他模組

---

## 🎨 UI/UX 設計規範

### 佈局設計

```
┌────────────────────────────────────────────────────────┐
│  氣象模組                                    [重新載入] │
├────────────────────────────────────────────────────────┤
│  選擇地點: [臺北市 ▼]                    [搜尋圖示]   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  【施工適宜度評估】                                     │
│  ┌────────────────────────────────────────────┐      │
│  │  分數: 85  等級: 良好                      │      │
│  │  影響因素:                                  │      │
│  │  - 降雨機率: 30% (中等)                    │      │
│  │  - 溫度: 25°C (舒適)                       │      │
│  │  建議: 天氣條件良好，可正常施工             │      │
│  └────────────────────────────────────────────┘      │
│                                                         │
│  【天氣預報】                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐                      │
│  │ 今天 │  │ 明天 │  │ 後天 │                      │
│  │ ☀️  │  │ ⛅   │  │ 🌧️  │                      │
│  │25-30°│  │23-28°│  │20-25°│                      │
│  │降雨30%│  │降雨50%│  │降雨70%│                    │
│  └──────┘  └──────┘  └──────┘                      │
│                                                         │
│  【氣象警報】                                          │
│  ⚠️ 地震速報: 芮氏規模 4.2，震央位於花蓮縣...        │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### 設計規範

1. **色彩系統**
   - 優秀 (excellent): 綠色 `#52c41a`
   - 良好 (good): 藍色 `#1890ff`
   - 尚可 (fair): 橙色 `#faad14`
   - 不佳 (poor): 紅色 `#f5222d`
   - 危險 (dangerous): 暗紅 `#cf1322`

2. **圖示系統**
   - 使用 Ant Design Icons
   - 天氣圖示使用 Emoji 或自定義 SVG
   - 保持圖示一致性

3. **響應式設計**
   - 支援手機、平板、桌面
   - 卡片佈局在小螢幕上垂直堆疊
   - 保持可讀性與可操作性

---

## 🧪 測試策略

### 單元測試

**測試覆蓋範圍**:
- ✅ 主協調器狀態管理
- ✅ 功能組件輸入輸出
- ✅ 格式化工具函數
- ✅ 計算邏輯 (施工適宜度)

**測試檔案**:
```
weather-module-view.component.spec.ts
forecast-display.component.spec.ts
location-selector.component.spec.ts
suitability-card.component.spec.ts
weather-alerts.component.spec.ts
weather-formatters.spec.ts
```

### 整合測試

**測試場景**:
- ✅ API 呼叫與快取機制
- ✅ 地點切換與資料更新
- ✅ 錯誤處理與重試
- ✅ 事件流與資料傳遞

---

## 📝 實施計畫

### Phase 1: 核心基礎設施 (2-3 小時)

**目標**: 建立模組核心層 (core/)

**任務清單**:
- [ ] 建立完整目錄結構
- [ ] 實作 API 配置 (`core/config/api.config.ts`)
- [ ] 實作常數定義 (`core/config/constants.ts`)
- [ ] 實作 API 回應模型 (`core/models/api-response.model.ts`)
- [ ] 實作天氣資料模型 (`core/models/weather.model.ts`)
- [ ] 實作記憶體快取服務 (`core/services/cache.service.ts`)
- [ ] 實作 CWA API 服務 (`core/services/weather-api.service.ts`)
- [ ] 單元測試核心服務

**交付物**:
- `core/` 目錄完整實作
- API 服務可正常呼叫 CWA API
- 記憶體快取機制運作正常

### Phase 2: 共享工具 (1-2 小時)

**目標**: 實作共享工具函數

**任務清單**:
- [ ] 實作格式化工具 (`shared/utils/formatters.ts`)
- [ ] 實作圖示映射 (`shared/utils/icons.ts`)
- [ ] 實作施工適宜度計算器 (`shared/utils/calculators.ts`)
- [ ] 單元測試工具函數

**交付物**:
- `shared/utils/` 完整實作
- 工具函數測試覆蓋率 > 90%

### Phase 3: 功能組件實作 (3-4 小時)

**目標**: 實作所有功能組件

**任務清單**:
- [ ] 實作 LocationSelectorComponent
- [ ] 實作 ForecastDisplayComponent
- [ ] 實作 SuitabilityCardComponent
- [ ] 實作 WeatherAlertsComponent
- [ ] 組件單元測試

**交付物**:
- 4 個功能組件完整實作
- 組件測試覆蓋率 > 80%

### Phase 4: 主協調器與整合 (2-3 小時)

**目標**: 整合所有組件

**任務清單**:
- [ ] 實作 WeatherModuleViewComponent
- [ ] 整合 WeatherApiService
- [ ] 實作狀態管理與資料流
- [ ] 實作錯誤處理
- [ ] 整合測試

**交付物**:
- 完整的主協調器
- 所有功能正常運作

### Phase 5: UI 優化與測試 (1-2 小時)

**目標**: 完善 UI 與測試

**任務清單**:
- [ ] 樣式優化與響應式設計
- [ ] 載入狀態與動畫
- [ ] 錯誤訊息優化
- [ ] E2E 測試

**交付物**:
- 完整的 UI 實作
- 測試覆蓋率 > 80%

**總計時間**: 9-14 小時

---

## 🔍 架構決策記錄 (ADR)

### ADR-001: 完全自主實作，不依賴現有 Climate Module

**決策**: 在 weather 模組內自行實作 CWA API 整合，不使用現有的 Climate Module

**理由**:
- ✅ **高內聚性**: 所有相關代碼集中在一個目錄
- ✅ **低耦合性**: 不依賴專案其他模組
- ✅ **獨立維護**: 模組可自由演進，不受其他模組影響
- ✅ **輕量化**: 只實作需要的功能，避免引入不必要的複雜性
- ✅ **可移植性**: 整個模組可獨立複製到其他專案

**取捨**:
- ⚠️ 需要自行實作 API 封裝與快取
- ⚠️ 與 Climate Module 有部分重複代碼
- ✅ 但獲得完全的自主控制權
- ✅ 維護成本更低（不需關注外部模組變更）

### ADR-002: Feature-Based 架構

**決策**: 採用功能導向架構，按業務功能劃分模組

**理由**:
- ✅ 高內聚性：相關功能組織在一起
- ✅ 低耦合性：功能間通過接口通訊
- ✅ 可擴展性：新增功能不影響現有功能
- ✅ 易於維護：功能職責清晰

**取捨**:
- ⚠️ 初始設置成本較高
- ✅ 長期維護成本更低

### ADR-003: 不使用 Firebase Functions

**決策**: 直接從前端呼叫 CWA API，不透過 Functions

**理由**:
- ✅ 簡化架構
- ✅ 減少延遲
- ✅ 降低成本
- ✅ CWA API 支援 CORS
- ✅ 公開資料不需要後端保護

**取捨**:
- ⚠️ API Key 暴露在前端 (使用環境變數保護)
- ✅ 對於公開資料 API 是可接受的

### ADR-004: Signals 狀態管理

**決策**: 使用 Angular Signals 進行狀態管理

**理由**:
- ✅ Angular 20 原生支援
- ✅ 細粒度響應式更新
- ✅ 效能優異
- ✅ 簡化狀態管理邏輯

**取捨**:
- ⚠️ 需要學習 Signals API
- ✅ 比 RxJS 更易於理解

### ADR-005: 記憶體快取，不存數據庫

**決策**: 使用記憶體快取 (Map)，不將天氣資料存儲到 Firestore

**理由**:
- ✅ 簡化架構：不需要 Repository 層
- ✅ 即時性：天氣資料實時從 API 獲取
- ✅ 符合需求：只展示資料，不需要歷史記錄
- ✅ 降低成本：避免 Firestore 讀寫費用

**取捨**:
- ⚠️ 重新整理頁面會重新載入資料
- ✅ 使用記憶體快取減輕 API 負擔
- ✅ 符合「極簡主義」原則

---

## 🚀 後續擴展方向

### 可能的擴展功能

1. **歷史資料查詢**
   - 查詢過去天氣資料
   - 趨勢分析與預測

2. **自訂警報規則**
   - 使用者自定義警報條件
   - 推送通知整合

3. **多地點監控**
   - 同時監控多個工地位置
   - 地圖視圖整合

4. **施工日誌整合**
   - 將天氣資料自動記錄到施工日誌
   - 天氣與施工進度相關性分析

5. **AI 預測模型**
   - 基於歷史資料的天氣預測
   - 施工適宜度智能推薦

---

## 📚 參考資料

### 官方文檔

- [中央氣象署開放資料平臺](https://opendata.cwa.gov.tw/dist/opendata-swagger.html)
- [Angular Signals 官方文檔](https://angular.dev/guide/signals)
- [ng-zorro-antd 組件庫](https://ng.ant.design/docs/introduce/zh)

### 專案文檔

- [GigHub 架構設計](/.github/instructions/ng-gighub-architecture.instructions.md)
- [Climate Module 實作](src/app/core/blueprint/modules/implementations/climate/)
- [Issues Module 參考](src/app/routes/blueprint/modules/issues/)

---

## ✅ 設計檢查清單

### 架構設計

- [x] 高內聚性：功能按業務劃分
- [x] 低耦合性：模組間透過接口通訊
- [x] 可擴展性：支援功能插件式擴展
- [x] 單一職責：每個組件職責明確
- [x] 極簡主義：只實作必要功能

### 技術實作

- [x] 使用 Angular 20 Signals
- [x] 使用 Standalone Components
- [x] 使用 inject() 依賴注入
- [x] 遵循三層架構
- [x] 整合現有 Climate Module

### 文檔完整性

- [x] 架構設計圖
- [x] 功能模組設計
- [x] API 整合方案
- [x] UI/UX 規範
- [x] 測試策略
- [x] 實施計畫
- [x] ADR 記錄

---

## 📞 聯絡資訊

**設計者**: GigHub Development Team  
**設計日期**: 2025-12-21  
**版本**: v1.0.0  
**狀態**: ✅ 設計完成，等待實施

---

**附註**: 本設計文檔遵循 GigHub 專案的架構規範與最佳實踐，確保與現有系統的一致性與可維護性。
