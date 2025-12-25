# SaaS 多租戶 DDD 架構設計

## 資料夾結構

```
src/
├── main.ts
├── index.html
├── styles/
│
├── app/
│   ├── app.component.ts
│   ├── app.config.ts
│   │
│   ├── core/                                    # 核心基礎設施
│   │   ├── auth/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── event-bus/                          # ✅ 事件總線（跨領域/跨租戶通訊）
│   │   │   ├── event-bus.service.ts
│   │   │   ├── domain-event.interface.ts
│   │   │   └── event-handlers/
│   │   └── multi-tenancy/                      # 多租戶基礎設施
│   │       ├── tenant-context.service.ts
│   │       ├── tenant-resolver.guard.ts
│   │       └── tenant-isolation.interceptor.ts
│   │
│   ├── shared/                                  # 共享層
│   │   ├── ui/
│   │   ├── utils/
│   │   ├── models/
│   │   └── types/
│   │
│   ├── domains/                                 # 領域層
│   │   │
│   │   ├── identity/                           # 身份識別領域（租戶管理）
│   │   │   ├── domain/
│   │   │   │   ├── aggregates/
│   │   │   │   │   ├── user.aggregate.ts
│   │   │   │   │   ├── organization.aggregate.ts
│   │   │   │   │   ├── team.aggregate.ts
│   │   │   │   │   └── partner.aggregate.ts
│   │   │   │   ├── entities/
│   │   │   │   │   ├── organization-member.entity.ts
│   │   │   │   │   ├── team-member.entity.ts
│   │   │   │   │   └── partner-member.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── email.vo.ts
│   │   │   │   │   ├── role.vo.ts
│   │   │   │   │   └── permission.vo.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── user-created.event.ts
│   │   │   │   │   ├── organization-created.event.ts
│   │   │   │   │   ├── team-created.event.ts
│   │   │   │   │   └── member-invited.event.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── permission.domain-service.ts
│   │   │   │   │   └── tenant-hierarchy.domain-service.ts
│   │   │   │   └── repositories/
│   │   │   │       ├── user.repository.interface.ts
│   │   │   │       ├── organization.repository.interface.ts
│   │   │   │       ├── team.repository.interface.ts
│   │   │   │       └── partner.repository.interface.ts
│   │   │   │
│   │   │   ├── application/
│   │   │   │   ├── commands/
│   │   │   │   │   ├── create-organization/
│   │   │   │   │   │   ├── create-organization.command.ts
│   │   │   │   │   │   ├── create-organization.handler.ts
│   │   │   │   │   │   └── create-organization.validator.ts
│   │   │   │   │   ├── create-team/
│   │   │   │   │   ├── invite-member/
│   │   │   │   │   └── assign-role/
│   │   │   │   ├── queries/
│   │   │   │   │   ├── get-organization-list/
│   │   │   │   │   ├── get-team-members/
│   │   │   │   │   └── get-user-permissions/
│   │   │   │   └── use-cases/
│   │   │   │       ├── setup-organization.use-case.ts
│   │   │   │       └── manage-team-hierarchy.use-case.ts
│   │   │   │
│   │   │   ├── infrastructure/
│   │   │   │   └── persistence/
│   │   │   │       ├── repositories/
│   │   │   │       │   ├── user.repository.ts
│   │   │   │       │   ├── organization.repository.ts
│   │   │   │       │   ├── team.repository.ts
│   │   │   │       │   └── partner.repository.ts
│   │   │   │       └── mappers/
│   │   │   │
│   │   │   └── presentation/
│   │   │       ├── pages/
│   │   │       │   ├── organization-dashboard.page.ts
│   │   │       │   ├── team-management.page.ts
│   │   │       │   └── partner-list.page.ts
│   │   │       ├── components/
│   │   │       ├── state/
│   │   │       │   ├── organization.store.ts
│   │   │       │   └── team.store.ts
│   │   │       └── routes/
│   │   │
│   │   └── blueprint/                          # 藍圖領域（容器管理）
│   │       ├── domain/
│   │       │   ├── aggregates/
│   │       │   │   └── blueprint-container.aggregate.ts
│   │       │   ├── entities/
│   │       │   │   ├── blueprint.entity.ts
│   │       │   │   ├── module-instance.entity.ts
│   │       │   │   └── module-connection.entity.ts
│   │       │   ├── value-objects/
│   │       │   │   ├── owner-info.vo.ts         # 擁有者資訊（用戶/組織）
│   │       │   │   ├── module-config.vo.ts
│   │       │   │   └── container-status.vo.ts
│   │       │   ├── events/
│   │       │   │   ├── container-created.event.ts
│   │       │   │   ├── module-enabled.event.ts
│   │       │   │   ├── module-disabled.event.ts
│   │       │   │   └── container-shared.event.ts
│   │       │   ├── services/
│   │       │   │   ├── ownership-validation.domain-service.ts
│   │       │   │   ├── module-lifecycle.domain-service.ts
│   │       │   │   └── resource-isolation.domain-service.ts
│   │       │   └── repositories/
│   │       │       ├── blueprint-container.repository.interface.ts
│   │       │       └── module-registry.repository.interface.ts
│   │       │
│   │       ├── application/
│   │       │   ├── commands/
│   │       │   │   ├── create-container/        # 只能用戶/組織建立
│   │       │   │   │   ├── create-container.command.ts
│   │       │   │   │   ├── create-container.handler.ts
│   │       │   │   │   └── ownership-validator.ts
│   │       │   │   ├── enable-module/
│   │       │   │   ├── configure-module/
│   │       │   │   └── share-container/         # 分享給團隊/夥伴
│   │       │   ├── queries/
│   │       │   │   ├── get-user-containers/
│   │       │   │   ├── get-organization-containers/
│   │       │   │   └── get-available-modules/
│   │       │   └── use-cases/
│   │       │       ├── initialize-container.use-case.ts
│   │       │       └── manage-module-lifecycle.use-case.ts
│   │       │
│   │       ├── infrastructure/
│   │       │   └── persistence/
│   │       │       ├── repositories/
│   │       │       │   ├── blueprint-container.repository.ts
│   │       │       │   └── module-registry.repository.ts
│   │       │       └── mappers/
│   │       │
│   │       └── presentation/
│   │           ├── pages/
│   │           │   ├── container-list.page.ts
│   │           │   ├── container-designer.page.ts
│   │           │   └── module-marketplace.page.ts
│   │           ├── components/
│   │           │   ├── container-card/
│   │           │   ├── module-selector/
│   │           │   └── ownership-badge/
│   │           ├── state/
│   │           │   └── blueprint.store.ts
│   │           └── routes/
│   │
│   ├── modules/                                 # 自包含功能模組
│   │   │
│   │   ├── acceptance/                         # 驗收模組
│   │   │   ├── domain/
│   │   │   │   ├── aggregates/
│   │   │   │   │   └── acceptance-request.aggregate.ts
│   │   │   │   ├── entities/
│   │   │   │   │   ├── inspection-item.entity.ts
│   │   │   │   │   └── acceptance-result.entity.ts
│   │   │   │   ├── value-objects/
│   │   │   │   ├── events/
│   │   │   │   │   ├── acceptance-submitted.event.ts
│   │   │   │   │   ├── acceptance-approved.event.ts
│   │   │   │   │   └── acceptance-rejected.event.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── acceptance-workflow.domain-service.ts
│   │   │   │   └── repositories/
│   │   │   │
│   │   │   ├── application/
│   │   │   │   ├── commands/
│   │   │   │   │   ├── submit-acceptance/
│   │   │   │   │   ├── approve-acceptance/
│   │   │   │   │   └── request-reinspection/
│   │   │   │   ├── queries/
│   │   │   │   │   ├── get-pending-acceptances/
│   │   │   │   │   └── get-acceptance-history/
│   │   │   │   └── use-cases/
│   │   │   │
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   └── integration/                # 模組間整合
│   │   │   │       └── event-handlers/
│   │   │   │           └── qa-defect-detected.handler.ts
│   │   │   │
│   │   │   └── presentation/
│   │   │       ├── pages/
│   │   │       ├── components/
│   │   │       ├── state/
│   │   │       └── routes/
│   │   │
│   │   ├── quality/                            # 品質管理模組
│   │   │   ├── domain/
│   │   │   │   ├── aggregates/
│   │   │   │   │   ├── inspection.aggregate.ts
│   │   │   │   │   └── defect.aggregate.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── defect-detected.event.ts    # 🔔 發送到事件總線
│   │   │   │   │   ├── inspection-completed.event.ts
│   │   │   │   │   └── defect-resolved.event.ts
│   │   │   │   └── repositories/
│   │   │   │
│   │   │   ├── application/
│   │   │   │   ├── commands/
│   │   │   │   │   ├── create-inspection/
│   │   │   │   │   ├── report-defect/
│   │   │   │   │   └── resolve-defect/
│   │   │   │   ├── queries/
│   │   │   │   └── use-cases/
│   │   │   │
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   └── integration/
│   │   │   │       └── event-handlers/
│   │   │   │           └── acceptance-approved.handler.ts  # 🎧 監聽其他模組事件
│   │   │   │
│   │   │   └── presentation/
│   │   │
│   │   ├── finance/                            # 財務模組
│   │   │   ├── domain/
│   │   │   │   ├── aggregates/
│   │   │   │   │   ├── invoice.aggregate.ts
│   │   │   │   │   ├── payment.aggregate.ts
│   │   │   │   │   └── budget.aggregate.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── invoice-generated.event.ts
│   │   │   │   │   ├── payment-approved.event.ts
│   │   │   │   │   └── budget-exceeded.event.ts
│   │   │   │   └── repositories/
│   │   │   │
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   │   └── integration/
│   │   │   │       └── event-handlers/
│   │   │   │           └── acceptance-completed.handler.ts  # 驗收完成→生成發票
│   │   │   │
│   │   │   └── presentation/
│   │   │
│   │   ├── material/                           # 物料模組
│   │   │   ├── domain/
│   │   │   │   ├── aggregates/
│   │   │   │   │   ├── material-stock.aggregate.ts
│   │   │   │   │   └── material-request.aggregate.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── material-requested.event.ts
│   │   │   │   │   ├── stock-depleted.event.ts
│   │   │   │   │   └── material-issued.event.ts
│   │   │   │   └── repositories/
│   │   │   │
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   │
│   │   ├── warranty/                           # 保固模組
│   │   │   ├── domain/
│   │   │   │   ├── aggregates/
│   │   │   │   │   ├── warranty-case.aggregate.ts
│   │   │   │   │   └── warranty-repair.aggregate.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── warranty-claimed.event.ts
│   │   │   │   │   └── repair-completed.event.ts
│   │   │   │   └── repositories/
│   │   │   │
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   │   └── integration/
│   │   │   │       └── event-handlers/
│   │   │   │           └── defect-detected.handler.ts  # QA 缺陷→自動建立保固案件
│   │   │   │
│   │   │   └── presentation/
│   │   │
│   │   ├── safety/                             # 安全模組
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   │
│   │   ├── tasks/                              # 任務模組
│   │   │   ├── domain/
│   │   │   │   ├── aggregates/
│   │   │   │   │   └── task.aggregate.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── task-created.event.ts
│   │   │   │   │   ├── task-assigned.event.ts
│   │   │   │   │   └── task-completed.event.ts
│   │   │   │   └── repositories/
│   │   │   │
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   │
│   │   ├── communication/                      # 溝通模組
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   │   └── integration/
│   │   │   │       └── event-handlers/
│   │   │   │           ├── task-assigned.handler.ts        # 任務分配→發送通知
│   │   │   │           ├── defect-detected.handler.ts      # 缺陷→推播通知
│   │   │   │           └── payment-approved.handler.ts     # 付款→通知相關人員
│   │   │   │
│   │   │   └── presentation/
│   │   │
│   │   ├── cloud-storage/                      # 雲端儲存模組
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   │
│   │   ├── weather/                            # 天氣模組
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   │
│   │   ├── diary/                              # 日誌模組
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── presentation/
│   │   │
│   │   └── audit-logs/                         # 審計日誌模組
│   │       ├── domain/
│   │       ├── application/
│   │       ├── infrastructure/
│   │       │   └── integration/
│   │       │       └── event-handlers/
│   │       │           └── all-events.handler.ts  # 🎧 監聽所有領域事件
│   │       │
│   │       └── presentation/
│   │
│   ├── cross-cutting/                          # 橫切關注點
│   │   ├── event-bus/
│   │   │   ├── handlers/
│   │   │   │   └── global-event-logger.ts
│   │   │   └── middleware/
│   │   │       ├── tenant-filter.middleware.ts
│   │   │       └── event-persistence.middleware.ts
│   │   │
│   │   ├── caching/
│   │   ├── validation/
│   │   └── localization/
│   │
│   └── features/                               # 跨領域功能
│       ├── dashboard/
│       ├── reporting/
│       └── search/
│
├── assets/
└── environments/
```

---

## 核心設計決策

### 1. **租戶層級架構**

```
用戶 (User)
  └── 組織 (Organization) ─────┐
        ├── 團隊 (Team)         │  可建立藍圖容器
        └── 夥伴 (Partner)      │
                                ↓
                    藍圖邏輯容器 (Blueprint Container)
                                ↓
                    模組實例 (Module Instances)
```

### 2. **✅ 需要事件總線 (Event Bus)**

#### **原因：**

1. **模組間解耦**
   - Quality 模組偵測缺陷 → Warranty 自動建立保固案件
   - Acceptance 驗收完成 → Finance 自動生成發票
   - Task 分配任務 → Communication 發送通知

2. **跨租戶通訊**
   - 組織分享容器給團隊/夥伴時的權限變更通知
   - 多租戶資料隔離與事件路由

3. **審計追蹤**
   - Audit Logs 模組監聽所有領域事件
   - 合規性要求與系統追蹤

4. **擴展性**
   - 新增模組無需修改現有模組
   - 支援未來整合第三方服務

#### **事件總線實作位置：**
```
core/
  └── event-bus/
      ├── event-bus.service.ts          # 核心服務
      ├── domain-event.interface.ts     # 事件介面
      ├── event-metadata.ts             # 租戶/容器元數據
      └── middleware/
          ├── tenant-filter.middleware.ts    # 租戶隔離
          └── event-persistence.middleware.ts # 事件持久化
```

---

### 3. **藍圖容器所有權規則**

```typescript
// blueprint/domain/value-objects/owner-info.vo.ts

export class OwnerInfo {
  constructor(
    public readonly ownerType: 'USER' | 'ORGANIZATION',
    public readonly ownerId: string,
    public readonly ownerName: string
  ) {}

  // 只有用戶或組織可以建立容器
  static canCreateContainer(ownerType: string): boolean {
    return ownerType === 'USER' || ownerType === 'ORGANIZATION';
  }

  // 團隊和夥伴只能被分享容器
  canShareToTeam(): boolean {
    return this.ownerType === 'ORGANIZATION';
  }

  canShareToPartner(): boolean {
    return this.ownerType === 'ORGANIZATION';
  }
}
```

---

### 4. **事件流範例**

```typescript
// Quality 模組偵測缺陷
class DefectDetectedEvent {
  constructor(
    public readonly defectId: string,
    public readonly severity: 'HIGH' | 'MEDIUM' | 'LOW',
    public readonly containerId: string,
    public readonly tenantId: string,  // 🔑 租戶隔離
    public readonly timestamp: Date
  ) {}
}

// Warranty 模組監聽並自動建立保固案件
@Injectable()
export class DefectDetectedHandler {
  constructor(
    private warrantyService: WarrantyService,
    private eventBus: EventBusService
  ) {
    this.eventBus.subscribe(DefectDetectedEvent, this.handle.bind(this));
  }

  async handle(event: DefectDetectedEvent): Promise<void> {
    if (event.severity === 'HIGH') {
      await this.warrantyService.createWarrantyCase({
        defectId: event.defectId,
        containerId: event.containerId,
        type: 'AUTO_GENERATED'
      });
    }
  }
}
```

---

### 5. **模組自包含原則**

每個模組必須：
- ✅ 獨立的 Domain 層（聚合根、實體、值對象）
- ✅ 獨立的 Repository 實作
- ✅ 獨立的 UI 組件與路由
- ✅ 透過事件總線與其他模組通訊
- ✅ 可單獨啟用/停用（透過藍圖容器配置）

---

### 6. **租戶資料隔離策略**

```typescript
// core/multi-tenancy/tenant-context.service.ts

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private currentTenant$ = new BehaviorSubject<TenantInfo | null>(null);

  setTenant(ownerType: OwnerType, ownerId: string): void {
    this.currentTenant$.next({ ownerType, ownerId });
  }

  getTenant(): TenantInfo | null {
    return this.currentTenant$.value;
  }

  // 驗證容器訪問權限
  canAccessContainer(container: BlueprintContainer): boolean {
    const tenant = this.getTenant();
    return container.hasAccess(tenant.ownerType, tenant.ownerId);
  }
}
```

---

## 關鍵優勢

1. **清晰的所有權模型**
   - 用戶/組織建立容器
   - 團隊/夥伴被授予訪問權

2. **模組完全解耦**
   - 每個模組可獨立開發、測試、部署
   - 透過事件總線通訊

3. **多租戶資料隔離**
   - 每個查詢/命令都帶租戶上下文
   - Database-per-Tenant 或 Row-Level Security

4. **靈活的模組組合**
   - 容器可自由組合啟用的模組
   - 支援不同租戶不同模組配置

5. **易於擴展**
   - 新增模組無需修改核心架構
   - 事件驅動架構支援微服務化遷移
