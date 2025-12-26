# 合約模組實作快速開始 (Contract Module Implementation Quickstart)

> 來源：`docs-old/CONTRACT_IMPLEMENTATION_QUICK_START.md`、`CONTRACT_MODULE_IMPLEMENTATION_SUMMARY.md`。提供最小步驟、角色分工與驗收檢查。

## 🚀 快速開始步驟
1. **準備 Blueprint/權限**：確認成員與 `contract:*` 權限齊備。
2. **上傳管線**：依 Storage 路徑規範（含 `blueprintId`）建立上傳；前端驗證檔案型別/大小。
3. **解析與回寫**：觸發 Functions/AI 解析，經 Repository 落地 Firestore（含版本與審計欄位）。
4. **事件通知**：發布 `contract.uploaded` / `contract.parsed`，UI 依事件更新。
5. **驗收**：E2E（上傳→解析→回寫→列表顯示）+ Security Rules（跨 Blueprint 拒絕）。

## 🧭 角色/責任
- **前端**：檔案驗證、進度顯示、錯誤/重試、權限提示。
- **Functions/AI**：解析、錯誤分類、回寫欄位對齊資料模型。
- **Security Rules**：Storage/Firestore 雙重權限；禁止跨 Blueprint。

## ✅ 檢查清單
- [ ] Storage 路徑/權限正確；非成員禁止上傳
- [ ] 解析錯誤可重試；保留原檔與解析版本
- [ ] Repository 寫入使用欄位轉換與重試
- [ ] 事件符合 Blueprint 邊界且 UI 已訂閱
- [ ] Emulator + E2E 覆蓋上傳/解析/回寫路徑

## 相關來源
- `docs-old/CONTRACT_IMPLEMENTATION_QUICK_START.md`
- `docs-old/CONTRACT_MODULE_IMPLEMENTATION_SUMMARY.md`
