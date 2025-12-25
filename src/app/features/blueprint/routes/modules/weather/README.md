# 氣象模組 (Weather Module)

> GigHub 工地施工進度追蹤管理系統 - 完全自主的氣象模組

## 📖 簡介

氣象模組直接整合[中央氣象署開放資料平臺](https://opendata.cwa.gov.tw/dist/opendata-swagger.html) API，為施工管理提供即時天氣資訊與施工適宜度評估。本模組**完全自有化內聚**在 `src/app/routes/blueprint/modules/weather` 目錄，不依賴專案其他模組。

## 🎯 核心特性

### 完全自主 (Self-Contained)
- ✅ **零外部依賴** - 不依賴專案其他模組 (如 Climate Module)
- ✅ **內部三層架構** - UI → Services → Models (全在 weather 目錄內)
- ✅ **記憶體快取** - 不存數據庫，純展示功能
- ✅ **獨立維護** - 可單獨演進，不影響其他模組
- ✅ **高可移植性** - 複製整個目錄即可移植到其他專案

## 🎯 核心功能

### 1. 天氣預報顯示
- 36小時天氣預報
- 多時段預報（今天、明天、後天）
- 溫度範圍與降雨機率
- 視覺化天氣資訊

### 2. 地點選擇
- 全台縣市選擇
- 搜尋與篩選功能
- 記住使用者偏好

### 3. 施工適宜度評估
- 智能評估施工條件
- 考慮降雨、溫度、風速等因素
- 提供施工建議與警告
- 0-100 分數與等級評估

### 4. 氣象警報
- 地震資訊快訊
- 重要天氣警報
- 異常天氣通知

## 🏗️ 架構設計

### 設計原則

本模組遵循以下設計原則：

1. **高內聚性 (High Cohesion)** - 功能按業務領域劃分
2. **低耦合性 (Low Coupling)** - 模組間透過明確接口通訊
3. **可擴展性 (Extensibility)** - 支援功能插件式擴展
4. **單一職責 (Single Responsibility)** - 每個組件只負責一個職責
5. **極簡主義 (Minimalism)** - 只實作必要功能

### 目錄結構 (完全自有化內聚)

```
weather/                                 # 完全自主的氣象模組
├── WEATHER_MODULE_DESIGN.md            # 詳細設計文檔
├── README.md                           # 本文件
├── IMPLEMENTATION_GUIDE.md            # 實施指南
├── weather-module-view.component.ts   # 主協調器
├── index.ts                            # 公開 API
│
├── core/                               # 核心層 (模組內部)
│   ├── services/                      # 業務服務
│   │   ├── weather-api.service.ts    # CWA API 封裝
│   │   ├── cache.service.ts          # 記憶體快取
│   │   └── index.ts
│   ├── models/                        # 資料模型
│   │   ├── weather.model.ts          # 天氣資料模型
│   │   ├── api-response.model.ts     # API 回應模型
│   │   └── index.ts
│   └── config/                        # 配置
│       ├── api.config.ts             # API 配置
│       ├── constants.ts              # 常數定義
│       └── index.ts
│
├── features/                          # 功能模組
│   ├── forecast-display/             # 天氣預報顯示
│   ├── location-selector/            # 地點選擇器
│   ├── construction-suitability/     # 施工適宜度評估
│   └── weather-alerts/               # 氣象警報
│
└── shared/                            # 共享工具
    └── utils/                         # 工具函數
        ├── formatters.ts             # 格式化工具
        ├── icons.ts                  # 圖示映射
        ├── calculators.ts            # 計算工具
        └── index.ts
```

### 資料流 (完全自主)

```
使用者選擇地點
    ↓
WeatherModuleView (主協調器)
    ↓
WeatherApiService (模組內部服務)
    ↓ [記憶體快取檢查]
    ↓
中央氣象署 API
    ↓
轉換為內部 WeatherForecast 模型
    ↓
更新 Signals 狀態
    ↓
功能組件接收資料並顯示
```

**重點**:
- ✅ 不依賴外部模組 (如 Climate Module)
- ✅ 內部實作完整的 API 服務
- ✅ 記憶體快取 (Map)，不存 Firestore
- ✅ 直接呼叫 CWA API，不透過 Functions

## 🔧 技術規格

### 技術棧

- **框架**: Angular 20.3.x
- **UI 庫**: ng-zorro-antd 20.3.x
- **狀態管理**: Angular Signals
- **HTTP 客戶端**: Angular HttpClient
- **API**: 中央氣象署開放資料平臺 API

### 核心服務 (模組內部)

**WeatherApiService** - CWA API 封裝
- 直接呼叫 CWA API
- 自動重試機制 (3次)
- 超時控制 (30秒)
- 錯誤處理

**CacheService** - 記憶體快取
- Map 資料結構
- TTL 過期機制
- 天氣預報: 3小時
- 地震資訊: 5分鐘

### CWA API 端點

| 端點 | 資料集 ID | 用途 | 快取時間 |
|------|-----------|------|----------|
| 一般天氣預報 | F-C0032-001 | 36小時天氣預報 | 3小時 |
| 地震報告 | E-A0016-001 | 顯著有感地震 | 5分鐘 |

### 不依賴的模組

- ❌ `@core/blueprint/modules/implementations/climate` - 完全不使用
- ❌ Firestore - 不存儲天氣資料
- ❌ Firebase Functions - 直接呼叫 API

### 環境配置

需要在環境變數中設定 CWA API Key：

```typescript
// src/environments/environment.ts
export const environment = {
  // ... 其他配置
  CWA_API_KEY: 'YOUR_API_KEY_HERE'
};
```

## 📋 實施計畫

### Phase 1: 核心基礎設施 (2-3 小時)

- [ ] 建立完整目錄結構
- [ ] 實作 API 配置與常數
- [ ] 實作資料模型 (weather.model.ts, api-response.model.ts)
- [ ] 實作記憶體快取服務 (cache.service.ts)
- [ ] 實作 CWA API 服務 (weather-api.service.ts)
- [ ] 單元測試核心服務

### Phase 2: 共享工具 (1-2 小時)

- [ ] 實作格式化工具 (formatters.ts)
- [ ] 實作圖示映射 (icons.ts)
- [ ] 實作施工適宜度計算器 (calculators.ts)
- [ ] 單元測試工具函數

### Phase 3: 功能組件實作 (3-4 小時)

- [ ] 實作 LocationSelectorComponent
- [ ] 實作 ForecastDisplayComponent
- [ ] 實作 SuitabilityCardComponent
- [ ] 實作 WeatherAlertsComponent
- [ ] 組件單元測試

### Phase 4: 主協調器與整合 (2-3 小時)

- [ ] 實作 WeatherModuleViewComponent
- [ ] 整合 WeatherApiService
- [ ] 實作狀態管理與資料流
- [ ] 整合測試

### Phase 5: UI 優化與測試 (1-2 小時)

- [ ] 樣式優化與響應式設計
- [ ] 載入狀態與動畫
- [ ] E2E 測試

**總計**: 9-14 小時

## 🧪 測試

### 單元測試

```bash
# 執行單元測試
npm run test -- --include='**/weather/**/*.spec.ts'
```

### E2E 測試

```bash
# 執行 E2E 測試
npm run e2e
```

### 測試覆蓋率

目標測試覆蓋率: **> 80%**

## 📚 API 使用範例

### 取得天氣預報 (使用模組內部服務)

```typescript
import { WeatherApiService } from './core/services/weather-api.service';

export class WeatherModuleViewComponent {
  private readonly weatherApi = inject(WeatherApiService);
  
  async loadWeather(location: string): Promise<void> {
    this.weatherApi.getCityForecast(location).subscribe({
      next: (forecasts) => {
        this.weatherData.set(forecasts);
      },
      error: (error) => {
        this.error.set('載入天氣資料失敗');
      }
    });
  }
}
```

### 計算施工適宜度 (使用模組內部工具)

```typescript
import { calculateConstructionSuitability } from './shared/utils/calculators';

export class SuitabilityCardComponent {
  suitability = computed(() => {
    const forecast = this.forecast();
    if (!forecast) return null;
    return calculateConstructionSuitability(forecast);
  });
}
```

### 取得地震資訊 (使用模組內部服務)

```typescript
import { WeatherApiService } from './core/services/weather-api.service';

export class WeatherAlertsComponent {
  private readonly weatherApi = inject(WeatherApiService);
  
  async loadEarthquakes(): Promise<void> {
    this.weatherApi.getEarthquakeReport(10).subscribe({
      next: (earthquakes) => {
        this.earthquakes.set(earthquakes);
      }
    });
  }
}
```

## 🎨 UI 設計規範

### 色彩系統

- **優秀 (excellent)**: 綠色 `#52c41a`
- **良好 (good)**: 藍色 `#1890ff`
- **尚可 (fair)**: 橙色 `#faad14`
- **不佳 (poor)**: 紅色 `#f5222d`
- **危險 (dangerous)**: 暗紅 `#cf1322`

### 響應式設計

- 支援手機、平板、桌面
- 卡片佈局在小螢幕上垂直堆疊
- 保持可讀性與可操作性

## 🔍 常見問題 (FAQ)

### Q: 為什麼不使用現有的 Climate Module？

A: 為了實現**完全自有化內聚**，weather 模組需要：
- ✅ 零外部依賴，獨立維護
- ✅ 可單獨演進，不受其他模組影響
- ✅ 高可移植性，可複製到其他專案
- ✅ 符合「高內聚、低耦合」原則

### Q: 為什麼不使用 Firebase Functions？

A: 為了簡化架構、減少延遲與成本，且 CWA API 支援 CORS，可以直接從前端呼叫。

### Q: API Key 如何保護？

A: 使用環境變數管理，不要將 API Key 提交到版本控制。在生產環境中，使用 Firebase 環境配置或 CI/CD 變數注入。

### Q: 為什麼不存數據庫？

A: 符合需求「只與 API 交互顯示天氣」，使用記憶體快取即可，避免：
- ❌ 不必要的 Firestore 讀寫費用
- ❌ 增加複雜性 (Repository 層)
- ✅ 天氣資料實時性更高
- ✅ 符合「極簡主義」原則

### Q: 快取策略是什麼？

A: 記憶體快取 (Map 資料結構)：
- 天氣預報：3 小時 TTL
- 地震資料：5 分鐘 TTL
- 自動清理過期快取

### Q: 如何擴展新功能？

A: 在對應目錄新增：
- 新服務 → `core/services/`
- 新模型 → `core/models/`
- 新功能組件 → `features/`
- 新工具 → `shared/utils/`

### Q: 可以移植到其他專案嗎？

A: 完全可以！只需：
1. 複製整個 `weather/` 目錄
2. 設定 `CWA_API_KEY` 環境變數
3. 安裝依賴 (Angular, ng-zorro-antd)
4. 即可使用

## 🚀 後續擴展

### 計畫中的功能

1. **歷史資料查詢** - 查詢過去天氣資料與趨勢分析
2. **自訂警報規則** - 使用者自定義警報條件
3. **多地點監控** - 同時監控多個工地位置
4. **施工日誌整合** - 將天氣資料自動記錄到施工日誌
5. **AI 預測模型** - 基於歷史資料的天氣預測

## 📞 支援

如有問題或建議，請聯絡：

- **開發團隊**: GigHub Development Team
- **專案倉庫**: [GitHub Repository](https://github.com/ac484/ng-gighub)
- **文檔**: `/docs/` 目錄

## 📄 授權

本專案遵循 MIT 授權條款。

---

**版本**: v1.0.0  
**最後更新**: 2025-12-21  
**狀態**: ✅ 設計完成，等待實施
