# QA Module Restructuring - Before & After

## 問題描述 (Problem Statement)

Issue #88 指出 `src/app/routes/blueprint/modules/qa-module-view.component.ts` 尚未進行結構化，需要參考 #75 的做法進行重構。

## 重構目標 (Refactoring Goals)

1. **高內聚性 (High Cohesion)**: 功能劃分清晰，業務邏輯集中
2. **低耦合性 (Low Coupling)**: 模組間透過明確接口溝通
3. **可擴展性 (Extensibility)**: 易於新增功能
4. **不向後兼容 (Not Backward Compatible)**: 徹底重構

## Before: 單一元件結構 (Monolithic Component)

### 舊結構 (Old Structure)
```
src/app/routes/blueprint/modules/
└── qa-module-view.component.ts (228 lines)
    ├── 統計卡片 (Statistics Cards)
    ├── 檢驗列表 (Inspections List)
    ├── 標準列表 (Standards List)
    ├── 所有業務邏輯混在一起
    └── 難以維護和擴展
```

### 問題 (Problems)
- ❌ 所有功能混在單一檔案
- ❌ 難以進行單元測試
- ❌ 難以重複使用元件
- ❌ 職責不清晰
- ❌ 擴展性差

## After: 特徵導向架構 (Feature-Based Architecture)

### 新結構 (New Structure)
```
src/app/routes/blueprint/modules/qa/
├── README.md                           (文檔)
├── qa-module-view.component.ts         (主協調器 - 80 lines)
│   └── 只負責組合功能元件
├── features/
│   ├── qa-stats/                       (統計功能)
│   │   ├── qa-stats.component.ts      (110 lines)
│   │   └── index.ts                   (barrel export)
│   ├── qa-inspections/                 (檢驗功能)
│   │   ├── qa-inspections.component.ts (120 lines)
│   │   └── index.ts
│   └── qa-standards/                   (標準功能)
│       ├── qa-standards.component.ts   (80 lines)
│       └── index.ts
└── index.ts                            (模組 barrel export)
```

### 優勢 (Advantages)
- ✅ **關注點分離**: 每個元件專注單一功能
- ✅ **可測試性**: 獨立元件易於測試
- ✅ **可重用性**: 功能元件可在其他地方使用
- ✅ **可維護性**: 小檔案易於理解和修改
- ✅ **可擴展性**: 新增功能只需新增 feature 目錄
- ✅ **團隊協作**: 多人可同時開發不同功能

## 架構對比 (Architecture Comparison)

| 面向 | Before (單一元件) | After (特徵導向) |
|------|------------------|-----------------|
| **檔案數量** | 1 個大檔案 (228 lines) | 7 個小檔案 (總計 ~390 lines) |
| **職責劃分** | 所有功能混在一起 | 每個元件單一職責 |
| **可測試性** | 困難 | 容易 (獨立測試) |
| **可重用性** | 無法重用 | 功能元件可重用 |
| **擴展性** | 需修改大檔案 | 新增 feature 目錄 |
| **協作性** | 容易衝突 | 多人協作無衝突 |
| **可讀性** | 需要閱讀全部 | 只需閱讀相關功能 |

## 程式碼範例對比 (Code Example Comparison)

### Before: 單一元件包含所有功能
```typescript
@Component({
  selector: 'app-qa-module-view',
  template: `
    <!-- 統計 -->
    <nz-card>
      <nz-statistic [nzValue]="stats().inspections" />
      <nz-statistic [nzValue]="stats().passRate" />
      <nz-statistic [nzValue]="stats().openIssues" />
    </nz-card>
    
    <!-- 檢驗列表 -->
    <nz-tabset>
      <nz-tab nzTitle="品質檢驗">
        <st [data]="inspections()" [columns]="inspectionColumns" />
      </nz-tab>
      
      <!-- 標準列表 -->
      <nz-tab nzTitle="品質標準">
        <nz-list [nzDataSource]="standards()" />
      </nz-tab>
    </nz-tabset>
  `
})
export class QaModuleViewComponent {
  // 所有狀態和邏輯都混在一起
  stats = signal({ ... });
  inspections = signal([]);
  standards = signal([]);
  inspectionColumns = [...];
  
  loadMockData() { ... }
  refreshData() { ... }
  addInspection() { ... }
}
```

### After: 功能元件各司其職
```typescript
// 主協調器 - 只負責組合
@Component({
  selector: 'app-qa-module-view',
  imports: [QaStatsComponent, QaInspectionsComponent, QaStandardsComponent],
  template: `
    <app-qa-stats [blueprintId]="blueprintId()" />
    
    <nz-card>
      <nz-tabset>
        <nz-tab nzTitle="品質檢驗">
          <app-qa-inspections [blueprintId]="blueprintId()" />
        </nz-tab>
        
        <nz-tab nzTitle="品質標準">
          <app-qa-standards [blueprintId]="blueprintId()" />
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `
})
export class QaModuleViewComponent {
  blueprintId = input.required<string>();
}

// 統計元件 - 專注統計功能
@Component({
  selector: 'app-qa-stats',
  template: `
    <nz-card nzTitle="品質管理">
      <nz-statistic [nzValue]="stats().inspections" />
      <nz-statistic [nzValue]="stats().passRate" />
      <nz-statistic [nzValue]="stats().openIssues" />
    </nz-card>
  `
})
export class QaStatsComponent {
  stats = signal({ ... });
  refresh() { ... }
}

// 檢驗元件 - 專注檢驗管理
@Component({
  selector: 'app-qa-inspections',
  template: `...`
})
export class QaInspectionsComponent {
  inspections = signal([]);
  columns = [...];
  addInspection() { ... }
}

// 標準元件 - 專注標準管理
@Component({
  selector: 'app-qa-standards',
  template: `...`
})
export class QaStandardsComponent {
  standards = signal([]);
}
```

## 使用方式對比 (Usage Comparison)

### Before: 只能整體使用
```typescript
// 只能匯入整個元件，無法單獨使用某個功能
import { QaModuleViewComponent } from './modules/qa-module-view.component';
```

### After: 靈活使用
```typescript
// 選項 1: 使用完整模組
import { QaModuleViewComponent } from './modules/qa';

// 選項 2: 只使用特定功能
import { QaStatsComponent, QaInspectionsComponent } from './modules/qa';

// 選項 3: 自訂組合
@Component({
  imports: [QaStatsComponent, QaInspectionsComponent],
  template: `
    <app-qa-stats [blueprintId]="id" />
    <app-qa-inspections [blueprintId]="id" />
  `
})
```

## 未來擴展範例 (Future Extension Example)

### 新增缺陷管理功能

#### Before: 需修改現有檔案
```typescript
// qa-module-view.component.ts (已經很大了)
// 1. 新增狀態
defects = signal([]);
// 2. 新增欄位
defectColumns = [...];
// 3. 新增方法
loadDefects() { ... }
// 4. 修改模板 (risk: 破壞現有功能)
```

#### After: 新增 feature 目錄即可
```bash
# 1. 建立新目錄
mkdir -p features/qa-defects

# 2. 建立元件
# features/qa-defects/qa-defects.component.ts
@Component({
  selector: 'app-qa-defects',
  template: `...`
})
export class QaDefectsComponent { ... }

# 3. 建立 barrel export
# features/qa-defects/index.ts
export * from './qa-defects.component';

# 4. 在主協調器中組合
@Component({
  imports: [..., QaDefectsComponent],
  template: `
    ...
    <nz-tab nzTitle="缺陷管理">
      <app-qa-defects [blueprintId]="blueprintId()" />
    </nz-tab>
  `
})
```

## 成員模組驗證 (Member Modules Verification)

### Blueprint Members (藍圖成員)
✅ **正確位置**: `src/app/routes/blueprint/modules/members/`
- 已經按照 #75 正確結構化
- 使用 feature-based 架構
- 包含 member-list 和 member-form 功能

### Team Members (團隊成員)
✅ **正確位置**: `src/app/routes/team/members/`
- 用於管理團隊內部成員
- 與 Blueprint 成員不同

### Organization Members (組織成員)
✅ **正確位置**: `src/app/routes/organization/members/`
- 用於管理組織成員
- 與 Blueprint 成員不同

### Partner Members (夥伴成員)
✅ **正確位置**: `src/app/routes/partner/members/`
- 用於管理夥伴成員
- 與 Blueprint 成員不同

**結論**: ✅ 沒有發現散落或放錯位置的藍圖成員模組

## 結論 (Conclusion)

✅ **重構完成**: QA 模組已成功重構為特徵導向架構  
✅ **高內聚性**: 每個功能元件職責單一  
✅ **低耦合性**: 透過清晰的介面溝通  
✅ **可擴展性**: 新增功能無需修改現有程式碼  
✅ **成員模組檢查**: 所有成員模組位置正確  

---

**重構日期**: 2025-12-19  
**參考**: Issue #75 (Members Module 重構)  
**維護者**: GigHub Development Team
