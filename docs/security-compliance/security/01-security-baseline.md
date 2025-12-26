# 安全基線摘要 (Security Baseline)

> 來源：`docs-old/architecture/SECURITY_RULES_NOTES.md`、`ARCHITECTURE.md`。整理多租戶隔離、權限與流程檢查點。

## 🔐 多租戶與權限
- Blueprint 為權限邊界；所有資料需含 `blueprintId` 並在 Rules/Guard/UI 三層檢查。
- Dedicated Membership Collection：`blueprintMembers/{uid_blueprintId}` 判斷成員與權限。
- 禁止跨 Blueprint 查詢；寫入時比對 `blueprintId` 與成員資格。

## 🛡️ Security Rules 基線
- `isAuthenticated()` + `isBlueprintMember(blueprintId)` 為讀取前置。
- 寫入需權限位階 (e.g., `task:create`/`task:update`/`task:delete`) 與成員狀態為 active。
- 資料驗證：欄位必填/長度/狀態枚舉；禁止客製權限提權。

## ✅ 檢查清單
- [ ] UI/Guard/Rules 權限邏輯一致
- [ ] Rules 覆蓋主要集合與子集合；禁止跨 Blueprint
- [ ] Emulator 測試涵蓋：未認證拒絕、無權限拒絕、有效成員允許
- [ ] 寫入皆驗證 `blueprintId` 與欄位格式

## 相關來源
- `docs-old/architecture/SECURITY_RULES_NOTES.md`
- `docs-old/ARCHITECTURE.md`
