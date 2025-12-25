---

# Blueprint Module Template (Angular v20 Standalone)

> Angular 20 官方指引（standalone components + Route 配置）建議優先使用無 NgModule 的設計。以下範本符合 GigHub 的 UI → Service → Repository 分層與 signals 狀態管理。

## 1️⃣ 推薦目錄結構（Standalone + Feature-Based）

```
src/app/routes/blueprint/modules/feature/
│
├─ README.md
├─ routes.ts                        # export const FEATURE_ROUTES: Routes = [...]
├─ feature-shell.component.ts       # Thin orchestrator (standalone, OnPush)
│
├─ components/                      # Page-level standalone components
│   ├─ feature-list.component.ts
│   ├─ feature-detail.component.ts
│   └─ feature-edit.component.ts
│
├─ ui/                              # Presentational pieces (cards, badges, forms)
│   └─ ...
│
├─ services/                        # Business coordination (no Firestore here)
│   ├─ feature.service.ts
│   └─ feature.facade.ts            # Optional signals-based facade/store API
│
├─ data-access/
│   ├─ repositories/
│   │   └─ feature.repository.ts    # Extends FirestoreBaseRepository<T>
│   └─ models/                      # DTO / domain contracts
│
├─ state/                           # Signals state containers
│   └─ feature.store.ts
│
├─ shared/                          # Reusable UI for this feature
│   └─ components/
│
└─ index.ts                         # Public exports
```

## 2️⃣ Routing（Angular 20 standalone lazy loading）

* 以 `Route[]` 匯出，供 Blueprint route 使用 `loadChildren` 或直接匯入。
* 頁面元件使用 `standalone: true`，並以 `SHARED_IMPORTS` / 特定 imports 取代 NgModule。

範例：
```typescript
import { Routes } from '@angular/router';
import { FeatureShellComponent } from './feature-shell.component';
import { FeatureListComponent } from './components/feature-list.component';
import { FeatureDetailComponent } from './components/feature-detail.component';

export const FEATURE_ROUTES: Routes = [
  {
    path: '',
    component: FeatureShellComponent,
    children: [
      { path: '', component: FeatureListComponent },
      { path: ':id', component: FeatureDetailComponent },
    ],
  },
];
```

## 3️⃣ 核心原則

1. **Standalone First**  
   無 NgModule / `forRoot` / `forFeature`。Routing、DI、imports 皆由元件與 route 配置完成。

2. **UI → Service → Repository**  
   * UI：signals 管理本地狀態，使用 `input()/output()`、`@if/@for` 控制流。  
   * Service/Facade：協調權限、校驗與流程；不得直接存取 Firestore。  
   * Repository：唯一的 Firestore 入口，繼承 `FirestoreBaseRepository`，實作資料轉換與重試。

3. **Feature Isolation**  
   子功能（list/detail/edit...）自包含，透過 facade/store 共享狀態與事件，避免跨 feature 耦合。

4. **Lazy + Permission Aware**  
   Route 層決定載入與守衛；權限判斷集中於 service/facade（UI 只負責呈現禁用/隱藏狀態）。

5. **SRP + Clear Interfaces**  
   每個模組專注單一責任（Contracts、Tasks、Settings）；對外只暴露 facade / public API，禁止直接操作內部狀態或 Firestore 集合。

6. **Centralized Data Access**  
   Firestore 或 API 只經 Repository；更換資料來源不影響 UI/Service 邏輯。

## 4️⃣ Extensibility & Shared Assets

* 新增子功能時，以 `components/` 或 `features/` 子資料夾自包含實作，並更新 `routes.ts`。  
* 共用的 ST 表格、表單 schema、timeline 等放在 `shared/`，或提升到 `src/app/shared/components`。  
* 資料模型、Repository 查詢條件保持通用型態以利重用與測試。

### Sub-Modules Guidelines

* 子模組自包含服務、state、UI；保持命名一致。  
* 優先 lazy load，維持邊界清晰。  
* 對外用 facade 包裹 service，避免其他模組依賴內部實作。

### State & Permissions

* 共享狀態可用 signals / RxJS；避免重複讀取。  
* 權限邏輯集中於 Permissions/Facade；UI 只呈現禁用或隱藏。  
* 使用 Firebase Claims / centralized PermissionsService 做授權。

### Notes / Best Practices

* 保持目錄一致；可選目錄（state/utils）可留空以保結構。  
* 永遠遵守 Service → Facade → Component 流向；Firestore 更動僅影響 Repository。  
* 每個子資料夾 README 紀錄用途、權限與路由。

## 5️⃣ Inter-Module Collaboration

1. **Facade as Public API**：跨模組呼叫只注入 facade；禁止直接依賴他模組的內部 service/state。  
2. **Shared/Core for Infrastructure**：共用服務（Permissions、User、Notification）放 shared/core，避免業務邏輯混入。  
3. **Event-Driven**：使用 signals/Observables 做跨模組事件（如 `contractCreated$`）；維持 lazy-load 友善。  
4. **Avoid Cycles**：不互相匯入 feature 目錄；只透過 facade 或 shared/core。  
5. **Shared Contracts**：跨模組 DTO 定義於 `shared/models` 或 `core/models`，避免耦合。  
6. **Permissions First**：跨模組操作前先以集中式 PermissionsService 驗證再呼叫 facade。

## 5️⃣ 最佳實踐

* 使用 `inject()` 取代 constructor DI；狀態以 `signal/computed/effect` 組合。  
* Firestore 查詢一律走 Repository，並以 Security Rules 做第二道防線。  
* 控制流使用 `@if / @for / @switch`，事件使用 `output()`。  
* 拆分 orchestrator（Shell）與純 UI 元件，Shell 僅負責調度與管控 loading/error。  
* 每個子目錄保留 README 或 index barrel，描述公開 API 與權限需求。
