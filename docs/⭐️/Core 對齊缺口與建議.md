# Core 對齊缺口與建議（src/app/core）

## 背景
- 參考母體規範：`docs/⭐️/整體架構設計.md` 與 `src/app/core/AGENTS.md` 均要求 Core 承載認證、守衛、攔截器、租戶/權限、通知與跨域模型，並保持「UI → Service/Facade → Repository」三層分離。
- 目前 Core 已有 Event Bus、部分網路攔截器與基礎服務，但尚未完整覆蓋母體預期的核心能力。

## 現況快照（2025-12）
- `data-access/auth`：有 `auth.facade.ts` / `auth.port.ts` / `auth.state.ts`，Firebase 實作位於 `src/app/firebase/infra`，但缺少明確的 core 層權限/租戶封裝。
- `net/`：僅有 `default.interceptor.ts`、`helper.ts`、`refresh-token.ts`，尚未落位到 `interceptors/` 目錄，也缺少錯誤/Token/租戶等專職攔截器。
- `services/`：有 logger、error-tracking、performance、push-messaging 等，仍存在違規的 `firebase.service.ts`（包裝 Auth）。
- `guards/`：僅文檔與 `start-page.guard.ts`，缺少權限/租戶/模組啟用的實作。
- `notification/`：僅 README，缺少可重用的跨域通知服務。
- `models/`：未集中定義 `user/organization/repository/permission` 等核心模型，導致 Blueprint / Feature 之間無共享型別。

## 缺口與優先級
### P0（立即補齊）
1) **移除 Firebase 包裝服務**  
   - `core/services/firebase.service.ts` 違反「直接注入 @angular/fire」原則。改由 AuthFacade 或直接注入 `Auth`，並透過 `currentUserSignal` 提供狀態。
2) **攔截器目錄化與職責分拆**  
   - 新增 `core/interceptors/`，將 `net/default.interceptor.ts` 與 helper 拆分為：`base-url.interceptor.ts`、`auth-token.interceptor.ts`、`error-handler.interceptor.ts`、`refresh-token.interceptor.ts`。統一在 `core/index.ts` 或 `app.config.ts` 註冊。
3) **權限 + 租戶上下文服務**  
   - 新增 `core/services/permission/permission.service.ts` 與 `core/services/tenant/tenant-context.service.ts`，對外輸出 Signals（目前僅 Event Bus 內部有 tenant-context）。供守衛與 Feature 共用。

### P1（短期完成）
4) **核心模型集中**  
   - 於 `core/models/` 建立 `user.model.ts`、`organization.model.ts`、`repository.model.ts`、`permission.model.ts`，並在 `core/index.ts` 匯出，避免各 Feature 重複定義。
5) **路由守衛家族**  
   - 補齊 `auth.guard.ts`、`permission.guard.ts`、`tenant.guard.ts`，讓 routes/ 與 features/ 不再各自實作。
6) **跨域通知服務**  
   - 實作 `core/notification/notification.service.ts`：監聽 Event Bus，橋接到 UI（Toast/Message/Badge），統一錯誤與成功訊息格式。

### P2（中期強化）
7) **Event Bus 對齊介面**  
   - 釐清 `event-bus` 既有實作的對外 Facade（例如 `IEventBus` + `BlueprintDomainEvent`）與核心 Provider 列表，於 Core 層建立最小重匯出。
8) **匯出入口**  
   - 確保上述新目錄均在 `core/index.ts` 暴露，提供 features 一致的注入點。

## 對齊後目錄建議（目標狀態）
```
src/app/core/
├── auth/                      # Auth Facade/Port/State（authGuard 依賴）
├── guards/
│   ├── auth.guard.ts
│   ├── permission.guard.ts
│   └── tenant.guard.ts
├── interceptors/
│   ├── base-url.interceptor.ts
│   ├── auth-token.interceptor.ts
│   ├── refresh-token.interceptor.ts
│   └── error-handler.interceptor.ts
├── services/
│   ├── permission/permission.service.ts
│   ├── tenant/tenant-context.service.ts
│   ├── notification/notification.service.ts
│   ├── logger/logger.service.ts
│   ├── error-tracking.service.ts
│   └── performance-monitoring.service.ts
├── models/
│   ├── user.model.ts
│   ├── organization.model.ts
│   ├── repository.model.ts
│   └── permission.model.ts
├── event-bus/                 # 既有：保持現有目錄與重匯出
├── startup/                   # 既有：初始化流程
└── index.ts                   # 統一匯出
```

## 行動路線圖
1) **Phase 1 – 基線清理（P0）**：移除 `firebase.service.ts`、建立 `interceptors/` 目錄與 Provider 註冊、落地權限/租戶服務。
2) **Phase 2 – 基礎模型（P1）**：建立核心模型與路由守衛，並在 `core/index.ts` 匯出。
3) **Phase 3 – 通知與事件整合（P1-P2）**：完成跨域通知服務，校準 Event Bus 匯出，補齊使用手冊。

## 驗收檢查表
- [ ] Core 中無 Firebase 包裝層，全部直接注入 @angular/fire。
- [ ] Interceptors 職責分拆並集中註冊，覆蓋 Base URL / Token / Error / Refresh。
- [ ] 權限與租戶服務以 Signals 封裝，提供給守衛與 Feature。
- [ ] 核心模型與守衛可被所有 Feature 直接匯入，無重複型別。
- [ ] 通知服務可由 Event Bus 觸發，UI 介面一致（成功/錯誤/警告）。
