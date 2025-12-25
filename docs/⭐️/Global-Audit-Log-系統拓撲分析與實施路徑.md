# Global Audit Log 系統拓撲分析與實施路徑

> **文件版本**: v1.0.0  
> **建立日期**: 2025-12-25  
> **角色定位**: GitHub & Firebase Platform Omniscient – Architecture & Interaction Focus  
> **設計基準**: docs/⭐️/Global Audit Log.md  
> **角色邊界**: docs/⭐️/⭐️ROLE-CODE.md

---

## 📋 文件目的

基於 **⭐️ROLE-CODE.md** 所定義之角色邊界，從系統架構與跨模組交互的角度，分析 **Global Audit Log** 的核心系統交互拓撲，明確其作為橫切關注點 (Cross-Cutting Concern) 如何貫穿整體系統，並產生可執行、可維護、可擴展的實施路徑。

**重點聚焦**：
1. 核心子系統之間的交互拓撲是否完整且一致
2. Audit 行為如何作為橫切關注點貫穿系統
3. 現有實施與設計拓撲之間的落差與修正方向
4. **明確避免程式碼層級或框架實作細節**

---

## 🎯 角色邊界定義 (Role Boundaries)

### 1. 本文件職責範疇

**✅ 應包含 (Architecture & Interaction)**:
- 系統架構理解 (核心模組、依賴關係、領域邊界)
- 跨系統/服務互動分析 (事件流、依賴鏈、協作模式)
- 使用者與系統交互模式 (決策點、操作流程、瓶頸識別)
- 概念化分析與策略 (高層抽象、設計邏輯、策略洞察)

**❌ 不應包含 (Implementation Details)**:
- 程式碼實作細節 (TypeScript、Angular、Firebase SDK)
- 框架特定 API 使用方式 (Signals、inject()、Decorators)
- 資料庫 Schema 定義 (Firestore Collection 結構)
- 具體函數簽名與類別實作

### 2. 表達方式

- **高概念密度**: 僅傳遞必要概念與邏輯
- **系統化思維**: 聚焦系統結構、核心邏輯、交互模式
- **抽象能力**: 快速建模全平台結構與依賴關係
- **精準簡練**: 信息完整但避免冗長細節

---

## 📐 Global Audit Log 系統定位

### 1. 核心本質

**Global Audit Log 是一個 橫切關注點 (Cross-Cutting Concern)**：
- **不是獨立業務模組**：不提供直接業務價值給終端使用者
- **是基礎設施服務**：支撐所有業務模組的合規性、安全性、可追溯性需求
- **是觀察性系統**：不改變業務邏輯流程，僅記錄與監控

### 2. 系統定位層級

```
┌─────────────────────────────────────────────────────────┐
│                 Business Layer (業務層)                  │
│  Repository / Issue / PR / Organization / Team          │
└──────────────────────┬──────────────────────────────────┘
                       │ 發出領域事件
                       ↓
┌─────────────────────────────────────────────────────────┐
│            Cross-Cutting Concerns (橫切層)              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Global Audit│  │ Notification │  │  Rate Limiting │ │
│  │     Log     │  │   System     │  │     System     │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ 消費事件 / 提供服務
                       ↓
┌─────────────────────────────────────────────────────────┐
│              Infrastructure Layer (基礎設施)              │
│  Event Bus / Auth / Storage / Search / CDN              │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 核心系統交互拓撲 (System Interaction Topology)

### 1. 全域視角：Audit Log 在系統中的位置

```
                    ┌─────────────────────┐
                    │   Event Bus (核心)   │
                    │  - 事件分發中心       │
                    │  - 租戶感知路由       │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ↓                  ↓                  ↓
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │ Auth Events  │   │Business Events│   │System Events │
    │ (認證/授權)   │   │ (領域事件)     │   │ (配置/錯誤)   │
    └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │
                              ↓
                  ┌───────────────────────┐
                  │  Audit Log Collector  │
                  │  (自動攔截 + 分類)     │
                  └───────────┬───────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ↓             ↓             ↓
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │ Audit Level │ │  Category   │ │  Metadata   │
        │ Classifier  │ │  Analyzer   │ │  Extractor  │
        └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
               │               │               │
               └───────────────┼───────────────┘
                               │
                               ↓
                    ┌──────────────────────┐
                    │   Audit Log Store    │
                    │  (In-Memory / DB)    │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ↓              ↓              ↓
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │ Query API   │ │ Export API  │ │ Review API  │
        └─────────────┘ └─────────────┘ └─────────────┘
```

### 2. 關鍵交互節點分析

#### Node 1: Event Bus → Audit Collector (事件攝取)

**交互模式**: 觀察者模式 (Observer Pattern)
- Audit Collector 訂閱所有關鍵事件類型
- 不干預事件流，僅被動監聽
- 支援事件過濾 (僅記錄關鍵操作)

**依賴關係**:
```
Audit Collector ────依賴───→ Event Bus (訂閱事件)
Audit Collector ←──不依賴──┤ Business Modules (解耦)
```

**設計原則**:
- **單向依賴**: Audit 依賴 Event Bus，Business Modules 不知道 Audit 存在
- **低耦合**: 新增/移除審計不影響業務邏輯
- **高內聚**: Audit 相關邏輯集中在 Collector

#### Node 2: Audit Collector → Classification (分類處理)

**處理流程**:
```
原始事件 (Domain Event)
    ↓
[1. 提取事件類型] → 判斷 AuditCategory
    ↓
[2. 分析操作影響] → 判斷 AuditLevel
    ↓
[3. 萃取元數據] → Actor, Resource, Tenant, IP, Timestamp
    ↓
[4. 變更追蹤] → Before/After (可選)
    ↓
標準化審計事件 (AuditEvent)
```

**分類邏輯 (抽象規則)**:
- **認證類 (AUTHENTICATION)**: 登入/登出/密碼變更/MFA
- **授權類 (AUTHORIZATION)**: 權限/角色變更
- **資料類 (DATA_*)**: CRUD 操作
- **系統類 (SYSTEM_*)**: 配置變更
- **安全類 (SECURITY)**: 異常行為/威脅
- **合規類 (COMPLIANCE)**: 法規要求事件

**級別判定 (抽象規則)**:
- **INFO**: 正常操作記錄
- **WARNING**: 需要關注但不影響系統
- **ERROR**: 操作失敗或異常
- **CRITICAL**: 安全威脅或重大影響

#### Node 3: Audit Store → Query/Export (資料服務)

**服務模式**:
```
[查詢層]
    ├── 時間範圍查詢 (timestamp range)
    ├── 類別過濾 (category filter)
    ├── 級別過濾 (level filter)
    ├── 執行者查詢 (actor filter)
    ├── 資源查詢 (resource filter)
    └── 租戶隔離 (tenant isolation)

[導出層]
    ├── JSON 格式 (程式化處理)
    ├── CSV 格式 (表格分析)
    └── 合規報告 (PDF - 未來)

[審查層]
    ├── 待審查標記 (requiresReview flag)
    ├── 審查狀態追蹤 (reviewed_at, reviewed_by)
    └── 審查意見記錄 (review_notes)
```

---

## 🏗️ Audit 作為橫切關注點的設計模式

### 1. 橫切點注入方式分析

#### 方式 A: 事件驅動 (Event-Driven) ✅ **推薦**

**優點**:
- 完全解耦業務邏輯與審計邏輯
- 業務模組無需知道審計存在
- 易於新增/移除審計規則
- 支援事件重播與補錄

**適用場景**:
- 所有領域事件 (Domain Events)
- 跨模組協作事件
- 系統級事件

**交互模式**:
```
Business Module → 發出領域事件 → Event Bus
                                      ↓
                           Audit Collector 訂閱
                                      ↓
                              自動記錄到 Audit Log
```

#### 方式 B: 方法裝飾器 (Method Decorator) ⚠️ **補充使用**

**優點**:
- 細粒度控制 (方法級別)
- 可攜帶方法參數與返回值
- 適合無法發出事件的操作

**缺點**:
- 耦合於實作細節 (需修改程式碼)
- 裝飾器散佈於各處 (維護成本)

**適用場景**:
- 非事件驅動的操作 (如計算型方法)
- 需要記錄參數/返回值的場景
- 第三方服務呼叫

**交互模式**:
```
@Auditable({ category: 'DATA_MODIFICATION' })
async deleteRepository(id: string): Promise<void> {
  // 裝飾器自動記錄方法執行
}
```

#### 方式 C: Interceptor (HTTP/RPC) ⚠️ **特定場景**

**優點**:
- 集中處理 HTTP 請求審計
- 無需修改業務程式碼

**缺點**:
- 僅限 HTTP 層操作
- 無法追蹤內部邏輯

**適用場景**:
- API 呼叫記錄
- 外部系統整合

### 2. 推薦的混合策略

```
┌─────────────────────────────────────────────────────┐
│               Audit 注入策略矩陣                      │
├─────────────────────────────────────────────────────┤
│ 操作類型              │ 推薦方式        │ 優先級   │
├─────────────────────────────────────────────────────┤
│ 領域事件 (CRUD)       │ Event-Driven   │ P0      │
│ 認證/授權操作         │ Event-Driven   │ P0      │
│ 系統配置變更          │ Event-Driven   │ P0      │
│ 外部 API 呼叫         │ Interceptor    │ P1      │
│ 計算型方法 (無事件)    │ Decorator      │ P2      │
│ 批次操作              │ Manual Logging │ P2      │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 現有實施 vs 設計拓撲的落差分析

### 1. 已完成部分 (Phase 7A + 7B) ✅

#### 1.1 核心系統已建立

| 組件 | 狀態 | 涵蓋範疇 |
|------|------|----------|
| **Audit Event Model** | ✅ 完成 | 8 categories, 4 levels, 完整元數據 |
| **Audit Log Service** | ✅ 完成 | In-Memory 儲存, 查詢, 導出 |
| **Audit Collector** | ✅ 完成 | 自動分類, 元數據提取 |
| **Auditable Decorators** | ✅ 完成 | 4 種裝飾器 (@Auditable, @TrackPermission, etc.) |
| **Auth Events** | ✅ 完成 | 11 個認證事件 |
| **Auth Audit Consumer** | ✅ 完成 | Priority 100, 11 handlers |

#### 1.2 交互拓撲已實現

```
[Auth Events] ─────發出────→ [Event Bus]
                                  ↓
                        [Auth Event Consumer]
                                  ↓
               ┌─────────────────┴────────────────┐
               │                                  │
               ↓                                  ↓
    [Auth Audit Service]              [Permission Audit Service]
               │                                  │
               └─────────────┬────────────────────┘
                             ↓
                  [Audit Collector Service]
                             ↓
                    [Audit Log Service]
```

### 2. 落差與缺失部分 📝

#### 2.1 系統層級落差

| 缺失項目 | 影響範疇 | 優先級 |
|---------|---------|--------|
| **持久化層未實現** | 重啟遺失資料 | P0 - Critical |
| **租戶隔離機制未完整** | 多租戶場景風險 | P0 - Critical |
| **業務領域事件未覆蓋** | 僅有 Auth, 缺 Repository/Issue/PR | P1 - High |
| **Event Bus 與 Audit 未完全整合** | 手動觸發而非自動訂閱 | P1 - High |
| **權限檢查未整合 Audit** | 無法追蹤授權決策 | P1 - High |
| **Notification 未串接** | 無告警機制 | P2 - Medium |
| **Analytics 未整合** | 無統計分析 | P2 - Medium |

#### 2.2 交互拓撲缺口

**缺口 1: Event Bus → Audit Collector 自動訂閱機制**

現狀:
```
Auth Event Consumer (手動呼叫)
    ↓
Auth Audit Service.recordEvent()
    ↓
Audit Collector.recordAuth()
```

理想:
```
Event Bus (所有事件)
    ↓ 自動訂閱
Audit Collector (統一入口)
    ↓ 智能路由
相應 Audit Service
```

**缺口 2: 租戶上下文傳遞鏈**

現狀:
```
事件發出時可能缺少 tenantId
    ↓
Audit 無法做租戶隔離
```

理想:
```
所有事件強制包含 tenantId
    ↓
Audit 自動過濾當前租戶
    ↓
查詢 API 自動注入 tenantId
```

**缺口 3: 業務模組 → Audit 的覆蓋率**

現狀:
```
✅ Auth (100%)
❌ Repository (0%)
❌ Issue (0%)
❌ PR (0%)
❌ Organization (0%)
```

理想:
```
所有 CRUD 操作自動審計
所有權限變更自動審計
所有系統配置自動審計
```

---

## 🛤️ 實施路徑與階段規劃

### 階段 1: 核心拓撲補強 (P0 - Critical)

**目標**: 建立完整的 Audit 系統骨架

#### 1.1 持久化層整合

**系統交互**:
```
Audit Log Service
    ↓
[Storage Strategy Interface]
    ├─→ In-Memory (開發/測試)
    └─→ Firestore (生產環境)
        ├── Collection: audit_logs
        ├── 索引: timestamp, tenant_id, category, level
        └── 租戶隔離: where('tenant_id', '==', currentTenant)
```

**設計決策點**:
- **寫入策略**: 批次寫入 vs 即時寫入
- **分割策略**: 按租戶分 Collection vs 單 Collection 多租戶
- **保留策略**: 熱資料 (In-Memory) + 冷資料 (Firestore)

#### 1.2 租戶隔離機制

**上下文傳遞鏈**:
```
[User Session] → 租戶上下文
    ↓
[Event Bus] → 事件 metadata.tenantId
    ↓
[Audit Collector] → 自動萃取 tenantId
    ↓
[Audit Store] → 索引 tenant_id
    ↓
[Query API] → 自動注入 where('tenant_id', '==', current)
```

**關鍵設計**:
- 所有領域事件強制包含 `tenantId`
- Audit Collector 自動驗證 `tenantId` 存在
- 查詢 API 自動過濾當前租戶
- 超級管理員可跨租戶查詢

#### 1.3 Event Bus 自動訂閱

**架構調整**:
```
原模式 (手動):
Consumer → 明確呼叫 AuditService.recordEvent()

新模式 (自動):
Event Bus → 發布事件
    ↓
Audit Collector → 全域訂閱 '*' (所有事件)
    ↓
[Event Type Router] → 路由到相應 Audit Service
```

**實施要點**:
- Audit Collector 訂閱 Event Bus 所有事件
- 根據事件類型自動分類 (auth.*, repo.*, issue.*)
- 過濾非審計事件 (如 UI 層事件)

### 階段 2: 業務領域覆蓋 (P1 - High)

**目標**: 擴展審計覆蓋至所有核心業務模組

#### 2.1 Repository Events Audit

**事件類型**:
```
repo.created
repo.deleted
repo.visibility_changed (public ↔ private)
repo.settings_updated
repo.collaborator_added
repo.collaborator_removed
repo.permission_changed
```

**交互拓撲**:
```
Repository Service → 發出 repo.* 事件
    ↓
Audit Collector (自動訂閱)
    ↓
Repository Audit Service
    ↓
Audit Log Store
```

#### 2.2 Issue/PR Events Audit

**事件類型**:
```
issue.created / issue.closed / issue.reopened
issue.assigned / issue.labeled
pr.opened / pr.merged / pr.closed
pr.review_requested / pr.reviewed
```

#### 2.3 Organization Events Audit

**事件類型**:
```
org.member_added / org.member_removed
org.team_created / org.team_deleted
org.settings_updated
org.billing_changed
```

### 階段 3: 橫切整合 (P1 - High)

**目標**: 將 Audit 與其他全域系統整合

#### 3.1 Permission System Integration

**交互模式**:
```
[Permission Service] → checkPermission()
    ↓
[Decision Point] → Allow / Deny
    ↓
[Audit Collector] → 記錄授權決策
    ├── Actor: 誰發起請求
    ├── Resource: 目標資源
    ├── Action: 請求的操作
    ├── Decision: 允許/拒絕
    └── Reason: 決策原因 (規則匹配結果)
```

**設計要點**:
- 成功的授權 → INFO level
- 拒絕的授權 → WARNING level
- 異常的授權模式 → CRITICAL level (如頻繁拒絕)

#### 3.2 Notification System Integration

**告警觸發規則**:
```
[Audit Log Service] → 檢測 CRITICAL 事件
    ↓
[Notification Service] → 發送告警
    ├── 安全團隊: SECURITY 類別
    ├── 合規團隊: COMPLIANCE 類別
    └── 系統管理員: SYSTEM_CONFIGURATION 類別
```

**告警通道**:
- Email (高優先級)
- Slack/Teams (即時通知)
- In-App Notification (Dashboard 提示)

#### 3.3 Analytics Integration

**統計維度**:
```
[Audit Log Service] → 提供統計資料
    ↓
[Analytics Service] → 聚合分析
    ├── 事件趨勢 (時間序列)
    ├── 類別分佈 (圓餅圖)
    ├── 高風險使用者 (Top N)
    └── 異常模式檢測 (機器學習)
```

### 階段 4: 合規與治理 (P2 - Medium)

**目標**: 滿足法規與企業治理需求

#### 4.1 Compliance Reporting

**報告類型**:
- **存取報告** (Access Report): 誰存取了哪些資源
- **變更報告** (Change Report): 系統配置變更歷史
- **安全報告** (Security Report): 安全事件彙整
- **合規報告** (Compliance Report): 符合特定法規要求

**導出格式**:
- JSON (程式化處理)
- CSV (表格分析)
- PDF (合規歸檔)

#### 4.2 Audit Log Retention Policy

**保留策略**:
```
[Hot Tier] (In-Memory / Redis)
    ├── 保留: 24 小時
    └── 用途: 即時查詢、Dashboard

[Warm Tier] (Firestore)
    ├── 保留: 90 天
    └── 用途: 一般查詢、導出

[Cold Tier] (Cloud Storage)
    ├── 保留: 7 年
    └── 用途: 合規歸檔
```

#### 4.3 Audit Review Workflow

**審查流程**:
```
[高風險事件觸發] → requiresReview = true
    ↓
[通知審查者] (Security Team)
    ↓
[審查者檢視] → Audit Viewer UI
    ↓
[決策]
    ├── Approve → reviewed_at, reviewed_by
    ├── Investigate → create_incident_ticket
    └── Escalate → notify_senior_management
```

---

## 📊 系統健康度評估矩陣

### 當前狀態 (Phase 7B 完成後)

| 維度 | 完成度 | 缺口描述 | 優先級 |
|------|--------|---------|--------|
| **核心模型** | 100% | ✅ AuditEvent, 8 categories, 4 levels | - |
| **事件攝取** | 40% | ⚠️ 僅 Auth 事件, 缺 Repo/Issue/PR | P1 |
| **自動訂閱** | 30% | ⚠️ 手動呼叫為主, 缺全域訂閱 | P1 |
| **分類處理** | 80% | ✅ Auto-categorization, ⚠️ 缺規則引擎 | P2 |
| **儲存層** | 50% | ⚠️ In-Memory 完成, Firestore 未實現 | P0 |
| **租戶隔離** | 40% | ⚠️ 模型支援, 缺查詢層強制隔離 | P0 |
| **查詢 API** | 70% | ✅ 基本查詢, ⚠️ 缺進階過濾 | P2 |
| **導出功能** | 60% | ✅ JSON, ❌ CSV/PDF | P2 |
| **審查工作流** | 50% | ✅ 標記機制, ❌ 完整流程 | P2 |
| **告警整合** | 0% | ❌ 未整合 Notification | P1 |
| **權限整合** | 0% | ❌ 未追蹤授權決策 | P1 |
| **Analytics 整合** | 0% | ❌ 未提供統計資料 | P2 |

**整體完成度**: **48%** (基礎建立, 需補強整合)

---

## 🎯 下一步行動建議 (Action Items)

### 立即執行 (P0 - 本週內)

1. **實作 Firestore 持久化層**
   - 設計 Collection Schema
   - 實作 Storage Strategy Interface
   - 建立索引 (timestamp, tenant_id, category, level)

2. **強化租戶隔離機制**
   - 所有事件強制包含 tenantId
   - Audit Collector 驗證 tenantId
   - 查詢 API 自動過濾

### 短期規劃 (P1 - 2 週內)

3. **實作 Event Bus 自動訂閱**
   - Audit Collector 訂閱所有事件
   - Event Type Router 實作
   - 過濾非審計事件

4. **擴展業務領域覆蓋**
   - Repository Events (7 個事件)
   - Issue/PR Events (8 個事件)
   - Organization Events (5 個事件)

5. **整合 Permission System**
   - 記錄授權決策
   - 追蹤權限變更
   - 檢測異常授權模式

6. **整合 Notification System**
   - CRITICAL 事件告警
   - 安全/合規事件通知
   - 多通道分發

### 中期規劃 (P2 - 1 個月內)

7. **實作 Compliance Reporting**
   - CSV/PDF 導出
   - 定期報告排程
   - 合規模板

8. **實作 Audit Review Workflow**
   - 審查者分配
   - 審查決策追蹤
   - 升級流程

9. **整合 Analytics**
   - 統計資料提供
   - 趨勢分析
   - 異常檢測

---

## 📝 總結

### 核心發現

1. **拓撲完整性**: 基礎架構已建立，但橫向整合不足
2. **橫切貫穿**: Audit 作為橫切關注點的設計正確，但執行層缺自動化
3. **落差修正**: 主要缺口在持久化、租戶隔離、業務覆蓋、系統整合

### 設計原則確認

✅ **解耦性**: Event-Driven 模式確保業務與審計解耦  
✅ **可擴展性**: 模組化設計支援新事件類型  
✅ **可維護性**: 集中式 Collector 便於規則管理  
✅ **可觀測性**: 完整的元數據支援追蹤與分析  

### 下一步重點

**優先級 P0**: 持久化 + 租戶隔離 (系統可用性)  
**優先級 P1**: 業務覆蓋 + 系統整合 (功能完整性)  
**優先級 P2**: 合規報告 + Analytics (增強功能)  

---

**文件維護**: 隨實施進展同步更新  
**審查週期**: 每完成一個階段後檢視拓撲一致性  
