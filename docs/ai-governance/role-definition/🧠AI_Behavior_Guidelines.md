# Angular v20 開發規範

## 目錄
1. [核心開發觀念](#核心開發觀念)  
   - [語言與框架](#語言與框架)  
   - [聲明式 & 響應式控制流](#聲明式--響應式控制流)  
   - [結構與模組化](#結構與模組化)  
   - [程式碼風格](#程式碼風格)  
   - [高階設計原則](#高階設計原則)  
   - [底層防技術債觀念](#底層防技術債觀念)  
2. [核心設計原則](#核心設計原則)  
   - [解耦合 (Decoupling)](#解耦合-decoupling)  
   - [單一職責 (Single Responsibility Principle, SRP)](#單一職責-single-responsibility-principle-srp)  
   - [避免違反關注分離原則 (Separation of Concerns)](#避免違反關注分離原則-separation-of-concerns)  
3. [Angular v20 新特性與模式](#angular-v20-新特性與模式)  

---

## 核心開發觀念

### 語言與框架
- 使用 **TypeScript + Angular v20 + RxJS + Signals / Standalone Components**。  
- 優先 **聲明式與響應式控制流**，避免手動 `subscribe` 或 callback。  

### 聲明式 & 響應式控制流
- 使用 `Observable` 搭配 `async` pipe 或 `Signals` 管理非同步資料。  
- 常用 RxJS 運算符：`switchMap`、`mergeMap`、`combineLatest`、`tap`。  
- 優先單向資料流 + 聲明式設計。  
- 使用 `Signals + computed()` 管理本地狀態。  
- Component 設定 `ChangeDetectionStrategy.OnPush`。  
- 禁止在 constructor 執行業務邏輯。  

### 結構與模組化
- 分層清晰：`Component`、`Service`、`Directive`、`Pipe`。  
- 優先 **功能模組化 (Feature Modules)**。  
- 副作用與狀態集中管理於 Service 或 Store（NgRx / Signals）。  
- 資料 / API / 副作用 → Service  
- 狀態管理 → Store / Signals / BehaviorSubject  
- UI → Component  

### 程式碼風格
- 命名規則：
  - 類 / Component / Pipe → **PascalCase**  
  - 函數 / 變數 → **camelCase**  
- 函數保持 **單一職責**、簡潔明瞭。  
- 儘量使用箭頭函數、環境變數、依賴注入，避免硬編碼。  

### 高階設計原則
- **單向資料流 + 聲明式設計**，保持代碼簡潔、可維護、可測試。  
- 優先可重用模組化設計，減少命令式邏輯。  

### 底層防技術債觀念

#### 1. 不可變性 (Immutability)
- **核心思想**：資料狀態不可被 Component 或函數直接修改，所有變更透過 Service 或 Store。  
- **實踐方式**：
  - Signals、RxJS `BehaviorSubject` 或 NgRx Store 均使用不可變資料結構。  
  - 物件/陣列使用 `readonly` 或 immutable 方案。  
- **好處**：
  - 避免隱性副作用  
  - 減少跨模組狀態污染  
  - 便於時間旅行調試與測試  

#### 2. 防禦性程式設計 (Defensive Programming)
- **核心思想**：系統假設所有輸入可能出錯，主動檢查與容錯。  
- **實踐方式**：
  - Service 層驗證 API 回傳格式、空值、異常。  
  - RxJS 流程加 `catchError`、`retry` 或 `defaultIfEmpty`。  
  - 使用 TypeScript `strict` 模式，避免隱性 any。  
- **好處**：
  - 減少未預期錯誤導致的技術債累積  
  - 減少 bug 回溯成本  

#### 3. 持續重構與技術債管理
- **核心思想**：技術債不可視而不管，需主動追蹤與評估。  
- **實踐方式**：
  - 使用 `TODO` 或 `@deprecated` 標記已知債務  
  - 定期 Sprint / Iteration 進行技術債清理  
  - 代碼覆蓋率 / Cyclomatic Complexity 作為技術債指標  
- **好處**：
  - 技術債不會累積成系統隱患  
  - AI 或團隊可優先處理高風險區域  

---

## 核心設計原則

### 解耦合 (Decoupling)
- 降低模組/Component/Service 之間依賴。  
- Component 不直接處理資料或副作用，邏輯放到 Service。  
- 使用 **DI** 或 **Signals/Observable** 對外提供資料。  
- 好處：易測試、可重用、可維護。  

### 單一職責 (Single Responsibility Principle, SRP)
- 每個 Component / Service / Pipe / Directive 只做一件事。  
- 實踐：
  - UI → Component  
  - 資料 / API → Service  
  - 狀態 → Store / Signals / BehaviorSubject  
- 避免 Component 同時處理 UI、資料抓取或計算邏輯。  

### 避免違反關注分離原則 (Separation of Concerns)
- 過度複雜的 Component → 降低可維護性、測試困難。  
- 實踐：
  - 使用 `Signals + computed()` 管理狀態。  
  - Component 設定 `ChangeDetectionStrategy.OnPush`。  
  - 不在 constructor 執行業務邏輯。  

---

## Angular v20 新特性與模式
- **Signals 模式** + **Standalone Components**。  
- 全新控制流語法：
  - `*ngIf → @if`  
  - `*ngFor → @for`  
  - `*ngSwitch → @switch`  
- **Zoneless Angular** 支援 SSR + Hydration。  
- 內建 **View Transitions**。  
- Angular DevTools 與 Build system 升級。  
- 新 **Functional Router** 路由模式。  
- **Control Flow Migration Tool**：自動轉換舊模板為 Signals 控制流。
