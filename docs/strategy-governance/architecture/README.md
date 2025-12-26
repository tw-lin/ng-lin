# 系統架構 (System Architecture)

> 本目錄包含 GigHub 專案的系統架構設計、設計模式與技術決策文件。

## 📋 目錄結構

```
architecture/
├── README.md                           # 本檔案
├── 01-architecture-overview.md         # 架構總覽
├── 02-three-layer-architecture.md      # 三層架構實作重點
├── 03-monitoring-module-manager.md     # 監控/模組管理摘要
├── 04-angular-fire-integration.md      # Angular + Firebase 整合
├── 05-contract-ai-integration.md       # 合約 AI / 文件解析架構
├── 06-angular-fire-analysis.md         # Angular-Fire 整合分析索引（docs-old 提取）
└── 07-monitoring-module-manager-index.md # 監控/模組管理索引（docs-old 提取）
├── diagrams/                           # 架構圖表目錄
│   ├── system-architecture.mermaid
│   ├── three-layer.mermaid
│   └── blueprint-context.mermaid
└── decisions/                          # 架構決策記錄 (ADR)
    ├── 001-three-layer-architecture.md
    ├── 002-signals-state-management.md
    └── 003-repository-pattern.md
```

## 🎯 核心架構原則

### 1. 三層架構 (Three-Layer Architecture)

GigHub 採用嚴格的三層架構，確保關注點分離：

```
┌─────────────────────────────────────────┐
│     Presentation Layer (UI)             │
│     src/app/routes/                     │
│     - 展示邏輯                           │
│     - 使用者互動                         │
│     - Signals 狀態管理                   │
└─────────────────────────────────────────┘
              ↓ inject()
┌─────────────────────────────────────────┐
│     Business Layer (Service)            │
│     src/app/core/services/              │
│     - 業務邏輯協調                       │
│     - 事件發布訂閱                       │
│     - 跨 Repository 編排                 │
└─────────────────────────────────────────┘
              ↓ inject()
┌─────────────────────────────────────────┐
│     Data Layer (Repository)             │
│     src/app/core/data-access/           │
│     - 資料存取抽象                       │
│     - Firestore 操作封裝                │
│     - CRUD 操作                         │
└─────────────────────────────────────────┘
```

**強制規範**:
- ✅ UI 只能注入 Service，不能直接呼叫 Repository
- ✅ Service 負責協調多個 Repository
- ✅ Repository 只負責資料存取，不包含業務邏輯
- ❌ 禁止跨層直接依賴

### 2. Blueprint 系統架構

Blueprint 是 GigHub 的核心概念，代表**權限邊界**而非資料邊界：

```typescript
// Blueprint 的本質
Blueprint {
  id: string;
  name: string;
  ownerType: 'user' | 'organization';
  ownerId: string;
}

// Blueprint Member 是獨立模型
BlueprintMember {
  blueprintId: string;
  memberType: 'user' | 'team' | 'partner';
  memberId: string;
  role: string;
  permissions: string[];
  status: 'active' | 'suspended' | 'revoked';
}
```

**設計原則**:
- Blueprint 定義「誰能存取什麼資源」
- 成員資格透過 `BlueprintMember` 管理
- 所有領域資料只需知道 `blueprintId`
- 權限檢查在 Firestore Security Rules

### 3. 模組化設計

```
src/app/
├── core/                      # 核心層
│   ├── data-access/           # Repository
│   ├── services/              # Service
│   ├── facades/               # Facade (可選)
│   └── state/                 # 全域狀態管理
├── routes/                    # 功能模組
│   ├── blueprints/
│   ├── tasks/
│   └── dashboard/
└── shared/                    # 共享資源
    ├── components/
    ├── utils/
    └── types/
```

## 🔧 設計模式

### Repository Pattern

所有 Firestore 操作必須透過 Repository 進行：

```typescript
@Injectable({ providedIn: 'root' })
export class TaskRepository extends FirestoreBaseRepository<Task> {
  protected collectionName = 'tasks';
  
  async findByBlueprintId(blueprintId: string): Promise<Task[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        this.collectionRef,
        where('blueprint_id', '==', blueprintId),
        where('deleted_at', '==', null)
      );
      return this.queryDocuments(q);
    });
  }
}
```

**優點**:
- 資料存取邏輯集中管理
- 自動重試機制 (Exponential Backoff)
- 統一錯誤處理
- 易於測試與維護

### Event-Driven Architecture

模組間通訊透過事件總線：

```typescript
// 發布事件
this.eventBus.publish({
  type: 'task.created',
  blueprintId: 'blueprint-1',
  timestamp: new Date(),
  actor: 'user-123',
  data: createdTask
});

// 訂閱事件
this.eventBus.on('task.created')
  .pipe(takeUntilDestroyed())
  .subscribe(event => {
    console.log('Task created:', event.data);
  });
```

**優點**:
- 低耦合
- 易於擴展
- 事件可審計
- 支援異步處理

### Facade Pattern (可選)

當業務邏輯複雜時，使用 Facade 協調多個服務：

```typescript
@Injectable({ providedIn: 'root' })
export class BlueprintFacade {
  private blueprintRepo = inject(BlueprintRepository);
  private memberRepo = inject(BlueprintMemberRepository);
  private eventBus = inject(BlueprintEventBus);
  
  async createBlueprint(
    name: string,
    ownerId: string
  ): Promise<Blueprint> {
    // 協調多個 repository 與服務
    const blueprint = await this.blueprintRepo.create({ name, ownerId });
    await this.memberRepo.addOwner(blueprint.id, ownerId);
    this.eventBus.publish({ type: 'blueprint.created', data: blueprint });
    return blueprint;
  }
}
```

## 📐 技術堆疊

### 前端技術

| 技術 | 版本 | 用途 |
|------|------|------|
| Angular | 20.x | 前端框架 |
| ng-alain | 20.x | 企業級 UI 框架 |
| ng-zorro-antd | 20.x | UI 元件庫 |
| TypeScript | 5.9.x | 開發語言 |
| RxJS | 7.8.x | 反應式程式設計 |

### 後端技術

| 技術 | 版本 | 用途 |
|------|------|------|
| Firebase | 20.x | 後端服務平台 |
| Firestore | - | NoSQL 資料庫 |
| Cloud Functions | - | Serverless 運算 |
| Firebase Auth | - | 認證服務 |
| Cloud Storage | - | 檔案儲存 |

### 開發工具

| 工具 | 用途 |
|------|------|
| Firebase Emulator | 本地開發與測試 |
| Angular CLI | 專案腳手架與建置 |
| ESLint | 程式碼檢查 |
| Prettier | 程式碼格式化 |
| Jest/Karma | 單元測試 |
| Cypress/Playwright | E2E 測試 |

## 🔐 安全架構

### 多租戶資料隔離

使用 **Dedicated Membership Collection** 策略：

```javascript
// Firestore Security Rules
match /tasks/{taskId} {
  allow read: if isAuthenticated() && 
                 isBlueprintMember(resource.data.blueprint_id);
  
  allow create: if isAuthenticated() && 
                   isBlueprintMember(request.resource.data.blueprint_id) &&
                   hasPermission(request.resource.data.blueprint_id, 'task:create');
}

function isBlueprintMember(blueprintId) {
  let memberId = request.auth.uid + '_' + blueprintId;
  return exists(/databases/$(database)/documents/blueprintMembers/$(memberId));
}
```

### 權限層級

```
┌──────────────────┐
│  Security Rules  │ ← 最後防線（後端）
└──────────────────┘
         ↑
┌──────────────────┐
│  Guards & ACL    │ ← 路由守衛（前端）
└──────────────────┘
         ↑
┌──────────────────┐
│  UI Permissions  │ ← 元件權限檢查（前端）
└──────────────────┘
```

## 🚀 效能優化策略

### 1. 懶載入 (Lazy Loading)

```typescript
export const routes: Routes = [
  {
    path: 'blueprints',
    loadComponent: () => 
      import('./routes/blueprints/blueprints.component')
        .then(m => m.BlueprintsComponent)
  }
];
```

### 2. OnPush 變更檢測

```typescript
@Component({
  selector: 'app-task-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskItemComponent {
  task = input.required<Task>();
}
```

### 3. Firestore 查詢優化

- 使用複合索引
- 限制查詢結果數量
- 使用分頁機制
- 實作快取策略

### 4. Signals 細粒度響應式

```typescript
// 只有相依的 computed signal 會更新
const totalTasks = computed(() => this.tasks().length);
const completedTasks = computed(() => 
  this.tasks().filter(t => t.status === 'completed').length
);
```

## 📊 架構決策記錄 (ADR)

### ADR-001: 採用三層架構

**背景**: 需要清晰的關注點分離與可測試性

**決策**: 採用 UI → Service → Repository 三層架構

**後果**: 
- ✅ 程式碼結構清晰
- ✅ 易於測試與維護
- ⚠️ 學習曲線較陡峭

### ADR-002: 使用 Signals 管理狀態

**背景**: 需要細粒度的響應式狀態管理

**決策**: 使用 Angular Signals 取代 NgRx/Redux

**後果**:
- ✅ 簡化狀態管理
- ✅ 更好的效能
- ✅ 與 Angular 深度整合
- ❌ 不適合極複雜的狀態邏輯

### ADR-003: Repository Pattern 強制使用

**背景**: 需要統一的資料存取層

**決策**: 所有 Firestore 操作必須透過 Repository

**後果**:
- ✅ 集中管理資料存取
- ✅ 自動重試與錯誤處理
- ✅ 易於測試
- ⚠️ 增加一層抽象

## 📚 相關文件

- [資料模型](../data-model(資料模型)/README.md) - Firestore 資料結構
- [安全規範](../security(安全)/README.md) - Security Rules 設計
- [設計原則](../principles(原則)/principles.md) - 核心設計原則
- [API 規格](../api(API/介面規格)/README.md) - API 介面定義

## 🔄 變更記錄

### v1.0.0 (2025-12-21)
- ✅ 建立系統架構文件
- ✅ 定義三層架構規範
- ✅ 說明 Blueprint 系統設計
- ✅ 記錄關鍵架構決策

## 📞 維護與更新

- 架構變更需經過團隊審查
- 每 6 個月檢視一次架構文件
- 重大變更需更新 ADR
- 開 PR 時需說明架構影響

---

**維護者**: GigHub 開發團隊  
**最後更新**: 2025-12-21  
**版本**: v1.0.0
