## GitHub 全域系統架構 (Global Platform Systems)

### 1. 事件總線 (Event Bus)

**職責**
- 統一事件分發中心
- 解耦事件生產者與消費者

**事件流**
```
Repository Events (push, PR, issue, release)
    ↓
[Event Bus] 租戶感知路由
    ↓
[消費者]
    ├── Webhooks Dispatcher
    ├── Actions Orchestrator
    ├── Notifications Service
    ├── Security Scanning Triggers
    ├── Analytics Aggregator
    └── Audit Log Writer
```

**關鍵特性**
- 保證事件順序性 (per repository)
- 支持事件重播 (webhook retry)
- 租戶級別事件隔離

---

### 2. 身份與授權系統 (Identity & Authorization)

**核心組件**
```
[Authentication Layer]
    ├── Session Management (跨租戶身份綁定)
    ├── OAuth Provider (第三方應用授權)
    ├── SSO Integration (Enterprise SAML/OIDC)
    └── 2FA/Security Keys

[Authorization Engine]
    ├── RBAC 計算引擎
    ├── Permission Cache (分散式)
    ├── Token Scoping (OAuth/PAT 範疇控制)
    └── Organization Context Resolver
```

**交互模式**
```
Request → Extract Token → Resolve User Identity
                              ↓
                         [當前 Organization Context]
                              ↓
                         計算有效權限集
                              ↓
                         返回 Allow/Deny
```

---

### 3. API Gateway & Rate Limiting

**職責**
- 統一 API 入口
- 流量控制與配額管理

**限流層級**
```
[Global Rate Limit] 平台級別保護
    ↓
[Tenant Rate Limit] Organization/User 配額
    ↓
[Endpoint Rate Limit] 特定 API 細粒度控制
    ↓
[Authenticated vs Unauthenticated] 差異化限制
```

**配額追蹤**
- REST API: 5000 requests/hour (authenticated)
- GraphQL: Cost-based limiting (query complexity)
- Actions: Minutes/Storage 租戶累計
- Packages: Bandwidth/Storage 租戶累計

---

### 4. 通知系統 (Notification System)

**多通道分發**
```
Event Bus → [Notification Router]
                    ↓
            [用戶訂閱過濾]
                    ↓
            [通道選擇器]
                ├── Web UI (Inbox)
                ├── Email
                ├── Mobile Push
                └── Slack/Teams Integrations
```

**智能聚合**
- 同類事件批次通知 (避免轟炸)
- 用戶偏好設定 (per repository/organization)
- 優先級分級 (mentions > assigned > watching)

---

### 5. 搜尋引擎 (Search & Indexing)

**多維度索引**
```
[Code Search]
    ├── 跨 Repository 全文檢索
    ├── 語法感知 (symbol search)
    └── 租戶範疇過濾

[Issue/PR Search]
    ├── 結構化查詢 (filters, labels, milestones)
    └── 全文檢索

[User/Organization Search]
    └── 公開資訊檢索
```

**權限整合**
- 搜尋結果自動過濾無權限資源
- 租戶私有內容不洩漏到全域索引

---

### 6. Git 分散式儲存系統

**架構**
```
[Git Protocol Layer]
    ├── clone/fetch/push 協議處理
    └── 租戶身份驗證

[Content-Addressable Storage]
    ├── Object Store (blob, tree, commit)
    ├── Deduplication (跨 Repository)
    └── Sharding by Repository

[References Database]
    ├── Branches/Tags 快速查詢
    └── 租戶隔離
```

**跨租戶共享**
- Fork 透過 Object Store 去重 (節省空間)
- 但 References 完全隔離

---

### 7. 審計日誌系統 (Audit Logging)

**不可變日誌**
```
所有關鍵操作 → [Audit Event Collector]
                        ↓
                [時間序列存儲]
                        ↓
                [租戶隔離查詢 API]
                        ↓
                Enterprise Admin 可檢視
```

**記錄範疇**
- 權限變更 (member add/remove, role change)
- 敏感操作 (secret access, token creation)
- Security events (failed login, 2FA disable)
- Compliance 事件 (GDPR data export)

---

### 8. Actions 編排引擎 (CI/CD Orchestration)

**全域組件**
```
[Workflow Scheduler]
    ├── Event Trigger Dispatcher
    ├── Cron Job Scheduler (租戶配額)
    └── Manual Dispatch Handler

[Runner Pool Manager]
    ├── GitHub-hosted Runners (共享池)
    ├── Self-hosted Runners (租戶私有)
    └── Resource Allocation (租戶配額)

[Artifact Storage]
    ├── Build Artifacts (租戶隔離)
    ├── Cache (跨 Workflow 共享)
    └── Logs (長期保留策略)
```

**執行隔離**
- 每個 Job 獨立容器/VM
- 租戶 Secrets 加密注入
- Network 隔離 (self-hosted runner 可配置)

---

### 9. Packages Registry (跨語言套件倉庫)

**多生態支援**
```
[Registry Router]
    ├── npm (JavaScript)
    ├── Maven (Java)
    ├── NuGet (.NET)
    ├── RubyGems (Ruby)
    ├── Docker (Container Images)
    └── Generic (任意檔案)
```

**權限繼承**
- Package 繼承 Repository 權限
- 支持 Organization-level Packages
- Public/Private 可見性控制

---

### 10. Security Scanning Platform

**多層掃描**
```
[Code Scanning]
    ├── CodeQL Analysis (語義分析)
    ├── Third-party SAST Tools
    └── Custom Queries

[Dependency Scanning]
    ├── Dependabot Alerts (已知漏洞)
    ├── Advisory Database (GitHub Security Advisory)
    └── License Compliance

[Secret Scanning]
    ├── Pattern Detection (API keys, tokens)
    └── Partner 整合 (AWS, Azure, Stripe)
```

**事件驅動**
```
Push Event → Security Scanning Jobs
                    ↓
            [發現問題] → Alert Creation
                    ↓
            Notification + PR (Dependabot auto-fix)
```

---

### 11. Billing & Metering System

**用量追蹤**
```
[Metering Collectors]
    ├── Actions Minutes (per workflow run)
    ├── Packages Storage/Bandwidth
    ├── Large File Storage (LFS)
    └── Codespaces Compute Hours

[Aggregation Engine]
    ├── 租戶累計用量
    ├── 計費週期結算
    └── 配額預警

[Billing Engine]
    ├── Subscription Management
    ├── Payment Processing
    └── Invoice Generation
```

---

### 12. Marketplace & Integrations Platform

**生態系統連接**
```
[OAuth Apps]
    ├── User Authorization Flow
    ├── Scoped Token 發放
    └── Webhook 註冊

[GitHub Apps]
    ├── Installation-based (Organization-level)
    ├── Fine-grained Permissions
    └── Installation Token (短期有效)

[Actions Marketplace]
    ├── Reusable Workflows
    ├── Custom Actions
    └── 版本管理
```

**安全隔離**
- App 只能訪問授權的 Repository
- Webhook 簽名驗證
- Rate Limit 獨立計算

---

### 13. Analytics & Insights Engine

**數據聚合**
```
[數據源]
    ├── Commit Activity
    ├── Issue/PR Velocity
    ├── Code Frequency
    └── Contributor Stats

[處理管道]
    ├── 實時計算 (熱數據)
    ├── 批次處理 (歷史分析)
    └── 租戶隔離聚合

[展示層]
    ├── Repository Insights
    ├── Organization Dashboard
    └── Traffic Analytics
```

---

### 14. Webhook Delivery System

**可靠分發**
```
Event Bus → [Webhook Queue]
                ↓
        [Delivery Worker]
                ↓
        [HTTP POST to User Endpoint]
                ↓
        [Retry Strategy] (exponential backoff)
                ↓
        [Delivery Status Tracking]
```

**租戶配置**
- 每個 Repository/Organization 可註冊多個 Webhook
- 事件過濾 (只訂閱關注的事件)
- Secret 簽名驗證

---

### 15. CDN & Asset Delivery

**全球分發**
```
[Static Assets]
    ├── Avatars
    ├── Repository Assets (images in README)
    ├── Release Artifacts
    └── Raw File Content

[CDN 邊緣節點]
    ├── 地理位置路由
    ├── 緩存策略 (public vs private)
    └── 權限驗證整合 (private repos)
```

---

### 16. Backup & Disaster Recovery

**多層備份**
```
[實時複製]
    ├── 數據庫 Multi-region Replication
    └── Git Storage Redundancy

[定期快照]
    ├── 租戶級別備份
    └── Point-in-time Recovery

[Compliance Archive]
    └── 長期保留 (法規要求)
```

---

## 全域系統交互拓撲

```
                    [API Gateway & Rate Limiting]
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
    [Event Bus] ←──→ [Identity & Auth] ←──→ [Audit Log]
            │                 │                 │
    ┌───────┼─────────┬───────┼───────┬─────────┼────────┐
    │       │         │       │       │         │        │
[Actions] [Security] [Notifications] [Search] [Webhooks] [Billing]
    │       │         │       │       │         │        │
    └───────┴─────────┴───────┴───────┴─────────┴────────┘
                              │
                    [Git Storage System]
                              │
                        [CDN & Backup]
```

---

## 總結:全域系統設計原則

1. **解耦**: 每個系統職責單一,透過事件總線通訊
2. **租戶感知**: 所有系統內建租戶隔離機制
3. **可擴展**: 無狀態服務,水平擴展
4. **可觀測**: 審計日誌、Metrics、分散式追蹤
5. **容錯**: 重試機制、降級策略、備份恢復
6. **安全**: 多層權限驗證、加密、Secret 管理

這些全域系統共同支撐 GitHub 平台的核心能力,讓上層業務模組 (Repository、Issues、PR) 可以專注領域邏輯,不需重複實現基礎設施。