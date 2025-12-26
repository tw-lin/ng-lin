# 合約模組驗證清單 (Contract Module Verification Checklist)

> 來源：`docs-old/VERIFICATION_CHECKLIST.md`。提供部署前後的檢查與手動測試指引。

## ✅ 部署前檢查
- Build 與 TypeScript 編譯通過；無模板錯誤
- 不在 `ngOnInit()` 呼叫 `effect()`；Facade 皆已初始化
- Firebase API 存取位於注入上下文

## 🧪 手動測試套件
- **通知/任務下拉**：開啟無 NG0203；資料正常
- **合約列表與篩選**：載入、篩選、統計正確；無「Blueprint ID not set」
- **合約建立**：快速建立與巫師流程皆成功；列表刷新
- **合約編輯/檢視**：資料載入與更新成功
- **邊界案例**：跨 Blueprint 切換、快速切換頁籤無殘留狀態

## 🖥️ 錯誤樣式監看
- 不應出現：`NG0203`、`Effect() can only be used...`、`Blueprint ID not set`
- 允許存在：Firebase 注入上下文警告（資訊級，後續以 Adapter 方案修正）

## 📝 記錄欄位
- 測試日期、版本、測試者
- 通過/失敗/阻塞數量
- 重大問題與備註

## 簽核
- [ ] 主要測試案例通過
- [ ] 未見 NG0203 或 Facade 初始化錯誤
- [ ] 合約 CRUD 與列表流程正常

## 相關來源
- `docs-old/VERIFICATION_CHECKLIST.md`
