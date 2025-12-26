# 三層架構實作重點 (Three-Layer Architecture Playbook)

> 來源：`docs-old/ARCHITECTURE.md`、`docs-old/architecture/EXECUTIVE_SUMMARY.md`。整理核心落地細節、禁行事項與效能/安全基線。

## 🔑 責任切分

- **Presentation (UI)**: 僅處理展示與互動，使用 Signals + OnPush；禁止直接呼叫 Firestore/Repository。
- **Service/Facade**: 協調多個 Repository、事件發布/訂閱、跨模組編排；禁止 UI 邏輯。
- **Repository**: 唯一資料存取層，封裝 Firestore 查詢、欄位轉換、重試與錯誤處理；禁止業務邏輯。

## 🚫 禁行事項

- UI 直連 Firestore/Repository
- NgModule、新舊控制流混用（改用 Standalone + `@if/@for`）
- `any` 類型、手動訂閱（改用 Signals 或 `takeUntilDestroyed`）
- Constructor 執行業務邏輯

## 🔐 安全與授權

- Blueprint 作為**權限邊界**；資料只需持有 `blueprintId`。
- 前端三層檢查：UI 權限 → Guard/ACL → Security Rules（最後防線）。
- Dedicated Membership Collection 模式：`blueprintMembers/{uid_blueprintId}` 決定讀寫與權限。

## ⚡ 效能基線

- 全面 OnPush + `trackBy`；大型列表啟用虛擬卷動。
- 查詢加入分頁與複合索引；Repository 內建重試/快取策略。
- Signals 為主的細粒度響應式：`signal`/`computed`/`effect`。

## 📌 執行清單

- [ ] UI 僅注入 Service；Service 僅注入 Repository
- [ ] Repository 全部採用 `FirestoreBaseRepository` 與 `executeWithRetry`
- [ ] 事件透過 BlueprintEventBus，避免事件風暴（節流/批次）
- [ ] Security Rules 與 UI/Guard 權限對齊
- [ ] Emulator + E2E 覆蓋主要讀寫路徑

## 相關來源
- `docs-old/ARCHITECTURE.md`
- `docs-old/architecture/EXECUTIVE_SUMMARY.md`
- `docs-old/architecture/firebase-adapter-implementation-roadmap.md`
