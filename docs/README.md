# GigHub 專案文檔總覽 (Documentation Hub)

> **最後更新**: 2025-12-25  
> **版本**: 2.0 (Post-Consolidation)

此資料夾包含 GigHub 專案的完整文檔，經過整理與規範化組織。所有核心架構文檔位於 `⭐️/` 目錄，作為**單一真實來源 (Single Source of Truth)**。

---

## ⭐️ 核心參考文檔 (Core Reference - Authoritative)

**位置**: `docs/⭐️/`

### AI 角色與行為指引 (🔒 Protected - DO NOT MODIFY)
- 📘 `📘AI_Character_Profile_Suggest.md` - AI 角色建議配置
- 🤖 `🤖AI_Character_Profile_Impl.md` - AI 角色實施配置
- 🧠 `🧠AI_Behavior_Guidelines.md` - AI 行為準則

### 系統架構核心文檔
- `整體架構設計.md` - 完整系統架構
- `Global全域系統交互拓撲.md` - 全域系統交互
- `Global Event Bus.md` - 事件匯流排系統
- `Global Audit Log.md` - 審計日誌系統
- `Identity & Auth.md` - 身份驗證與授權

### 架構分析報告 (NEW - 2025-12-25)
- `INDEX.md` - 架構分析導覽
- `EXECUTIVE_SUMMARY.md` - 管理層摘要
- `QUICK_ACTION_SUMMARY.md` - 開發者快速指南
- `ARCHITECTURAL_ANALYSIS_REPORT.md` - 完整技術分析
- `REMEDIATION_PLAN.md` - 架構修復計畫
- `VISUAL_SUMMARY.md` - 視覺化摘要

---

## 📂 分類文檔目錄

```
⭐️/                      # 核心參考 (權威來源)
├─ AI 角色配置            # AI Character & Behavior
├─ 系統架構核心文檔       # Architecture Core Docs
└─ 架構分析報告           # Architecture Analysis (NEW)

api(API/介面規格)/       # API 規格與介面定義
architecture(架構)/      # 系統架構設計
data-model(資料模型)/    # 資料模型與 Schema
deployment(部署)/        # 部署流程與 CI/CD
design(設計)/            # UI/UX 設計規範
functions(函數)/         # Cloud Functions 規範
getting-started(快速開始)/  # 開發環境設置
operations(維運)/        # 監控、日誌、維運
overview(總覽)/          # 專案總覽與分析
principles(原則)/        # 開發原則與規範
reference/               # 技術參考文檔
security(安全)/          # 安全規範與 Rules
ui-theme(主題)/          # UI 主題系統
```

### 目錄說明

* **⭐️/**：核心參考文檔（權威來源）- AI 配置、系統架構、架構分析
* **api(API/介面規格)/**：API 規格、介面定義與契約文檔
* **architecture(架構)/**：三層架構、模組邊界與系統設計
* **data-model(資料模型)/**：Firestore Schema、資料關聯與索引
* **deployment(部署)/**：Firebase 部署、CI/CD 與成本控制
* **design(設計)/**：UI/UX 設計、無障礙性與響應式設計
* **functions(函數)/**：Cloud Functions 規範（含 AI 整合）
* **getting-started(快速開始)/**：開發環境設置與快速指南
* **operations(維運)/**：監控、日誌、錯誤處理與維運流程
* **overview(總覽)/**：專案摘要、進度追蹤與分析索引
* **principles(原則)/**：開發原則、規範與技術債管理
* **reference/**：技術參考（前端、後端、各層級設計）
* **security(安全)/**：Security Rules、驗證流程與機密管理
* **ui-theme(主題)/**：主題系統、色彩規範與設計指南

---

## 📖 閱讀指南 (Reading Guide)

### 👨‍💼 管理層 / PM
1. `⭐️/EXECUTIVE_SUMMARY.md` - 管理層摘要 (5 分鐘)
2. `⭐️/VISUAL_SUMMARY.md` - 視覺化架構 (3 分鐘)
3. `overview(總覽)/` - 專案進度與分析

### 👨‍💻 開發者 / 工程師
1. `⭐️/QUICK_ACTION_SUMMARY.md` - 快速指南 (10 分鐘)
2. `getting-started(快速開始)/` - 環境設置
3. `architecture(架構)/`, `design(設計)/` - 架構與設計規範
4. `reference/` - 技術參考文檔

### 🏗️ 架構師 / Tech Lead
1. `⭐️/ARCHITECTURAL_ANALYSIS_REPORT.md` - 完整分析 (1 小時)
2. `⭐️/` - 所有核心架構文檔
3. `architecture(架構)/`, `principles(原則)/` - 深度架構文檔

### 🎨 UI/UX 設計師
1. `design(設計)/README.md` - 設計規範總覽
2. `ui-theme(主題)/` - 主題系統與色彩規範
3. `design(設計)/04-accessibility.md` - 無障礙設計

---

## 🔄 文檔更新歷史

### 2025-12-25: 重大文檔整理 (v2.0)
**變更摘要**:
- ✅ 刪除 23 個重複/過時文檔
- ✅ 建立 `⭐️/` 作為權威來源
- ✅ 新增架構分析報告 (6 份文檔)
- ✅ 統一文檔命名與組織結構

**刪除的重複文檔**:
- 11 個 event-bus 重複版本
- 5 個根目錄重複文檔
- 7 個命名不清文檔

**保留的權威來源**:
- ✅ `⭐️/` - 核心架構文檔
- ✅ 分類子目錄 - 功能領域文檔
- ✅ 根目錄專題 - 深度分析文檔

---

## 檔案命名規範

1. **統一格式**：`序號-模組-說明.md`（例：`01-architecture-overview.md`）
2. **規格檔**：JSON Schema 用 `*.schema.json`，API 契約用 `*.contract.md`
3. **序號**：章節檔以序號開頭維持閱讀順序
4. **版本化**：多版本放子資料夾 `v1/`、`v2/`
5. **說明**：使用英文或完整中文，避免數字命名（0.md, 1.md）

---

## 結構與維護規範

* 資料夾以 **業務能力** 為單位組織
* `⭐️/` 為**單一真實來源 (Single Source of Truth)**
* 文件變更需在 PR 附上摘要與影響範圍
* 避免重複內容，使用引用指向權威文檔
* 重要文件每 6 個月檢視並記錄變更

---

## 聯絡與貢獻

* 補充或修改文件請開 PR，描述目的與影響範圍
* 發現錯誤或過時內容，開 GitHub Issue 標註 `documentation`

---