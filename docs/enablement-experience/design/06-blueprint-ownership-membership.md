# Blueprint 所有權與成員設計摘要

> 來源：`docs-old/design/blueprint-ownership-membership.md`、`partner-member-management-modernization.md`。摘要 Blueprint/Partner 成員權責、邀請與治理。

## 核心概念
- Blueprint 是權限邊界；成員可為 user/team/partner，須記錄角色與權限集合。
- 邀請/加入流程需審計；狀態：pending/active/suspended/revoked。
- Partner 管理現代化：對外協作需隔離權限與資料（最小揭露）。

## 流程要點
- 邀請：owner/admin 發送；接受後綁定 blueprintId 與角色。
- 權限：依角色配置（owner/admin/editor/viewer/partner-*）；遵循最小權限。
- 審計：記錄邀請、接受/拒絕、權限變更；保留 blueprintId/actor。

## 風險與對策
- **越權/資料外洩**：必須以 blueprintId 過濾；Partner 僅存取授權資源。
- **孤兒成員**：定期巡檢無對應使用者/團隊的成員紀錄。
- **審計缺漏**：所有成員生命週期事件需寫入審計日誌。

## 相關來源
- `docs-old/design/blueprint-ownership-membership.md`
- `docs-old/design/partner-member-management-modernization.md`
