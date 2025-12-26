# 元件設計原則 (Component Design)

> 來源：`docs-old/ui-theme/COMPONENTS.md`、`IMPLEMENTATION_GUIDE.md`、`BEST_PRACTICES.md`。聚焦組件層級的外觀、互動與可重用性。

## 🎨 視覺與主題
- 使用玄武主題色階，按鈕/警示/徽章色彩與 `ui-theme/` 對齊。
- 卡片/表格/表單的邊距、圓角、陰影遵循主題設定；禁用 inline style。

## 🧭 互動與狀態
- 每個互動元件需具備：正常/hover/focus/active/disabled 狀態。
- 重要操作提供「次確認」或撤銷，錯誤訊息清晰且可重試。
- 表單欄位對齊、錯誤提示在欄位下方；必填以標記或輔助說明呈現。

## ♻️ 可重用性
- 優先使用共享元件庫（表格、抽屜、對話框、Badge）；新元件需沉澱至 shared。
- 以輸入/輸出明確的介面化 props，避免神奇常數；狀態以 Signals 管理。
- 列表元件提供 `trackBy`、分頁與快取策略，適用虛擬卷動場景。

## ✅ 檢查清單
- [ ] 狀態圖示/色彩符合主題與對比度要求
- [ ] 重要互動皆有鍵盤操作與清楚 focus 標示
- [ ] 列表/表格具篩選、排序、分頁與空狀態
- [ ] 表單欄位具 label、helper text、錯誤提示

## 相關來源
- `docs-old/ui-theme/COMPONENTS.md`
- `docs-old/ui-theme/IMPLEMENTATION_GUIDE.md`
- `docs-old/ui-theme/BEST_PRACTICES.md`
