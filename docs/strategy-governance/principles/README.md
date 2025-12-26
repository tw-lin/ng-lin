# 原則 (Principles)

> 本目錄包含 GigHub 專案的編碼、架構與安全原則，定義開發團隊必須遵循的核心規範。

## 📋 目錄結構

```
principles/
├── README.md                           # 本檔案
├── 01-principles-core-principles.md    # 核心設計原則
├── 02-principles-rules.md              # 開發規範與規則
└── 03-principles-technical-debt.md     # 技術債治理原則（docs-old 提取）
```

## 🎯 核心原則概述

GigHub 專案建立在以下核心原則之上：

### 1. Three-Layer Architecture (三層架構)

嚴格遵循 UI → Service → Repository 三層架構：

```
┌────────────────────┐
│  Presentation (UI) │ ← 展示邏輯、使用者互動
└────────────────────┘
         ↓
┌────────────────────┐
│  Business (Service)│ ← 業務邏輯、事件協調
└────────────────────┘
         ↓
┌────────────────────┐
│  Data (Repository) │ ← 資料存取、Firestore 操作
└────────────────────┘
```

**強制規範**:
- ✅ UI 只能注入 Service，不能直接呼叫 Repository
- ✅ Repository 只負責資料存取，不包含業務邏輯
- ❌ 禁止跨層直接依賴

### 2. Repository Pattern (資料存取模式)

所有 Firestore 操作必須透過 Repository 進行：

```typescript
@Injectable({ providedIn: 'root' })
export class TaskRepository extends FirestoreBaseRepository<Task> {
  protected collectionName = 'tasks';
  
  async findByBlueprintId(blueprintId: string): Promise<Task[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        this.collectionRef,
        where('blueprint_id', '==', blueprintId)
      );
      return this.queryDocuments(q);
    });
  }
}
```

### 3. Angular Signals (狀態管理)

使用 Angular Signals 進行細粒度響應式狀態管理：

```typescript
// 使用 signal() 建立可寫狀態
const tasks = signal<Task[]>([]);

// 使用 computed() 建立衍生狀態
const totalTasks = computed(() => tasks().length);

// 使用 effect() 處理副作用
effect(() => {
  console.log('Tasks updated:', tasks().length);
});
```

### 4. inject() Dependency Injection

使用 `inject()` 函數進行依賴注入，不使用 constructor：

```typescript
@Component({...})
export class TaskListComponent {
  // ✅ 正確
  private taskService = inject(TaskService);
  
  // ❌ 禁止
  constructor(private taskService: TaskService) {}
}
```

### 5. Security First (安全優先)

安全性是首要考量：

- Firestore Security Rules 作為最後防線
- 前端路由守衛保護敏感頁面
- 元件層級權限檢查控制 UI 顯示
- 多層防護，深度防禦

### 6. Result Pattern (錯誤處理)

統一使用 Result Pattern 處理非同步錯誤：

```typescript
type Result<T> = { success: true; data: T } | { success: false; error: Error };

async function getTasks(): Promise<Result<Task[]>> {
  try {
    const tasks = await repository.findAll();
    return { success: true, data: tasks };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

## 🚫 禁止事項 (Forbidden Practices)

### 架構禁止
- ❌ UI 直接呼叫 Repository
- ❌ 建立 FirebaseService 封裝層
- ❌ Repository 包含業務邏輯
- ❌ Service 包含 UI 邏輯

### Angular 禁止
- ❌ 使用 NgModule (必須使用 Standalone Components)
- ❌ 使用 `@Input()` / `@Output()` 裝飾器 (改用 `input()` / `output()`)
- ❌ 使用舊控制流語法 `*ngIf` / `*ngFor` (改用 `@if` / `@for`)
- ❌ Constructor 注入 (改用 `inject()`)
- ❌ 手動管理訂閱 (改用 `takeUntilDestroyed()`)

### TypeScript 禁止
- ❌ 使用 `any` 類型
- ❌ 隱式類型推斷（必須明確定義）
- ❌ 忽略編譯錯誤

## 📐 設計模式

GigHub 專案使用以下設計模式：

| 模式 | 用途 | 範例 |
|------|------|------|
| Repository Pattern | 資料存取抽象 | `TaskRepository` |
| Facade Pattern | 複雜業務協調 | `BlueprintFacade` |
| Event-Driven | 模組間通訊 | `BlueprintEventBus` |
| Store Pattern | 全域狀態管理 | `TaskStore` |

## 📚 相關文件

- [架構設計](../architecture(架構)/README.md) - 系統架構設計
- [安全規範](../security(安全)/README.md) - Security Rules 設計
- [資料模型](../data-model(資料模型)/README.md) - Firestore 資料結構
- [快速開始](../getting-started(快速開始)/README.md) - 開發環境設定

## 🔄 變更記錄

### v1.0.0 (2025-12-21)
- ✅ 建立原則文件結構
- ✅ 定義核心設計原則
- ✅ 列出禁止事項清單
- ✅ 統一檔案命名規範

---

**維護者**: GigHub 開發團隊  
**最後更新**: 2025-12-21  
**版本**: v1.0.0
