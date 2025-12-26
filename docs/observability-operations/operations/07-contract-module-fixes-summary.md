# 合約模組修復摘要 (Contract Module Fixes Summary)

> 來源：`docs-old/FIXES_SUMMARY.md`。摘要合約模組主要缺陷與對應修復。

## 🐞 問題概述
- **NG0203**：`effect()` 在注入上下文外呼叫（notify/task header 元件）。
- **ContractFacade 未初始化**：未設定 blueprintId 時即呼叫，導致錯誤。
- **Firebase API 注入上下文警告**：Repository 直呼 Firebase API。

## 🔧 修復方案
- **effect() 放入 constructor**：避免在 `ngOnInit()` 觸發 NG0203。
- **Facade 初始化**：在 modal / wizard / view 頁面載入前注入 blueprintId / userId。
- **Firebase Adapter/注入上下文**：封裝存取路徑，確保在注入上下文內執行。

## ✅ 驗證焦點
- Header 通知/任務下拉不再出現 NG0203。
- 合約列表/建立/編輯流程中無「Blueprint ID not set」錯誤。
- Firebase API 警告僅視為資訊，不影響流程（後續以 Adapter 方案處理）。

## 相關來源
- `docs-old/FIXES_SUMMARY.md`
