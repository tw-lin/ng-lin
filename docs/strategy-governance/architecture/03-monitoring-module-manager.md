# 監控模組/模組管理摘要 (Monitoring & Module Manager)

> 來源：`docs-old/architecture/MONITORING_MODULE_MANAGER_*.md`、`docs-old/architecture/UI_ACCESS_GUIDE.md`。概述目標、範疇、關鍵圖表與落地檢查點。

## 🎯 目標
- 以模組化方式提供系統健康監控、事件觀測與依賴可視化。
- 讓管理者可視化模組狀態、事件流量、授權與入口路徑。

## 🗺️ 範疇
- **監控儀表板**：模組健康度、事件 TPS、錯誤率。
- **事件觀測**：事件佇列/批次策略、風暴防護。
- **存取路徑**：對應 `UI_ACCESS_GUIDE` 的入口與權限檢查點。
- **依賴關係**: 模組與 Blueprint Container 的依賴圖。

## ✅ 落地檢查
- 儀表板至少呈現：事件吞吐、延遲、錯誤分類、模組啟用狀態。
- 事件風暴防護：節流/批次/重放策略已定義並測試。
- 權限對齊：UI 入口、Guard/ACL、Security Rules 一致。
- 稽核軌跡：關鍵操作寫入審計 (event log)。

## 🔗 相關圖表/文件
- `docs-old/architecture/MONITORING_MODULE_MANAGER_VISUAL_GUIDE.md`
- `docs-old/architecture/MONITORING_MODULE_MANAGER_SOLUTION.md`
- `docs-old/architecture/UI_ACCESS_GUIDE.md`

## 📌 待辦/後續
- 建立實際 mermaid/diagram 檔案並掛載到 `architecture/diagrams/`。
- 以 emulator + e2e 驗證事件風暴及權限路徑。 
