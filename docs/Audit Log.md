## Audit Log 的層級架構

是的,Audit Log 是**全域系統**,但它採用**分層記錄與分層訪問**的設計。

---

## 分層架構

```
[全域 Audit Log System]
    │
    ├── [Enterprise Level Audit]
    │    ├── Organization 管理操作
    │    ├── Member 權限變更
    │    ├── Billing 變更
    │    ├── Security 策略變更
    │    └── SSO/SAML 配置
    │
    ├── [Organization Level Audit]
    │    ├── Team 管理
    │    ├── Repository 創建/刪除/轉移
    │    ├── Webhook 配置
    │    ├── App Installation
    │    └── Member 邀請/移除
    │
    └── [Repository Level Audit]
         ├── Branch Protection 變更
         ├── Deploy Keys 管理
         ├── Collaborator 權限變更
         ├── Secret 訪問 (Actions)
         ├── Release 發布
         └── Sensitive Settings 修改
```

---

## Repository Audit 特性

### 1. 記錄範疇

**Security-sensitive Operations**
```
[Repository Settings]
    ├── Visibility 變更 (Public ↔ Private)
    ├── Branch Protection Rules
    ├── Code Scanning 啟用/停用
    ├── Secret Scanning 配置
    └── Dependabot 設定

[Access Control]
    ├── Collaborator 新增/移除
    ├── Team 權限變更
    ├── Deploy Key 管理
    └── GitHub App 授權

[Critical Actions]
    ├── Force Push
    ├── Branch/Tag 刪除
    ├── Release 發布
    └── Repository Transfer/Archive
```

### 2. 統一收集機制

```
Repository Operation
    ↓
[Local Audit Event Generator]
    ├── 操作者身份 (User/App)
    ├── 時間戳
    ├── 操作類型
    ├── 目標資源
    └── 變更前後狀態
    ↓
[全域 Audit Event Bus]
    ↓
[時間序列存儲]
    ├── 按租戶索引
    ├── 按時間索引
    └── 按事件類型索引
    ↓
[不可變日誌存儲]
```

---

## 訪問權限分層

### Enterprise Admin 視圖
```
可見範疇:
    ├── 所有子 Organization 的 Audit
    ├── 所有 Repository 的 Audit
    ├── 跨組織聚合查詢
    └── Compliance 導出
```

### Organization Owner 視圖
```
可見範疇:
    ├── 本 Organization 管理操作
    ├── 所有擁有的 Repository Audit
    ├── Member 活動追蹤
    └── 但看不到其他 Organization
```

### Repository Admin 視圖
```
可見範疇:
    ├── 僅本 Repository 的 Audit
    ├── Collaborator 活動
    ├── Settings 變更歷史
    └── 但看不到 Organization 層級操作
```

### 普通 Member
```
可見範疇:
    └── 無法訪問 Audit Log (除非 Organization 開放)
```

---

## Repository Audit 關鍵場景

### 1. Security Incident Investigation

**案例:懷疑 Repository 被入侵**
```
查詢流程:
    1. Repository Admin 檢視 Audit Log
    2. 過濾 "異常訪問" 事件
        ├── 非預期的 Collaborator 新增
        ├── Deploy Key 創建
        ├── Branch Protection 被關閉
        └── Secrets 被訪問 (Actions)
    3. 追蹤操作者身份
        ├── 是合法 Member 還是被盜用的 Token?
        ├── IP 位址異常?
        └── 操作時間異常 (半夜)?
    4. 撤銷權限 + 回滾設定
```

### 2. Compliance Audit

**案例:證明符合 SOC2/ISO 27001**
```
Organization Owner 導出:
    ├── 過去 90 天所有 Repository 權限變更
    ├── 敏感操作記錄 (force push, branch delete)
    ├── Access Review 證據 (定期移除過期 Collaborator)
    └── 交給稽核員檢視
```

### 3. Change Tracking

**案例:Branch Protection 突然失效**
```
Repository Admin 查詢:
    ├── 搜尋 "branch_protection_rule" 事件
    ├── 發現 3 天前被某 Admin 修改
    ├── 查看變更前後差異
    └── 聯繫該 Admin 確認原因 + 恢復設定
```

---

## Repository Audit vs Activity Log

### Activity Log (Public Timeline)
```
用途:團隊協作可見性
內容:
    ├── Commit Push
    ├── PR/Issue 開啟/關閉
    ├── Comment 討論
    └── Release 發布

可見性:Repository Member 可見
保留期:長期 (作為 Repository 歷史)
```

### Audit Log (Security & Compliance)
```
用途:安全稽核與合規
內容:
    ├── 權限變更
    ├── 敏感設定修改
    ├── Secret 訪問
    └── Security Events

可見性:僅 Admin 以上
保留期:
    ├── Free/Team: 90 天
    └── Enterprise: 可配置 (180 天或更長)
```

---

## 技術實現特性

### 1. 不可變性 (Immutability)
```
寫入後無法修改或刪除
    ├── 防止操作者事後湮滅證據
    ├── 使用 Append-only Storage
    └── 加密簽名保證完整性
```

### 2. 實時性
```
操作完成後幾秒內可查詢
    ├── 事件即時寫入 Event Bus
    ├── 異步索引到 Audit Storage
    └── 支持 Streaming API (Enterprise)
```

### 3. 查詢能力
```
多維度過濾:
    ├── 按操作者 (User/App)
    ├── 按事件類型 (repo.create, team.add_member)
    ├── 按時間範圍
    ├── 按資源 (特定 Repository)
    └── 按結果 (成功/失敗)

導出格式:
    ├── JSON
    ├── CSV
    └── SIEM 整合 (Splunk, Datadog)
```

---

## 跨層級事件關聯

**案例:Repository Transfer**
```
[Organization A Audit]
    └── "repo.transfer_outgoing"
         ├── 操作者: Owner@OrgA
         ├── 目標: RepoX
         └── 接收方: Organization B

[Organization B Audit]
    └── "repo.transfer_incoming"
         ├── 來源: Organization A
         ├── 接收者: Owner@OrgB
         └── Repository: RepoX

[Repository X Audit]
    └── "repo.ownership_changed"
         ├── 舊 Owner: Organization A
         ├── 新 Owner: Organization B
         └── 保留完整歷史 Audit
```

**全域視圖 (Enterprise Admin)**
```
可追蹤完整 Transfer 鏈:
    OrgA Audit → RepoX Audit → OrgB Audit
    └── 三個視角組成完整事件
```

---

## 總結

| 層級 | 記錄位置 | 訪問權限 | 用途 |
|------|---------|---------|------|
| **Enterprise** | 全域 Audit System | Enterprise Admin | 跨組織治理、合規稽核 |
| **Organization** | 全域 Audit System | Org Owner/Admin | 組織管理、Member 追蹤 |
| **Repository** | 全域 Audit System | Repo Admin+ | 權限管理、Security 調查 |

**關鍵設計**:
1. **統一存儲**:所有層級寫入同一個全域 Audit System
2. **分層訪問**:透過權限控制誰能看到什麼範疇
3. **事件關聯**:跨層級操作會在各層級留下對應記錄
4. **不可變性**:保證證據鏈完整性

所以回答你的問題:**Audit Log 是全域系統,Repository 的操作也記錄在內,只是訪問權限受限於角色**。