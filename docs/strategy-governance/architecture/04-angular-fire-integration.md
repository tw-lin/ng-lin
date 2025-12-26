# Angular + Firebase 整合摘要 (Angular-Fire Integration)

> 來源：`docs-old/architecture/ANGULAR_FIRE_INDEX.md`、`ANGULAR_FIRE_INTEGRATION_ANALYSIS.md`、`ANGULAR_FIRE_VISUAL_SUMMARY.md`、`firebase-adapter-pattern-proposal.md`、`firebase-adapter-implementation-roadmap.md`。聚焦整合模式、Adapter 策略與測試要求。

## 🧭 整合策略
- **Repository 強制**：所有 Firestore/Functions 存取走 Repository，禁止 UI/Service 直接呼叫 SDK。
- **Adapter Pattern**：以 Adapter 封裝 SDK 呼叫，暴露純型別方法，利於替換與測試。
- **Error/Retry 標準化**：使用 `executeWithRetry` + 自動分類可重試/不可重試錯誤。

## 🔧 主要決策
- **Signals 為主**：資料流以 Signals/Resource 為核心，必要時 `toSignal` 包裹 RxJS。
- **安全對齊**：前端權限檢查須與 Security Rules 一致；所有寫入路徑需 emulator 覆蓋。
- **版本控管**：遵循語意化版本，API/契約變更需同步更新 `api/interface-spec`。

## ✅ 檢查清單
- [ ] Repository 皆繼承 `FirestoreBaseRepository`（重試/欄位轉換/軟刪除）
- [ ] Adapter 有單元測試與 emulator 測試案例
- [ ] 主要查詢具索引、分頁與限制
- [ ] Functions 呼叫經 `httpsCallable`，錯誤映射至領域錯誤
- [ ] 日誌/追蹤覆蓋：延遲、錯誤碼、重試次數

## 相關來源
- `docs-old/architecture/firebase-adapter-pattern-proposal.md`
- `docs-old/architecture/firebase-adapter-implementation-roadmap.md`
- `docs-old/architecture/ANGULAR_FIRE_*`
