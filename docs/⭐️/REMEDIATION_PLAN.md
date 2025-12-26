# 架構修復實施計畫 (Architectural Remediation Implementation Plan)
> **基於**: ARCHITECTURAL_ANALYSIS_REPORT.md  
> **版本**: 1.0  
> **日期**: 2025-12-25

---

## 修復原則 (Remediation Principles)

根據母系統指導原則 (`docs/⭐️/🤖AI_Character_Profile_Impl.md`):

1. **最少代碼等效實現** - 用最少的模組/層級/抽象達成相同結果
2. **單一真實來源** - 避免相同行為在多處生成
3. **避免錯誤抽象** - 在 Firebase 架構中，錯誤的抽象比重複代碼更昂貴
4. **僅在必要時設計** - 只處理已存在的痛點，不為潛在需求而新增設計

---

## P0: 移除 FirebaseService (CRITICAL 🔴)

### 問題描述
`FirebaseService` 是對 `@angular/fire` Auth 的 trivial wrapper，違反：
- `.github/copilot-instructions.md` 第 2 條: "Never create a FirebaseService wrapper"
- 母系統原則: "避免不必要的抽象層"

### 影響範圍
5 個檔案需要修改:
```
src/app/core/global-event-bus/services/tenant-context.service.ts
src/app/layout/basic/widgets/communication/notify.component.ts
src/app/layout/basic/widgets/communication/task.component.ts
src/app/features/social/pages/friends.page.ts
src/app/features/account/routes/organization/members/organization-members.component.ts
```

### 修復步驟

#### Step 1: 修改 tenant-context.service.ts

**Before**:
```typescript
import { FirebaseService } from '@core/services/firebase.service';

export class TenantContextService {
  private readonly firebaseService = inject(FirebaseService);
  
  private getCurrentUserId(): string | null {
    return this.firebaseService.getCurrentUserId();
  }
}
```

**After**:
```typescript
import { Auth } from '@angular/fire/auth';

export class TenantContextService {
  private readonly auth = inject(Auth);
  
  private getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }
}
```

#### Step 2: 修改 notify.component.ts

**Before**:
```typescript
import { FirebaseService } from '@core/services/firebase.service';

export class NotifyComponent {
  private readonly firebase = inject(FirebaseService);
  
  checkUser(): void {
    const userId = this.firebase.getCurrentUserId();
    // ...
  }
}
```

**After**:
```typescript
import { Auth } from '@angular/fire/auth';

export class NotifyComponent {
  private readonly auth = inject(Auth);
  
  checkUser(): void {
    const userId = this.auth.currentUser?.uid ?? null;
    // ...
  }
}
```

#### Step 3: 修改 task.component.ts (同上)

#### Step 4: 修改 friends.page.ts (同上)

#### Step 5: 修改 organization-members.component.ts (同上)

#### Step 6: 刪除 firebase.service.ts

```bash
rm src/app/core/services/firebase.service.ts
```

#### Step 7: 更新 barrel exports (如果存在)

檢查 `src/app/core/services/index.ts` 或其他 barrel exports，移除 FirebaseService 的 export。

### 驗證步驟
```bash
# 1. 確認沒有遺漏的引用
grep -r "FirebaseService" src/app --include="*.ts"

# 2. 執行型別檢查
ng build --configuration development

# 3. 執行測試
ng test

# 4. 手動測試受影響功能
# - 登入/登出
# - 組織成員管理
# - 通知功能
# - 任務功能
# - 朋友列表
```

### 估計工時
- 修改 5 個檔案: 30 分鐘
- 測試與驗證: 30 分鐘
- **總計**: 1 小時

---

## P1: 創建 FirestoreBaseRepository (HIGH PRIORITY ⚠️)

### 問題描述
當前所有 Repository 重複實作相同的錯誤處理、重試邏輯、日誌記錄。違反：
- 母系統原則: "單一真實來源"
- `.github/instructions/ng-gighub-firestore-repository.instructions.md`

### 目標
創建 `FirestoreBaseRepository<T>` 提供：
1. **自動重試機制** - Exponential Backoff
2. **智能錯誤處理** - 區分可重試/不可重試錯誤
3. **自動日誌記錄** - 操作成功/失敗/重試
4. **效能追蹤** - 記錄操作時間
5. **軟刪除支援** - 預設使用 `deleted_at` timestamp

### 實作步驟

#### Step 1: 創建 Base Repository

**檔案**: `src/app/core/data-access/base/firestore-base.repository.ts`

```typescript
import { inject, Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  query, 
  getDocs, 
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentData,
  Timestamp,
  Query
} from '@angular/fire/firestore';

/**
 * Base Repository for Firestore operations
 * Provides:
 * - Automatic retry with exponential backoff
 * - Intelligent error handling
 * - Automatic logging
 * - Performance tracking
 * - Soft delete support
 */
export abstract class FirestoreBaseRepository<T> {
  protected readonly firestore = inject(Firestore);
  
  // Subclasses must implement
  protected abstract collectionName: string;
  protected abstract toEntity(data: DocumentData, id: string): T;
  
  // Optional override
  protected toDocument(entity: Partial<T>): DocumentData {
    return entity as DocumentData;
  }
  
  /**
   * Execute operation with automatic retry
   * Implements exponential backoff for transient errors
   */
  protected async executeWithRetry<R>(
    operation: () => Promise<R>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<R> {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const startTime = performance.now();
        const result = await operation();
        const duration = performance.now() - startTime;
        
        console.debug(`[${this.collectionName}] Operation succeeded (${duration.toFixed(2)}ms)`);
        return result;
      } catch (error: any) {
        lastError = error;
        
        // Don't retry non-retryable errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
        const jitter = Math.random() * 1000;
        const totalDelay = delay + jitter;
        
        console.warn(
          `[${this.collectionName}] Operation failed (attempt ${attempt + 1}/${maxRetries}), ` +
          `retrying in ${totalDelay.toFixed(0)}ms`,
          error
        );
        
        await this.sleep(totalDelay);
      }
    }
    
    console.error(`[${this.collectionName}] Operation failed after ${maxRetries} retries`, lastError);
    throw lastError;
  }
  
  /**
   * Check if error should not be retried
   */
  protected isNonRetryableError(error: any): boolean {
    const nonRetryableCodes = [
      'permission-denied',
      'invalid-argument',
      'not-found',
      'already-exists',
      'failed-precondition',
      'unauthenticated'
    ];
    
    return nonRetryableCodes.includes(error?.code);
  }
  
  /**
   * Query documents with automatic retry and entity mapping
   */
  protected async queryDocuments(q: Query): Promise<T[]> {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.toEntity(doc.data(), doc.id));
  }
  
  /**
   * Get single document by ID
   */
  protected async getDocument(id: string): Promise<T | null> {
    const docRef = doc(this.firestore, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return this.toEntity(docSnap.data(), docSnap.id);
  }
  
  /**
   * Create document
   */
  protected async createDocument(entity: Partial<T>): Promise<T> {
    const data = this.toDocument(entity);
    const now = Timestamp.now();
    
    const docRef = await addDoc(
      collection(this.firestore, this.collectionName),
      {
        ...data,
        created_at: now,
        updated_at: now,
        deleted_at: null
      }
    );
    
    const created = await this.getDocument(docRef.id);
    if (!created) {
      throw new Error('Failed to retrieve created document');
    }
    
    return created;
  }
  
  /**
   * Update document
   */
  protected async updateDocument(id: string, entity: Partial<T>): Promise<T> {
    const docRef = doc(this.firestore, this.collectionName, id);
    const data = this.toDocument(entity);
    
    await updateDoc(docRef, {
      ...data,
      updated_at: Timestamp.now()
    });
    
    const updated = await this.getDocument(id);
    if (!updated) {
      throw new Error('Failed to retrieve updated document');
    }
    
    return updated;
  }
  
  /**
   * Delete document (soft delete by default)
   * @param hard - If true, permanently deletes the document
   */
  protected async deleteDocument(id: string, hard = false): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    
    if (hard) {
      await deleteDoc(docRef);
    } else {
      await updateDoc(docRef, {
        deleted_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

#### Step 2: 遷移現有 Repository (POC)

**範例**: TasksRepository

**Before**:
```typescript
@Injectable({ providedIn: 'root' })
export class TasksRepository {
  private readonly firestore = inject(Firestore);
  private readonly collectionName = 'tasks';

  async findByBlueprintId(blueprintId: string): Promise<TaskModel[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('blueprint_id', '==', blueprintId),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.toEntity(doc.data(), doc.id));
  }

  private toEntity(data: DocumentData, id: string): TaskModel {
    return {
      id,
      blueprintId: data['blueprint_id'] ?? '',
      title: data['title'] ?? '',
      status: data['status'],
      createdAt: this.toDate(data['created_at']),
      updatedAt: this.toDate(data['updated_at'])
    };
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Timestamp) return value.toDate();
    if (typeof value.toDate === 'function') return value.toDate();
    return new Date(value);
  }
}
```

**After**:
```typescript
import { FirestoreBaseRepository } from '@core/data-access/base/firestore-base.repository';

@Injectable({ providedIn: 'root' })
export class TasksRepository extends FirestoreBaseRepository<TaskModel> {
  protected collectionName = 'tasks';
  
  // 實作必要的 toEntity
  protected toEntity(data: DocumentData, id: string): TaskModel {
    return {
      id,
      blueprintId: data['blueprint_id'] ?? '',
      title: data['title'] ?? '',
      status: data['status'],
      createdAt: this.toDate(data['created_at']),
      updatedAt: this.toDate(data['updated_at'])
    };
  }
  
  // 業務查詢方法使用 executeWithRetry
  async findByBlueprintId(blueprintId: string): Promise<TaskModel[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('blueprint_id', '==', blueprintId),
        orderBy('created_at', 'desc')
      );
      return this.queryDocuments(q);
    });
  }
  
  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Timestamp) return value.toDate();
    if (typeof value.toDate === 'function') return value.toDate();
    return new Date(value);
  }
}
```

### 驗證步驟
```bash
# 1. 型別檢查
ng build --configuration development

# 2. 單元測試
ng test --include='**/task.repository.spec.ts'

# 3. 功能測試
# - 測試任務列表載入
# - 測試網路失敗重試
# - 測試錯誤處理
```

### 估計工時
- 創建 Base Repository: 4 小時
- 遷移 3 個 POC Repository: 2 小時
- 測試與驗證: 2 小時
- **總計**: 8 小時 (1 天)

---

## P1: 重構 Service 使用 inject() (HIGH PRIORITY ⚠️)

### 問題描述
部分 Service 使用舊式 constructor 注入，違反 Angular 20 最佳實踐。

### 影響範圍
約 10 個 Service:
- `tenant-validation-middleware.service.ts`
- `audit-collector.service.ts`
- `validation.service.ts`
- 等等

### 修復步驟

**Before**:
```typescript
export class TenantValidationMiddlewareService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly logger: LoggerService
  ) {}
  
  validate(event: DomainEvent): boolean {
    // ...
  }
}
```

**After**:
```typescript
export class TenantValidationMiddlewareService {
  private readonly tenantContext = inject(TenantContextService);
  private readonly logger = inject(LoggerService);
  
  validate(event: DomainEvent): boolean {
    // ...
  }
}
```

### 自動化腳本

創建 `scripts/refactor-inject.sh`:
```bash
#!/bin/bash
# 批次重構 Service 使用 inject()

FILES=$(grep -rl "constructor(" src/app --include="*.service.ts")

for file in $FILES; do
  echo "Processing: $file"
  # 這裡可以使用 AST 工具如 ts-morph 進行自動重構
  # 或者手動處理每個檔案
done
```

### 估計工時
- 重構 10 個 Service: 2 小時
- 測試驗證: 1 小時
- **總計**: 3 小時

---

## P2: 驗證三層架構 (MEDIUM PRIORITY 📋)

### 問題描述
需要驗證 UI 元件是否直接使用 Repository。

### 檢查清單

```bash
# 生成可疑元件列表
grep -r "Repository" src/app --include="*.component.ts" | \
  grep -v "//.*Repository" > suspicious-components.txt
```

### 驗證步驟

對於每個可疑元件：
1. 檢查是否直接注入 Repository
2. 如果是，確認是否應該使用 Facade/Service
3. 創建對應的 Facade (如果不存在)
4. 重構元件使用 Facade

**範例**:

**Before** (假設某個元件直接使用 Repository):
```typescript
export class SomeComponent {
  private readonly taskRepo = inject(TasksRepository); // ❌ 違反三層架構
  
  async loadTasks(): Promise<void> {
    this.tasks = await this.taskRepo.findByBlueprintId(this.blueprintId);
  }
}
```

**After**:
```typescript
export class SomeComponent {
  private readonly taskFacade = inject(TasksFacade); // ✅ 使用 Facade
  
  readonly tasks = computed(() => this.taskFacade.tasksState.data());
  
  constructor() {
    this.taskFacade.ensureLoaded(this.blueprintId);
  }
}
```

### 估計工時
- 檢查 10 個元件: 2 小時
- 創建必要的 Facade: 4 小時
- 重構元件: 2 小時
- 測試驗證: 2 小時
- **總計**: 10 小時 (1.5 天)

---

## 實施時程表 (Implementation Timeline)

### Week 1 (5 天)
- **Day 1**: P0 - 移除 FirebaseService (1 小時)
- **Day 1-2**: P1 - 創建 FirestoreBaseRepository (8 小時)
- **Day 3**: P1 - 重構 Service 使用 inject() (3 小時)
- **Day 4-5**: P2 - 驗證三層架構 (10 小時)

### Week 2 (5 天)
- **Day 1-3**: 遷移更多 Repository 至 BaseRepository
- **Day 4-5**: 綜合測試與文檔更新

### 總時程
- **兼職 (每天 2-4 小時)**: 3-4 週
- **全職 (每天 8 小時)**: 2 週

---

## 檢查清單 (Checklist)

### P0: FirebaseService
- [ ] 修改 tenant-context.service.ts
- [ ] 修改 notify.component.ts
- [ ] 修改 task.component.ts
- [ ] 修改 friends.page.ts
- [ ] 修改 organization-members.component.ts
- [ ] 刪除 firebase.service.ts
- [ ] 更新 barrel exports
- [ ] 執行測試驗證
- [ ] 提交 PR

### P1: FirestoreBaseRepository
- [ ] 創建 firestore-base.repository.ts
- [ ] 添加單元測試
- [ ] 遷移 TasksRepository (POC)
- [ ] 遷移 ContractRepository (POC)
- [ ] 遷移 IssuesRepository (POC)
- [ ] 驗證功能正確性
- [ ] 更新文檔
- [ ] 提交 PR

### P1: Refactor inject()
- [ ] 識別所有使用 constructor 的 Service
- [ ] 批次重構為 inject()
- [ ] 執行測試驗證
- [ ] 提交 PR

### P2: 三層架構
- [ ] 生成可疑元件列表
- [ ] 逐一檢查驗證
- [ ] 創建必要的 Facade
- [ ] 重構元件
- [ ] 執行測試驗證
- [ ] 提交 PR

---

## 風險管理 (Risk Management)

### 潛在風險
1. **測試覆蓋不足** - 修改可能引入 regression
   - 緩解: 在修改前增加測試覆蓋率
   
2. **依賴衝突** - FirebaseService 可能有未被發現的依賴
   - 緩解: 使用全域搜尋確保完整性
   
3. **效能回退** - BaseRepository 的抽象可能影響效能
   - 緩解: 添加效能基準測試

### 回滾計畫
每個 PR 應該是獨立可回滾的：
- 使用 feature flag 控制新功能
- 保留舊代碼 1-2 個版本
- 建立詳細的回滾文檔

---

## 成功指標 (Success Metrics)

### 完成標準
- [ ] 所有 P0 違反已修復
- [ ] 所有 P1 違反已修復
- [ ] 測試覆蓋率 > 80%
- [ ] 無 regression bugs
- [ ] 文檔已更新

### 品質指標
- **代碼重複度**: 減少 30%
- **平均檔案大小**: 減少 20%
- **技術債評分**: 從 Medium 降至 Low
- **構建時間**: 無明顯增加
- **測試執行時間**: 無明顯增加

---

## 下一步行動 (Next Steps)

1. **立即執行**: 移除 FirebaseService (P0)
2. **本週開始**: 創建 FirestoreBaseRepository (P1)
3. **下週規劃**: 三層架構驗證 (P2)
4. **持續改進**: 遷移所有 Repository

**問題或疑慮?** 請聯繫架構團隊進行討論。

---

**計畫版本**: 1.0  
**創建日期**: 2025-12-25  
**負責人**: [待指派]  
**審查人**: [待指派]
