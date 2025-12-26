# 架構總覽與現況 (Architecture Overview & Health Check)

> 提取自 `docs-old/ARCHITECTURE.md`（最後更新：2025-12-17），以精簡摘要的方式提供最新架構健康度、關鍵議題與優先行動。

## 🎯 Executive Summary

- **平台定位**：企業級 Angular 20 + ng-alain 應用，採模組化 Blueprint 2.0 架構，專注工地施工進度追蹤。
- **健康度**：基礎與容器層完成度高，模組與測試仍有空缺。
- **優勢**：
  - 現代化技術堆疊（Signals、新控制流、事件驅動）
  - 三層架構明確，依賴注入與模組邊界清楚
  - Blueprint 容器與事件總線已落地，可支撐後續模組擴充
- **主要風險/議題**：
  - 變更檢測與記憶體潛在瓶頸（需要 OnPush、trackBy、虛擬卷動）
  - 模組覆蓋度不均（Quality 模組缺口；UI 元件僅約 40%）
  - 狀態管理混用 Signals/RxJS，需收斂
  - 觀測性與 E2E 測試覆蓋不足；事件風暴需控管

### 完成度快照

| 層/領域            | 狀態        | 備註 |
|-------------------|-----------|------|
| Foundation Layer  | ✅ 100%   | 依賴注入、基礎設施完備 |
| Container Layer   | ✅ 100%   | Blueprint/事件總線就緒 |
| Business Modules  | 🚧 67%    | Tasks/Logs ✅；Quality ❌ |
| UI Components     | 🚧 40%    | 需要補齊模組 UI |
| Testing Infra     | 🚧 60%    | 需補齊 E2E/性能監控 |

## 🌐 系統脈絡 (System Context)

- **核心目標**：提供藍圖為邊界的多租戶協作，支援任務、文件、品質、日誌等模組化業務。
- **主要角色**：
  - 工程/專案經理：配置藍圖與模組、監控進度
  - 現場人員：更新任務狀態、提交日誌/文件
  - 系統管理員：治理組織、權限、合規
- **外部系統**：Firebase（Auth/Firestore/Functions/Storage）為主要後端；Cloud Storage 存放附件。
- **邊界**：Web SPA、client-side routing、事件驅動模組；原生 App、離線模式屬未來範圍。

## 🧭 架構護欄 (Guardrails)

1. **三層架構強制**：UI → Service → Repository → Firestore；UI 僅注入 Service，Repository 僅處理資料存取與欄位轉換。
2. **Blueprint = 授權邊界**：Blueprint 只定義成員與權限；跨 Blueprint 行為需顯式授權與審計。
3. **事件驅動**：模組交互透過 BlueprintEventBus，需避免事件風暴（建立節流/批次策略）。
4. **安全層次**：Security Rules 為最後防線；前端 Guard/ACL 與 UI 權限檢查需一致。
5. **Signals 為主的狀態管理**：收斂 RxJS 混用，採 computed/effect/resource + OnPush/trackBy。
6. **測試與觀測性**：Security Rules 測試、Firebase Emulator、本地 E2E、效能監控與告警需列為必備。

## ⚡ 優先行動 (Top Priorities)

1. **效能強化**：全面啟用 OnPush + trackBy，為大型清單加入虛擬卷動；審視事件總線的節流/批次策略。
2. **品質補齊**：補完缺漏模組（特別是 Quality），統一 Signals 狀態模式，建立跨模組 UI 樣板。
3. **測試覆蓋**：擴充 E2E 關鍵路徑（任務、藍圖、文件/合約流程）、Security Rules 單元測試、性能基準。
4. **觀測性**：落地日誌/追蹤/告警基線，針對 Functions/Firestore 建立 SLO 與儀表板。

## 📌 參考與來源

- 原始詳細版：`docs-old/ARCHITECTURE.md`（含系統上下文圖、Security Rules 範例、Angular 安全建議、Signals/Resource 使用範例）
- 關聯文件：`../principles(原則)/`（權限與 Blueprint 原則）、`../data-model(資料模型)/`（Schema 與索引）、`../security(安全)/`（Rules 與防護層）

---

**維護者**: GigHub 開發團隊  
**最後更新**: 2025-12-22  
**版本**: v1.0.0 (摘要版)
