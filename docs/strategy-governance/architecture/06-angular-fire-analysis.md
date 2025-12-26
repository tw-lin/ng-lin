# Angular Fire 整合分析摘要

> 來源：`docs-old/architecture/ANGULAR_FIRE_INDEX.md`、`ANGULAR_FIRE_INTEGRATION_ANALYSIS.md`、`ANGULAR_FIRE_VISUAL_SUMMARY.md`、`ANGULAR_FIRE_整合分析_中文摘要.md`、`README_ANGULAR_FIRE_ANALYSIS.md`。彙整 Angular/Firebase 整合的決策、風險與行動。

## 🎯 重點
- 採用 AngularFire 直接存取 Firestore/Storage/Auth，配合 Repository pattern，避免 UI 直呼。
- SSR/冷啟動注意：減少首次載入依賴、懶載 heavy 模組。
- 配置分層：app.config 提供 Firebase providers，Repo 以 inject() 注入。

## ⚠️ 風險
- **注入上下文外呼叫**：導致警告/不穩定。
- **配額與成本**：讀寫/Storage 熱點與索引不足。
- **安全**：Rules 未覆蓋 blueprintId、ownerRole，易越權。

## 🚧 行動
- Repository 封裝與重試；UI/Service 禁止直呼 Firestore。
- 索引與批次：熱查詢建立複合索引；批次寫降低成本。
- 安全：Rules 強制 blueprintId/ownerId；functions-storage 處理檔案驗證。
- 監控：Firebase Performance/Alerts 對讀寫、延遲與錯誤率設 KPI。

## 相關來源
- `docs-old/architecture/ANGULAR_FIRE_INDEX.md`
- `docs-old/architecture/ANGULAR_FIRE_INTEGRATION_ANALYSIS.md`
- `docs-old/architecture/ANGULAR_FIRE_VISUAL_SUMMARY.md`
- `docs-old/architecture/ANGULAR_FIRE_整合分析_中文摘要.md`
- `docs-old/architecture/README_ANGULAR_FIRE_ANALYSIS.md`
