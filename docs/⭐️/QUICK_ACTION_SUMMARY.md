# 架構問題快速行動摘要 (Quick Action Summary)
> **基於**: ARCHITECTURAL_ANALYSIS_REPORT.md & REMEDIATION_PLAN.md  
> **狀態**: 待執行  
> **預期完成**: 2-4 週

---

## 🔴 P0: 立即修復 (1 小時)

### 問題: FirebaseService 存在
**違反**: `.github/copilot-instructions.md` - "Never create a FirebaseService wrapper"

**修復**:
```bash
# 1. 搜尋所有使用
grep -r "FirebaseService" src/app --include="*.ts"

# 2. 替換為直接注入 Auth
# Before: private firebase = inject(FirebaseService);
# After:  private auth = inject(Auth);

# 3. 替換方法呼叫
# Before: this.firebase.getCurrentUserId()
# After:  this.auth.currentUser?.uid ?? null

# 4. 刪除檔案
rm src/app/core/services/firebase.service.ts

# 5. 測試
ng test
```

**影響檔案**: 5 個
- tenant-context.service.ts
- notify.component.ts
- task.component.ts
- friends.page.ts
- organization-members.component.ts

---

## ⚠️ P1: 高優先級 (1 天)

### 問題: 缺少 FirestoreBaseRepository
**違反**: 單一真實來源原則 - 重複的錯誤處理和重試邏輯

**修復**:
1. 創建 `src/app/core/data-access/base/firestore-base.repository.ts`
2. 實作核心方法:
   - `executeWithRetry()` - 自動重試
   - `queryDocuments()` - 查詢封裝
   - `createDocument()` - 創建文檔
   - `updateDocument()` - 更新文檔
   - `deleteDocument()` - 軟刪除

3. 遷移範例:
```typescript
// Before
@Injectable({ providedIn: 'root' })
export class TasksRepository {
  private readonly firestore = inject(Firestore);
  // ... 重複的錯誤處理邏輯
}

// After
@Injectable({ providedIn: 'root' })
export class TasksRepository extends FirestoreBaseRepository<TaskModel> {
  protected collectionName = 'tasks';
  protected toEntity(data: DocumentData, id: string): TaskModel { /* ... */ }
  
  async findByBlueprintId(blueprintId: string): Promise<TaskModel[]> {
    return this.executeWithRetry(async () => {
      const q = query(/* ... */);
      return this.queryDocuments(q);
    });
  }
}
```

**影響範圍**: 10+ repositories

---

## ⚠️ P1: 重構 inject() (3 小時)

### 問題: Services 使用 constructor 注入
**違反**: Angular 20 最佳實踐

**修復**:
```typescript
// Before
export class SomeService {
  constructor(
    private readonly dep1: Dep1,
    private readonly dep2: Dep2
  ) {}
}

// After
export class SomeService {
  private readonly dep1 = inject(Dep1);
  private readonly dep2 = inject(Dep2);
}
```

**影響範圍**: ~10 services

---

## 📋 P2: 驗證三層架構 (1.5 天)

### 問題: 可能有 UI 直接使用 Repository
**需要驗證**: 是否違反 UI → Service → Repository 原則

**檢查步驟**:
```bash
# 1. 找出可疑元件
grep -r "Repository" src/app --include="*.component.ts" > check-list.txt

# 2. 逐一檢查是否直接注入 Repository
# 3. 如違反，創建對應 Facade
# 4. 重構元件使用 Facade
```

**如果違反**:
```typescript
// Before (違反)
export class SomeComponent {
  private readonly repo = inject(SomeRepository); // ❌
}

// After (正確)
export class SomeComponent {
  private readonly facade = inject(SomeFacade); // ✅
}
```

---

## 實施順序 (Execution Order)

```
Day 1 Morning (2h):
└─ P0: 移除 FirebaseService ✅

Day 1-2 (8h):
└─ P1: 創建 FirestoreBaseRepository
   ├─ 實作基礎類別
   ├─ 添加單元測試
   └─ POC: 遷移 3 個 Repository

Day 3 (3h):
└─ P1: 重構 inject()
   └─ 批次處理 10 個 Service

Day 4-5 (10h):
└─ P2: 三層架構驗證
   ├─ 檢查可疑元件
   ├─ 創建必要 Facade
   └─ 重構元件

Week 2+:
└─ 遷移剩餘 Repository
└─ 更新文檔
└─ 團隊培訓
```

---

## 檢查清單 (Quick Checklist)

### P0 - 立即執行
- [ ] 移除 FirebaseService
- [ ] 更新 5 個依賴檔案
- [ ] 執行測試
- [ ] 提交 PR

### P1 - 本週完成
- [ ] 創建 BaseRepository
- [ ] 遷移 3 個 POC Repository
- [ ] 重構 10 個 Service 使用 inject()
- [ ] 執行測試
- [ ] 提交 PR

### P2 - 下週完成
- [ ] 檢查 10+ 可疑元件
- [ ] 創建必要 Facade
- [ ] 重構元件
- [ ] 執行測試
- [ ] 提交 PR

---

## 成功標準 (Success Criteria)

✅ **完成時**:
- FirebaseService 不存在
- 所有 Repository 繼承 BaseRepository
- 所有 Service 使用 inject()
- UI 不直接使用 Repository
- 測試覆蓋率 > 80%
- 無 regression bugs

📊 **品質指標**:
- 代碼重複度: ↓ 30%
- 技術債評分: Medium → Low
- 架構合規分數: 75 → 95

---

## 資源連結 (Resources)

- 📋 **完整分析**: `docs/⭐️/ARCHITECTURAL_ANALYSIS_REPORT.md`
- 📝 **詳細計畫**: `docs/⭐️/REMEDIATION_PLAN.md`
- 📘 **架構原則**: `.github/rules/architectural-principles.md`
- 🎯 **Copilot 指引**: `.github/copilot-instructions.md`

---

## 問題聯絡 (Contact)

有問題或需要討論？請聯繫:
- **架構團隊**: [待指派]
- **技術債管理**: [待指派]

---

**更新日期**: 2025-12-25  
**下次審查**: 2026-01-08
