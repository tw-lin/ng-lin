# 合約上傳與解析實作指南 (Contract Upload & AI Parsing)

> 來源：`docs-old/CONTRACT_UPLOAD_AND_PARSING.md`、`CONTRACT_UPLOAD_IMPLEMENTATION.md`。摘要上傳決策、流程與風險控管。

## 🎯 架構決策
- **直接 Firebase Storage 上傳**：使用 AngularFire `uploadBytesResumable` 取得即時進度、降低延遲與成本。
- **functions-storage 角色**：後置驗證與自動處理（檔案掃描、縮圖/中繼資料、審計）。

## 🔄 高階流程
1) 前端：驗證檔案類型/大小 → `uploadBytesResumable` 至含 `blueprintId` 的 Storage 路徑。
2) 監聽進度：UI 顯示進度/重試/取消；錯誤提示與紀錄。
3) 解析：觸發 Functions/AI 解析，產出結構化結果與版本欄位。
4) 回寫：Repository 對齊欄位（blueprintId、version、parserVersion、audit 欄位）。
5) 事件：發布 `contract.uploaded` / `contract.parsed`；UI 訂閱更新。

## ⚠️ 風險與對策
- **跨 Blueprint 上傳**：Storage 路徑/Rules 嚴格含 `blueprintId`，UI 也校驗。
- **解析失敗**：分類錯誤並允許重試/人工覆寫，保留原檔。
- **成本/配額**：大檔/併發需節流；設定告警與配額監控。
- **安全**：functions-storage 執行病毒/格式檢查；禁止未授權讀取原檔。

## ✅ 檢查清單
- [ ] 上傳路徑含 blueprintId，未授權拒絕
- [ ] UI 進度/錯誤/重試可見
- [ ] 解析結果含版本與審計欄位；回寫由 Repository 處理
- [ ] 事件發布與訂閱遵循 Blueprint 邊界
- [ ] 成本與配額告警已設

## 相關來源
- `docs-old/CONTRACT_UPLOAD_AND_PARSING.md`
- `docs-old/CONTRACT_UPLOAD_IMPLEMENTATION.md`
