# 合約模組架構摘要 (Contract Module Architecture)

> 來源：`docs-old/CONTRACT_MODULE_ARCHITECTURE.md`、`CONTRACT_MODULE_IMPLEMENTATION_SUMMARY.md`。整理模組邊界、流程與風險。

## 🏗️ 模組邊界
- **上傳與儲存**：Storage 路徑含 `blueprintId`；前端/Rules 雙驗證。
- **解析與資料流**：Functions + AI 解析 → Repository 寫入 `contracts` / `parsed_contract_data`。
- **事件通報**：`contract.uploaded`、`contract.parsed`、`contract.failed`；UI 依事件更新狀態。

## 🌐 高階流程
1. 使用者於 Blueprint 內上傳合約 → Storage
2. 觸發解析 → 產生結構化結果（工項、金額、版本）
3. Repository 寫入並附審計欄位
4. 發布事件 → UI/其他模組更新

## ⚠️ 風險與對策
- **權限錯置**：Storage/Firestore/事件訂閱需同一 Blueprint 邊界；缺失則拒絕。
- **解析失敗/重試**：分類錯誤、支持重試與人工覆寫；保留原始檔。
- **性能/成本**：解析批次與佇列，避免風暴；必要時使用預估成本/配額告警。

## ✅ 檢查清單
- [ ] 路徑/Rules 防止跨 Blueprint
- [ ] 版本與審計欄位完整（version, parserVersion, createdAt, actor）
- [ ] 事件與 UI/Guard 對齊；無未授權訂閱
- [ ] 解析失敗/重試/人工覆寫流程可用

## 相關來源
- `docs-old/CONTRACT_MODULE_ARCHITECTURE.md`
- `docs-old/CONTRACT_MODULE_IMPLEMENTATION_SUMMARY.md`
