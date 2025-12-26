# 設計總覽 (Design Overview)

> 來源：`docs-old/design/blueprint-ownership-membership.md`、`partner-member-management-modernization.md`。聚焦角色、權限與協作體驗的設計原則。

## 🎯 設計焦點
- **權限透明**：Blueprint/Organization/Team/Partner 的角色與可見範圍清楚呈現。
- **協作效率**：批次指派、搜尋/篩選、快速動作（右鍵/快捷列）。
- **一致性**：沿用玄武主題、統一間距、按鈕層級與狀態色。

## 📌 關鍵場景
- **藍圖擁有權/成員管理**：視覺化顯示 Owner/Admin/Member 權限；邀請與審核流程在同一介面。
- **合作夥伴管理**：Partner/Team 成員獨立維護，支援停用/恢復與權限邊界提示。
- **審批/工作流**：以步驟導引方式呈現，明確進度/例外處理與稽核紀錄入口。

## ✅ 設計檢查清單
- [ ] 所有主要流程提供空狀態/錯誤狀態/載入狀態
- [ ] 重要操作具二次確認與權限提示
- [ ] 列表具分頁/篩選/排序，並可直接批次操作
- [ ] 玄武主題配色與字級對齊 `ui-theme/`

## 相關來源
- `docs-old/design/blueprint-ownership-membership.md`
- `docs-old/design/partner-member-management-modernization.md`
