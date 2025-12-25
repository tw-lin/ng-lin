# Diary Module (工地施工日誌模組)

> 重構自 Construction Log，採用功能導向架構設計與完全自包含架構

## 🎯 架構原則

本模組遵循以下核心原則:
- **高內聚 (High Cohesion)**: 相關功能組織在同一 feature 中
- **低耦合 (Low Coupling)**: Features 間透過明確接口溝通
- **可擴展性 (Extensibility)**: 易於新增 features 或擴展現有功能
- **可維護性 (Maintainability)**: 清晰結構，小型專注元件
- **完全自包含 (Self-Contained)**: 直接使用 `@angular/fire`，不依賴 `@core` 層

## 📁 目錄結構 (Feature-Based)

```
diary/
├── diary-module-view.component.ts     # 主協調器 (thin orchestrator)
├── index.ts                           # Public API
├── README.md                          # 本文件
│
├── core/                              # 🔥 模組核心層 (自包含)
│   ├── models/                        # 資料模型
│   │   └── diary.model.ts
│   ├── repositories/                  # 資料存取 (使用 @angular/fire)
│   │   └── diary.repository.ts
│   └── services/                      # 業務邏輯
│       └── diary.service.ts
│
├── features/                          # 功能模組
│   ├── list/                          # 🔍 列表功能
│   │   ├── diary-list.component.ts    # Feature 主元件
│   │   ├── components/
│   │   │   ├── diary-statistics.component.ts  # 統計卡片
│   │   │   ├── diary-filters.component.ts     # 搜尋與操作
│   │   │   └── diary-table.component.ts       # 表格顯示
│   │   └── index.ts
│   │
│   ├── create/                        # ➕ 建立功能
│   │   └── index.ts                   # 使用 edit modal (mode: create)
│   │
│   ├── edit/                          # ✏️ 編輯功能
│   │   ├── diary-edit-modal.component.ts      # Modal 主元件
│   │   ├── components/
│   │   │   ├── diary-form.component.ts        # 表單元件
│   │   │   └── diary-photo-upload.component.ts # 照片上傳
│   │   └── index.ts
│   │
│   └── detail/                        # 👁️ 詳情功能
│       └── index.ts                   # 使用 edit modal (mode: view)
│
└── shared/                            # 🔄 共享元件
    ├── components/
    │   └── diary-status-badge.component.ts    # 狀態標籤
    └── index.ts
```

## 🔥 Firebase 整合

本模組**完全自包含**，在 `core/repositories/` 目錄下實作自己的 Repository：

```typescript
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, orderBy, getDocs, addDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class DiaryRepository {
  private firestore = inject(Firestore); // ✅ 直接注入 @angular/fire
  
  async findByBlueprintId(blueprintId: string): Promise<Diary[]> {
    const q = query(
      collection(this.firestore, 'diaries'),
      where('blueprint_id', '==', blueprintId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Diary));
  }
}
```

## 🎨 架構設計

### 主協調器 (Main Orchestrator)

**`DiaryModuleViewComponent`** - Thin orchestration layer

責任:
- 管理高層狀態 (diaries, loading, statistics)
- 協調 features 互動
- 處理 feature 事件

特點:
- **Thin Layer**: 最小化邏輯，委託給 features
- **Event-Driven**: 透過 inputs/outputs 與 features 溝通
- **Stateful**: 只管理必要的全域狀態

### Features 架構

每個 feature 是自包含的功能模組:

#### 1. List Feature 🔍

**職責**: 顯示日誌列表與統計資訊

**元件**:
- `DiaryListComponent` - Feature 協調器
- `DiaryStatisticsComponent` - 統計卡片 (total, thisMonth, today, totalPhotos)
- `DiaryFiltersComponent` - 搜尋與操作按鈕
- `DiaryTableComponent` - ST Table 顯示

**接口**:
```typescript
@Input() diaries: Log[]
@Input() statistics: DiaryStatistics
@Input() loading: boolean
@Input() error: string | null
@Output() create: void
@Output() refresh: void
@Output() viewDiary: Log
@Output() editDiary: Log
@Output() deleteDiary: Log
@Output() tableChange: STChange
```

#### 2. Create Feature ➕

**職責**: 建立新日誌

**實作**: 使用 `DiaryEditModalComponent` with `mode: 'create'`

**接口**:
```typescript
// Via Modal Data
blueprintId: string
mode: 'create'
```

#### 3. Edit Feature ✏️

**職責**: 編輯日誌資訊

**元件**:
- `DiaryEditModalComponent` - Modal 協調器
- `DiaryFormComponent` - 基本資訊表單 (日期、標題、描述、工時、工人數、設備、天氣、溫度)
- `DiaryPhotoUploadComponent` - 照片上傳與管理

**接口**:
```typescript
// Via Modal Data
blueprintId: string
diary?: Log  // 編輯模式
mode: 'create' | 'edit' | 'view'
```

#### 4. Detail Feature 👁️

**職責**: 查看日誌詳情

**實作**: 使用 `DiaryEditModalComponent` with `mode: 'view'`

**接口**:
```typescript
// Via Modal Data
blueprintId: string
diary: Log
mode: 'view'
```

### 共享元件 🔄

**可重用元件**, 無外部依賴:

- `DiaryStatusBadgeComponent` - 狀態標籤顯示 (draft, published, archived)

## 📋 使用方式

### 匯入與使用

```typescript
// 主視圖 (完整功能)
import { DiaryModuleViewComponent } from './diary';

// 或獨立使用 features
import { DiaryListComponent } from './diary/features/list';
import { DiaryEditModalComponent } from './diary/features/edit';

// 共享元件
import { DiaryStatusBadgeComponent } from './diary/shared';
```

### Blueprint 整合

日誌模組整合在 Blueprint 詳情頁的 Tab 中:

```typescript
// blueprint-detail.component.ts
import { DiaryModuleViewComponent } from './modules/diary';

@Component({
  template: `
    <nz-tab nzTitle="施工日誌">
      <ng-template nz-tab>
        @if (blueprint()?.id) {
          <app-diary-module-view [blueprintId]="blueprint()!.id" />
        }
      </ng-template>
    </nz-tab>
  `
})
```

### Feature 互動流程

```
User Action → Main Orchestrator → Feature Component → Event → Orchestrator → Update State
```

**範例 - 編輯日誌**:
1. User 點擊「編輯」
2. `DiaryListComponent` 發出 `editDiary` 事件
3. Orchestrator 接收事件
4. Orchestrator 開啟 `DiaryEditModalComponent` with `mode: 'edit'`
5. User 編輯並儲存
6. Modal 關閉，Store 自動更新列表
7. Orchestrator 顯示成功訊息

## 🧩 擴展性範例

### 新增 Feature

**範例: 新增 "匯出" Feature**

1. 建立 feature 目錄:
```
features/export/
├── diary-export.component.ts
├── components/
│   ├── export-format-selector.component.ts
│   └── export-preview.component.ts
└── index.ts
```

2. 定義接口:
```typescript
@Input() diaries: Log[]
@Input() blueprintId: string
@Output() exported: ExportResult
```

3. 在 Orchestrator 整合:
```typescript
handleExport(): void {
  this.modal.create({
    nzTitle: '匯出日誌',
    nzContent: DiaryExportComponent,
    nzData: {
      blueprintId: this.blueprintId(),
      diaries: this.diaries()
    }
  });
}
```

### 新增子元件

**範例: 在 List Feature 新增進階篩選**

1. 建立元件:
```
features/list/components/diary-advanced-filter.component.ts
```

2. 在 DiaryListComponent 整合:
```typescript
<app-diary-advanced-filter 
  (filterApplied)="onFilterApplied($event)" 
/>
```

## 🎯 設計原則

### 單一職責原則 (Single Responsibility)
- 每個元件只負責一件事
- 協調器元件只協調，不包含 UI 邏輯
- 子元件只處理自己的 UI 邏輯

### 開放/封閉原則 (Open/Closed)
- Features 對擴展開放
- Features 對修改封閉
- 新增功能不需修改現有 features

### 依賴反轉原則 (Dependency Inversion)
- 依賴抽象 (interfaces), 不依賴具體實作
- Features 透過 inputs/outputs 溝通
- No direct feature-to-feature dependencies

## 💡 最佳實踐

### 元件大小
- **Orchestrator**: < 200 lines
- **Feature Main Component**: < 150 lines
- **Sub Components**: < 100 lines

### 命名規範
- Feature folders: lowercase with dash (e.g., `list`, `create`, `edit`)
- Components: diary-action.component.ts (e.g., `diary-list.component.ts`)
- Sub-components: descriptive name (e.g., `diary-statistics.component.ts`)

### 狀態管理
- **Global State**: Orchestrator (diaries, loading, error)
- **Feature State**: Feature main component (modal visibility)
- **Local State**: Sub-components (form values, upload state)

### 事件處理
- Use outputs for feature → orchestrator communication
- Use inputs for orchestrator → feature data flow
- Keep events semantic (e.g., `diaryCreated`, not `buttonClicked`)

## 📚 資料模型

### Log Interface (Diary Entry)

```typescript
interface Log {
  id: string;
  blueprintId: string;
  date: Date;
  title: string;
  description?: string;
  workHours?: number;
  workers?: number;
  equipment?: string;
  weather?: string;
  temperature?: number;
  photos: LogPhoto[];
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
```

**Note**: Log type is reused from construction-log for backward compatibility.

### LogPhoto Interface

```typescript
interface LogPhoto {
  id: string;
  url: string;
  publicUrl?: string;
  caption?: string;
  uploadedAt: Date;
  size?: number;
  fileName?: string;
}
```

### DiaryStatistics Interface

```typescript
interface DiaryStatistics {
  total: number;        // 總日誌數
  thisMonth: number;    // 本月日誌數
  today: number;        // 今日日誌數
  totalPhotos: number;  // 總照片數
}
```

## 🔧 技術實作

### Store 管理

使用現有的 `ConstructionLogStore` (位於 `@core/stores`):

```typescript
// 注入 Store
private logStore = inject(ConstructionLogStore);

// 讀取狀態
diaries = this.logStore.logs;
loading = this.logStore.loading;
error = this.logStore.error;

// 計算統計
statistics = computed(() => ({
  total: this.logStore.totalCount(),
  thisMonth: this.logStore.thisMonthCount(),
  today: this.logStore.todayCount(),
  totalPhotos: this.logStore.totalPhotos()
}));

// 執行操作
await this.logStore.createLog(request);
await this.logStore.updateLog(blueprintId, diaryId, request);
await this.logStore.deleteLog(blueprintId, diaryId);
await this.logStore.uploadPhoto(blueprintId, diaryId, file);
```

### Firebase/Firestore 整合

透過 `LogFirestoreRepository` (位於 `@core/data-access`):

- Collection: `logs`
- Storage Bucket: `log-photos`
- Security Rules: 由 Blueprint 權限控制

### Angular 20 現代化

- ✅ Standalone Components
- ✅ Signals for state management
- ✅ New control flow syntax (`@if`, `@for`)
- ✅ `input()` and `output()` functions
- ✅ `inject()` for dependency injection
- ✅ OnPush change detection

## 🚀 開發指南

### 新增功能

1. 評估功能屬於哪個 feature 或需要新 feature
2. 在對應 feature 目錄建立元件
3. 更新 feature 的 index.ts 匯出
4. 在 Orchestrator 整合 (如需)
5. 保持與現有架構一致

### 修改現有功能

1. 找到對應的 feature 或 component
2. 修改元件實作
3. 更新相關的 inputs/outputs (如有變動)
4. 確保不影響其他 features

### 測試建議

```typescript
// 測試 List Feature
it('should display diary statistics', () => {
  // 測試統計卡片是否正確顯示
});

it('should emit create event when create button clicked', () => {
  // 測試建立按鈕事件
});

// 測試 Edit Feature
it('should validate form fields', () => {
  // 測試表單驗證
});

it('should upload photos successfully', () => {
  // 測試照片上傳
});
```

## 🔄 與 Construction Log 的差異

| 面向 | Construction Log | Diary Module |
|------|-----------------|--------------|
| 架構 | 扁平結構 | Feature-based 架構 |
| 元件組織 | 單一層級 | 多層級 (features/shared) |
| 命名 | construction-log | diary |
| 可擴展性 | 較低 | 高 (易於新增 features) |
| 元件大小 | 較大 (200+ lines) | 較小 (< 150 lines) |
| 職責分離 | 較少 | 明確 (orchestrator/features) |

**遷移優勢**:
- 更清晰的結構
- 更易於維護和擴展
- 更好的程式碼重用
- 更容易測試

## 📈 未來擴展方向

可考慮的 features:

- [ ] **Search Feature**: 進階搜尋與篩選
- [ ] **Export Feature**: 匯出為 PDF/Excel
- [ ] **Template Feature**: 日誌模板管理
- [ ] **Voice Feature**: 語音記錄 (如需要)
- [ ] **Weather API Integration**: 自動填寫天氣資訊
- [ ] **Realtime Updates**: 即時同步其他使用者的更新
- [ ] **Approval Feature**: 日誌審核流程

**擴展原則**: 只在有明確業務需求時才新增功能，避免過度設計。

## 🐛 常見問題

### Q: 為什麼使用 Log 而非 Diary 類型？
A: 為了向後兼容現有的 Store 和 Repository。Log 類型已被廣泛使用，重命名會影響太多檔案。

### Q: 為什麼 Create/Detail Features 沒有獨立元件？
A: 它們使用 `DiaryEditModalComponent` 的不同模式 (`mode: 'create'` 和 `mode: 'view'`)。這樣可以重用程式碼，減少重複。

### Q: 如何新增新的表單欄位？
A: 在 `DiaryFormComponent` 新增欄位，更新 `CreateLogRequest` 和 `UpdateLogRequest` 類型，確保 Store 和 Repository 支援該欄位。

### Q: 為什麼不重構 Store 的命名？
A: Store 是全域服務，重命名會影響整個專案。目前的做法是保留 Store 命名，只重構 UI 層的架構。

## 📞 支援

如有問題或建議:
1. 參考本 README
2. 檢查原始碼註解
3. 參考 Contract Module 實作 (相同架構)
4. 聯繫 GigHub 開發團隊

## 技術棧

- Angular 20.3.x
- ng-alain 20.1.x (@delon/abc, @delon/form)
- ng-zorro-antd 20.3.x
- Firebase 20.0.x (Authentication, Firestore, Storage)
- Signals for state management
- Standalone Components
- TypeScript 5.9.x

## 維護者

GigHub Development Team

---

**版本**: v1.0  
**建立日期**: 2025-12-19  
**重構自**: Construction Log Module
