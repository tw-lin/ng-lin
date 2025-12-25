# 專案架構分析報告 (Architectural Analysis Report)
> **分析日期**: 2025-12-25  
> **分析者**: AI Architecture Agent  
> **專案**: ng-lin (GigHub Construction Site Progress Tracking System)

---

## 執行摘要 (Executive Summary)

### 分析目的
根據母系統指導原則 (`docs/⭐️/🤖AI_Character_Profile_Impl.md`, `docs/⭐️/🧠AI_Behavior_Guidelines.md`) 對專案當前架構進行全面檢視，識別違背核心原則的部分，並提供最少代碼等效實現的修復建議。

### 核心發現
✅ **符合母系統的部分**:
1. 專案已採用三層架構 (UI → Service/Facade → Repository)
2. Repository 正確地直接注入 `@angular/fire` 的 `Firestore`
3. 大部分元件使用 Standalone Components 和 Signals
4. 大部分元件使用新控制流語法 (`@if`, `@for`)
5. 已實作 Facade 模式用於複雜業務協調

⚠️ **違背母系統的部分**:
1. **FirebaseService 存在且被使用** - 違反 `.github/copilot-instructions.md` 第 2 條
2. **部分 Service 使用 constructor 注入** - 違反 Angular 20 最佳實踐
3. **部分元件可能直接使用 Repository** - 需進一步驗證
4. **缺少統一的 Repository Base Class** - 導致重複的重試邏輯

---

## 詳細分析 (Detailed Analysis)

### 1. FirebaseService 分析 (CRITICAL VIOLATION 🔴)

#### 問題描述
專案中存在 `src/app/core/services/firebase.service.ts`，這**直接違反了 copilot-instructions.md 的第 2 條規定**：

> **Never create a FirebaseService wrapper**

#### 當前實作
```typescript
// src/app/core/services/firebase.service.ts
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private readonly auth = inject(Auth);

  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  getCurrentUser(): import('@angular/fire/auth').User | null {
    return this.auth.currentUser;
  }

  currentUser(): import('@angular/fire/auth').User | null {
    return this.getCurrentUser();
  }
}
```

#### 使用情況
此服務被以下檔案使用：
- `src/app/core/global-event-bus/services/tenant-context.service.ts`
- `src/app/layout/basic/widgets/communication/notify.component.ts`
- `src/app/layout/basic/widgets/communication/task.component.ts`
- `src/app/features/social/pages/friends.page.ts`
- `src/app/features/account/routes/organization/members/organization-members.component.ts`

#### 為什麼這是違反?
根據母系統指導原則:
1. **Firebase 為唯一後端平台** - 前端應直接使用 `@angular/fire` 提供的服務
2. **避免不必要的抽象層** - FirebaseService 是對 Auth 的 trivial wrapper，不增加價值
3. **單一真實來源原則** - 創建了多餘的中間層

#### 修復方案
**最少代碼等效實現**：
```typescript
// 移除 FirebaseService，所有需要 Auth 的地方直接注入
private readonly auth = inject(Auth);

// 直接使用
const userId = this.auth.currentUser?.uid ?? null;
```

**影響範圍**: 5 個檔案需要修改
**風險評估**: 低 - 這是簡單的依賴替換
**優先級**: P0 (Critical) - 違反核心架構原則

---

### 2. Repository 架構分析 (COMPLIANT ✅ with IMPROVEMENT OPPORTUNITIES)

#### 當前狀態
✅ **正確實作**:
- Repository 直接注入 `Firestore` from `@angular/fire`
- Repository 不包含業務邏輯
- Repository 負責資料轉換 (`toEntity`, `toDate`)

```typescript
// Example: TasksRepository (GOOD)
@Injectable({ providedIn: 'root' })
export class TasksRepository {
  private readonly firestore = inject(Firestore); // ✅ 直接注入
  
  async findByBlueprintId(blueprintId: string): Promise<TaskModel[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('blueprint_id', '==', blueprintId),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.toEntity(doc.data(), doc.id));
  }
}
```

#### 改善機會
⚠️ **缺少統一基礎類別**:
根據 `.github/instructions/ng-gighub-firestore-repository.instructions.md`，應該存在：
- `FirestoreBaseRepository<T>` - 提供統一的錯誤處理、重試邏輯、軟刪除
- `executeWithRetry()` - Exponential Backoff 重試機制
- 自動日誌記錄與效能追蹤

**建議**: 創建 `FirestoreBaseRepository` 並讓所有 Repository 繼承

---

### 3. 三層架構驗證 (MOSTLY COMPLIANT ✅)

#### Presentation Layer (UI Components)
✅ **符合規範的實作**:
```typescript
// src/app/features/blueprint/routes/modules/tasks/components/tasks-list.component.ts
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class TasksListComponent {
  private readonly facade = inject(TasksFacade); // ✅ 注入 Facade，不是 Repository
  
  readonly tasks = computed(() => this.facade.tasksState.data());
  readonly loading = computed(() => this.facade.tasksState.loading());
}
```

⚠️ **需要驗證的部分**:
以下元件可能直接使用 Repository (需要逐一檢查):
- `notify.component.ts`
- `task.component.ts`
- `team-detail-drawer.component.ts`
- `create-organization.component.ts`
- 等等 (約 10+ 個檔案)

#### Business Layer (Service/Facade)
✅ **正確使用 Facade Pattern**:
```typescript
// src/app/features/blueprint/routes/modules/tasks/services/tasks.facade.ts
@Injectable({ providedIn: 'root' })
export class TasksFacade {
  private readonly repository = inject(TasksRepository); // ✅ Service 注入 Repository
  
  private readonly tasks = signal<TaskModel[]>([]);
  private readonly loading = signal(false);
  
  async loadByBlueprint(blueprintId: string): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.repository.findByBlueprintId(blueprintId);
      this.tasks.set(result);
    } finally {
      this.loading.set(false);
    }
  }
}
```

#### Data Layer (Repository)
✅ **正確實作** - 如前述分析

---

### 4. Angular 20 現代化評估

#### ✅ 已採用的最佳實踐
1. **Standalone Components** - 檢查顯示 0 個 NgModule 使用
2. **Signals 狀態管理** - Facade 正確使用 `signal()`, `computed()`, `effect()`
3. **新控制流語法** - 僅發現 1 處舊語法使用
4. **input()/output() 函數** - 組件使用 `input.required<string>()`
5. **ChangeDetectionStrategy.OnPush** - 組件設定正確

#### ⚠️ 需要改善的部分
1. **部分 Service 使用 constructor()** - 應改用 `inject()` 函數
   - `tenant-validation-middleware.service.ts`
   - `audit-collector.service.ts`
   - `validation.service.ts`
   - 等等

2. **constructor 執行業務邏輯** - 應移至 `ngOnInit()`
   ```typescript
   // TasksListComponent
   constructor() {
     this.facade.ensureLoaded(this.blueprintId); // ⚠️ 業務邏輯在 constructor
   }
   ```

---

### 5. 事件驅動架構分析

#### ✅ 正確實作
- 專案有完整的 `global-event-bus` 系統
- 實作了事件驗證、重試、死信隊列
- 有審計日誌自動訂閱機制

#### 📋 需要驗證
- 是否所有跨模組溝通都使用 EventBus
- 是否有直接的 Service-to-Service 調用

---

## 違反清單與修復優先級 (Violation List & Remediation Priority)

### P0 (Critical) - 違反核心架構原則 🔴

#### V1: FirebaseService 存在
- **違反規則**: `.github/copilot-instructions.md` - "Never create a FirebaseService wrapper"
- **影響範圍**: 5 個檔案
- **修復方案**: 移除 `FirebaseService`，直接注入 `Auth`
- **技術債風險**: High - 引入不必要的抽象層
- **修復成本**: Low - 簡單的依賴替換

**修復步驟**:
1. 在所有使用 `FirebaseService` 的地方，改為直接注入 `Auth`
2. 將 `getCurrentUserId()` 替換為 `this.auth.currentUser?.uid ?? null`
3. 移除 `firebase.service.ts` 檔案
4. 執行測試驗證

### P1 (High) - 違反最佳實踐 ⚠️

#### V2: 缺少統一 Repository Base Class
- **違反規則**: `.github/instructions/ng-gighub-firestore-repository.instructions.md`
- **影響範圍**: 所有 Repository (10+ 個)
- **修復方案**: 創建 `FirestoreBaseRepository<T>`
- **技術債風險**: Medium - 重複的錯誤處理和重試邏輯
- **修復成本**: Medium - 需要設計基礎類別

**修復步驟**:
1. 創建 `src/app/core/data-access/base/firestore-base.repository.ts`
2. 實作 `executeWithRetry()`, `queryDocuments()`, `toEntity()` 等方法
3. 逐步遷移現有 Repository 繼承此基礎類別
4. 添加單元測試

#### V3: 部分 Service 使用 constructor 注入
- **違反規則**: Angular 20 最佳實踐 - 應使用 `inject()` 函數
- **影響範圍**: 約 10 個 Service
- **修復方案**: 重構為使用 `inject()` 函數
- **技術債風險**: Low - 功能正常但不符合現代慣例
- **修復成本**: Low - 簡單的重構

**修復步驟**:
1. 識別所有使用 `constructor(...)` 的 Service
2. 改為在類別屬性使用 `inject()`
3. 移除空的 `constructor()`
4. 執行測試驗證

### P2 (Medium) - 潛在問題 📋

#### V4: 部分元件可能直接使用 Repository
- **需要驗證**: UI 層是否直接注入 Repository
- **影響範圍**: 約 10 個元件
- **修復方案**: 創建對應的 Facade 或 Service
- **技術債風險**: Medium - 違反三層架構
- **修復成本**: Medium - 需要創建 Facade

**驗證步驟**:
1. 逐一檢查可疑的元件檔案
2. 確認是否直接注入 Repository
3. 如果違反，創建對應的 Facade
4. 重構元件使用 Facade

#### V5: constructor 執行業務邏輯
- **違反規則**: Angular 最佳實踐 - constructor 應只用於依賴注入
- **影響範圍**: 部分元件
- **修復方案**: 移至 `ngOnInit()` 生命週期
- **技術債風險**: Low - 可能導致測試困難
- **修復成本**: Low - 簡單的重構

---

## 修復路徑圖 (Remediation Roadmap)

### Phase 1: Critical Fixes (1-2 days)
```
Week 1:
- [ ] 移除 FirebaseService (P0-V1)
  - 修改 5 個依賴檔案
  - 替換為直接注入 Auth
  - 執行測試驗證
  - 提交 PR
```

### Phase 2: Repository Foundation (3-5 days)
```
Week 2:
- [ ] 創建 FirestoreBaseRepository (P1-V2)
  - 實作基礎類別與重試機制
  - 添加單元測試
  - 文檔化使用方式
- [ ] 遷移 2-3 個 Repository 作為 POC
  - TasksRepository
  - ContractRepository
  - IssuesRepository
```

### Phase 3: Modern Angular Patterns (3-5 days)
```
Week 3:
- [ ] 重構 Service 使用 inject() (P1-V3)
  - 批次處理 10 個 Service
  - 執行測試驗證
- [ ] 驗證三層架構 (P2-V4)
  - 檢查可疑元件
  - 創建必要的 Facade
- [ ] 移動 constructor 業務邏輯 (P2-V5)
```

### Phase 4: Repository Migration (5-7 days)
```
Week 4-5:
- [ ] 遷移所有 Repository 至 BaseRepository
  - 批次處理剩餘 Repository
  - 驗證功能正確性
  - 更新文檔
```

---

## 長期演進建議 (Long-term Evolution Recommendations)

### 1. 架構治理機制
建議建立自動化架構檢查：
- **ESLint Rules**: 禁止直接注入 Repository 在元件
- **Pre-commit Hooks**: 檢查 FirebaseService 不被重新引入
- **CI/CD Checks**: 驗證三層架構遵守情況

### 2. 文檔更新
建議更新以下文檔：
- `docs/architecture(架構)/README.md` - 添加實際範例
- `.github/instructions/` - 補充 Facade 模式指引
- `CONTRIBUTING.md` - 添加架構遵守檢查清單

### 3. 團隊培訓
建議進行以下培訓：
- Angular 20 現代化模式 (Signals, inject())
- 三層架構最佳實踐
- Repository Pattern 與 BaseRepository 使用

---

## 結論 (Conclusion)

### 總體評估
專案在架構上**基本符合母系統指導原則**，但存在以下關鍵問題：

1. **FirebaseService 存在** - 這是最嚴重的違反，應立即修復
2. **缺少統一 Repository Base** - 導致代碼重複，應優先處理
3. **部分現代化未完成** - 可逐步改善

### 建議行動
1. **立即行動** (本週):
   - 移除 FirebaseService
   - 開始 FirestoreBaseRepository 設計

2. **短期行動** (2-4 週):
   - 完成 BaseRepository 並遷移
   - 重構 Service 使用 inject()
   - 驗證三層架構

3. **長期行動** (1-2 月):
   - 建立架構治理機制
   - 完善文檔
   - 團隊培訓

### 技術債評估
- **當前技術債**: Medium
- **修復後技術債**: Low
- **預期投入時間**: 2-3 週 (兼職)
- **長期收益**: 更容易維護、更好的可測試性、更符合母系統原則

---

## 附錄 (Appendix)

### A. 檢查腳本
```bash
# 檢查 FirebaseService 使用
grep -r "FirebaseService" src/app --include="*.ts"

# 檢查直接 Firestore 注入
grep -r "inject(Firestore)" src/app --include="*.ts"

# 檢查舊式控制流
grep -r "*ngIf\|*ngFor" src/app --include="*.html"

# 檢查 constructor 注入
grep -r "constructor(" src/app --include="*.service.ts"
```

### B. 相關文檔
- `.github/copilot-instructions.md` - 核心架構規則
- `docs/⭐️/🤖AI_Character_Profile_Impl.md` - AI 角色定義
- `docs/⭐️/🧠AI_Behavior_Guidelines.md` - AI 行為準則
- `.github/rules/architectural-principles.md` - 架構原則
- `.github/instructions/ng-gighub-firestore-repository.instructions.md` - Repository 指引

### C. 聯絡人
- **架構負責人**: [待填]
- **技術債管理**: [待填]
- **PR 審查**: [待填]

---

**報告版本**: 1.0  
**生成日期**: 2025-12-25  
**下次審查**: 2026-01-08 (2 週後)
