# Identity & Auth Lite — Subtraction-First Cleanup Plan

> 目標：先減法後加法，剔除幻覺與重複文件，保留與母體一致的必要內容。**目前未刪檔**，僅列出保留/待審清單。

## 準則
- 僅保留與母體一致的核心鏈路與文檔：`@angular/fire/auth → @delon/auth → DA_SERVICE_TOKEN`、必要登入/註冊/重設/Email 驗證、Google/GitHub OAuth、Token 注入/守衛。
- 不再引入新的 Auth 專屬 Event Bus/Audit 管線；如需審計沿用既有 `src/app/core/event-bus`。
- 不新增額外租戶層級；沿用既有組織/團隊/Blueprint 成員模型。
- 任何新增文檔必須引用母體來源並標明差異。

## 保留（必須）
- `docs/identity-tenancy/Identity & Auth.md`（含 Lite 範圍聲明）
- `docs/identity-tenancy/identity/` 下六份核心文檔：`API_REFERENCE.md`, `DEPLOYMENT_GUIDE.md`, `PRODUCTION_RUNBOOK.md`, `PRODUCTION_READINESS_CHECKLIST.md`, `MONITORING_COST_OPTIMIZATION.md`, `VALIDATION_REPORT.md`
- `docs/identity-tenancy/README.md`（範圍總覽）

## 待審（未刪，列名單）
- `docs/identity-tenancy/ACCOUNT_CONTEXT_SWITCHER_ANALYSIS.md`
- `docs/identity-tenancy/ACCOUNT_REORGANIZATION_SUMMARY.md`
- `docs/identity-tenancy/saas-ddd-structure.md`
- `docs/identity-tenancy/SaaS.md`

## 待審／可能移除或合併
- `docs/identity-tenancy/multi-tenancy/` 下文檔（需確認是否與母體多租戶敘事重複）
- `docs/⭐️/Identity & Auth.md` 與本目錄內容的重複段落（需去重或引用）

## 下一步
- 與母體逐段比對上述「待審」文件，決定：保留/合併/刪除。
- 刪除或合併後更新目錄索引與交叉引用，避免重工。
