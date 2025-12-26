# 合約模組文檔索引 (Contract Module Documentation Index)

> 來源：`docs-old/CONTRACT_DOCUMENTATION_INDEX.md` 及相關合約模組文檔（版本 1.0，2025-12-19）。本檔以 docs 規範格式重組，提供角色導向的閱讀路徑與快速導覽。

## 🎯 目的

為合約模組的技術債修復與功能強化提供**快速索引**，讓不同角色在最短時間取得對應的決策資訊、實施指南與檢查清單。

## 📚 文檔地圖

| 檔名 (來源：docs-old) | 角色/用途 | 摘要 |
|----------------------|-----------|------|
| TECHNICAL_DEBT_REMEDIATION_PLAN.md | 架構師、開發者 | 詳列 TD-1~TD-5、修復步驟、程式碼範例、測試要求、成功指標 |
| CONTRACT_MODULE_IMPLEMENTATION_SUMMARY.md | PM、利害關係人 | 執行摘要、時程估算、資源需求、成效量化 |
| CONTRACT_IMPLEMENTATION_QUICK_START.md | 實施開發者 | 5 分鐘概覽、分階段檢查清單、常見問題 |
| CONTRACT_MODULE_ARCHITECTURE.md | 架構師、審查者 | 視覺化架構圖、資料流程、狀態管理與安全層次 |

> 深入內容仍保留於 `docs-old/`，本檔提供導航與重點提煉。

## 👥 角色導向快速路徑

- **PM / 利害關係人（15 分鐘）**
  1. CONTRACT_MODULE_IMPLEMENTATION_SUMMARY.md — 問題/解法/成效
  2. CONTRACT_MODULE_ARCHITECTURE.md — 5 分鐘看流程與依賴
- **實施開發者（60~90 分鐘）**
  1. CONTRACT_IMPLEMENTATION_QUICK_START.md — 檢查清單 + 常見問題
  2. TECHNICAL_DEBT_REMEDIATION_PLAN.md — TD-1~TD-5 詳細步驟與測試
  3. CONTRACT_MODULE_ARCHITECTURE.md — 狀態管理與安全層次
- **架構師 / 審查者（45~70 分鐘）**
  1. CONTRACT_MODULE_ARCHITECTURE.md — 架構一致性/依賴檢視
  2. TECHNICAL_DEBT_REMEDIATION_PLAN.md — 決策理由、安全考量、測試要求
  3. CONTRACT_MODULE_IMPLEMENTATION_SUMMARY.md — 決策摘要與時程

## 🚀 實施流程快覽

```
1) Quick Start 檢查清單
2) Phase-by-Phase 修復 TD-1~TD-5（按 Technical Debt Plan）
3) 每階段完成後執行測試組合（unit + emulator + E2E）
4) 比對 Architecture 圖，確認依賴與安全層次一致
5) 收斂文件與程式碼，更新成功指標
```

### 關鍵里程碑

- **時程估算**：約 37 工時（1 位開發者，1 週）
- **預期成效**：合約建立時間 ↓80%，流程與安全性一致
- **測試重點**：合約上傳/解析、權限檢查、事件流、錯誤處理

## 🔒 審查檢查清單（摘要）

- 架構一致性：與 cloud 模組比對，模組邊界/依賴清晰
- 安全層次：Security Rules、Guard/ACL、UI 權限檢查一致
- 資料流程：上傳 → 解析 → 儲存 → 事件通知可追蹤
- 測試覆蓋：TD-1~TD-5 對應的測試案例齊備
- 文件同步：完成後更新 Quick Start 常見問題與成功指標

## 📌 存放位置

- 完整來源：`docs-old/TECHNICAL_DEBT_REMEDIATION_PLAN.md` 等同名檔案
- 相關程式碼參考：`src/app/routes/blueprint/modules/contract/`、`functions-storage/`、`functions-ai-document/`
- 相關指引：`.github/instructions/ng-gighub-architecture.instructions.md`

---

**維護者**: GigHub 開發團隊  
**最後更新**: 2025-12-22  
**版本**: v1.0.0 (索引摘要版)
