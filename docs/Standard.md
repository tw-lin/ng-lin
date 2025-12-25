# Angular v20 現代化開發規範

## 語言與框架
- TypeScript + Angular v20 + RxJS + Signals / Standalone Components

## 聲明式 & 響應式控制流
- 優先使用 `Observable + async pipe` 或 `Signals`，避免手動 `subscribe` 或 callback。
- 使用 RxJS 運算符 (`switchMap`, `mergeMap`, `combineLatest`, `tap`) 管理非同步流程。
- 使用 `Signals + computed()` 管理本地狀態。
- Component 使用 `OnPush` 變更檢測策略。
- 禁止直接在 constructor 執行業務邏輯。

## 結構與模組化
- Component、Service、Directive、Pipe 分層清晰。
- 優先功能模組 (Feature Modules)。
- 將副作用與狀態管理集中到 Service 或 Store（NgRx / Signals）。
- 資料 / API / 副作用 → Service
- 狀態管理 → Store / Signals / BehaviorSubject
- UI → Component

### 依賴方向
```
{
  "src/app": {
    "core": "核心 Service、全局 Provider",
    "features": "功能模組 (Feature Modules)",
    "firebase": "Firebase 封裝 (Auth / Firestore / Storage / FCM / Functions)",
    "layout": "共用 Layout / Routing",
    "shared": "共用 Component / Directive / Pipe / Utilities"
  }
}

````

## @angular/fire 統一使用規範
- 所有 Firebase 功能統一透過 Service 封裝，不直接在 Component 使用 `@angular/fire`。
- 導入順序規範：
  1. `@angular/fire/auth`
  2. `@angular/fire/firestore`
  3. `@angular/fire/storage`
  4. 其他 Firebase 功能 (`functions`, `messaging`, `realtime-db`)
- Service 內部使用 Firebase API，Component 透過 Service 或 Signals/Observable 訂閱資料。
- 避免在 Component constructor 中初始化 Firebase 或呼叫 API。
- 環境配置統一管理：API Key、Endpoints、Feature Flags 放在 `environment.ts`。

## 程式碼風格
- 命名：
  - 類 / Component / Pipe → PascalCase
  - 函數 / 變數 → camelCase
- 函數保持單一職責、簡潔明瞭。
- 儘量使用箭頭函數、環境變數與依賴注入，避免硬編碼。

## 高階原則
- 單向資料流 + 聲明式設計
- 保持代碼簡潔、可維護、可測試
- 優先可重用模組化設計，減少命令式邏輯

### 1. 解耦合 (Decoupling)
- 降低模組/Component/Service 之間的依賴。
- Component 不直接處理資料或副作用，把邏輯放到 Service。
- 使用依賴注入 (DI) 或 Signals/Observable 對外提供資料。
- 好處：易測試、可重用、可維護。

### 2. 單一職責 (Single Responsibility Principle, SRP)
- 每個 Component / Service / Pipe / Directive 都只做一件事。
- 避免 Component 既處理 UI，又做資料抓取、邏輯計算、狀態管理。

### 3. 違反關注分離原則 (Violating Separation of Concerns)
- 避免 Component 負責過多事情 → 破壞 SRP、降低可維護性、測試困難。
- 避免在 Component 內直接操作 Firebase 或非 UI 邏輯。

## AI 可解析流程圖
```mermaid
flowchart TD
  %% App 層級
  App["src/app"]

  Core["core\n- 核心 Service\n- 全局 Provider"]
  Features["features\n- 功能模組 (Feature Modules)"]
  Firebase["firebase\n- Auth / Firestore / Storage / FCM / Functions"]
  Layout["layout\n- 共用 Layout / Routing"]
  Shared["shared\n- Component / Directive / Pipe / Utilities"]

  %% App 結構
  App --> Core
  App --> Features
  App --> Firebase
  App --> Layout
  App --> Shared

  %% Firebase 封裝規範
  Auth["@angular/fire/auth"]
  Firestore["@angular/fire/firestore"]
  Storage["@angular/fire/storage"]
  OtherFirebase["其他 Firebase 功能\n(functions / messaging / realtime-db)"]

  Firebase --> Auth
  Firebase --> Firestore
  Firebase --> Storage
  Firebase --> OtherFirebase

  %% Component 與 Service
  Component["Component\n- UI\n- OnPush\n- 不操作 Firebase 直接 API"]
  Service["Service\n- API / Firebase / 狀態管理\n- Signals / Observable"]

  Features --> Component
  Component -->|透過 DI 或 Signals / Observable| Service
  Service -->|操作 Firebase API| Firebase

  %% 狀態管理
  Store["Store / Signals / BehaviorSubject"]
  Service --> Store
  Component -->|讀取狀態| Store
````