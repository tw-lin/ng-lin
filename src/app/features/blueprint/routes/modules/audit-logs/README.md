# Audit Logs Module

> 審計記錄模組 - Blueprint V2 模組化實作

## 概述

Audit Logs Module 是一個完整的審計記錄解決方案，用於追蹤和記錄藍圖中的所有重要操作和事件。

## 功能特性

### 核心功能

- ✅ **自動記錄**: 自動追蹤系統事件
- ✅ **批次記錄**: 支援批次建立審計記錄
- ✅ **進階查詢**: 支援多條件篩選和查詢
- ✅ **統計摘要**: 提供審計記錄統計分析
- ✅ **分頁載入**: 高效的分頁載入機制
- ✅ **事件分類**: 按類別、嚴重性、狀態分類

### 技術特性

- 🎯 **Signals 狀態管理**: 使用 Angular Signals 管理反應式狀態
- 🏗️ **分層架構**: Repository → Service → Component 清晰分層
- 🔄 **生命週期管理**: 完整實作 IBlueprintModule 生命週期
- 📡 **事件總線整合**: 與 Blueprint EventBus 整合
- 🎨 **UI 元件**: 提供開箱即用的 UI 元件

## 目錄結構

```
audit-logs/
├── audit-logs.module.ts          # 主模組實作 (IBlueprintModule)
├── module.metadata.ts            # 模組元資料和設定
├── index.ts                      # 匯出入口
├── README.md                     # 本文件
├── config/                       # 配置
│   └── audit-logs.config.ts
├── models/                       # 資料模型
│   ├── audit-log.model.ts        # 完整審計記錄模型
│   └── audit-log.types.ts        # 簡化類型定義
├── repositories/                 # 資料存取層
│   └── audit-log.repository.ts   # Firestore 資料存取
├── services/                     # 業務邏輯層
│   └── audit-logs.service.ts     # 審計記錄服務
├── components/                   # UI 元件
│   └── audit-logs.component.ts   # 審計記錄顯示元件
└── exports/                      # 公開 API
    └── audit-logs-api.exports.ts
```

## 快速開始

### 1. 註冊模組

```typescript
import { AuditLogsModule } from './modules/audit-logs';

// 在 Blueprint Container 中註冊（如果使用模組系統）
await container.registerModule(AuditLogsModule);
```

### 2. 使用服務

```typescript
import { inject } from '@angular/core';
import { AuditLogsService } from './modules/audit-logs/core/services/audit-logs.service';
import { CreateAuditLogData, AuditEventType, AuditCategory, AuditSeverity, AuditStatus, ActorType } from './modules/audit-logs/core/models';

class MyComponent {
  private auditService = inject(AuditLogsService);

  async recordAction() {
    const logData: CreateAuditLogData = {
      blueprintId: 'blueprint-123',
      eventType: AuditEventType.BLUEPRINT_UPDATED,
      category: AuditCategory.BLUEPRINT,
      severity: AuditSeverity.INFO,
      actorId: 'user-456',
      actorType: ActorType.USER,
      resourceType: 'blueprint',
      resourceId: 'blueprint-123',
      action: 'Updated blueprint settings',
      message: 'User updated blueprint configuration',
      status: AuditStatus.SUCCESS
    };

    await this.auditService.recordLog(logData);
  }

  async loadLogs() {
    await this.auditService.loadLogs('blueprint-123', {
      category: AuditCategory.BLUEPRINT,
      limit: 50
    });

    console.log('Logs:', this.auditService.logs());
  }
}
```

### 3. 使用元件

```typescript
import { Component } from '@angular/core';
import { AuditLogsComponent } from './modules/audit-logs';

@Component({
  selector: 'app-my-page',
  standalone: true,
  imports: [AuditLogsComponent],
  template: `
    <app-audit-logs [blueprintId]="blueprintId" />
  `
})
export class MyPageComponent {
  blueprintId = 'blueprint-123';
}
```

## 🔥 Firebase 整合

本模組**完全自包含**，直接使用 `@angular/fire` 進行 Firestore 操作，不依賴 `@core` 層。

### Repository 實作

Audit-logs 模組在 `core/repositories/` 目錄下實作自己的 Repository：

```typescript
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, orderBy, limit as firestoreLimit, getDocs, addDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuditLogRepository {
  private firestore = inject(Firestore); // ✅ 直接注入 @angular/fire
  
  async create(data: CreateAuditLogData): Promise<AuditLogDocument> {
    const docRef = await addDoc(collection(this.firestore, 'audit_logs'), {
      ...data,
      timestamp: new Date()
    });
    return { id: docRef.id, ...data } as AuditLogDocument;
  }
  
  async findByBlueprintId(blueprintId: string, pageSize = 50): Promise<AuditLogDocument[]> {
    const q = query(
      collection(this.firestore, 'audit_logs'),
      where('blueprint_id', '==', blueprintId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(pageSize)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogDocument));
  }
}
```

## API 參考

### AuditLogsService

**主要方法:**

- `recordLog(data: CreateAuditLogData): Promise<AuditLogDocument>` - 記錄單一審計記錄
- `recordBatch(logs: CreateAuditLogData[]): Promise<void>` - 批次記錄
- `loadLogs(blueprintId: string, options?: AuditLogQueryOptions): Promise<void>` - 載入審計記錄
- `loadSummary(blueprintId: string, startDate?: Date, endDate?: Date): Promise<void>` - 載入統計摘要
- `filterByCategory(blueprintId: string, category: AuditCategory): Promise<void>` - 按類別篩選
- `clearState(): void` - 清除狀態

**Signals:**

- `logs: Signal<AuditLogDocument[]>` - 審計記錄列表
- `loading: Signal<boolean>` - 載入狀態
- `error: Signal<Error | null>` - 錯誤狀態
- `summary: Signal<AuditLogSummary | null>` - 統計摘要
- `hasLogs: Signal<boolean>` - 是否有記錄
- `errorCount: Signal<number>` - 錯誤記錄數量

### AuditLogRepository

**主要方法:**

- `create(data: CreateAuditLogData): Promise<AuditLogDocument>` - 建立審計記錄
- `createBatch(logs: CreateAuditLogData[]): Promise<void>` - 批次建立
- `findByBlueprintId(blueprintId: string, pageSize?: number, lastDoc?: QueryDocumentSnapshot): Promise<AuditLogPage>` - 分頁查詢
- `queryLogs(blueprintId: string, options: AuditLogQueryOptions): Promise<AuditLogDocument[]>` - 進階查詢
- `getSummary(blueprintId: string, startDate?: Date, endDate?: Date): Promise<AuditLogSummary>` - 取得統計

### 資料模型

#### AuditLogDocument

```typescript
interface AuditLogDocument {
  id?: string;
  blueprintId: string;
  eventType: AuditEventType;
  category: AuditCategory;
  severity: AuditSeverity;
  actorId: string;
  actorType: ActorType;
  resourceType: string;
  resourceId?: string;
  action: string;
  message: string;
  changes?: AuditChange[];
  context?: AuditContext;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  timestamp: Timestamp | Date;
  status: AuditStatus;
  error?: AuditError;
}
```

#### 列舉類型

**AuditEventType**: 事件類型 (blueprint.created, module.added, etc.)
**AuditCategory**: 類別 (blueprint, module, member, permission, access, system)
**AuditSeverity**: 嚴重性 (critical, high, medium, low, info)
**AuditStatus**: 狀態 (success, failed, partial, pending)
**ActorType**: 執行者類型 (user, system, service, api)

## 設定

### 預設設定

```typescript
const AUDIT_LOGS_MODULE_DEFAULT_CONFIG = {
  features: {
    enableAutoLogging: true,
    enableBatchLogging: false,
    enableRealTimeSync: false,
    enableLogExport: true,
    enableLogSearch: true,
    enableLogFiltering: true,
    enableLogSummary: true,
    enableDetailedView: true,
    enableLogRetention: true
  },
  settings: {
    logRetentionDays: 365,
    maxLogsPerPage: 100,
    enabledCategories: ['blueprint', 'module', 'member', 'permission', 'access', 'system'],
    minSeverityLevel: 'info',
    autoDeleteAfterRetention: false
  }
};
```

## 事件

模組發出以下事件:

- `audit-logs.log_created` - 記錄已建立
- `audit-logs.log_batch_created` - 批次記錄已建立
- `audit-logs.logs_loaded` - 記錄已載入
- `audit-logs.logs_filtered` - 記錄已篩選
- `audit-logs.logs_exported` - 記錄已匯出
- `audit-logs.summary_generated` - 摘要已生成
- `audit-logs.error_occurred` - 發生錯誤

## 最佳實踐

### 1. 記錄重要事件

```typescript
// ✅ 好的做法: 記錄業務關鍵操作
await auditService.recordLog({
  blueprintId,
  eventType: AuditEventType.BLUEPRINT_PUBLISHED,
  category: AuditCategory.BLUEPRINT,
  severity: AuditSeverity.HIGH,
  actorId: userId,
  actorType: ActorType.USER,
  resourceType: 'blueprint',
  resourceId: blueprintId,
  action: 'Published blueprint',
  message: 'Blueprint published to production',
  status: AuditStatus.SUCCESS
});

// ❌ 避免: 記錄過於瑣碎的操作
// 不要記錄每次 UI 點擊或滑鼠移動
```

### 2. 使用適當的嚴重性級別

```typescript
// Critical: 系統安全事件
severity: AuditSeverity.CRITICAL

// High: 重要業務操作
severity: AuditSeverity.HIGH

// Medium: 一般業務操作
severity: AuditSeverity.MEDIUM

// Low: 次要操作
severity: AuditSeverity.LOW

// Info: 資訊性事件
severity: AuditSeverity.INFO
```

### 3. 記錄變更詳情

```typescript
const changes = [
  {
    field: 'status',
    oldValue: 'draft',
    newValue: 'published',
    changeType: 'updated' as const
  }
];

await auditService.recordLog({
  // ... other fields
  changes
});
```

### 4. 提供上下文資訊

```typescript
const context = {
  module: 'blueprint-designer',
  feature: 'publish',
  sessionId: 'session-123',
  location: {
    country: 'TW',
    city: 'Taipei'
  }
};

await auditService.recordLog({
  // ... other fields
  context
});
```

## 效能考量

1. **批次記錄**: 對於大量記錄，使用 `recordBatch()` 而非多次呼叫 `recordLog()`
2. **分頁載入**: 使用 `findByBlueprintId()` 的分頁功能載入大量記錄
3. **適當的查詢條件**: 使用 category、resourceType 等條件縮小查詢範圍
4. **快取策略**: Service 層提供本地快取，減少重複查詢

## 安全性

1. **存取控制**: 透過 ACL 控制誰可以查看審計記錄
2. **資料完整性**: 審計記錄不可修改或刪除 (僅建立和查詢)
3. **敏感資訊**: 避免在 changes 中記錄敏感資料 (密碼、token 等)
4. **IP 追蹤**: 自動記錄 IP 地址和 User Agent

## 疑難排解

### 問題: 記錄未顯示

**解決方案:**
1. 檢查 blueprintId 是否正確
2. 確認使用者有 `audit.read` 權限
3. 檢查 Firestore 規則是否正確設定
4. 查看 Console 是否有錯誤訊息

### 問題: 查詢效能差

**解決方案:**
1. 在 Firestore 建立複合索引
2. 使用更具體的查詢條件
3. 減少 limit 數量
4. 考慮使用快取

## 授權

Proprietary - GigHub Development Team

## 變更記錄

### v1.0.0 (2025-12-13)
- ✨ 初始發布
- ✅ 完整模組實作
- ✅ Signals 狀態管理
- ✅ UI 元件
- ✅ 文件完整

---

**維護者**: GigHub Development Team  
**最後更新**: 2025-12-13
