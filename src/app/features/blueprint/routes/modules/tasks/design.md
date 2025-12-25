# 任務模組設計文件 (Tasks Module Design)

## 文件資訊
- **版本**: v1.1
- **最後更新**: 2025-12-22
- **適用範圍**: `/src/app/routes/blueprint/modules/tasks`
- **審核狀態**: ✅ 已檢查並修正潛在實作問題
- **相關文件**: 
  - [Blueprint Module Template](../README.md)
  - [Component Design](../../../../../docs/design(設計)/03-component-design.md)
  - [Design Overview](../../../../../docs/design(設計)/01-design-overview.md)

## ⚠️ 實作前必讀

### 重要提醒

1. **模組自包含設計**: 本模組採用完全自包含架構，直接使用 `@angular/fire` 進行 Firebase 整合，不依賴 `@core` 層
2. **Task 模型定義位置**: 在模組內部定義 Task 類型 (`./core/models/task.model.ts`)
3. **Repository 實作**: 直接注入 `Firestore` from `@angular/fire/firestore`
4. **EventBus**: 如需事件總線，在模組內部實作或使用共享的 EventBus
5. **依賴注入**: 統一使用 `inject()` 函式，禁止使用建構函式注入
6. **日期工具函式**: 使用 `date-fns` 庫的 `isSameDay`, `isSameMonth` 函式

---

## 📋 目錄

1. [核心設計概念](#核心設計概念)
2. [架構設計](#架構設計)
3. [多視圖設計](#多視圖設計)
4. [資料模型](#資料模型)
5. [狀態管理](#狀態管理)
6. [實作指引](#實作指引)
7. [視圖實作細節](#視圖實作細節)

---

## 核心設計概念

### 🎯 設計理念

任務模組採用 **核心實體 + 多視圖** (Domain Core + Multi-View) 設計模式，實現業務邏輯與展示層的完全解耦。

#### 核心原則

1. **單一資料來源 (Single Source of Truth)**
   - 任務核心實體 (`Task`) 作為唯一的資料來源
   - 所有視圖都從同一資料源映射而來
   - 資料一致性由核心層保證

2. **多視圖表現 (Multi-View Representation)**
   - 同一任務資料可以用多種方式呈現
   - 視圖只是資料的不同表現形式
   - 視圖間可以無縫切換

3. **解耦設計 (Decoupled Architecture)**
   - 業務邏輯與 UI 展示完全分離
   - 視圖變更不影響核心業務邏輯
   - 易於擴展新的視圖類型

### 💡 設計價值

- **靈活性**: 可根據不同場景選擇最合適的視圖
- **一致性**: 所有視圖展示的資料保持一致
- **可維護性**: 業務邏輯集中管理，視圖獨立實作
- **可擴展性**: 新增視圖無需修改核心邏輯

---

## 架構設計

### 🏗️ 三層架構

遵循 GigHub 專案的標準三層架構：

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│                     (UI Components)                      │
│  - 視圖切換器 (View Switcher)                           │
│  - 多種任務視圖 (Tree, Gantt, Calendar, Timeline...)    │
│  - 使用 Signals 管理視圖狀態                            │
└─────────────────────────────────────────────────────────┘
                           ↓ inject()
┌─────────────────────────────────────────────────────────┐
│                     Business Layer                       │
│                  (Services / Facades)                    │
│  - TaskFacade: 任務業務協調 (模組內部)                 │
│  - TaskViewService: 視圖轉換邏輯 (模組內部)            │
│  - TaskValidationService: 業務規則驗證 (模組內部)      │
│  - EventBus 整合 (如需)                                 │
└─────────────────────────────────────────────────────────┘
                           ↓ inject()
┌─────────────────────────────────────────────────────────┐
│                      Data Layer                          │
│                    (Repositories)                        │
│  - TaskRepository: CRUD + 查詢 (使用 @angular/fire)    │
│  - TaskRealtimeRepository: 即時更新 (使用 @angular/fire)│
│  - 直接注入 Firestore                                   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    Firebase/Firestore                    │
│             (Database + Security Rules)                  │
└─────────────────────────────────────────────────────────┘
```

### 📁 目錄結構

```
tasks/
├─ design.md                                  # 本設計文件
├─ README.md                                  # 模組說明
├─ routes.ts                                  # 路由配置
├─ tasks-shell.component.ts                   # 薄協調層
├─ tasks-module-view.component.ts             # 視圖切換器
│
├─ components/                                # 頁面層級元件
│   ├─ tasks-list.component.ts                # 任務列表（預設視圖）
│   ├─ task-detail.component.ts               # 任務詳情
│   ├─ task-form.component.ts                 # 任務表單
│   └─ view-switcher.component.ts             # 視圖切換控制
│
├─ views/                                     # 多視圖實作
│   ├─ tree/                                  # 樹狀圖視圖
│   │   ├─ task-tree-view.component.ts
│   │   └─ task-tree-node.component.ts
│   ├─ tree-list/                             # 樹狀列表視圖
│   │   └─ task-tree-list-view.component.ts
│   ├─ gantt/                                 # 甘特圖視圖
│   │   ├─ task-gantt-view.component.ts
│   │   └─ gantt-timeline.component.ts
│   ├─ calendar/                              # 日曆視圖
│   │   └─ task-calendar-view.component.ts
│   └─ timeline/                              # 時間線視圖
│       └─ task-timeline-view.component.ts
│
├─ services/                                  # 業務層
│   ├─ tasks.facade.ts                        # Facade API
│   ├─ task-view.service.ts                   # 視圖轉換服務
│   └─ task-validation.service.ts             # 驗證服務
│
├─ data-access/                               # 資料層
│   ├─ models/
│   │   ├─ task.model.ts                      # 核心任務模型
│   │   ├─ task-view.model.ts                 # 視圖相關模型
│   │   └─ wbs.model.ts                       # WBS 結構模型
│   └─ repositories/
│       ├─ task.repository.ts                 # 任務 Repository
│       └─ task-realtime.repository.ts        # 即時任務 Repository
│
├─ state/                                     # 狀態管理
│   ├─ task.store.ts                          # 任務狀態 Store
│   └─ task-view.store.ts                     # 視圖狀態 Store
│
└─ shared/                                    # 共用資源
    ├─ utils/
    │   ├─ task-tree.utils.ts                 # 樹結構工具
    │   ├─ task-date.utils.ts                 # 日期計算工具
    │   └─ wbs.utils.ts                       # WBS 工具
    └─ components/
        ├─ task-status-badge.component.ts     # 狀態徽章
        ├─ task-priority-icon.component.ts    # 優先級圖示
        └─ task-assignee-avatar.component.ts  # 指派人頭像
```

---

## 多視圖設計

### 🎨 視圖分類

任務模組支援五種主要視圖類型，分為三大類別：

#### 1️⃣ 結構與層級視圖 (Structure & Hierarchy)

適用於任務分解、組織關係和依賴管理的場景。

##### A. 樹狀圖 (Tree View)
- **用途**: 視覺化任務分解結構 (WBS)、父子關係
- **特點**: 圖形化展示、可摺疊展開、拖拽重組
- **技術**: ng-zorro-antd `nz-tree` 組件
- **適用場景**: 
  - 任務分解規劃
  - 階層結構檢視
  - 快速瀏覽任務樹

**UI 特性**:
```
📁 專案 A
  ├─ 📂 階段 1: 規劃
  │   ├─ ☑️ 需求分析
  │   └─ ☑️ 架構設計
  ├─ 📂 階段 2: 實作
  │   ├─ ⏳ 前端開發
  │   └─ ⏳ 後端開發
  └─ 📂 階段 3: 測試
      ├─ ⭕ 單元測試
      └─ ⭕ 整合測試
```

##### B. 樹狀列表 (Tree List / Hierarchical Table)
- **用途**: 表格化層級資料，兼具結構與資料管理
- **特點**: 可排序、可篩選、批次操作、可展開/摺疊
- **技術**: ng-zorro-antd `nz-table` + 階層展開
- **適用場景**:
  - 任務列表管理
  - 批次編輯操作
  - 資料匯出分析

**UI 特性**:
```
| 層級 | 任務名稱           | 狀態     | 負責人 | 開始日期   | 結束日期   | 進度  | 操作 |
|------|-------------------|---------|--------|-----------|-----------|-------|------|
| 📁 1 | 專案 A            | 進行中   | 張三   | 2025-01-01| 2025-12-31| 45%   | ...  |
|   📂 | 階段 1: 規劃      | 完成     | 李四   | 2025-01-01| 2025-03-31| 100%  | ...  |
|     ☑️| 需求分析          | 完成     | 王五   | 2025-01-01| 2025-01-31| 100%  | ...  |
|     ☑️| 架構設計          | 完成     | 趙六   | 2025-02-01| 2025-03-31| 100%  | ...  |
```

#### 2️⃣ 排程與時間視圖 (Scheduling & Timeline)

適用於專案排程、時間管理和進度追蹤的場景。

##### C. 甘特圖 (Gantt Chart)
- **用途**: 專案排程、任務進度、依賴關係視覺化
- **特點**: 時間軸展示、依賴線條、拖拽排程、進度條
- **技術**: @delon/chart 或第三方 Gantt 庫
- **適用場景**:
  - 專案時程規劃
  - 關鍵路徑分析
  - 資源分配檢視

**UI 特性**:
```
任務名稱        |  1月  |  2月  |  3月  |  4月  |  5月  |
----------------|-------|-------|-------|-------|-------|
需求分析        |███████|       |       |       |       |
架構設計        |   |███████████|       |       |       |
前端開發        |       |   |███████████████████|       |
後端開發        |       |   |███████████████████|       |
單元測試        |       |       |       |███████|       |
整合測試        |       |       |       |   |███████████|
                 依賴關係: ─────→
```

##### D. 日曆視圖 (Calendar View)
- **用途**: 任務在日期、週或月的分佈情況
- **特點**: 月曆格式、日期標記、快速導航、多任務檢視
- **技術**: ng-zorro-antd `nz-calendar`
- **適用場景**:
  - 每日任務檢視
  - 截止日期提醒
  - 工作負載評估

**UI 特性**:
```
         2025年1月
 日  一  二  三  四  五  六
                1   2   3
 4   5   6   7   8   9  10
11  12  13  14  15  16  17
    [需求分析完成]
18  19  20  21  22  23  24
25  26  27  28  29  30  31
              [架構設計到期]
```

#### 3️⃣ 流程與順序視圖 (Process & Sequence)

適用於流程分析、事件追蹤和歷史記錄的場景。

##### E. 時間線視圖 (Timeline View)
- **用途**: 事件在時間軸上的分佈，強調先後順序
- **特點**: 垂直/水平時間軸、事件標記、里程碑、歷史追蹤
- **技術**: ng-zorro-antd `nz-timeline` + 自訂樣式
- **適用場景**:
  - 專案里程碑追蹤
  - 任務歷史記錄
  - 事件順序分析

**UI 特性**:
```
2025-01-01  ●─── 專案啟動
            │
2025-01-31  ●─── 需求分析完成
            │
2025-03-31  ●─── 架構設計完成
            │
2025-06-30  ●─── 前端開發完成
            │
2025-08-31  ○─── 預計測試完成 (未來)
            │
2025-12-31  ○─── 專案交付 (未來)
```

### 🔄 視圖切換機制

#### 視圖切換器設計

用戶可以透過視圖切換器在不同視圖間無縫切換：

```typescript
interface TaskViewType {
  id: 'tree' | 'tree-list' | 'gantt' | 'calendar' | 'timeline';
  label: string;
  icon: string;
  description: string;
}

const TASK_VIEWS: TaskViewType[] = [
  { id: 'tree-list', label: '列表', icon: 'unordered-list', description: '表格化任務列表' },
  { id: 'tree', label: '樹狀圖', icon: 'apartment', description: '階層結構視圖' },
  { id: 'gantt', label: '甘特圖', icon: 'bar-chart', description: '時程與依賴關係' },
  { id: 'calendar', label: '日曆', icon: 'calendar', description: '日期分佈檢視' },
  { id: 'timeline', label: '時間線', icon: 'clock-circle', description: '事件順序追蹤' }
];
```

#### 視圖狀態管理

使用 Angular Signals 管理視圖狀態：

```typescript
@Injectable({ providedIn: 'root' })
export class TaskViewStore {
  // 當前選擇的視圖
  private _currentView = signal<TaskViewType['id']>('tree-list');
  currentView = this._currentView.asReadonly();
  
  // 視圖過濾條件
  private _viewFilters = signal<TaskViewFilters>({});
  viewFilters = this._viewFilters.asReadonly();
  
  // 視圖排序設定
  private _viewSort = signal<TaskViewSort | null>(null);
  viewSort = this._viewSort.asReadonly();
  
  // 切換視圖
  switchView(viewId: TaskViewType['id']): void {
    this._currentView.set(viewId);
  }
}
```

---

## 資料模型

### 📦 核心任務模型 (Task Core Model)

⚠️ **重要提醒**: 專案已有現存 Task 模型定義於 `/src/app/core/domain/types/task/task.types.ts`

#### 現有 Task 模型 (必須使用)

```typescript
// 從 @core/domain/types/task/task.types.ts 匯入
import { Task, TaskStatus, TaskPriority, AssigneeType } from '@core/domain/types/task/task.types';

// 現有模型包含欄位:
// - id, blueprintId, title, description
// - status: TaskStatus (PENDING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED)
// - priority: TaskPriority (LOW, MEDIUM, HIGH, CRITICAL)
// - assigneeType, assigneeId, assigneeName
// - assigneeTeamId, assigneeTeamName
// - assigneePartnerId, assigneePartnerName
// - creatorId, dueDate
// - createdAt, updatedAt, deletedAt
// - tags, metadata
```

#### 需要擴展的欄位 (用於 WBS 與多視圖)

以下欄位需要透過 **擴展類型** 或 **單獨的 WBS 模型** 實作，不要直接修改核心 Task 模型：

```typescript
/**
 * 任務擴展模型 (用於 WBS 與視圖功能)
 * 繼承現有 Task 模型並添加 WBS 相關欄位
 */
export interface TaskWithWBS extends Task {
  // WBS 階層結構 (新增欄位)
  parentId?: string | null;                   // 父任務 ID (null 表示根任務)
  level?: number;                             // 階層深度 (0 = 根, 1 = 第一層子任務...)
  orderIndex?: number;                        // 同層排序索引
  wbsCode?: string;                           // WBS 編碼 (如: 1.2.3)
  path?: string[];                            // 祖先路徑 [rootId, parentId, ...]
  
  // 進度與時間 (新增欄位)
  progress?: number;                          // 進度百分比 (0-100)
  plannedStartDate?: Date;                    // 計劃開始日期
  plannedEndDate?: Date;                      // 計劃結束日期
  actualStartDate?: Date;                     // 實際開始日期
  actualEndDate?: Date;                       // 實際完成日期
  estimatedHours?: number;                    // 預估工時
  actualHours?: number;                       // 實際工時
  
  // 依賴關係 (新增欄位)
  dependencies?: TaskDependency[];            // 依賴的其他任務
  blockedBy?: string[];                       // 被哪些任務阻擋
}

/**
 * 任務依賴關係
 */
export interface TaskDependency {
  taskId: string;                             // 依賴的任務 ID
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  lag?: number;                               // 延遲天數 (正數=延後, 負數=提前)
}

/**
 * 任務狀態對應 (現有與視圖使用的對應關係)
 */
export const TASK_STATUS_MAP = {
  // 現有 TaskStatus enum 值
  PENDING: 'pending' as const,
  IN_PROGRESS: 'in-progress' as const,
  ON_HOLD: 'on-hold' as const,
  COMPLETED: 'completed' as const,
  CANCELLED: 'archived' as const,  // 將 CANCELLED 對應到視圖的 archived
} as const;

/**
 * 任務優先級對應
 */
export const TASK_PRIORITY_MAP = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  CRITICAL: 'urgent' as const,  // 將 CRITICAL 對應到視圖的 urgent
} as const;
```

### 🎭 視圖特定模型

```typescript
/**
 * 樹狀視圖節點
 */
export interface TaskTreeNode {
  task: TaskWithWBS;                          // 使用擴展的任務模型
  children: TaskTreeNode[];
  expanded: boolean;
  level: number;
}

/**
 * 甘特圖任務項
 */
export interface GanttTaskItem {
  task: TaskWithWBS;                          // 使用擴展的任務模型
  startDate: Date;
  endDate: Date;
  duration: number;                           // 天數
  progress: number;
  dependencies: GanttDependency[];
  style?: {
    color?: string;
    barClass?: string;
  };
}

export interface GanttDependency {
  from: string;                               // 任務 ID
  to: string;                                 // 任務 ID
  type: TaskDependency['type'];
}

/**
 * 日曆事件項
 */
export interface CalendarTaskEvent {
  task: TaskWithWBS;                          // 使用擴展的任務模型
  date: Date;
  type: 'start' | 'end' | 'due' | 'milestone';
  badge?: {
    status: string;
    text: string;
  };
}

/**
 * 時間線事件項
 */
export interface TimelineTaskEvent {
  task: TaskWithWBS;                          // 使用擴展的任務模型
  timestamp: Date;
  eventType: 'created' | 'started' | 'completed' | 'updated' | 'milestone';
  description: string;
  icon?: string;
  color?: string;
}
```

### 📊 WBS (Work Breakdown Structure) 模型

```typescript
/**
 * WBS 節點
 */
export interface WBSNode {
  id: string;
  code: string;                               // WBS 編碼 (如: 1.2.3)
  title: string;
  level: number;
  parentId: string | null;
  children: WBSNode[];
  task?: TaskWithWBS;                         // 關聯的任務實體 (使用擴展模型)
}

/**
 * WBS 結構
 */
export interface WBSStructure {
  rootNodes: WBSNode[];
  flatMap: Map<string, WBSNode>;
  maxDepth: number;
}
```

---

## 狀態管理

### 🔄 任務狀態 Store

使用 Angular Signals 進行響應式狀態管理：

```typescript
@Injectable({ providedIn: 'root' })
export class TaskStore {
  // ⚠️ 實作提醒: 使用現有的 TaskFirestoreRepository
  private taskRepository = inject(TaskFirestoreRepository);  // 從 @core/data-access/repositories/task-firestore.repository
  
  // ===== Private State =====
  private _tasks = signal<TaskWithWBS[]>([]);  // 使用擴展模型
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _selectedTaskId = signal<string | null>(null);
  
  // ===== Public Readonly Signals =====
  tasks = this._tasks.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  selectedTaskId = this._selectedTaskId.asReadonly();
  
  // ===== Computed Signals =====
  
  // 當前選擇的任務
  selectedTask = computed(() => {
    const id = this._selectedTaskId();
    if (!id) return null;
    return this._tasks().find(t => t.id === id) || null;
  });
  
  // 根任務列表 (無父任務)
  rootTasks = computed(() => 
    this._tasks().filter(t => t.parentId === null)
  );
  
  // 按狀態分組
  tasksByStatus = computed(() => {
    const tasks = this._tasks();
    return {
      pending: tasks.filter(t => t.status === 'pending'),
      inProgress: tasks.filter(t => t.status === 'in-progress'),
      completed: tasks.filter(t => t.status === 'completed'),
      archived: tasks.filter(t => t.status === 'archived')
    };
  });
  
  // 按優先級分組
  tasksByPriority = computed(() => {
    const tasks = this._tasks();
    return {
      urgent: tasks.filter(t => t.priority === 'urgent'),
      high: tasks.filter(t => t.priority === 'high'),
      medium: tasks.filter(t => t.priority === 'medium'),
      low: tasks.filter(t => t.priority === 'low')
    };
  });
  
  // 統計資訊
  statistics = computed(() => {
    const tasks = this._tasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    
    return {
      total,
      completed,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgProgress: total > 0 ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / total) : 0
    };
  });
  
  // ===== Actions =====
  
  async loadTasks(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const tasks = await this.taskRepository.findByBlueprintId(blueprintId);
      this._tasks.set(tasks);
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      this._loading.set(false);
    }
  }
  
  selectTask(taskId: string | null): void {
    this._selectedTaskId.set(taskId);
  }
  
  async createTask(task: Omit<TaskWithWBS, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskWithWBS> {
    try {
      // ⚠️ 實作提醒: TaskFirestoreRepository.create() 需要調整以支援 WBS 欄位
      const created = await this.taskRepository.create(task as any);
      this._tasks.update(tasks => [...tasks, created as TaskWithWBS]);
      return created as TaskWithWBS;
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }
  
  async updateTask(id: string, updates: Partial<TaskWithWBS>): Promise<void> {
    try {
      await this.taskRepository.update(id, updates);
      this._tasks.update(tasks => 
        tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      );
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }
  
  async deleteTask(id: string): Promise<void> {
    try {
      await this.taskRepository.delete(id);
      this._tasks.update(tasks => tasks.filter(t => t.id !== id));
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }
}
```

### 🎭 視圖狀態 Store

```typescript
@Injectable({ providedIn: 'root' })
export class TaskViewStore {
  // ===== Private State =====
  private _currentView = signal<TaskViewType['id']>('tree-list');
  private _expandedNodes = signal<Set<string>>(new Set());
  private _filters = signal<TaskFilters>({});
  private _sortConfig = signal<TaskSortConfig | null>(null);
  
  // ===== Public Readonly Signals =====
  currentView = this._currentView.asReadonly();
  expandedNodes = this._expandedNodes.asReadonly();
  filters = this._filters.asReadonly();
  sortConfig = this._sortConfig.asReadonly();
  
  // ===== Actions =====
  
  switchView(viewId: TaskViewType['id']): void {
    this._currentView.set(viewId);
  }
  
  toggleNode(nodeId: string): void {
    this._expandedNodes.update(nodes => {
      const newNodes = new Set(nodes);
      if (newNodes.has(nodeId)) {
        newNodes.delete(nodeId);
      } else {
        newNodes.add(nodeId);
      }
      return newNodes;
    });
  }
  
  expandAll(nodeIds: string[]): void {
    this._expandedNodes.set(new Set(nodeIds));
  }
  
  collapseAll(): void {
    this._expandedNodes.set(new Set());
  }
  
  setFilters(filters: TaskFilters): void {
    this._filters.set(filters);
  }
  
  setSortConfig(config: TaskSortConfig): void {
    this._sortConfig.set(config);
  }
}
```

---

## 實作指引

### 🚀 實作階段規劃

⚠️ **實作前必須完成的準備工作**:

#### 準備階段 0: 環境檢查與依賴確認 (1 天)
- [ ] 確認專案使用 Angular 20.3.x, ng-zorro-antd 20.3.x
- [ ] 確認已安裝 `date-fns` 套件 (用於日期比較函式)
  ```bash
  yarn add date-fns
  ```
- [ ] 檢查 `/src/app/core/domain/types/task/task.types.ts` 中的 Task 定義
- [ ] 檢查 `/src/app/core/data-access/repositories/task-firestore.repository.ts` 現有實作
- [ ] 檢查 `/src/app/core/blueprint/events/enhanced-event-bus.service.ts` 現有實作
- [ ] 確認 FirestoreBaseRepository 的使用方式

#### Phase 1: 基礎設施 (1-2 週)
- [ ] 定義 TaskWithWBS 擴展模型 (基於現有 Task)
- [ ] 定義視圖相關模型 (TaskTreeNode, GanttTaskItem, etc.)
- [ ] 定義 WBS 相關模型
- [ ] 擴展 TaskFirestoreRepository 以支援 WBS 欄位查詢
- [ ] 確認 Firestore Security Rules 涵蓋新欄位

#### Phase 2: 核心視圖實作 (2-3 週)
- [ ] 實作樹狀列表視圖 (Tree List - 預設視圖)
  - 使用 ng-zorro-antd `nz-table`
  - 實作階層展開/摺疊
  - 實作排序、篩選、分頁
- [ ] 實作視圖切換器 (View Switcher)
- [ ] 實作任務表單與驗證
- [ ] 整合 Security Rules

#### Phase 3: 進階視圖實作 (3-4 週)
- [ ] 實作樹狀圖視圖 (Tree View)
  - 使用 ng-zorro-antd `nz-tree`
  - 支援拖拽重組
- [ ] 實作甘特圖視圖 (Gantt Chart)
  - 整合 @delon/chart 或第三方庫
  - 實作時間軸與依賴線條
- [ ] 實作日曆視圖 (Calendar View)
  - 使用 ng-zorro-antd `nz-calendar`
  - 支援日/週/月切換
- [ ] 實作時間線視圖 (Timeline View)
  - 使用 ng-zorro-antd `nz-timeline`
  - 支援里程碑標記

#### Phase 4: 整合與優化 (1-2 週)
- [ ] 即時更新整合 (TaskRealtimeRepository)
- [ ] 效能優化 (虛擬滾動、快取)
- [ ] E2E 測試
- [ ] 文檔完善

### 🔧 技術選型

| 功能 | 技術方案 | 必要性 | 注意事項 |
|------|---------|--------|----------|
| 樹狀圖 | ng-zorro-antd `nz-tree` | 必須 | 需匯入 `NzTreeModule` 或使用 standalone 元件 |
| 樹狀列表 | ng-zorro-antd `nz-table` + 階層邏輯 | 必須 | 預設視圖，優先實作 |
| 甘特圖 | @delon/chart + 自訂邏輯 | 可選 | 或使用第三方如 dhtmlx-gantt (需付費授權) |
| 日曆 | ng-zorro-antd `nz-calendar` | 可選 | 需搭配 `nz-badge` 顯示事件 |
| 時間線 | ng-zorro-antd `nz-timeline` | 可選 | 適合歷史記錄展示 |
| 狀態管理 | Angular Signals | 必須 | Angular 20 內建 |
| 即時更新 | Firestore onSnapshot | 可選 | 使用 TaskRealtimeRepository |
| 日期工具 | `date-fns` | 必須 | 用於 `isSameDay`, `isSameMonth` 等函式 |

### ✅ 實作檢查清單

#### 架構檢查
- [ ] 遵循三層架構 (UI → Service → Repository)
- [ ] 使用 Standalone Components
- [ ] 使用 `inject()` 依賴注入
- [ ] 使用 Signals 管理狀態
- [ ] 使用 `@if/@for/@switch` 新控制流

#### 視圖檢查
- [ ] 所有視圖從同一資料源讀取
- [ ] 視圖切換不丟失狀態
- [ ] 支援響應式設計
- [ ] 提供 Loading 與 Error 狀態
- [ ] 實作空狀態提示

#### 效能檢查
- [ ] 大列表使用虛擬滾動
- [ ] 實作適當的快取策略
- [ ] 避免不必要的重新渲染
- [ ] 使用 OnPush 變更檢測
- [ ] 優化 Firestore 查詢

#### 安全檢查
- [ ] 實作 Firestore Security Rules
- [ ] 驗證使用者權限
- [ ] 檢查 Blueprint 成員資格
- [ ] 保護敏感操作 (刪除、匯出)

---

## 視圖實作細節

### 1️⃣ 樹狀列表視圖 (Tree List View)

#### 元件結構

```typescript
import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { TaskStore } from '../../state/task.store';
import { TaskViewStore } from '../../state/task-view.store';
import { TaskWithWBS } from '@core/domain/types/task/task.types';  // ⚠️ 使用現有類型

@Component({
  selector: 'app-task-tree-list-view',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-table 
      #table
      [nzData]="flattenedTasks()"
      [nzLoading]="loading()"
      [nzPageSize]="pageSize()"
      [nzShowPagination]="true"
      [nzFrontPagination]="false"
    >
      <thead>
        <tr>
          <th nzWidth="40px"></th>
          <th nzWidth="400px">任務名稱</th>
          <th nzWidth="100px">狀態</th>
          <th nzWidth="120px">負責人</th>
          <th nzWidth="120px">開始日期</th>
          <th nzWidth="120px">結束日期</th>
          <th nzWidth="80px">進度</th>
          <th nzWidth="120px">操作</th>
        </tr>
      </thead>
      <tbody>
        @for (item of table.data; track item.task.id) {
          <tr [class.expanded]="isExpanded(item.task.id)">
            <td>
              @if (item.hasChildren) {
                <button 
                  nz-button 
                  nzType="text" 
                  nzSize="small"
                  (click)="toggleExpand(item.task.id)"
                >
                  <span 
                    nz-icon 
                    [nzType]="isExpanded(item.task.id) ? 'minus-square' : 'plus-square'"
                  ></span>
                </button>
              }
            </td>
            <td [style.padding-left.px]="item.level * 24">
              <span [class]="'level-' + item.level">
                {{ item.task.title }}
              </span>
            </td>
            <td>
              <app-task-status-badge [status]="item.task.status" />
            </td>
            <td>
              <app-task-assignee-avatar [task]="item.task" />
            </td>
            <td>{{ item.task.plannedStartDate | date:'yyyy-MM-dd' }}</td>
            <td>{{ item.task.plannedEndDate | date:'yyyy-MM-dd' }}</td>
            <td>
              <nz-progress 
                [nzPercent]="item.task.progress" 
                nzSize="small"
              />
            </td>
            <td>
              <button nz-button nzType="link" (click)="editTask(item.task)">
                編輯
              </button>
              <button nz-button nzType="link" nzDanger (click)="deleteTask(item.task)">
                刪除
              </button>
            </td>
          </tr>
        }
      </tbody>
    </nz-table>
  `
})
export class TaskTreeListViewComponent {
  private taskStore = inject(TaskStore);
  private taskViewStore = inject(TaskViewStore);
  
  // Signals
  loading = this.taskStore.loading;
  tasks = this.taskStore.tasks;
  expandedNodes = this.taskViewStore.expandedNodes;
  pageSize = signal(20);
  
  // 扁平化任務列表 (考慮展開狀態)
  flattenedTasks = computed(() => {
    const tasks = this.tasks();
    const expanded = this.expandedNodes();
    return this.flattenTaskTree(tasks, expanded);
  });
  
  isExpanded(taskId: string): boolean {
    return this.expandedNodes().has(taskId);
  }
  
  toggleExpand(taskId: string): void {
    this.taskViewStore.toggleNode(taskId);
  }
  
  private flattenTaskTree(
    tasks: TaskWithWBS[],  // ⚠️ 使用擴展模型
    expanded: Set<string>
  ): { task: TaskWithWBS; level: number; hasChildren: boolean }[] {
    // 建立任務樹結構並扁平化
    const result: { task: TaskWithWBS; level: number; hasChildren: boolean }[] = [];
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const rootTasks = tasks.filter(t => !t.parentId);  // ⚠️ 使用 parentId 欄位
    
    const flatten = (task: TaskWithWBS, level: number) => {
      const children = tasks.filter(t => t.parentId === task.id);
      result.push({ task, level, hasChildren: children.length > 0 });
      
      if (expanded.has(task.id!) && children.length > 0) {  // ⚠️ task.id 可能是 optional
        children.forEach(child => flatten(child, level + 1));
      }
    };
    
    rootTasks.forEach(task => flatten(task, 0));
    return result;
  }
}
```

### 2️⃣ 樹狀圖視圖 (Tree View)

```typescript
import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzTreeNodeOptions } from 'ng-zorro-antd/tree';  // ⚠️ 正確的型別匯入
import { TaskStore } from '../../state/task.store';
import { TaskViewStore } from '../../state/task-view.store';
import { TaskWithWBS, TaskStatus } from '@core/domain/types/task/task.types';

@Component({
  selector: 'app-task-tree-view',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-tree
      [nzData]="treeNodes()"
      [nzDraggable]="canEdit()"
      [nzExpandedKeys]="expandedKeys()"
      (nzClick)="onNodeClick($event)"
      (nzDrop)="onNodeDrop($event)"
    >
      <ng-template #nzTreeTemplate let-node>
        <div class="tree-node-content">
          <span [class]="'status-icon status-' + node.origin.task.status">
            <span nz-icon [nzType]="getStatusIcon(node.origin.task.status)"></span>
          </span>
          <span class="node-title">{{ node.origin.task.title }}</span>
          <span class="node-meta">
            <app-task-priority-icon [priority]="node.origin.task.priority" />
            <app-task-assignee-avatar [task]="node.origin.task" />
            <nz-tag [nzColor]="getProgressColor(node.origin.task.progress || 0)">
              {{ node.origin.task.progress || 0 }}%
            </nz-tag>
          </span>
        </div>
      </ng-template>
    </nz-tree>
  `
})
export class TaskTreeViewComponent {
  private taskStore = inject(TaskStore);
  private taskViewStore = inject(TaskViewStore);
  
  tasks = this.taskStore.tasks;
  expandedNodes = this.taskViewStore.expandedNodes;
  
  // 轉換為 ng-zorro-antd 樹節點格式
  treeNodes = computed(() => {
    return this.buildTreeNodes(this.tasks());
  });
  
  expandedKeys = computed(() => Array.from(this.expandedNodes()));
  
  canEdit = computed(() => {
    // ⚠️ 實作提醒: 需整合 PermissionService 檢查權限
    return true;
  });
  
  private buildTreeNodes(tasks: TaskWithWBS[]): NzTreeNodeOptions[] {  // ⚠️ 使用正確的型別
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const rootTasks = tasks.filter(t => !t.parentId);
    
    const buildNode = (task: TaskWithWBS): NzTreeNodeOptions => {
      const children = tasks.filter(t => t.parentId === task.id);
      return {
        key: task.id!,  // ⚠️ 處理 optional id
        title: task.title,
        expanded: this.expandedNodes().has(task.id!),
        children: children.map(child => buildNode(child)),
        origin: { task }
      };
    };
    
    return rootTasks.map(task => buildNode(task));
  }
  
  getStatusIcon(status: TaskStatus): string {
    // ⚠️ 使用現有的 TaskStatus enum 值
    const icons: Record<string, string> = {
      'pending': 'clock-circle',
      'in_progress': 'loading',
      'on_hold': 'pause-circle',
      'completed': 'check-circle',
      'cancelled': 'folder'
    };
    return icons[status] || 'question-circle';
  }
  
  getProgressColor(progress: number): string {
    if (progress === 0) return 'default';
    if (progress < 50) return 'orange';
    if (progress < 100) return 'blue';
    return 'green';
  }
  
  onNodeClick(event: any): void {
    // ⚠️ 實作提醒: 處理節點點擊事件
  }
  
  onNodeDrop(event: any): void {
    // ⚠️ 實作提醒: 處理節點拖放事件，需更新 WBS 結構
  }
}
```

### 3️⃣ 甘特圖視圖 (Gantt Chart)

```typescript
@Component({
  selector: 'app-task-gantt-view',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gantt-container">
      <div class="gantt-sidebar">
        <div class="gantt-task-list">
          @for (item of ganttItems(); track item.task.id) {
            <div class="gantt-task-row" [style.padding-left.px]="item.level * 16">
              <span class="task-name">{{ item.task.title }}</span>
            </div>
          }
        </div>
      </div>
      
      <div class="gantt-timeline" #timelineContainer>
        <div class="gantt-header">
          <!-- 時間軸標題 (月份) -->
          @for (month of timelineMonths(); track month.key) {
            <div class="month-header" [style.width.px]="month.width">
              {{ month.label }}
            </div>
          }
        </div>
        
        <div class="gantt-body">
          @for (item of ganttItems(); track item.task.id) {
            <div class="gantt-bar-row">
              <div 
                class="gantt-bar"
                [style.left.px]="item.barLeft"
                [style.width.px]="item.barWidth"
                [class.completed]="item.task.status === 'completed'"
              >
                <div class="progress-bar" [style.width.%]="item.task.progress"></div>
              </div>
              
              <!-- 依賴關係線條 -->
              @for (dep of item.dependencies; track dep.to) {
                <svg class="dependency-line">
                  <line 
                    [attr.x1]="dep.x1" 
                    [attr.y1]="dep.y1"
                    [attr.x2]="dep.x2" 
                    [attr.y2]="dep.y2"
                  />
                </svg>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gantt-container {
      display: flex;
      height: 100%;
    }
    
    .gantt-sidebar {
      width: 300px;
      border-right: 1px solid #e8e8e8;
    }
    
    .gantt-timeline {
      flex: 1;
      overflow-x: auto;
    }
    
    .gantt-bar {
      position: relative;
      height: 24px;
      background: #1890ff;
      border-radius: 4px;
    }
    
    .progress-bar {
      height: 100%;
      background: rgba(255, 255, 255, 0.3);
    }
  `]
})
export class TaskGanttViewComponent {
  private taskStore = inject(TaskStore);
  
  tasks = this.taskStore.tasks;
  
  // 計算甘特圖項目
  ganttItems = computed(() => {
    return this.calculateGanttItems(this.tasks());
  });
  
  // 計算時間軸月份
  timelineMonths = computed(() => {
    return this.calculateTimelineMonths(this.tasks());
  });
  
  private calculateGanttItems(tasks: Task[]): GanttTaskItem[] {
    // 實作甘特圖項目計算邏輯
    // 包含: 任務位置、寬度、依賴關係線條座標
    return [];
  }
  
  private calculateTimelineMonths(tasks: Task[]): any[] {
    // 實作時間軸月份計算邏輯
    return [];
  }
}
```

### 4️⃣ 日曆視圖 (Calendar View)

```typescript
import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { isSameDay, isSameMonth } from 'date-fns';  // ⚠️ 需安裝 date-fns
import { TaskStore } from '../../state/task.store';
import { TaskWithWBS } from '@core/domain/types/task/task.types';

@Component({
  selector: 'app-task-calendar-view',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-calendar 
      [nzMode]="calendarMode()"
      [(ngModel)]="selectedDate"
      (nzSelectChange)="onDateSelect($event)"
    >
      <ul *nzDateCell="let date" class="events">
        @for (event of getTasksForDate(date); track event.id) {
          <li>
            <nz-badge 
              [nzStatus]="getBadgeStatus(event)"
              [nzText]="event.title"
            />
          </li>
        }
      </ul>
      
      <div *nzMonthCell="let month" class="month-summary">
        <span>{{ getMonthTaskCount(month) }} 個任務</span>
      </div>
    </nz-calendar>
    
    <!-- 選擇日期的任務詳情 -->
    @if (selectedDateTasks().length > 0) {
      <nz-card nzTitle="當日任務" class="selected-date-tasks">
        @for (task of selectedDateTasks(); track task.id) {
          <div class="task-item">
            <app-task-status-badge [status]="task.status" />
            <span>{{ task.title }}</span>
            <button nz-button nzType="link" (click)="viewTaskDetail(task)">
              查看
            </button>
          </div>
        }
      </nz-card>
    }
  `
})
export class TaskCalendarViewComponent {
  private taskStore = inject(TaskStore);
  
  tasks = this.taskStore.tasks;
  selectedDate = signal(new Date());
  calendarMode = signal<'month' | 'year'>('month');
  
  // 選擇日期的任務
  selectedDateTasks = computed(() => {
    const date = this.selectedDate();
    return this.getTasksForDate(date);
  });
  
  getTasksForDate(date: Date): TaskWithWBS[] {
    return this.tasks().filter(task => {
      // ⚠️ 使用 date-fns 的 isSameDay 函式
      const taskDate = task.plannedStartDate || task.plannedEndDate || task.dueDate;
      return taskDate && isSameDay(new Date(taskDate), date);
    });
  }
  
  getMonthTaskCount(month: Date): number {
    return this.tasks().filter(task => {
      // ⚠️ 使用 date-fns 的 isSameMonth 函式
      const taskDate = task.plannedStartDate || task.plannedEndDate || task.dueDate;
      return taskDate && isSameMonth(new Date(taskDate), month);
    });
  }
  
  getBadgeStatus(task: TaskWithWBS): string {
    // ⚠️ 根據 TaskStatus enum 映射徽章狀態
    const statusMap: Record<string, string> = {
      'pending': 'default',
      'in_progress': 'processing',
      'on_hold': 'warning',
      'completed': 'success',
      'cancelled': 'error'
    };
    return statusMap[task.status] || 'default';
  }
  
  onDateSelect(date: Date): void {
    this.selectedDate.set(date);
  }
  
  viewTaskDetail(task: TaskWithWBS): void {
    // ⚠️ 實作提醒: 導航到任務詳情頁
  }
}
```

### 5️⃣ 時間線視圖 (Timeline View)

```typescript
@Component({
  selector: 'app-task-timeline-view',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-timeline [nzMode]="timelineMode()">
      @for (event of timelineEvents(); track event.timestamp.getTime()) {
        <nz-timeline-item 
          [nzColor]="event.color"
          [nzDot]="dotTemplate"
        >
          <ng-template #dotTemplate>
            <span nz-icon [nzType]="event.icon"></span>
          </ng-template>
          
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="event-time">{{ event.timestamp | date:'yyyy-MM-dd HH:mm' }}</span>
              <nz-tag [nzColor]="event.color">{{ event.eventType }}</nz-tag>
            </div>
            <div class="timeline-body">
              <h4>{{ event.task.title }}</h4>
              <p>{{ event.description }}</p>
            </div>
            <div class="timeline-footer">
              <button nz-button nzType="link" (click)="viewTaskDetail(event.task)">
                查看詳情
              </button>
            </div>
          </div>
        </nz-timeline-item>
      }
    </nz-timeline>
  `
})
export class TaskTimelineViewComponent {
  private taskStore = inject(TaskStore);
  
  tasks = this.taskStore.tasks;
  timelineMode = signal<'left' | 'alternate' | 'right'>('left');
  
  // 生成時間線事件
  timelineEvents = computed(() => {
    return this.generateTimelineEvents(this.tasks());
  });
  
  private generateTimelineEvents(tasks: Task[]): TimelineTaskEvent[] {
    const events: TimelineTaskEvent[] = [];
    
    tasks.forEach(task => {
      // 創建事件
      if (task.createdAt) {
        events.push({
          task,
          timestamp: new Date(task.createdAt),
          eventType: 'created',
          description: `任務已創建`,
          icon: 'plus-circle',
          color: 'blue'
        });
      }
      
      // 開始事件
      if (task.actualStartDate) {
        events.push({
          task,
          timestamp: new Date(task.actualStartDate),
          eventType: 'started',
          description: `任務已開始`,
          icon: 'play-circle',
          color: 'green'
        });
      }
      
      // 完成事件
      if (task.actualEndDate) {
        events.push({
          task,
          timestamp: new Date(task.actualEndDate),
          eventType: 'completed',
          description: `任務已完成`,
          icon: 'check-circle',
          color: 'green'
        });
      }
    });
    
    // 按時間排序
    return events.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }
}
```

---

## 附錄

### 📚 相關資源

#### 專案文件
- [Blueprint Module Template](../README.md)
- [Component Design](../../../../../docs/design(設計)/03-component-design.md)
- [Design Overview](../../../../../docs/design(設計)/01-design-overview.md)
- [Architecture Guidelines](.github/instructions/ng-gighub-architecture.instructions.md)

#### 技術文件
- [Angular Signals Documentation](https://angular.dev/guide/signals)
- [ng-zorro-antd Components](https://ng.ant.design/components/overview/en)
- [@delon Documentation](https://ng-alain.com/components)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)

#### 設計參考
- [Gantt Chart Design Patterns](https://www.nngroup.com/articles/gantt-charts/)
- [Work Breakdown Structure (WBS)](https://www.pmi.org/learning/library/applying-work-breakdown-structure-project-lifecycle-6979)
- [Timeline Design Best Practices](https://www.interaction-design.org/literature/article/timeline-design)

### 🔖 術語表

| 術語 | 英文 | 說明 |
|------|------|------|
| 任務核心實體 | Task Core Entity | 任務的領域模型，包含所有業務屬性 |
| 多視圖設計 | Multi-View Design | 同一資料源的多種展示方式 |
| 單一資料來源 | Single Source of Truth | 資料只有一個權威來源 |
| WBS | Work Breakdown Structure | 工作分解結構 |
| 甘特圖 | Gantt Chart | 專案排程圖表 |
| 依賴關係 | Task Dependency | 任務間的先後關係 |
| 關鍵路徑 | Critical Path | 決定專案完成時間的最長路徑 |
| 里程碑 | Milestone | 專案中的重要時間點 |

### 📝 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|---------|------|
| v1.0 | 2025-12-22 | 初始版本 | AI Assistant |
| v1.1 | 2025-12-22 | 修正實作問題：<br>- 明確指出使用現有 Task 模型<br>- 新增 TaskWithWBS 擴展模型<br>- 修正元件範例的匯入與型別<br>- 新增 date-fns 依賴說明<br>- 補充實作前檢查清單 | AI Assistant |

---

## 🔍 實作風險評估與緩解措施

### 高風險項目

#### 1️⃣ 資料模型不一致 (已解決)
**風險**: 設計文件定義的 Task 模型與現有模型不一致
**緩解**: 
- ✅ 明確使用現有 `/src/app/core/domain/types/task/task.types.ts` 定義
- ✅ 透過 `TaskWithWBS` 擴展模型增加 WBS 欄位
- ✅ 避免修改核心 Task 介面

#### 2️⃣ Repository 方法不支援 WBS 欄位
**風險**: TaskFirestoreRepository 不支援 WBS 相關欄位的查詢與儲存
**緩解**:
- 需擴展 `toEntity()` 和 `toDocument()` 方法以處理 WBS 欄位
- 需新增 WBS 特定的查詢方法 (如 `findByParentId()`, `findRootTasks()`)
- 需更新 Firestore Security Rules 以涵蓋新欄位

#### 3️⃣ 第三方套件依賴
**風險**: 缺少必要的第三方套件 (date-fns, gantt library)
**緩解**:
- ✅ 明確標註 `date-fns` 為必須依賴
- ⚠️ 甘特圖視圖標註為可選功能
- 提供替代方案 (先實作樹狀列表等核心視圖)

### 中風險項目

#### 4️⃣ ng-zorro-antd 型別定義
**風險**: 元件範例使用的型別可能不存在或已變更
**緩解**:
- ✅ 修正為使用正確的 `NzTreeNodeOptions` 型別
- ✅ 元件範例包含必要的 import 語句
- 建議實作時參考 ng-zorro-antd 最新文檔

#### 5️⃣ 效能問題
**風險**: 大量任務的樹狀展開與甘特圖渲染可能造成效能問題
**緩解**:
- 實作虛擬滾動 (ng-zorro-antd `nz-table` 支援)
- 實作分頁載入
- 使用 OnPush 變更檢測策略
- 合理設定預設展開層級

### 低風險項目

#### 6️⃣ 視圖切換狀態遺失
**風險**: 視圖切換時可能遺失使用者的操作狀態
**緩解**:
- ✅ 設計文件已包含 TaskViewStore 管理視圖狀態
- 使用 Signals 持久化展開節點、篩選條件等狀態

---

## ✅ 實作前終極檢查清單

### Phase 0: 開始實作前 (強制完成)

- [ ] **已閱讀完整設計文件** 包含所有章節與實作細節
- [ ] **已檢查現有 Task 模型定義** (`/src/app/core/domain/types/task/task.types.ts`)
- [ ] **已檢查 TaskFirestoreRepository** (`/src/app/core/data-access/repositories/task-firestore.repository.ts`)
- [ ] **已檢查 FirestoreBaseRepository** (`/src/app/core/data-access/repositories/base/firestore-base.repository.ts`)
- [ ] **已確認 EventBus 實作** (`/src/app/core/blueprint/events/enhanced-event-bus.service.ts`)
- [ ] **已安裝 date-fns 套件** (`yarn add date-fns`)
- [ ] **已確認 ng-zorro-antd 版本** (需 20.3.x)
- [ ] **已確認 Angular 版本** (需 20.3.x)
- [ ] **已規劃實作順序** (建議: 資料模型 → Repository 擴展 → Store → 樹狀列表視圖 → 其他視圖)

### Phase 1: 資料模型擴展

- [ ] 定義 `TaskWithWBS` 介面 (繼承 Task)
- [ ] 定義 `TaskTreeNode` 介面
- [ ] 定義 `GanttTaskItem` 介面 (可選)
- [ ] 定義 `CalendarTaskEvent` 介面 (可選)
- [ ] 定義 `TimelineTaskEvent` 介面 (可選)
- [ ] 定義 `WBSNode` 和 `WBSStructure` 介面
- [ ] 撰寫型別轉換輔助函式 (Task → TaskWithWBS)

### Phase 2: Repository 擴展

- [ ] 擴展 `TaskFirestoreRepository.toEntity()` 以處理 WBS 欄位
- [ ] 擴展 `TaskFirestoreRepository.toDocument()` 以處理 WBS 欄位
- [ ] 新增 `findRootTasks()` 方法
- [ ] 新增 `findByParentId()` 方法
- [ ] 新增 `findDescendants()` 方法
- [ ] 新增 `updateWBSStructure()` 方法
- [ ] 撰寫 Repository 單元測試
- [ ] 更新 Firestore Security Rules

### Phase 3: 狀態管理

- [ ] 實作 `TaskStore` (使用 Signals)
- [ ] 實作 `TaskViewStore` (視圖狀態)
- [ ] 實作 computed signals (rootTasks, tasksByStatus, etc.)
- [ ] 實作 CRUD actions
- [ ] 撰寫 Store 單元測試

### Phase 4: 樹狀列表視圖 (優先)

- [ ] 實作 `TaskTreeListViewComponent`
- [ ] 實作展開/摺疊功能
- [ ] 實作排序功能
- [ ] 實作篩選功能
- [ ] 實作分頁
- [ ] 實作 CRUD 操作整合
- [ ] 撰寫元件測試

### Phase 5: 其他視圖 (可選)

- [ ] 實作樹狀圖視圖 (可選)
- [ ] 實作甘特圖視圖 (可選)
- [ ] 實作日曆視圖 (可選)
- [ ] 實作時間線視圖 (可選)
- [ ] 實作視圖切換器
- [ ] 測試視圖間切換的狀態保持

### Phase 6: 整合與測試

- [ ] 整合 EventBus 發送任務事件
- [ ] 實作權限檢查 (PermissionService)
- [ ] 實作即時更新 (可選)
- [ ] E2E 測試關鍵流程
- [ ] 效能測試與優化
- [ ] 撰寫使用者文檔

---

## 結語

本設計文件提供了任務模組的完整設計藍圖，從核心概念到實作細節都有詳細說明。實作時應遵循以下原則：

1. **先完成核心功能，再擴展進階視圖**
2. **保持架構簡單，避免過度設計**
3. **充分測試每個視圖的功能與效能**
4. **持續收集使用者回饋，迭代改進**

任務模組是 Blueprint 系統的核心功能之一，良好的設計將為整個專案管理流程奠定堅實基礎。

---

**文件維護**: 本文件應隨專案演進持續更新，確保設計與實作保持一致。
