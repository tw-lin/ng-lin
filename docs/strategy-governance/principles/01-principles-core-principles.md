# GigHub 系統設計原則

## 核心理念

GigHub 是一個企業級的工地施工進度追蹤管理系統，建立在以下核心原則之上：

- 🔹 **多租戶架構** (Multi-Tenancy)
- 🔹 **高度可擴充** (Scalability)
- 🔹 **權限與安全** (Security & Authorization)
- 🔹 **長期演進能力** (Long-term Evolution)

---

## 系統實體定義

### 基礎實體

- **用戶 (User)** - 系統的個別使用者
- **組織 (Organization)** - 企業或團體實體
- **團隊 (Team)** - 組織內部的協作單位
- **夥伴 (Partner)** - 組織外部的協作實體
- **藍圖 (Blueprint)** - 專案的容器與權限邊界

### 藍圖 (Blueprint) 的本質

藍圖只做一件事：**定義誰能存取什麼資源**

- 它有一個 **Owner**，而 Owner 可以是不同型別（User 或 Organization）
- 藍圖是權限邊界，不是資料邊界

### 子帳戶關係

✅ **Team 與 Partner 都是「組織的子帳戶（Sub-Account）」**  
❌ **但它們不是「同一種子帳戶」**

- **Team** = 組織內部子帳戶 (Internal Sub-Account)
- **Partner** = 組織外部關係子帳戶 (External / Federated Sub-Account)

### 成員結構

#### 當 Owner = User 時
→ Members: User / Collaborators (僅限使用者)

#### 當 Owner = Organization 時
→ Members: Organization Members / Teams / Partners

### 任務指派規則

Task assignment is scoped to blueprint membership.

- 任務只能指派給藍圖的有效成員（users, teams, partners）
- 允許的 assignee 類型由藍圖的 owner 決定

---

## 十大設計原則

### 一、身份（Identity）與角色（Role）必須嚴格解耦

#### 原則 1：身份 ≠ 權限 ≠ 行為

**User / Organization / Team / Partner**  
👉 只代表「**誰**」

**Role / Permission**  
👉 代表「**能做什麼**」

**Action / Policy**  
👉 代表「**在什麼條件下能做**」

#### Blueprint 不應 hardcode 任何角色語意

❌ **錯誤做法：**
- Team 就一定可以指派任務
- Partner 一定不能看財務

✅ **正確做法：**

Blueprint Owner 決定：
- 哪些 Member Type 可存在
- 哪些 Role 可被賦予
- 哪些 Role 可執行哪些 Action

> 🔑 **這是避免「Partner 特例地獄」的關鍵**

---

### 二、Blueprint 是「權限邊界」不是資料邊界

#### 原則 2：Blueprint = Authorization Boundary

Blueprint 只做三件事：

1. **定義「誰是成員」**
2. **定義「成員能做什麼」**
3. **限制「行為只能在成員集合內發生」**

#### Blueprint 不應：

- ❌ 強制資料儲存方式
- ❌ 綁定某個 domain schema
- ❌ 知道任務 / 財務 / 文件的內部結構

#### 所有 domain 都必須做到：

```
Domain Data
→ 只知道 blueprint_id
→ 不知道 owner 是誰
```

---

### 三、Owner Type 必須是「策略」而不是「分支判斷」

#### 原則 3：Owner 是 Policy Source，不是 if-else

Blueprint has exactly ONE owner:
```
Owner ∈ {User, Organization}
```

#### ❌ 不要寫：

```typescript
if (owner.type === 'organization') {
  // 特定邏輯
}
```

#### ✅ 而是：

```typescript
ownerPolicy.canAssignTo(memberType)
ownerPolicy.canInvite(memberType)
ownerPolicy.allowedAssigneeTypes
```

#### 未來擴充性

這樣未來你要加：
- AI Agent Owner
- DAO Owner
- Smart Contract Owner

**Blueprint 不用改結構**

---

### 四、Membership 是「關係模型」，不是 Entity 屬性

#### 原則 4：Membership 永遠是獨立模型

```typescript
BlueprintMember {
  blueprint_id
  member_type (user | team | partner)
  member_id
  role
  status
}
```

#### 禁止：

```typescript
team.blueprints[]
partner.blueprints[]
```

#### 原因

> 🔥 **一個成員，在不同 Blueprint 裡，權限永遠不同**

---

### 五、Task Assignment ≠ Ownership ≠ Responsibility

#### 原則 5：任務指派不等於責任歸屬

即使你允許：
- 指派給 Team
- 指派給 Partner

也必須保證：
- **最終執行人永遠是 User**
- **行為審計永遠回到 User**

#### 建議結構：

```typescript
Task {
  assigned_to (team / partner / user)
  executor (user, nullable)
  accountable (user or organization)
}
```

這能保證：
- Partner 是外包，不是黑盒
- Team 是集合，不是幽靈

---

### 六、跨 Blueprint 行為必須是「顯式授權」

#### 原則 6：Blueprint 不自動信任 Blueprint

#### 禁止：

- ❌ 同一個 Organization 的 Blueprint 可以互相存取

#### 所有跨 Blueprint 行為都必須：

- ✅ 建立 Link / Grant / Contract
- ✅ 有 scope
- ✅ 可撤銷
- ✅ 可審計

> 📌 **這對 Partner 特別重要（法律 & 合約）**

---

### 七、審計（Audit）是一級公民

#### 原則 7：任何跨帳戶行為必須可追溯

只要牽涉到：
- Partner
- Team 代表行為
- 組織資源

就必須記錄：

```typescript
AuditLog {
  who (user)
  acting_as (team / partner / org)
  in_blueprint
  did_what
  when
}
```

> ⚠️ **沒有這個，後期一定會炸（真的）**

---

### 八、Blueprint 是「容器」，不是「流程」

#### 原則 8：流程屬於 Engine，不屬於 Blueprint

Blueprint 不應該：
- ❌ hardcode workflow
- ❌ 綁定某一種 task flow
- ❌ 內建狀態機邏輯

它只提供：
- Context
- Membership
- Policy Surface

#### Workflow / Automation / State Machine
👉 **全部在 Engine 層**

---

### 九、刪除永遠是「狀態」，不是「消失」

#### 原則 9：永不硬刪 Owner / Member

特別是 Partner：
- 歷史任務
- 合約
- 責任歸屬

**都不能消失**

```typescript
status = suspended | revoked | archived
```

Blueprint 歷史必須可回放

---

### 十、Blueprint 是「最小治理單位」

#### 原則 10：所有治理行為必須可下沉到 Blueprint

包括：
- 成員管理
- 權限調整
- Partner 存取
- 任務範圍

#### 禁止：

- ❌ 只能在 Organization 全域設定

否則 Blueprint 就不是真正的邏輯容器

---

## 核心總結

> **Blueprint 不是「功能模組」  
> Blueprint 是「信任與權限的最小閉包」**

---

## 技術實作考量

### Angular 安全性最佳實踐

基於 Angular 官方文檔和 Google 安全工程團隊的建議：

#### 1. 內建安全機制

- **HTML Sanitization** - Angular 自動清理不安全的 HTML 內容
- **Trusted Types** - 支援瀏覽器的 Trusted Types API
- **XSRF Protection** - HttpClient 內建 XSRF 防護機制

#### 2. 安全 API 使用

❌ **避免使用標記為 "Security Risk" 的 API**：
- `bypassSecurityTrustHtml()`
- `bypassSecurityTrustScript()`
- `bypassSecurityTrustStyle()`
- `bypassSecurityTrustUrl()`
- `bypassSecurityTrustResourceUrl()`

✅ **應該：**
- 使用 Angular 的內建清理機制
- 只在確定安全的情況下 bypass
- 每次 bypass 都需要註解說明原因

#### 3. Content Security Policy (CSP)

```typescript
// 使用唯一且不可預測的 nonce
import { CSP_NONCE } from '@angular/core';

// 在需要內嵌樣式的組件中
providers: [
  { provide: CSP_NONCE, useValue: generateUniqueNonce() }
]
```

#### 4. 定期更新與審計

- 保持 Angular 版本最新
- 不要修改 Angular 核心代碼
- 定期進行安全審計
- 使用 Google's Vulnerability Reward Program 回報問題

### Firebase/Firestore 安全性

#### 1. Security Rules 最佳實踐

```javascript
// 多租戶資料隔離範例
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 藍圖資料 - 只有成員可存取
    match /blueprints/{blueprintId} {
      allow read: if isAuthenticated() && isBlueprintMember(blueprintId);
      allow write: if isAuthenticated() && isBlueprintOwnerOrAdmin(blueprintId);
      
      // 藍圖內的任務
      match /tasks/{taskId} {
        allow read: if isAuthenticated() && isBlueprintMember(blueprintId);
        allow create: if isAuthenticated() && canCreateTask(blueprintId);
        allow update: if isAuthenticated() && canUpdateTask(blueprintId, taskId);
        allow delete: if isAuthenticated() && canDeleteTask(blueprintId, taskId);
      }
    }
    
    // 組織資料 - 只有組織成員可存取
    match /organizations/{orgId} {
      allow read: if isAuthenticated() && isOrgMember(orgId);
      allow write: if isAuthenticated() && isOrgOwnerOrAdmin(orgId);
    }
    
    // 輔助函數
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isBlueprintMember(blueprintId) {
      return exists(/databases/$(database)/documents/blueprintMembers/$(request.auth.uid + '_' + blueprintId));
    }
    
    function isBlueprintOwnerOrAdmin(blueprintId) {
      let member = get(/databases/$(database)/documents/blueprintMembers/$(request.auth.uid + '_' + blueprintId));
      return member.data.role in ['owner', 'admin'];
    }
    
    function isOrgMember(orgId) {
      return exists(/databases/$(database)/documents/organizationMembers/$(request.auth.uid + '_' + orgId));
    }
    
    function isOrgOwnerOrAdmin(orgId) {
      let member = get(/databases/$(database)/documents/organizationMembers/$(request.auth.uid + '_' + orgId));
      return member.data.role in ['owner', 'admin'];
    }
    
    function canCreateTask(blueprintId) {
      let member = get(/databases/$(database)/documents/blueprintMembers/$(request.auth.uid + '_' + blueprintId));
      return member.data.permissions.hasAny(['task:create']);
    }
    
    function canUpdateTask(blueprintId, taskId) {
      let member = get(/databases/$(database)/documents/blueprintMembers/$(request.auth.uid + '_' + blueprintId));
      let task = get(/databases/$(database)/documents/blueprints/$(blueprintId)/tasks/$(taskId));
      return member.data.permissions.hasAny(['task:update']) || 
             task.data.assigned_to == request.auth.uid;
    }
    
    function canDeleteTask(blueprintId, taskId) {
      let member = get(/databases/$(database)/documents/blueprintMembers/$(request.auth.uid + '_' + blueprintId));
      return member.data.permissions.hasAny(['task:delete']);
    }
  }
}
```

#### 2. Authentication 整合

```typescript
// Angular + Firebase Authentication
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { inject } from '@angular/core';

export class AuthService {
  private auth = inject(Auth);
  
  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      
      // ID Token 會自動附加到 Firestore 請求
      // Security Rules 可以透過 request.auth.uid 存取
      return userCredential.user;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }
}
```

#### 3. 多租戶資料隔離策略

**方法 1: Document-level isolation**
```
/blueprints/{blueprintId}
  - ownerId: string
  - members: array<string>
  
Security Rule: request.auth.uid in resource.data.members
```

**方法 2: Collection-level isolation with subcollections**
```
/organizations/{orgId}
  /blueprints/{blueprintId}
    /tasks/{taskId}
    
Security Rule: 在父文件檢查成員資格
```

**方法 3: Dedicated membership collection**
```
/blueprintMembers/{userId_blueprintId}
  - blueprintId: string
  - userId: string
  - role: string
  - permissions: array<string>
  
Security Rule: exists(/databases/$(database)/documents/blueprintMembers/$(request.auth.uid + '_' + blueprintId))
```

#### 4. IAM vs Security Rules 使用時機

| 使用場景 | 推薦方案 | 原因 |
|---------|---------|------|
| Mobile/Web Client | Security Rules | 細粒度權限控制，使用者層級存取 |
| Server/Cloud Functions | IAM | 服務帳戶，全域管理權限 |
| 管理後台 | Security Rules | 即使是管理員也應遵循相同規則 |
| 批次處理 | IAM | 需要跨多個文件的全域存取 |
| Realtime Updates | Security Rules | 即時資料同步需要細粒度控制 |

### Angular 現代狀態管理

#### 1. Signals 響應式狀態管理

```typescript
import { Component, signal, computed, effect, inject } from '@angular/core';
import { TaskService } from '@core/facades/task.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  template: `
    <div class="task-list">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (hasError()) {
        <nz-alert nzType="error" [nzMessage]="error()!" />
      } @else {
        <div class="task-stats">
          <span>總計: {{ totalTasks() }}</span>
          <span>已完成: {{ completedTasks() }}</span>
          <span>進行中: {{ inProgressTasks() }}</span>
        </div>
        
        @for (task of tasks(); track task.id) {
          <app-task-item [task]="task" (taskChange)="updateTask($event)" />
        }
      }
    </div>
  `
})
export class TaskListComponent {
  private taskService = inject(TaskService);
  
  // Writable signals
  tasks = signal<Task[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Computed signals - 自動追蹤依賴
  totalTasks = computed(() => this.tasks().length);
  completedTasks = computed(() => 
    this.tasks().filter(t => t.status === 'completed').length
  );
  inProgressTasks = computed(() => 
    this.tasks().filter(t => t.status === 'in-progress').length
  );
  hasError = computed(() => this.error() !== null);
  
  constructor() {
    // Effect - 當相依 signal 改變時自動執行
    effect(() => {
      console.log('Tasks updated:', this.tasks().length);
    });
    
    this.loadTasks();
  }
  
  async loadTasks() {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const tasks = await this.taskService.getTasks();
      this.tasks.set(tasks);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.loading.set(false);
    }
  }
  
  updateTask(updatedTask: Task) {
    this.tasks.update(tasks => 
      tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    );
  }
}
```

#### 2. linkedSignal vs computed

```typescript
import { signal, computed, linkedSignal } from '@angular/core';

// computed - 只讀，自動從源 signal 衍生
const userStatus = signal<'online' | 'offline'>('online');
const notificationsEnabled = computed(() => userStatus() === 'online');

// linkedSignal - 可寫，但也會自動更新
const notificationsEnabledLinked = linkedSignal(() => userStatus() === 'online');

// computed 無法手動設定
// notificationsEnabled.set(true); // ❌ 編譯錯誤

// linkedSignal 可以手動覆寫
notificationsEnabledLinked.set(false); // ✅ 允許手動控制

// 當 userStatus 改變時，兩者都會自動更新
userStatus.set('offline');
// notificationsEnabled() === false
// notificationsEnabledLinked() === false (除非之前手動設定)
```

**使用時機：**
- **computed**: 純粹的衍生狀態，不需要手動控制
- **linkedSignal**: 需要同時支援自動更新和手動控制

#### 3. Resource API 用於非同步資料

```typescript
import { Component, resource, signal } from '@angular/core';
import { TaskService } from '@core/facades/task.service';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  template: `
    @if (taskResource.isLoading()) {
      <nz-spin nzSimple />
    } @else if (taskResource.hasError()) {
      <nz-alert nzType="error" nzMessage="載入失敗" />
    } @else {
      <div class="task-detail">
        <h2>{{ taskResource.value()?.title }}</h2>
        <p>{{ taskResource.value()?.description }}</p>
      </div>
    }
  `
})
export class TaskDetailComponent {
  private taskService = inject(TaskService);
  
  // Input signal
  taskId = signal<string>('');
  
  // Resource - 自動處理載入狀態
  taskResource = resource({
    params: () => ({ id: this.taskId() }),
    loader: async ({ params }) => {
      if (!params.id) return null;
      return this.taskService.getTask(params.id);
    }
  });
  
  // Computed states
  isLoading = computed(() => this.taskResource.status() === 'loading');
  hasError = computed(() => this.taskResource.status() === 'error');
}
```

#### 4. 依賴注入最佳實踐

```typescript
// ✅ 使用 inject() 函數（Angular 14+）
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);
  
  // ... service methods
}

// ✅ 在組件中使用 inject()
@Component({
  selector: 'app-example',
  standalone: true
})
export class ExampleComponent {
  private taskService = inject(TaskService);
  private router = inject(Router);
  
  // ... component logic
}

// ✅ 提供者階層 - 適當的範圍
@Injectable({ providedIn: 'root' }) // 單例，整個應用共享
export class GlobalService { }

@Injectable() // 由注入點決定範圍
export class ScopedService { }

// ✅ 依賴注入的策略模式
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private logger = inject(LoggerService);
  
  notify(message: string) {
    this.logger.log(message);
  }
}

// 可以用不同實作替換
@Injectable()
export class MockNotificationService extends NotificationService {
  override notify(message: string) {
    console.log('[MOCK]', message);
  }
}

// 在測試中提供 mock
TestBed.configureTestingModule({
  providers: [
    { provide: NotificationService, useClass: MockNotificationService }
  ]
});
```

### 企業級架構考量

#### 1. 可測試性與可維護性

**單元測試範例：**

```typescript
import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';
import { TaskRepository } from '@core/infra/task.repository';

describe('TaskService', () => {
  let service: TaskService;
  let mockRepository: jasmine.SpyObj<TaskRepository>;
  
  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('TaskRepository', ['findAll', 'create']);
    
    TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: TaskRepository, useValue: mockRepository }
      ]
    });
    
    service = TestBed.inject(TaskService);
  });
  
  it('should load tasks from repository', async () => {
    const mockTasks = [
      { id: '1', title: 'Task 1', status: 'pending' },
      { id: '2', title: 'Task 2', status: 'completed' }
    ];
    
    mockRepository.findAll.and.returnValue(Promise.resolve(mockTasks));
    
    await service.loadTasks();
    
    expect(service.tasks()).toEqual(mockTasks);
    expect(mockRepository.findAll).toHaveBeenCalled();
  });
});
```

#### 2. 模組化與可擴充性

```typescript
// ✅ 三層架構範例

// 1. Foundation Layer - 核心服務
// src/app/core/services/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  // 認證邏輯
}

// 2. Container Layer - 業務容器
// src/app/core/facades/blueprint.facade.ts
@Injectable({ providedIn: 'root' })
export class BlueprintFacade {
  private blueprintRepo = inject(BlueprintRepository);
  private authService = inject(AuthService);
  
  // 編排多個 repository 和服務
}

// 3. Business Layer - 業務模組
// src/app/routes/blueprints/blueprints.component.ts
@Component({
  selector: 'app-blueprints',
  standalone: true
})
export class BlueprintsComponent {
  private blueprintFacade = inject(BlueprintFacade);
  
  // UI 邏輯
}
```

#### 3. 效能優化策略

```typescript
// ✅ OnPush Change Detection
@Component({
  selector: 'app-task-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
export class TaskItemComponent {
  // 使用 signals 自動觸發變更檢測
  task = input.required<Task>();
}

// ✅ TrackBy 函數優化列表渲染
@Component({
  template: `
    @for (task of tasks(); track trackByTaskId($index, task)) {
      <app-task-item [task]="task" />
    }
  `
})
export class TaskListComponent {
  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }
}

// ✅ 延遲載入路由
export const routes: Routes = [
  {
    path: 'blueprints',
    loadComponent: () => import('./routes/blueprints/blueprints.component')
      .then(m => m.BlueprintsComponent)
  }
];

// ✅ Virtual Scrolling 大量資料
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="task-list">
      @for (task of tasks(); track task.id) {
        <app-task-item [task]="task" />
      }
    </cdk-virtual-scroll-viewport>
  `
})
export class TaskListComponent { }
```

---

## 開發流程建議

### 1. 需求分析階段

- 明確定義 Blueprint Owner 型別
- 規劃 Member 類型與角色
- 設計權限矩陣
- 定義跨 Blueprint 互動需求

### 2. 架構設計階段

- 使用三層架構劃分職責
- 設計 Firestore Security Rules
- 規劃 Angular 組件結構
- 定義 API 介面

### 3. 開發階段

- 遵循 Angular 20 最佳實踐
- 使用 Signals 管理狀態
- 實作 Security Rules 並測試
- 撰寫單元測試和整合測試

### 4. 測試階段

- Firebase Emulator 本地測試
- Security Rules 單元測試
- Angular 組件測試
- E2E 測試關鍵流程

### 5. 部署與監控

- 使用 Firebase Hosting 部署
- 設定 Cloud Functions 處理後端邏輯
- 啟用 Firebase Analytics 追蹤使用
- 配置告警與日誌

---

## 參考資源

### Angular 官方文檔
- [Angular Security](https://angular.dev/best-practices/security)
- [Signals Guide](https://angular.dev/guide/signals)
- [Dependency Injection](https://angular.dev/guide/di)

### Firebase 官方文檔
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Multi-tenancy Best Practices](https://firebase.google.com/docs/firestore/solutions/multi-tenancy)

### ng-alain 文檔
- [ng-alain 官方文檔](https://ng-alain.com)
- [@delon 組件庫](https://ng-alain.com/components)

### ng-zorro-antd 文檔
- [NG-ZORRO 官方文檔](https://ng.ant.design)

---

**文件版本**: v2.0  
**最後更新**: 2025-12-17  
**維護者**: GigHub 開發團隊
