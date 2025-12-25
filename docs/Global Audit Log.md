## Angular 20 + Firebase 專案結構樹圖

```
src/app/
├── core/                           # 核心單例服務與全域系統
│   ├── auth/                       # 身份認證模組
│   │   ├── services/
│   │   │   ├── auth.service.ts              # Firebase Auth 封裝
│   │   │   ├── tenant.service.ts            # 租戶上下文管理
│   │   │   └── permission.service.ts        # RBAC 權限計算引擎
│   │   ├── guards/
│   │   │   ├── auth.guard.ts                # 路由守衛
│   │   │   ├── tenant.guard.ts              # 租戶邊界守衛
│   │   │   └── permission.guard.ts          # 權限守衛
│   │   ├── interceptors/
│   │   │   ├── tenant-context.interceptor.ts  # 自動注入 tenant_id
│   │   │   └── auth-token.interceptor.ts      # Firebase Token 注入
│   │   └── models/
│   │       ├── user.model.ts
│   │       ├── tenant.model.ts
│   │       └── permission.model.ts
│   │
│   ├── global-event-bus/                  # 全域事件總線
│   │   ├── services/
│   │   │   ├── event-bus.service.ts         # 事件分發核心
│   │   │   └── event-logger.service.ts      # 事件記錄
│   │   ├── models/
│   │   │   ├── base-event.model.ts
│   │   │   └── event-types.enum.ts
│   │   └── operators/
│   │       └── tenant-filter.operator.ts     # RxJS 租戶過濾
│   │
│   ├── global-audit-log/                      # 審計日誌系統
│   │   ├── services/
│   │   │   ├── audit-log.service.ts         # 日誌收集與查詢
│   │   │   └── audit-collector.service.ts   # 自動攔截關鍵操作
│   │   ├── models/
│   │   │   ├── audit-event.model.ts
│   │   │   └── audit-level.enum.ts
│   │   └── decorators/
│   │       └── auditable.decorator.ts        # 方法裝飾器自動記錄
│   │
│   ├── notification/               # 通知系統
│   │   ├── services/
│   │   │   ├── notification.service.ts      # 通知分發
│   │   │   ├── fcm.service.ts               # Firebase Cloud Messaging
│   │   │   └── in-app-notification.service.ts
│   │   ├── models/
│   │   │   └── notification.model.ts
│   │   └── components/
│   │       └── notification-center/         # 全域通知中心 UI
│   │
│   ├── search/                     # 全域搜尋
│   │   ├── services/
│   │   │   ├── search.service.ts            # 統一搜尋入口
│   │   │   └── search-indexer.service.ts    # Algolia/Typesense 整合
│   │   └── models/
│   │       └── search-result.model.ts
│   │
│   ├── rate-limit/                 # 流量控制
│   │   ├── services/
│   │   │   └── rate-limiter.service.ts      # 前端防抖 + 後端配額追蹤
│   │   └── interceptors/
│   │       └── rate-limit.interceptor.ts
│   │
│   ├── billing/                    # 計費與用量追蹤
│   │   ├── services/
│   │   │   ├── metering.service.ts          # 用量追蹤
│   │   │   └── subscription.service.ts      # 訂閱管理
│   │   └── models/
│   │       ├── plan.model.ts
│   │       └── usage.model.ts
│   │
│   ├── cache/                      # 租戶感知緩存
│   │   ├── services/
│   │   │   └── cache.service.ts             # IndexedDB/Memory Cache
│   │   └── strategies/
│   │       ├── tenant-cache-key.strategy.ts
│   │       └── invalidation.strategy.ts
│   │
│   └── core.module.ts              # 核心模組 (forRoot 單例註冊)
│
├── firebase/                       # Firebase 服務層封裝
│   ├── firestore/
│   │   ├── services/
│   │   │   ├── base-firestore.service.ts    # 抽象基礎 CRUD
│   │   │   └── tenant-firestore.service.ts  # 租戶隔離 CRUD
│   │   ├── operators/
│   │   │   ├── tenant-query.operator.ts     # 自動注入 where('tenant_id')
│   │   │   └── permission-filter.operator.ts
│   │   └── converters/
│   │       └── firestore-converter.ts       # 型別轉換
│   │
│   ├── storage/
│   │   ├── services/
│   │   │   ├── file-upload.service.ts       # 檔案上傳
│   │   │   └── tenant-storage.service.ts    # 租戶隔離路徑
│   │   └── pipes/
│   │       └── storage-url.pipe.ts          # 動態 URL 生成
│   │
│   ├── functions/
│   │   ├── services/
│   │   │   └── callable-functions.service.ts # Cloud Functions 呼叫
│   │   └── models/
│   │       └── function-request.model.ts
│   │
│   ├── security-rules/             # Security Rules 型別定義 (僅文檔)
│   │   └── rules-schema.ts
│   │
│   └── firebase.module.ts          # Firebase 模組整合
│
├── features/                       # 業務功能模組
│   ├── tenant-management/          # 租戶管理
│   │   ├── components/
│   │   │   ├── tenant-list/
│   │   │   ├── tenant-detail/
│   │   │   └── tenant-settings/
│   │   ├── services/
│   │   │   └── tenant-management.service.ts
│   │   ├── models/
│   │   │   └── tenant-config.model.ts
│   │   └── tenant-management-routing.module.ts
│   │
│   ├── organization/               # 組織管理 (類似 GitHub Organization)
│   │   ├── components/
│   │   │   ├── org-dashboard/
│   │   │   ├── org-members/
│   │   │   ├── org-teams/
│   │   │   └── org-settings/
│   │   ├── services/
│   │   │   ├── organization.service.ts
│   │   │   ├── team.service.ts
│   │   │   └── member.service.ts
│   │   └── organization-routing.module.ts
│   │
│   ├── repository/                 # 儲存庫管理 (核心業務)
│   │   ├── components/
│   │   │   ├── repo-list/
│   │   │   ├── repo-detail/
│   │   │   ├── repo-settings/
│   │   │   └── repo-collaborators/
│   │   ├── services/
│   │   │   ├── repository.service.ts
│   │   │   └── collaborator.service.ts
│   │   ├── models/
│   │   │   ├── repository.model.ts
│   │   │   └── repo-permission.model.ts
│   │   └── repository-routing.module.ts
│   │
│   ├── issue-tracking/             # Issue 追蹤
│   │   ├── components/
│   │   │   ├── issue-list/
│   │   │   ├── issue-detail/
│   │   │   └── issue-board/              # Kanban Board
│   │   ├── services/
│   │   │   ├── issue.service.ts
│   │   │   └── label.service.ts
│   │   └── issue-tracking-routing.module.ts
│   │
│   ├── pull-request/               # Pull Request 工作流
│   │   ├── components/
│   │   │   ├── pr-list/
│   │   │   ├── pr-detail/
│   │   │   └── code-review/
│   │   ├── services/
│   │   │   ├── pull-request.service.ts
│   │   │   └── code-review.service.ts
│   │   └── pull-request-routing.module.ts
│   │
│   ├── audit-viewer/               # 審計日誌查看器
│   │   ├── components/
│   │   │   ├── audit-log-list/
│   │   │   ├── audit-log-detail/
│   │   │   └── audit-search/
│   │   ├── services/
│   │   │   └── audit-viewer.service.ts
│   │   └── audit-viewer-routing.module.ts
│   │
│   ├── security/                   # 安全管理
│   │   ├── components/
│   │   │   ├── security-alerts/
│   │   │   ├── access-tokens/
│   │   │   └── 2fa-settings/
│   │   ├── services/
│   │   │   ├── security-alert.service.ts
│   │   │   └── token.service.ts
│   │   └── security-routing.module.ts
│   │
│   └── billing-portal/             # 計費門戶
│       ├── components/
│       │   ├── subscription-plan/
│       │   ├── usage-dashboard/
│       │   └── invoice-history/
│       ├── services/
│       │   └── billing-portal.service.ts
│       └── billing-portal-routing.module.ts
│
├── shared/                         # 共享模組
│   ├── components/                 # 通用 UI 組件
│   │   ├── data-table/             # 基於 nz-table 的通用表格
│   │   ├── avatar/                 # 用戶頭像
│   │   ├── tag-selector/           # 標籤選擇器
│   │   ├── markdown-editor/        # Tinymce 封裝
│   │   ├── permission-badge/       # 權限徽章顯示
│   │   ├── tenant-selector/        # 租戶切換器
│   │   └── empty-state/            # 空狀態佔位
│   │
│   ├── directives/
│   │   ├── permission.directive.ts       # *appPermission="'repo:write'"
│   │   ├── tenant-scope.directive.ts     # 租戶範疇控制
│   │   └── auditable-action.directive.ts # 自動記錄用戶操作
│   │
│   ├── pipes/
│   │   ├── relative-time.pipe.ts         # "2 hours ago"
│   │   ├── tenant-filter.pipe.ts
│   │   ├── permission-check.pipe.ts
│   │   └── safe-html.pipe.ts
│   │
│   ├── models/
│   │   ├── base.model.ts                 # 所有模型繼承的基類
│   │   ├── tenant-entity.model.ts        # 租戶實體基類
│   │   └── paginated-response.model.ts
│   │
│   ├── utils/
│   │   ├── date.util.ts
│   │   ├── string.util.ts
│   │   └── tenant-id-generator.util.ts
│   │
│   └── shared.module.ts            # 共享模組 (可重複導入)
│
├── layout/                         # 應用佈局
│   ├── components/
│   │   ├── main-layout/
│   │   │   ├── main-layout.component.ts
│   │   │   ├── header/                   # 頂部導航
│   │   │   │   ├── tenant-switcher/      # 租戶切換下拉
│   │   │   │   ├── notification-bell/
│   │   │   │   └── user-menu/
│   │   │   ├── sidebar/                  # 側邊欄
│   │   │   │   └── nav-menu/
│   │   │   └── footer/
│   │   ├── auth-layout/            # 登入/註冊佈局
│   │   └── blank-layout/           # 空白佈局 (錯誤頁面)
│   │
│   └── layout.module.ts
│
├── app.component.ts                # 根組件
├── app.config.ts                   # Angular 20 App Config
├── app.routes.ts                   # 路由配置 (使用新 Control Flow)
└── app.module.ts                   # 根模組 (如果使用 NgModule 模式)
```

---

## 交互拓撲圖

### 1. 垂直分層架構

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
│  (features/* components + layout/* + shared/components)      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                        │
│         (features/*/services + core/*/services)              │
└────────────┬───────────────────────────────┬────────────────┘
             │                               │
             ↓                               ↓
┌────────────────────────┐    ┌─────────────────────────────┐
│   Core Global Systems  │    │  Firebase Service Layer     │
│  (core/* - 全域單例)    │◄───┤  (firebase/* - 封裝層)      │
└────────────────────────┘    └─────────────┬───────────────┘
             │                               │
             │                               ↓
             │                  ┌────────────────────────────┐
             └─────────────────►│  Firebase Backend Services │
                                │  (Auth, Firestore, etc.)   │
                                └────────────────────────────┘
```

---

### 2. 核心系統交互拓撲

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Bootstrap                            │
│                      (app.config.ts)                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
              ┌────────────────────────┐
              │  CoreModule (forRoot)  │◄─────┐
              │  - 全域單例初始化       │      │
              └────────┬───────────────┘      │
                       │                      │
        ┌──────────────┼──────────────┬───────┼────────┐
        │              │              │       │        │
        ↓              ↓              ↓       ↓        ↓
┌──────────┐  ┌──────────────┐  ┌─────────┐ │  ┌──────────┐
│  Auth    │  │  Event Bus   │  │  Audit  │ │  │  Cache   │
│  Service │  │   Service    │  │ Service │ │  │ Service  │
└────┬─────┘  └──────┬───────┘  └────┬────┘ │  └────┬─────┘
     │               │               │      │       │
     │      ┌────────┴───────────────┴──────┘       │
     │      │                                        │
     │      ↓                                        │
     │  ┌──────────────────┐                        │
     │  │ Tenant Service   │◄───────────────────────┘
     │  │ (租戶上下文管理)  │
     │  └──────┬───────────┘
     │         │
     └─────────┼────────────────┐
               │                │
               ↓                ↓
        ┌─────────────┐  ┌─────────────────┐
        │ Permission  │  │ Notification    │
        │  Service    │  │   Service       │
        └─────────────┘  └─────────────────┘
```

---

### 3. HTTP 請求流程 (Interceptor Chain)

```
Component 發起請求
    ↓
┌────────────────────────────────────────┐
│  HttpClient                            │
└────────────┬───────────────────────────┘
             │
             ↓
┌────────────────────────────────────────┐
│  Auth Token Interceptor                │
│  - 注入 Firebase ID Token              │
└────────────┬───────────────────────────┘
             │
             ↓
┌────────────────────────────────────────┐
│  Tenant Context Interceptor            │
│  - 注入 X-Tenant-ID Header             │
│  - 或在 Body 中添加 tenant_id          │
└────────────┬───────────────────────────┘
             │
             ↓
┌────────────────────────────────────────┐
│  Rate Limit Interceptor                │
│  - 檢查前端防抖                        │
│  - 追蹤請求配額                        │
└────────────┬───────────────────────────┘
             │
             ↓
┌────────────────────────────────────────┐
│  Audit Collector Interceptor           │
│  - 記錄關鍵 API 呼叫                   │
└────────────┬───────────────────────────┘
             │
             ↓
     Firebase Backend
             │
             ↓ (Response)
┌────────────────────────────────────────┐
│  Error Interceptor                     │
│  - 統一錯誤處理                        │
│  - 401 → 觸發重新登入                  │
│  - 403 → 權限不足提示                  │
└────────────┬───────────────────────────┘
             │
             ↓
     回到 Component
```

---

### 4. 事件總線交互流程

```
┌──────────────────────────────────────────────────────────┐
│              任意 Service/Component 發出事件               │
│  eventBus.emit('repo:created', { repoId, tenantId })     │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ↓
          ┌──────────────────────┐
          │   Event Bus Service  │
          │  (Subject<BaseEvent>) │
          └──────────┬───────────┘
                     │
      ┌──────────────┼──────────────┬─────────────┐
      │              │              │             │
      ↓              ↓              ↓             ↓
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Audit    │  │Notification│ │ Analytics│  │ Feature  │
│ Collector│  │  Service  │  │  Service │  │ Services │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
      │              │              │             │
      ↓              ↓              ↓             ↓
  寫入 Audit     發送通知      追蹤事件      業務邏輯
  Firestore      (FCM/UI)     (Analytics)    響應
```

**使用範例**
```typescript
// repository.service.ts
async createRepository(data: CreateRepoDto): Promise<Repository> {
  const repo = await this.firestoreService.create('repositories', data);
  
  // 發出事件 - 解耦通知其他系統
  this.eventBus.emit({
    type: 'repo:created',
    payload: { repoId: repo.id, tenantId: repo.tenant_id },
    actor: this.authService.currentUser.uid
  });
  
  return repo;
}

// notification.service.ts (訂閱者)
constructor(private eventBus: EventBusService) {
  this.eventBus.on$('repo:created')
    .pipe(tenantFilter()) // RxJS operator 過濾當前租戶
    .subscribe(event => {
      this.sendNotification({
        title: '新儲存庫已建立',
        body: `${event.payload.repoId} 已成功建立`,
        recipients: this.getOrgMembers(event.payload.tenantId)
      });
    });
}
```

---

### 5. 權限檢查流程

```
User 操作 (點擊刪除按鈕)
    ↓
Component 呼叫 Service
    ↓
┌────────────────────────────────────┐
│  @Auditable() Decorator (可選)     │
│  - 自動記錄方法呼叫                │
└────────────┬───────────────────────┘
             ↓
┌────────────────────────────────────┐
│  Permission Service                │
│  .checkPermission(resource, action)│
└────────────┬───────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ↓             ↓
┌──────────┐  ┌──────────────┐
│ Tenant   │  │ Auth Service │
│ Service  │  │ (當前用戶)    │
└────┬─────┘  └──────┬───────┘
     │               │
     └───────┬───────┘
             ↓
┌────────────────────────────────────┐
│  計算有效權限                       │
│  1. 查詢用戶在租戶的角色            │
│  2. 查詢資源的權限規則              │
│  3. RBAC 矩陣計算                  │
└────────────┬───────────────────────┘
             │
      ┌──────┴──────┐
      ↓             ↓
   Allow         Deny
      │             │
      ↓             ↓
  執行操作      拋出錯誤
      │         顯示提示
      ↓
  Event Bus 發出事件
      │
      ↓
  Audit Log 記錄
```

---

### 6. Feature Module 與 Core 交互

```
┌─────────────────────────────────────────────────────────┐
│           Repository Feature Module                      │
│  (features/repository)                                   │
└───────────────────┬─────────────────────────────────────┘
                    │
         ┌──────────┼──────────┬──────────────┐
         │          │          │              │
         ↓          ↓          ↓              ↓
┌──────────┐ ┌──────────┐ ┌─────────┐ ┌─────────────┐
│Component │ │Component │ │ Service │ │   Service   │
│ (List)   │ │ (Detail) │ │ (CRUD)  │ │ (Business)  │
└────┬─────┘ └────┬─────┘ └────┬────┘ └──────┬──────┘
     │            │            │             │
     └────────────┴────────────┴─────────────┘
                    │
                    ↓
     ┌──────────────────────────────┐
     │  依賴 Core Services (注入)    │
     ├──────────────────────────────┤
     │  - TenantService             │
     │  - PermissionService         │
     │  - EventBusService           │
     │  - AuditLogService           │
     │  - NotificationService       │
     └──────────────┬───────────────┘
                    │
                    ↓
     ┌──────────────────────────────┐
     │  依賴 Firebase Services       │
     ├──────────────────────────────┤
     │  - TenantFirestoreService    │
     │  - FileUploadService         │
     │  - CallableFunctionsService  │
     └──────────────────────────────┘
```

**依賴注入範例**
```typescript
// features/repository/services/repository.service.ts
@Injectable()
export class RepositoryService {
  constructor(
    // Core Services (全域單例)
    private tenant: TenantService,
    private permission: PermissionService,
    private eventBus: EventBusService,
    private audit: AuditLogService,
    
    // Firebase Services (封裝層)
    private firestore: TenantFirestoreService,
    private storage: TenantStorageService
  ) {}
  
  async deleteRepository(repoId: string): Promise<void> {
    // 1. 權限檢查
    await this.permission.requirePermission('repository', 'delete', repoId);
    
    // 2. 執行刪除
    await this.firestore.delete('repositories', repoId);
    
    // 3. 發出事件 (解耦)
    this.eventBus.emit({
      type: 'repo:deleted',
      payload: { repoId, tenantId: this.tenant.currentId }
    });
    
    // 4. Audit 已由 Interceptor/Decorator 自動記錄
  }
}
```

---

### 7. Lazy Loading 模組依賴

```
App Shell (立即載入)
    ├── CoreModule (forRoot) - 全域單例
    ├── SharedModule - 通用組件
    ├── LayoutModule - 佈局
    └── FirebaseModule - Firebase 初始化
         │
         └─► Routes 觸發懶載入
                │
                ├─► /organization → OrganizationModule
                │                     │
                │                     └─► 注入 CoreModule Services
                │
                ├─► /repository → RepositoryModule
                │                   │
                │                   └─► 注入 CoreModule + SharedModule
                │
                ├─► /audit → AuditViewerModule
                │              │
                │              └─► 注入 CoreModule (AuditLogService)
                │
                └─► /billing → BillingPortalModule
                                 │
                                 └─► 注入 CoreModule (BillingService)
```

---

### 8. 租戶隔離實現流程

```
用戶登入
    ↓
AuthService.signIn()
    ↓
Firebase Auth 驗證成功
    ↓
┌────────────────────────────────────┐
│  查詢用戶所屬租戶                   │
│  GET /users/{uid}/tenants          │
└────────────┬───────────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│  TenantService.setCurrentTenant()  │
│  - 儲存到 BehaviorSubject          │
│  - 寫入 LocalStorage (可選)        │
└────────────┬───────────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│  所有後續請求自動攜帶 tenant_id     │
│  (透過 Interceptor)                │
└────────────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ↓             ↓
Firestore Query   Cloud Functions
.where(           Context.tenant_id
  'tenant_id',    自動驗證
  '==',
  currentTenantId
)
```

**Firestore Query 自動注入**
```typescript
// firebase/firestore/services/tenant-firestore.service.ts
@Injectable()
export class TenantFirestoreService {
  constructor(
    private firestore: Firestore,
    private tenant: TenantService
  ) {}
  
  query<T>(collectionPath: string, ...queryConstraints: QueryConstraint[]): Observable<T[]> {
    const tenantId = this.tenant.currentId;
    
    // 自動注入租戶過濾
    const tenantConstraint = where('tenant_id', '==', tenantId);
    
    const q = query(
      collection(this.firestore, collectionPath),
      tenantConstraint,
      ...queryConstraints
    );
    
    return collectionData(q) as Observable<T[]>;
  }
}
```

---

## 總結:關鍵架構原則

### 1. 分層解耦
- **UI Layer** 只依賴 Services,不直接操作 Firebase
- **Business Logic** 透過 Core Services 協調全域功能
- **Data Access** 由 Firebase Services 統一封裝

### 2. 單一職責
- **Core Module**: 全域系統,應用級單例
- **Features Module**: 業務邏輯,可獨立開發測試
- **Firebase Module**: 技術封裝,隔離 Firebase API 變更
- **Shared Module**: 純展示組件與工具,無業務邏輯

### 3. 租戶感知
- 所有數據操作自動注入 `tenant_id`
- 權限計算基於租戶上下文
- 事件總線支持租戶過濾

### 4. 事件驅動
- 業務操作透過 Event Bus 解耦副作用
- Audit/Notification/Analytics 作為事件訂閱者
- 支持跨模組協作不產生硬依賴

### 5. 可測試性
- Services 透過依賴注入,易於 Mock
- 純函數工具類不依賴 Angular 框架
- Event Bus 可替換為 Testing Subject

這種結構讓你可以漸進式實現 GitHub 級別的功能,同時保持程式碼組織清晰、可維護性高。