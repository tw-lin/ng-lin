# 合約模組實作指南 (Contract Module Implementation Guide)

> **補充文件**: 搭配 `design.md` 使用，提供實作細節與最佳實踐  
> **版本**: v2.0.0 - 自包含架構  
> **最後更新**: 2025-12-23

## 📋 目的

本文件針對 `design.md` 提供以下補充：
1. **實作順序**: 明確的開發步驟與檢查清單
2. **程式碼範例**: 完整可執行的程式碼片段
3. **常見陷阱**: 實作時容易出錯的地方及解決方案
4. **測試策略**: 如何測試每個層級的程式碼
5. **自包含架構**: 直接使用 `@angular/fire` 進行 Firebase 整合

---

## 🚀 實作路徑 (Implementation Roadmap)

### Phase 0: 準備工作 (Prerequisites)

**檢查清單**:
- [ ] 確認已閱讀 `design.md` 完整內容
- [ ] 確認了解三層架構: UI → Service → Repository
- [ ] **確認模組採用自包含設計**: 直接使用 `@angular/fire`，不依賴 `@core` 層
- [ ] 確認已設定 Firebase Emulator（用於本地測試）

**關鍵檔案**:
- `.github/instructions/ng-gighub-architecture.instructions.md`
- `src/app/routes/blueprint/modules/cloud/core/cloud-storage.repository.ts` (自包含範例)

---

### Phase 1: 資料模型定義 (Data Models)

#### 步驟 1.1: 更新 Contract Model

**目標**: 將現有的簡化模型擴展為完整模型（在模組內部）

**現有模型** (`src/app/routes/blueprint/modules/contract/core/models/contract.model.ts`):
```typescript
export interface ContractModel {
  id: string;
  blueprintId: string;
  title: string;
  status?: string;
  effectiveDate?: Date;
  updatedAt?: Date;
}
```

**目標模型** (逐步擴展):

**階段 1 - 基本欄位**:
```typescript
export interface Contract {
  // 識別資訊
  id: string;
  blueprintId: string;
  
  // 基本資訊
  title: string;
  contractNumber: string;
  contractType: ContractType;
  description?: string;
  
  // 時程資訊
  startDate: Date;
  endDate: Date;
  effectiveDate?: Date;
  
  // 狀態
  status: ContractStatus;
  
  // 元數據
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  deletedAt: Date | null;
}

export type ContractType = 
  | 'main_contract' 
  | 'sub_contract' 
  | 'supplement' 
  | 'change_order' 
  | 'other';

export type ContractStatus = 
  | 'draft' 
  | 'under_review' 
  | 'active' 
  | 'completed' 
  | 'terminated' 
  | 'suspended';
```

**階段 2 - 添加契約方與金額**:
```typescript
export interface Contract {
  // ... 階段 1 欄位
  
  // 契約方資訊
  partyA: ContractParty;
  partyB: ContractParty;
  partyC?: ContractParty;
  
  // 金額與條款
  totalAmount: number;
  paidAmount: number;
  currency: string;
  paymentTerms?: string;
}

export interface ContractParty {
  id: string;
  name: string;
  type: 'organization' | 'individual';
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}
```

**階段 3 - 添加附件與 AI 解析** (後續擴展):
```typescript
export interface Contract {
  // ... 階段 1 & 2 欄位
  
  // 附件與文件
  attachments: ContractAttachment[];
  originalFileUrl?: string;
  parsedData?: ParsedContractData;
  
  // 審核資訊
  approvalStatus?: ApprovalStatus;
  approvalHistory: ApprovalRecord[];
}
```

**⚠️ 重要**: 採用漸進式擴展，每個階段完成後都要測試

#### 步驟 1.2: 建立輔助類型

**檔案**: `src/app/routes/blueprint/modules/contract/data-access/models/contract-types.ts`

```typescript
// 附件資訊
export interface ContractAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  downloadUrl?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// AI 解析資料
export interface ParsedContractData {
  extractedFields: Record<string, any>;
  workItems: WorkItem[];
  keyTerms: string[];
  confidence: number;
  parsedAt: Date;
  parserVersion: string;
}

// 工項
export interface WorkItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

// 審批狀態
export type ApprovalStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'cancelled';

// 審批記錄
export interface ApprovalRecord {
  id: string;
  approverUserId: string;
  approverName: string;
  action: ApprovalStatus;
  comment?: string;
  timestamp: Date;
  level: number;
}
```

---

### Phase 2: Repository 實作 (Data Access Layer)

#### 步驟 2.1: 建立 ContractRepository

**檔案**: `src/app/routes/blueprint/modules/contract/data-access/repositories/contract.repository.ts`

**⚠️ 關鍵注意事項**:
1. 專案使用 `FirebaseService` 而非直接注入 `Firestore`
2. 必須繼承 `FirestoreBaseRepository<T>`
3. 必須實作 `collectionName` 和 `toEntity` 方法
4. Firestore 使用 `snake_case`，TypeScript 使用 `camelCase`

**完整實作範例**:

```typescript
import { Injectable, inject } from '@angular/core';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  DocumentData 
} from '@angular/fire/firestore';
import { FirestoreBaseRepository } from '@core/data-access/repositories/base/firestore-base.repository';
import { Contract, ContractStatus, ContractType } from '../models/contract.model';

@Injectable({ providedIn: 'root' })
export class ContractRepository extends FirestoreBaseRepository<Contract> {
  // ✅ 必須: 定義 collection 名稱
  protected collectionName = 'contracts';
  
  /**
   * ✅ 必須: 將 Firestore DocumentData 轉換為 TypeScript 實體
   * 
   * 重要: Firestore 使用 snake_case，TypeScript 使用 camelCase
   */
  protected toEntity(data: DocumentData, id: string): Contract {
    return {
      // 識別資訊
      id,
      blueprintId: data['blueprint_id'] || data['blueprintId'],
      
      // 基本資訊
      title: data['title'],
      contractNumber: data['contract_number'] || data['contractNumber'],
      contractType: this.mapContractType(data['contract_type']),
      description: data['description'],
      
      // 契約方資訊 (階段 2)
      partyA: this.mapParty(data['party_a']),
      partyB: this.mapParty(data['party_b']),
      partyC: data['party_c'] ? this.mapParty(data['party_c']) : undefined,
      
      // 金額與條款
      totalAmount: data['total_amount'] || 0,
      paidAmount: data['paid_amount'] || 0,
      currency: data['currency'] || 'TWD',
      paymentTerms: data['payment_terms'],
      
      // 時程資訊
      startDate: this.toDate(data['start_date']),
      endDate: this.toDate(data['end_date']),
      effectiveDate: data['effective_date'] ? this.toDate(data['effective_date']) : undefined,
      signedDate: data['signed_date'] ? this.toDate(data['signed_date']) : undefined,
      
      // 狀態與版本
      status: this.mapStatus(data['status']),
      version: data['version'] || 1,
      previousVersionId: data['previous_version_id'],
      
      // 附件與文件 (階段 3)
      attachments: data['attachments'] || [],
      originalFileUrl: data['original_file_url'],
      parsedData: data['parsed_data'],
      
      // 審核資訊 (階段 3)
      approvalStatus: data['approval_status'],
      approvalHistory: data['approval_history'] || [],
      
      // 元數據
      createdAt: this.toDate(data['created_at']),
      createdBy: data['created_by'],
      updatedAt: this.toDate(data['updated_at']),
      updatedBy: data['updated_by'],
      deletedAt: data['deleted_at'] ? this.toDate(data['deleted_at']) : null,
      
      // 額外資訊
      tags: data['tags'] || [],
      notes: data['notes'],
      metadata: data['metadata']
    };
  }
  
  /**
   * ✅ 可選: 將 TypeScript 實體轉換為 Firestore DocumentData
   * 
   * 重要: 移除 undefined 值，Firestore 不接受 undefined
   */
  protected override toDocument(contract: Partial<Contract>): DocumentData {
    const doc: DocumentData = {};
    
    // 只添加有值的欄位
    if (contract.blueprintId) doc['blueprint_id'] = contract.blueprintId;
    if (contract.title) doc['title'] = contract.title;
    if (contract.contractNumber) doc['contract_number'] = contract.contractNumber;
    if (contract.contractType) doc['contract_type'] = contract.contractType.toUpperCase();
    if (contract.description !== undefined) doc['description'] = contract.description;
    
    // 契約方資訊
    if (contract.partyA) doc['party_a'] = this.partyToDocument(contract.partyA);
    if (contract.partyB) doc['party_b'] = this.partyToDocument(contract.partyB);
    if (contract.partyC) doc['party_c'] = this.partyToDocument(contract.partyC);
    
    // 金額與條款
    if (contract.totalAmount !== undefined) doc['total_amount'] = contract.totalAmount;
    if (contract.paidAmount !== undefined) doc['paid_amount'] = contract.paidAmount;
    if (contract.currency) doc['currency'] = contract.currency;
    if (contract.paymentTerms !== undefined) doc['payment_terms'] = contract.paymentTerms;
    
    // 時程資訊
    if (contract.startDate) doc['start_date'] = Timestamp.fromDate(contract.startDate);
    if (contract.endDate) doc['end_date'] = Timestamp.fromDate(contract.endDate);
    if (contract.effectiveDate) doc['effective_date'] = Timestamp.fromDate(contract.effectiveDate);
    if (contract.signedDate) doc['signed_date'] = Timestamp.fromDate(contract.signedDate);
    
    // 狀態
    if (contract.status) doc['status'] = contract.status.toUpperCase();
    if (contract.version !== undefined) doc['version'] = contract.version;
    if (contract.previousVersionId) doc['previous_version_id'] = contract.previousVersionId;
    
    // 附件與文件
    if (contract.attachments) doc['attachments'] = contract.attachments;
    if (contract.originalFileUrl) doc['original_file_url'] = contract.originalFileUrl;
    if (contract.parsedData) doc['parsed_data'] = contract.parsedData;
    
    // 審核資訊
    if (contract.approvalStatus) doc['approval_status'] = contract.approvalStatus;
    if (contract.approvalHistory) doc['approval_history'] = contract.approvalHistory;
    
    // 額外資訊
    if (contract.tags) doc['tags'] = contract.tags;
    if (contract.notes !== undefined) doc['notes'] = contract.notes;
    if (contract.metadata) doc['metadata'] = contract.metadata;
    
    return doc;
  }
  
  // ===== 輔助方法 =====
  
  private toDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp?.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }
  
  private mapStatus(status: string): ContractStatus {
    const normalized = status?.toUpperCase();
    switch (normalized) {
      case 'DRAFT': return 'draft';
      case 'UNDER_REVIEW': return 'under_review';
      case 'ACTIVE': return 'active';
      case 'COMPLETED': return 'completed';
      case 'TERMINATED': return 'terminated';
      case 'SUSPENDED': return 'suspended';
      default: return 'draft';
    }
  }
  
  private mapContractType(type: string): ContractType {
    const normalized = type?.toLowerCase();
    switch (normalized) {
      case 'main_contract': return 'main_contract';
      case 'sub_contract': return 'sub_contract';
      case 'supplement': return 'supplement';
      case 'change_order': return 'change_order';
      default: return 'other';
    }
  }
  
  private mapParty(data: any): any {
    if (!data) return null;
    return {
      id: data['id'] || data['id'],
      name: data['name'],
      type: data['type'],
      contactPerson: data['contact_person'] || data['contactPerson'],
      phone: data['phone'],
      email: data['email'],
      address: data['address']
    };
  }
  
  private partyToDocument(party: any): any {
    return {
      id: party.id,
      name: party.name,
      type: party.type,
      contact_person: party.contactPerson,
      phone: party.phone,
      email: party.email,
      address: party.address
    };
  }
  
  // ===== 業務查詢方法 =====
  
  /**
   * 依 Blueprint ID 查詢合約（不含已刪除）
   */
  async findByBlueprintId(blueprintId: string): Promise<Contract[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        collection(this.firebaseService.db, this.collectionName),
        where('blueprint_id', '==', blueprintId),
        where('deleted_at', '==', null),
        orderBy('created_at', 'desc')
      );
      return this.queryDocuments(q);
    });
  }
  
  /**
   * 依狀態查詢合約
   */
  async findByStatus(
    blueprintId: string, 
    status: ContractStatus
  ): Promise<Contract[]> {
    return this.executeWithRetry(async () => {
      const q = query(
        collection(this.firebaseService.db, this.collectionName),
        where('blueprint_id', '==', blueprintId),
        where('status', '==', status.toUpperCase()),
        where('deleted_at', '==', null),
        orderBy('created_at', 'desc')
      );
      return this.queryDocuments(q);
    });
  }
  
  /**
   * 依 ID 查詢單一合約
   */
  async findById(id: string): Promise<Contract | null> {
    return this.executeWithRetry(async () => {
      return this.getDocument(id);
    });
  }
  
  /**
   * 建立合約
   */
  async create(contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Contract> {
    return this.executeWithRetry(async () => {
      return this.createDocument(contract);
    });
  }
  
  /**
   * 更新合約
   */
  async update(id: string, contract: Partial<Contract>): Promise<Contract> {
    return this.executeWithRetry(async () => {
      return this.updateDocument(id, contract);
    });
  }
  
  /**
   * 刪除合約（軟刪除）
   */
  async delete(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      return this.deleteDocument(id, false);  // false = 軟刪除
    });
  }
}
```

**✅ 檢查清單**:
- [ ] Repository 繼承 `FirestoreBaseRepository<Contract>`
- [ ] 實作 `collectionName`
- [ ] 實作 `toEntity` (Firestore → TypeScript)
- [ ] 實作 `toDocument` (TypeScript → Firestore)
- [ ] 所有查詢使用 `executeWithRetry`
- [ ] 欄位命名: Firestore 用 snake_case，TypeScript 用 camelCase
- [ ] 處理 Timestamp 轉換
- [ ] 處理 null vs undefined
- [ ] 軟刪除使用 `deleted_at` 欄位

---

### Phase 3: Service/Facade 實作 (Business Layer)

#### 步驟 3.1: 更新 ContractFacade

**檔案**: `src/app/routes/blueprint/modules/contract/services/contract.facade.ts`

**現有實作** (簡化版):
```typescript
@Injectable({ providedIn: 'root' })
export class ContractFacade {
  private readonly repository = inject(ContractRepository);
  private readonly contracts = signal<ContractModel[]>([]);
  private readonly loading = signal(false);

  readonly contractsState = {
    data: this.contracts.asReadonly(),
    loading: this.loading.asReadonly()
  };

  ensureLoaded(blueprintId: Signal<string>): void {
    effect(() => {
      const id = blueprintId();
      void this.loadByBlueprint(id);
    }, { allowSignalWrites: true });
  }

  async loadByBlueprint(blueprintId: string): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.repository.findByBlueprintId(blueprintId);
      this.contracts.set(result);
    } finally {
      this.loading.set(false);
    }
  }
}
```

**完整實作** (包含錯誤處理、事件、權限):

```typescript
import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { ContractRepository } from '../data-access/repositories/contract.repository';
import { Contract, ContractStatus } from '../data-access/models/contract.model';
import { BlueprintEventBus } from '@core/services/blueprint-event-bus.service';
import { PermissionService } from '@core/services/permission.service';

@Injectable({ providedIn: 'root' })
export class ContractFacade {
  private readonly repository = inject(ContractRepository);
  private readonly eventBus = inject(BlueprintEventBus);
  private readonly permissionService = inject(PermissionService);
  
  // ===== Private Signals =====
  private readonly _contracts = signal<Contract[]>([]);
  private readonly _selectedContract = signal<Contract | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  
  // ===== Public Readonly Signals =====
  readonly contracts = this._contracts.asReadonly();
  readonly selectedContract = this._selectedContract.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  
  // ===== Computed Signals =====
  readonly contractsByStatus = computed(() => {
    const contracts = this._contracts();
    return {
      draft: contracts.filter(c => c.status === 'draft'),
      underReview: contracts.filter(c => c.status === 'under_review'),
      active: contracts.filter(c => c.status === 'active'),
      completed: contracts.filter(c => c.status === 'completed'),
      terminated: contracts.filter(c => c.status === 'terminated'),
      suspended: contracts.filter(c => c.status === 'suspended')
    };
  });
  
  readonly totalAmount = computed(() => {
    return this._contracts().reduce((sum, c) => sum + c.totalAmount, 0);
  });
  
  readonly paidAmount = computed(() => {
    return this._contracts().reduce((sum, c) => sum + c.paidAmount, 0);
  });
  
  readonly statistics = computed(() => {
    const contracts = this._contracts();
    const total = contracts.length;
    const byStatus = this.contractsByStatus();
    
    return {
      total,
      draft: byStatus.draft.length,
      underReview: byStatus.underReview.length,
      active: byStatus.active.length,
      completed: byStatus.completed.length,
      terminated: byStatus.terminated.length,
      suspended: byStatus.suspended.length,
      totalAmount: this.totalAmount(),
      paidAmount: this.paidAmount(),
      completionRate: total > 0 ? Math.round((byStatus.completed.length / total) * 100) : 0
    };
  });
  
  // ===== Actions =====
  
  /**
   * 載入 Blueprint 的所有合約
   */
  async loadContracts(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const contracts = await this.repository.findByBlueprintId(blueprintId);
      this._contracts.set(contracts);
    } catch (error) {
      const message = this.getErrorMessage(error);
      this._error.set(message);
      console.error('[ContractFacade] Failed to load contracts:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }
  
  /**
   * 建立新合約
   */
  async createContract(
    blueprintId: string, 
    contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Promise<Contract> {
    // ✅ 權限檢查
    if (!this.permissionService.hasPermission(blueprintId, 'contract:create')) {
      throw new Error('沒有建立合約的權限');
    }
    
    try {
      const created = await this.repository.create(contract);
      
      // ✅ 更新本地狀態
      this._contracts.update(contracts => [...contracts, created]);
      
      // ✅ 發布事件
      this.eventBus.publish({
        type: 'contract.created',
        blueprintId,
        timestamp: new Date(),
        actor: 'current-user-id', // TODO: 從 AuthService 獲取
        data: created
      });
      
      return created;
    } catch (error) {
      const message = this.getErrorMessage(error);
      this._error.set(message);
      console.error('[ContractFacade] Failed to create contract:', error);
      throw error;
    }
  }
  
  /**
   * 更新合約
   */
  async updateContract(id: string, updates: Partial<Contract>): Promise<void> {
    const contract = this._contracts().find(c => c.id === id);
    if (!contract) {
      throw new Error('找不到合約');
    }
    
    // ✅ 權限檢查
    if (!this.permissionService.hasPermission(contract.blueprintId, 'contract:update')) {
      throw new Error('沒有更新合約的權限');
    }
    
    try {
      const updated = await this.repository.update(id, updates);
      
      // ✅ 更新本地狀態
      this._contracts.update(contracts =>
        contracts.map(c => c.id === id ? updated : c)
      );
      
      // ✅ 更新選中的合約
      if (this._selectedContract()?.id === id) {
        this._selectedContract.set(updated);
      }
      
      // ✅ 發布事件
      this.eventBus.publish({
        type: 'contract.updated',
        blueprintId: contract.blueprintId,
        timestamp: new Date(),
        actor: 'current-user-id',
        data: updated
      });
    } catch (error) {
      const message = this.getErrorMessage(error);
      this._error.set(message);
      console.error('[ContractFacade] Failed to update contract:', error);
      throw error;
    }
  }
  
  /**
   * 刪除合約（軟刪除）
   */
  async deleteContract(id: string): Promise<void> {
    const contract = this._contracts().find(c => c.id === id);
    if (!contract) {
      throw new Error('找不到合約');
    }
    
    // ✅ 權限檢查
    if (!this.permissionService.hasPermission(contract.blueprintId, 'contract:delete')) {
      throw new Error('沒有刪除合約的權限');
    }
    
    try {
      await this.repository.delete(id);
      
      // ✅ 更新本地狀態
      this._contracts.update(contracts => contracts.filter(c => c.id !== id));
      
      // ✅ 清除選中狀態
      if (this._selectedContract()?.id === id) {
        this._selectedContract.set(null);
      }
      
      // ✅ 發布事件
      this.eventBus.publish({
        type: 'contract.deleted',
        blueprintId: contract.blueprintId,
        timestamp: new Date(),
        actor: 'current-user-id',
        data: { id }
      });
    } catch (error) {
      const message = this.getErrorMessage(error);
      this._error.set(message);
      console.error('[ContractFacade] Failed to delete contract:', error);
      throw error;
    }
  }
  
  /**
   * 選擇合約
   */
  selectContract(id: string): void {
    const contract = this._contracts().find(c => c.id === id);
    this._selectedContract.set(contract || null);
  }
  
  /**
   * 清除錯誤
   */
  clearError(): void {
    this._error.set(null);
  }
  
  /**
   * 重置狀態
   */
  reset(): void {
    this._contracts.set([]);
    this._selectedContract.set(null);
    this._loading.set(false);
    this._error.set(null);
  }
  
  // ===== 輔助方法 =====
  
  private getErrorMessage(error: any): string {
    if (error instanceof Error) {
      // Firestore 錯誤處理
      if (error.message.includes('permission-denied')) {
        return '沒有存取權限';
      }
      if (error.message.includes('not-found')) {
        return '找不到資料';
      }
      if (error.message.includes('unavailable')) {
        return '服務暫時無法使用，請稍後再試';
      }
      return error.message;
    }
    return '未知錯誤';
  }
}
```

**✅ 檢查清單**:
- [ ] Facade 注入 Repository, EventBus, PermissionService
- [ ] 使用 private writable signals 和 public readonly signals
- [ ] 實作 computed signals (contractsByStatus, statistics)
- [ ] 所有操作包含權限檢查
- [ ] 所有操作包含錯誤處理
- [ ] 所有操作發布對應事件
- [ ] 提供友善的錯誤訊息

---

### Phase 4: UI 元件實作 (Presentation Layer)

#### 步驟 4.1: 更新 ContractListComponent

**檔案**: `src/app/routes/blueprint/modules/contract/components/contract-list.component.ts`

```typescript
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_IMPORTS } from '@shared';
import { STColumn, STModule } from '@delon/abc/st';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ContractFacade } from '../services/contract.facade';
import { Contract, ContractStatus } from '../data-access/models/contract.model';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [
    SHARED_IMPORTS,
    STModule,
    NzButtonModule,
    NzCardModule,
    NzStatisticModule,
    NzSelectModule,
    NzInputModule
  ],
  template: `
    <nz-card>
      <!-- 統計卡片 -->
      <div class="stats-row" style="display: flex; gap: 16px; margin-bottom: 16px;">
        <nz-statistic 
          [nzValue]="statistics().total" 
          nzTitle="總合約數">
        </nz-statistic>
        <nz-statistic 
          [nzValue]="statistics().totalAmount" 
          nzTitle="合約總額"
          nzPrefix="$">
        </nz-statistic>
        <nz-statistic 
          [nzValue]="statistics().completionRate" 
          nzTitle="完成率"
          nzSuffix="%">
        </nz-statistic>
      </div>
      
      <!-- 篩選與搜尋 -->
      <div class="toolbar" style="display: flex; gap: 16px; margin-bottom: 16px;">
        <nz-input-group nzSearch style="flex: 1;">
          <input 
            nz-input 
            [(ngModel)]="searchText"
            (ngModelChange)="onSearchChange()"
            placeholder="搜尋合約編號、標題..."
          />
        </nz-input-group>
        
        <nz-select 
          [(ngModel)]="statusFilter"
          (ngModelChange)="onFilterChange()"
          placeholder="選擇狀態"
          style="width: 150px;">
          <nz-option nzValue="all" nzLabel="全部"></nz-option>
          <nz-option nzValue="draft" nzLabel="草稿"></nz-option>
          <nz-option nzValue="under_review" nzLabel="審核中"></nz-option>
          <nz-option nzValue="active" nzLabel="生效中"></nz-option>
          <nz-option nzValue="completed" nzLabel="已完成"></nz-option>
        </nz-select>
        
        <button 
          nz-button 
          nzType="primary"
          (click)="openCreateModal()">
          <i nz-icon nzType="plus"></i>
          新增合約
        </button>
      </div>
      
      <!-- 錯誤訊息 -->
      @if (facade.error(); as errorMsg) {
        <nz-alert 
          nzType="error" 
          [nzMessage]="errorMsg"
          nzShowIcon
          nzCloseable
          (nzOnClose)="facade.clearError()"
          style="margin-bottom: 16px;">
        </nz-alert>
      }
      
      <!-- 合約表格 -->
      <st 
        [data]="filteredContracts()"
        [columns]="columns"
        [loading]="facade.loading()"
        [page]="{ show: true, showSize: true }"
        (change)="handleTableChange($event)">
      </st>
    </nz-card>
  `
})
export class ContractListComponent {
  readonly facade = inject(ContractFacade);
  readonly router = inject(Router);
  
  // ✅ 使用 input() 接收 blueprintId
  readonly blueprintId = input.required<string>();
  
  // ✅ 本地 UI 狀態
  searchText = signal('');
  statusFilter = signal<string>('all');
  
  // ✅ Computed signals
  statistics = computed(() => this.facade.statistics());
  
  filteredContracts = computed(() => {
    let contracts = this.facade.contracts();
    
    // 狀態篩選
    const status = this.statusFilter();
    if (status !== 'all') {
      contracts = contracts.filter(c => c.status === status);
    }
    
    // 搜尋
    const search = this.searchText().toLowerCase();
    if (search) {
      contracts = contracts.filter(c => 
        c.title.toLowerCase().includes(search) ||
        c.contractNumber.toLowerCase().includes(search)
      );
    }
    
    return contracts;
  });
  
  // ✅ ST 表格欄位定義
  columns: STColumn[] = [
    { 
      title: '合約編號', 
      index: 'contractNumber', 
      width: 150,
      sort: { default: 'descend' }
    },
    { 
      title: '標題', 
      index: 'title',
      sort: true
    },
    { 
      title: '狀態', 
      index: 'status', 
      type: 'badge',
      width: 100,
      badge: {
        draft: { text: '草稿', color: 'default' },
        under_review: { text: '審核中', color: 'processing' },
        active: { text: '生效中', color: 'success' },
        completed: { text: '已完成', color: 'success' },
        terminated: { text: '已終止', color: 'error' },
        suspended: { text: '暫停', color: 'warning' }
      }
    },
    { 
      title: '合約總額', 
      index: 'totalAmount', 
      type: 'currency',
      width: 120,
      sort: true
    },
    { 
      title: '開始日期', 
      index: 'startDate', 
      type: 'date',
      width: 120,
      sort: true
    },
    { 
      title: '結束日期', 
      index: 'endDate', 
      type: 'date',
      width: 120,
      sort: true
    },
    {
      title: '操作',
      width: 200,
      buttons: [
        { 
          text: '查看', 
          icon: 'eye',
          click: (record: Contract) => this.viewContract(record) 
        },
        { 
          text: '編輯', 
          icon: 'edit',
          click: (record: Contract) => this.editContract(record),
          iif: (record: Contract) => record.status === 'draft'
        },
        { 
          text: '刪除', 
          icon: 'delete',
          type: 'del',
          click: (record: Contract) => this.deleteContract(record),
          pop: {
            title: '確定要刪除此合約嗎？',
            okType: 'danger'
          }
        }
      ]
    }
  ];
  
  // ✅ 生命週期
  constructor() {
    // 使用 effect 監聽 blueprintId 變化
    effect(() => {
      const blueprintId = this.blueprintId();
      if (blueprintId) {
        this.facade.loadContracts(blueprintId);
      }
    }, { allowSignalWrites: true });
  }
  
  // ===== 事件處理 =====
  
  onSearchChange(): void {
    // 搜尋會透過 computed signal 自動更新
  }
  
  onFilterChange(): void {
    // 篩選會透過 computed signal 自動更新
  }
  
  handleTableChange(event: any): void {
    console.log('Table change:', event);
  }
  
  viewContract(contract: Contract): void {
    this.router.navigate(['contracts', contract.id]);
  }
  
  editContract(contract: Contract): void {
    this.router.navigate(['contracts', contract.id, 'edit']);
  }
  
  async deleteContract(contract: Contract): Promise<void> {
    try {
      await this.facade.deleteContract(contract.id);
      // 成功訊息由 nz-message 顯示
    } catch (error) {
      // 錯誤已由 facade 處理並設定到 error signal
    }
  }
  
  openCreateModal(): void {
    // TODO: 開啟建立精靈或 Modal
    this.router.navigate(['contracts', 'new']);
  }
}
```

**✅ 檢查清單**:
- [ ] 使用 `input()` 接收參數
- [ ] 使用 `inject()` 注入服務
- [ ] 使用 Signals 管理本地狀態
- [ ] 使用 `computed()` 衍生狀態
- [ ] 使用 `effect()` 監聽變化
- [ ] 使用 `@if` / `@for` 新控制流
- [ ] ST 表格使用 `trackBy`
- [ ] 錯誤訊息顯示與清除
- [ ] 權限控制按鈕顯示

---

### Phase 5: Security Rules 實作與測試

#### 步驟 5.1: 更新 Security Rules

**檔案**: `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ===== 輔助函數 =====
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getCurrentUserId() {
      return request.auth.uid;
    }
    
    function isBlueprintMember(blueprintId) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      return exists(/databases/$(database)/documents/blueprintMembers/$(memberId));
    }
    
    function isMemberActive(blueprintId) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return member.data.status == 'active';
    }
    
    function hasPermission(blueprintId, permission) {
      let memberId = getCurrentUserId() + '_' + blueprintId;
      let member = get(/databases/$(database)/documents/blueprintMembers/$(memberId));
      return permission in member.data.permissions;
    }
    
    // ===== Contracts Collection =====
    
    match /contracts/{contractId} {
      // 讀取：Blueprint 活躍成員可讀取未刪除的合約
      allow read: if isAuthenticated() 
                     && isBlueprintMember(resource.data.blueprint_id)
                     && isMemberActive(resource.data.blueprint_id)
                     && resource.data.deleted_at == null;
      
      // 建立：有 contract:create 權限的活躍成員可建立
      allow create: if isAuthenticated() 
                       && isBlueprintMember(request.resource.data.blueprint_id)
                       && isMemberActive(request.resource.data.blueprint_id)
                       && hasPermission(request.resource.data.blueprint_id, 'contract:create')
                       && request.resource.data.blueprint_id is string
                       && request.resource.data.title is string
                       && request.resource.data.contract_number is string
                       && request.resource.data.status in ['DRAFT', 'UNDER_REVIEW'];
      
      // 更新：有 contract:update 權限或為建立者可更新
      allow update: if isAuthenticated() 
                       && isBlueprintMember(resource.data.blueprint_id)
                       && isMemberActive(resource.data.blueprint_id)
                       && (hasPermission(resource.data.blueprint_id, 'contract:update')
                           || resource.data.created_by == getCurrentUserId())
                       && request.resource.data.blueprint_id == resource.data.blueprint_id;
      
      // 刪除：有 contract:delete 權限可刪除
      allow delete: if isAuthenticated() 
                       && isBlueprintMember(resource.data.blueprint_id)
                       && isMemberActive(resource.data.blueprint_id)
                       && hasPermission(resource.data.blueprint_id, 'contract:delete');
    }
  }
}
```

#### 步驟 5.2: Security Rules 測試

**檔案**: `firestore.rules.spec.js` (建議位置: `tests/firestore.rules.spec.js`)

```javascript
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { readFileSync } = require('fs');

describe('Contract Security Rules', () => {
  let testEnv;
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'gighub-test',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  beforeEach(async () => {
    await testEnv.clearFirestore();
  });
  
  describe('Contract Read', () => {
    it('should allow authenticated blueprint member to read contract', async () => {
      const userId = 'user1';
      const blueprintId = 'blueprint1';
      
      // 設定測試資料
      await testEnv.withSecurityRulesDisabled(async (context) => {
        // 建立成員資格
        await context.firestore().doc(`blueprintMembers/${userId}_${blueprintId}`).set({
          blueprint_id: blueprintId,
          user_id: userId,
          role: 'member',
          status: 'active',
          permissions: ['contract:read']
        });
        
        // 建立合約
        await context.firestore().doc(`contracts/contract1`).set({
          blueprint_id: blueprintId,
          title: 'Test Contract',
          contract_number: 'C001',
          status: 'ACTIVE',
          deleted_at: null
        });
      });
      
      // 測試讀取
      const authenticatedContext = testEnv.authenticatedContext(userId);
      await assertSucceeds(
        authenticatedContext.firestore().doc('contracts/contract1').get()
      );
    });
    
    it('should deny unauthenticated user to read contract', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc('contracts/contract1').set({
          blueprint_id: 'blueprint1',
          title: 'Test Contract',
          status: 'ACTIVE'
        });
      });
      
      const unauthenticatedContext = testEnv.unauthenticatedContext();
      await assertFails(
        unauthenticatedContext.firestore().doc('contracts/contract1').get()
      );
    });
  });
  
  describe('Contract Create', () => {
    it('should allow member with contract:create permission to create', async () => {
      const userId = 'user1';
      const blueprintId = 'blueprint1';
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`blueprintMembers/${userId}_${blueprintId}`).set({
          blueprint_id: blueprintId,
          user_id: userId,
          role: 'member',
          status: 'active',
          permissions: ['contract:create']
        });
      });
      
      const authenticatedContext = testEnv.authenticatedContext(userId);
      await assertSucceeds(
        authenticatedContext.firestore().collection('contracts').add({
          blueprint_id: blueprintId,
          title: 'New Contract',
          contract_number: 'C002',
          status: 'DRAFT'
        })
      );
    });
    
    it('should deny member without contract:create permission', async () => {
      const userId = 'user1';
      const blueprintId = 'blueprint1';
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`blueprintMembers/${userId}_${blueprintId}`).set({
          blueprint_id: blueprintId,
          user_id: userId,
          role: 'viewer',
          status: 'active',
          permissions: ['contract:read']  // 沒有 create 權限
        });
      });
      
      const authenticatedContext = testEnv.authenticatedContext(userId);
      await assertFails(
        authenticatedContext.firestore().collection('contracts').add({
          blueprint_id: blueprintId,
          title: 'New Contract',
          contract_number: 'C002',
          status: 'DRAFT'
        })
      );
    });
  });
});
```

**執行測試**:
```bash
# 啟動 Firebase Emulator
firebase emulators:start --only firestore

# 在另一個終端執行測試
npm test firestore.rules.spec.js
```

---

## 🚨 常見陷阱與解決方案

### 1. ❌ 陷阱: 忘記處理 Timestamp 轉換

**錯誤**:
```typescript
// Firestore 返回 Timestamp 物件
const contract: Contract = {
  startDate: doc.data()['start_date']  // ❌ Timestamp 物件而非 Date
};
```

**正確**:
```typescript
private toDate(timestamp: any): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
}

const contract: Contract = {
  startDate: this.toDate(doc.data()['start_date'])  // ✅ 轉換為 Date
};
```

### 2. ❌ 陷阱: Firestore 不接受 undefined

**錯誤**:
```typescript
await updateDoc(docRef, {
  description: undefined  // ❌ Firestore 會報錯
});
```

**正確**:
```typescript
const updates: any = {};
if (description !== undefined) {
  updates.description = description;
}
await updateDoc(docRef, updates);
```

### 3. ❌ 陷阱: 沒有使用 executeWithRetry

**錯誤**:
```typescript
async findByBlueprintId(blueprintId: string): Promise<Contract[]> {
  const q = query(...);
  return this.queryDocuments(q);  // ❌ 網路錯誤會直接失敗
}
```

**正確**:
```typescript
async findByBlueprintId(blueprintId: string): Promise<Contract[]> {
  return this.executeWithRetry(async () => {  // ✅ 自動重試
    const q = query(...);
    return this.queryDocuments(q);
  });
}
```

### 4. ❌ 陷阱: UI 直接注入 Repository

**錯誤**:
```typescript
@Component({ ... })
export class ContractListComponent {
  private repository = inject(ContractRepository);  // ❌ 違反三層架構
}
```

**正確**:
```typescript
@Component({ ... })
export class ContractListComponent {
  readonly facade = inject(ContractFacade);  // ✅ 透過 Facade
}
```

### 5. ❌ 陷阱: 忘記檢查權限

**錯誤**:
```typescript
async deleteContract(id: string): Promise<void> {
  await this.repository.delete(id);  // ❌ 沒有權限檢查
}
```

**正確**:
```typescript
async deleteContract(id: string): Promise<void> {
  // ✅ 權限檢查
  if (!this.permissionService.hasPermission(blueprintId, 'contract:delete')) {
    throw new Error('沒有刪除權限');
  }
  await this.repository.delete(id);
}
```

---

## ✅ 最終檢查清單

### Repository Layer
- [ ] 繼承 `FirestoreBaseRepository<T>`
- [ ] 實作 `collectionName`
- [ ] 實作 `toEntity` (snake_case → camelCase)
- [ ] 實作 `toDocument` (camelCase → snake_case)
- [ ] 所有操作使用 `executeWithRetry`
- [ ] 處理 Timestamp 轉換
- [ ] 處理 undefined 值
- [ ] 軟刪除使用 `deleted_at`

### Service/Facade Layer
- [ ] 注入 Repository, EventBus, PermissionService
- [ ] 使用 Signals 管理狀態
- [ ] 實作 Computed Signals
- [ ] 所有操作包含權限檢查
- [ ] 所有操作包含錯誤處理
- [ ] 所有操作發布事件
- [ ] 提供友善錯誤訊息

### UI Layer
- [ ] 使用 `input()` / `output()`
- [ ] 使用 `inject()` 注入服務
- [ ] 使用 Signals 管理本地狀態
- [ ] 使用 `@if` / `@for` 新控制流
- [ ] 使用 OnPush 變更檢測
- [ ] ST 表格使用 `trackBy`
- [ ] 顯示載入與錯誤狀態
- [ ] 權限控制 UI 元素

### Security Rules
- [ ] Blueprint 成員資格檢查
- [ ] 權限陣列檢查
- [ ] 活躍狀態檢查
- [ ] 資料驗證規則
- [ ] 軟刪除過濾
- [ ] 單元測試覆蓋

---

## 📚 參考資源

### 專案文檔
- [design.md](./design.md) - 合約模組設計概覽
- [架構總覽](../../../../docs/architecture(架構)/01-architecture-overview.md)
- [三層架構](../../../../docs/architecture(架構)/02-three-layer-architecture.md)
- [Repository 模式](../../../../.github/instructions/ng-gighub-firestore-repository.instructions.md)
- [Signals 狀態管理](../../../../.github/instructions/ng-gighub-signals-state.instructions.md)

### Firebase 文檔
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Security Rules Testing](https://firebase.google.com/docs/rules/unit-tests)
- [Firebase Emulator](https://firebase.google.com/docs/emulator-suite)

---

**維護者**: GigHub 開發團隊  
**最後更新**: 2025-12-22  
**版本**: v1.0.0
