# 合約模組 AI / 文件解析架構 (Contract AI & Document Parsing)

> 來源：`docs-old/architecture/Contract-AI-Integration_Architecture.md`、`CONTRACT_UPLOAD_AND_PARSING.md`、`CONTRACT_UPLOAD_IMPLEMENTATION.md`、`OCR-PDF-PARSING-ANALYSIS.md`。整理合約上傳、解析、事件流與安全要求。

## 🌐 流程概覽
1. **上傳**：前端上傳至 Cloud Storage（需權限檢查與檔案型別驗證）。
2. **解析**：Functions 觸發 AI 解析 (Document AI) → 產生結構化欄位/工項清單。
3. **寫入**：Repository 將解析結果落地 Firestore，記錄版本與審計欄位。
4. **事件通知**：BlueprintEventBus 發布 `contract.parsed`/`contract.uploaded` 供 UI 更新。

## 🔐 安全與治理
- 前端：僅 Blueprint 成員可上傳；檔案類型/大小限制；病毒掃描（如啟用）。
- 後端：Security Rules 依 Blueprint 權限；寫入需 `blueprintId` 驗證。
- 日誌/審計：上傳/解析/回寫全程紀錄 requestId、actor、timestamp。

## ✅ 檢查清單
- [ ] Storage 路徑與權限策略已定義（避免跨 Blueprint 混用）
- [ ] 解析錯誤可回報並重試；保留原檔與解析版本
- [ ] Firestore 寫入走 Repository，欄位統一 snake_case → domain model
- [ ] 事件對齊 UI/Guard，避免未授權訂閱
- [ ] Emulator + 合約上傳 E2E 覆蓋

## 相關來源
- `docs-old/architecture/Contract-AI-Integration_Architecture.md`
- `docs-old/CONTRACT_UPLOAD_AND_PARSING.md`
- `docs-old/CONTRACT_UPLOAD_IMPLEMENTATION.md`
- `docs-old/analysis/OCR-PDF-PARSING-ANALYSIS.md`
