# 可存取性指引 (Accessibility)

> 來源：`docs-old/ui-theme/TESTING.md`、`ui-theme/IMPLEMENTATION_GUIDE.md`。對齊 WCAG 2.1 AA，提供檢查重點。

## 🔑 原則
- 鍵盤可導航且焦點可見；隱藏元素不可聚焦。
- 色彩對比：一般文字 ≥ 4.5:1，大字 ≥ 3:1，互動元素 ≥ 3:1。
- 使用語義化標籤與 aria-* 屬性；互動名稱需包含視覺標籤。

## ✅ 檢查清單
- [ ] 所有互動元素可 Tab/Shift+Tab 並有 focus 標示
- [ ] 圖片/圖示具備 `alt` 或 `aria-label`
- [ ] 表單欄位有對應 label，錯誤提示可被讀屏辨識
- [ ] 跳躍連結/主要區塊定位（例如 “Skip to main content”）
- [ ] 對話框/抽屜：焦點圈與 Esc 關閉；背景不可操作
- [ ] 表格：表頭 `scope` 或 `aria` 相關屬性，空狀態提示

## 🧪 測試建議
- Lighthouse / axe-core / Accessibility Insights
- 鍵盤巡覽（Tab/Shift+Tab/Enter/Escape）與螢幕閱讀器粗驗

## 相關來源
- `docs-old/ui-theme/TESTING.md`
- `docs-old/ui-theme/IMPLEMENTATION_GUIDE.md`
