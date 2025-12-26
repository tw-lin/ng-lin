# 技術債治理原則 (Technical Debt Remediation)

> 來源：`docs-old/TECHNICAL_DEBT_REMEDIATION_PLAN.md`。整理技術債分類、處理順序與驗收要點。

## 🗂️ 分類與優先級
- **TD-1 架構/邊界**：三層分離、Repository 強制、事件風暴防護。
- **TD-2 安全/權限**: Security Rules 對齊、Guard/ACL、一致的 Blueprint 邊界。
- **TD-3 測試/品質**: Emulator + Security Rules 單測、E2E 關鍵流程。
- **TD-4 效能/成本**: 查詢索引/分頁、OnPush+trackBy、快取/批次、成本警戒。
- **TD-5 UX/可存取性**: 空狀態/錯誤態、鍵盤可用、對比度、進度與重試提示。

## 🔧 處理順序
1) 消除安全/邊界風險 (TD-1/TD-2)
2) 彌補測試缺口 (TD-3)
3) 優化效能與成本 (TD-4)
4) 提升 UX/可存取性 (TD-5)

## ✅ 驗收檢查清單
- [ ] UI 不直連 Repository；Repository 使用重試與欄位轉換
- [ ] Security Rules、Guard、UI 權限對齊且有測試
- [ ] Emulator/Security Rules/E2E 覆蓋主要讀寫路徑
- [ ] 主要查詢具索引、分頁；表格 OnPush+trackBy/虛擬卷動
- [ ] 重要操作有進度/重試/錯誤提示，WCAG 2.1 AA 基線

## 相關來源
- `docs-old/TECHNICAL_DEBT_REMEDIATION_PLAN.md`
