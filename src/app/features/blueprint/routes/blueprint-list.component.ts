import { Component, OnInit, inject, effect, computed, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { Blueprint, BlueprintStatus, LoggerService, AuthFacade, OwnerType, ContextType } from '@core';
import { STChange, STColumn, STData } from '@delon/abc/st';
import { ModalHelper } from '@delon/theme';
import { SHARED_IMPORTS, createAsyncArrayState, WorkspaceContextService } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { firstValueFrom, Subject, debounceTime } from 'rxjs';

import { BlueprintFeatureService } from '../services/blueprint.service';

/**
 * Blueprint List Component
 * 藍圖列表元件 - 顯示使用者的所有藍圖
 *
 * Features:
 * - Display blueprints in ST table
 * - Filter by status
 * - Create new blueprint
 * - Navigate to detail
 * - Expandable rows for secondary information
 *
 * ✅ Modernized with AsyncState pattern
 * ✅ OnPush change detection for optimal performance
 * ✅ Debounced search (300ms) for better UX and performance
 * ✅ Signal-based reactive filtering
 * ✅ Expandable rows for secondary fields (dates, budget, modules)
 */
@Component({
  selector: 'app-blueprint-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzSpaceModule, NzStatisticModule, NzInputModule, NzDescriptionsModule],
  template: `
    <page-header [title]="'藍圖列表'" [action]="action">
      <ng-template #action>
        <nz-space>
          <button *nzSpaceItem nz-button (click)="refresh()">
            <span nz-icon nzType="reload"></span>
            重新整理
          </button>
          <button *nzSpaceItem nz-button nzType="primary" (click)="create()">
            <span nz-icon nzType="plus"></span>
            建立藍圖
          </button>
        </nz-space>
      </ng-template>
    </page-header>

    @if (blueprintsState.error()) {
      <nz-alert
        nzType="error"
        nzShowIcon
        [nzMessage]="'載入失敗'"
        [nzDescription]="blueprintsState.error()?.message || '無法載入藍圖列表'"
        class="mb-md"
      />
    }

    <!-- Statistics Cards -->
    @if (!blueprintsState.loading()) {
      <nz-row [nzGutter]="16" class="mb-md">
        <nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
          <nz-card>
            <nz-statistic [nzValue]="stats().total" nzTitle="總數" [nzPrefix]="totalPrefixTpl" />
            <ng-template #totalPrefixTpl>
              <span nz-icon nzType="project" nzTheme="outline"></span>
            </ng-template>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
          <nz-card>
            <nz-statistic [nzValue]="stats().active" nzTitle="啟用中" [nzValueStyle]="{ color: '#52c41a' }" [nzPrefix]="activePrefixTpl" />
            <ng-template #activePrefixTpl>
              <span nz-icon nzType="check-circle" nzTheme="outline"></span>
            </ng-template>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
          <nz-card>
            <nz-statistic [nzValue]="stats().draft" nzTitle="草稿" [nzValueStyle]="{ color: '#1890ff' }" [nzPrefix]="draftPrefixTpl" />
            <ng-template #draftPrefixTpl>
              <span nz-icon nzType="edit" nzTheme="outline"></span>
            </ng-template>
          </nz-card>
        </nz-col>
        <nz-col [nzXs]="12" [nzSm]="12" [nzMd]="6">
          <nz-card>
            <nz-statistic
              [nzValue]="stats().archived"
              nzTitle="已封存"
              [nzValueStyle]="{ color: '#d9d9d9' }"
              [nzPrefix]="archivedPrefixTpl"
            />
            <ng-template #archivedPrefixTpl>
              <span nz-icon nzType="inbox" nzTheme="outline"></span>
            </ng-template>
          </nz-card>
        </nz-col>
      </nz-row>
    }

    <nz-card>
      <!-- Filter Section -->
      <div class="mb-md" style="display: flex; gap: 8px; flex-wrap: wrap;">
        <nz-input-group [nzPrefix]="searchPrefix" style="width: 250px;">
          <input nz-input placeholder="搜尋藍圖..." [value]="searchText()" (input)="onSearchChange($any($event.target).value)" />
        </nz-input-group>
        <ng-template #searchPrefix>
          <span nz-icon nzType="search"></span>
        </ng-template>

        <nz-select
          [ngModel]="filterStatus()"
          (ngModelChange)="onStatusFilterChange($event)"
          nzPlaceHolder="篩選狀態"
          nzAllowClear
          style="width: 150px"
        >
          <nz-option nzLabel="全部" [nzValue]="null"></nz-option>
          <nz-option nzLabel="草稿" nzValue="draft"></nz-option>
          <nz-option nzLabel="啟用" nzValue="active"></nz-option>
          <nz-option nzLabel="封存" nzValue="archived"></nz-option>
        </nz-select>
      </div>

      <!-- Table -->
      <st
        #st
        [data]="filteredBlueprints()"
        [columns]="columns"
        [loading]="blueprintsState.loading()"
        [page]="{ show: true, showSize: true }"
        [expand]="expandTpl"
        [expandRowByClick]="false"
        [expandAccordion]="true"
        (change)="onChange($event)"
      ></st>

      <!-- Expand Row Template for Secondary Information -->
      <ng-template #expandTpl let-item let-index="index">
        <nz-descriptions [nzColumn]="{ xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 }" nzBordered [nzSize]="'small'">
          <nz-descriptions-item nzTitle="開始日期">
            {{ formatDateValue(getMetadataDate(item, ['startDate', 'start', 'plannedStart'])) }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="預計完成日">
            {{ formatDateValue(getMetadataDate(item, ['dueDate', 'endDate', 'plannedEnd'])) }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="建立時間">
            {{ formatDateValue(item.createdAt) }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="啟用模組">
            {{ item.enabledModules ? item.enabledModules.length + '/5' : '0/5' }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="預算">
            {{ formatCurrency(getMetadataNumber(item, ['budget', 'budgetAmount'])) }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="已花費">
            {{ formatCurrency(getMetadataNumber(item, ['spent', 'cost', 'actualCost'])) }}
          </nz-descriptions-item>
        </nz-descriptions>
      </ng-template>
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class BlueprintListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly modal = inject(ModalHelper);
  private readonly message = inject(NzMessageService);
  private readonly logger = inject(LoggerService);
  private readonly blueprintService = inject(BlueprintFeatureService);
  private readonly authService = inject(AuthFacade);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly destroyRef = inject(DestroyRef);

  // ✅ Modern Pattern: Use AsyncState
  readonly blueprintsState = createAsyncArrayState<Blueprint>([]);

  // ✅ Signal-based reactive state
  readonly filterStatus = signal<BlueprintStatus | null>(null);
  readonly searchText = signal('');

  // ✅ Debounced search subject
  private searchSubject = new Subject<string>();

  // ✅ Modern Pattern: Separate auth state for guards
  private readonly authenticated = this.workspaceContext.isAuthenticated;
  private readonly contextType = this.workspaceContext.contextType;
  private readonly contextId = this.workspaceContext.contextId;

  // ✅ Computed: Stats
  readonly stats = computed(() => {
    const data = this.blueprintsState.data() || [];
    return {
      total: data.length,
      active: data.filter(b => b.status === 'active').length,
      draft: data.filter(b => b.status === 'draft').length,
      archived: data.filter(b => b.status === 'archived').length
    };
  });

  // ✅ Computed: Filtered blueprints with reactive signals
  readonly filteredBlueprints = computed(() => {
    let data = this.blueprintsState.data() || [];

    // Filter by status (reactive)
    const status = this.filterStatus();
    if (status) {
      data = data.filter(b => b.status === status);
    }

    // Filter by search text (reactive, debounced)
    const search = this.searchText();
    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter(
        b =>
          b.name.toLowerCase().includes(searchLower) ||
          b.slug.toLowerCase().includes(searchLower) ||
          (b.description && b.description.toLowerCase().includes(searchLower))
      );
    }

    return data;
  });

  // ✅ Computed: Logic separation - determine if we should load
  private readonly shouldLoadBlueprints = computed(() => {
    const isAuth = this.authenticated();
    const type = this.contextType();
    const id = this.contextId();

    // Must be authenticated
    if (!isAuth) {
      return false;
    }

    // For non-USER contexts, require contextId
    if (type !== ContextType.USER && !id) {
      return false;
    }

    return true;
  });

  constructor() {
    // ✅ Effect: Only handle side effects, logic is in computed
    effect(() => {
      if (this.shouldLoadBlueprints()) {
        this.loadBlueprints();
      } else {
        // Clear blueprints when conditions not met
        this.blueprintsState.setData([]);
      }
    });

    // ✅ Debounced search: 300ms delay for better performance
    this.searchSubject.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe((text: string) => {
      this.searchText.set(text);
    });
  }

  // Table columns configuration
  // ✅ Removed secondary fields (start date, due date, created time, modules, budget, spent)
  // ✅ These are now shown in the expandable row below each blueprint
  columns: STColumn[] = [
    {
      title: '名稱',
      index: 'name',
      width: '180px',
      render: 'name'
    },
    {
      title: '業主',
      index: 'ownerType',
      width: '110px',
      format: (item: Blueprint) => this.getOwnerDisplay(item)
    },
    {
      title: 'Slug',
      index: 'slug',
      width: '120px'
    },
    {
      title: '描述',
      index: 'description',
      width: '220px',
      default: '-'
    },
    {
      title: '狀態',
      index: 'status',
      width: '90px',
      type: 'badge',
      badge: {
        draft: { text: '草稿', color: 'default' },
        active: { text: '啟用', color: 'success' },
        archived: { text: '封存', color: 'default' }
      }
    },
    {
      title: '進度',
      index: 'metadata.progress',
      width: '90px',
      format: (item: Blueprint) => this.formatProgress(item)
    },
    {
      title: '負責人',
      index: 'createdBy',
      width: '150px',
      format: (item: Blueprint) => this.getResponsibleDisplay(item)
    },
    {
      title: '最後更新時間',
      index: 'updatedAt',
      width: '130px',
      format: (item: Blueprint) => this.formatDateValue(item.updatedAt)
    },
    {
      title: '操作',
      width: '200px',
      buttons: [
        {
          text: '檢視',
          icon: 'eye',
          type: 'link',
          click: (record: STData) => this.view(record)
        },
        {
          text: '設計',
          icon: 'block',
          type: 'link',
          click: (record: STData) => this.design(record)
        },
        {
          text: '編輯',
          icon: 'edit',
          type: 'link',
          click: (record: STData) => this.edit(record)
        },
        {
          text: '刪除',
          icon: 'delete',
          type: 'del',
          pop: {
            title: '確定要刪除嗎?',
            okType: 'danger'
          },
          click: (record: STData) => this.delete(record)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadBlueprints();
  }

  private getOwnerDisplay(blueprint: Blueprint): string {
    const ownerName = this.getMetadataString(blueprint, ['ownerName', 'client', 'clientName']);
    if (ownerName) {
      return ownerName;
    }

    const ownerLabels: Record<OwnerType, string> = {
      [OwnerType.USER]: '個人',
      [OwnerType.ORGANIZATION]: '組織'
    };

    // For user-owned blueprints, try to show user name
    if (blueprint.ownerType === OwnerType.USER) {
      const user = this.workspaceContext.currentUser();
      if (user?.name && user.id === blueprint.ownerId) {
        return user.name;
      }
    }

    // For organization-owned blueprints, try to show organization name
    if (blueprint.ownerType === OwnerType.ORGANIZATION) {
      const organization = this.workspaceContext.organizations().find(org => org.id === blueprint.ownerId);
      if (organization?.name) {
        return organization.name;
      }
    }

    // Fallback to generic label
    return ownerLabels[blueprint.ownerType] || '未知';
  }

  private getResponsibleDisplay(blueprint: Blueprint): string {
    const responsible =
      this.getMetadataString(blueprint, ['responsibleName', 'assigneeName', 'responsibleDisplay']) ||
      this.getMetadataString(blueprint, ['responsible', 'owner', 'manager', 'lead', 'assignee']);

    if (responsible) {
      return responsible;
    }

    const currentUser = this.workspaceContext.currentUser();
    if (currentUser && blueprint.createdBy === currentUser.id) {
      return currentUser.name || currentUser.email || currentUser.uid || '-';
    }

    // Fallback: avoid exposing opaque IDs directly
    if (blueprint.createdBy && blueprint.createdBy.length <= 12) {
      return blueprint.createdBy;
    }

    return '-';
  }

  private formatProgress(blueprint: Blueprint): string {
    const progress = this.getMetadataNumber(blueprint, ['progress', 'progressPercent']);
    if (progress === null) {
      return '-';
    }
    const normalized = Math.min(100, Math.max(0, progress));
    return `${normalized}%`;
  }

  /** Format date value for display */
  formatDateValue(value: unknown): string {
    let date: Date | null = null;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      date = new Date(value);
    } else if (this.isTimestampLike(value)) {
      date = value.toDate();
    }

    if (!date || Number.isNaN(date.getTime())) {
      return '-';
    }
    return date.toLocaleDateString();
  }

  /** Format currency value for display */
  formatCurrency(value: number | null): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '-';
    }
    return value.toLocaleString('zh-TW', { maximumFractionDigits: 0 });
  }

  private getMetadataString(blueprint: Blueprint, keys: string[]): string | null {
    if (!blueprint.metadata) {
      return null;
    }
    for (const key of keys) {
      const value = blueprint.metadata[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }
    return null;
  }

  /** Get metadata number value */
  getMetadataNumber(blueprint: Blueprint, keys: string[]): number | null {
    if (!blueprint.metadata) {
      return null;
    }
    for (const key of keys) {
      const value = blueprint.metadata[key];
      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value;
      }
    }
    return null;
  }

  /** Get metadata date value */
  getMetadataDate(blueprint: Blueprint, keys: string[]): unknown {
    if (!blueprint.metadata) {
      return null;
    }
    for (const key of keys) {
      const value = blueprint.metadata[key];
      if (value instanceof Date || typeof value === 'string') {
        return value;
      }
      if (this.isTimestampLike(value)) {
        return value;
      }
    }
    return null;
  }

  private isTimestampLike(value: unknown): value is { toDate: () => Date } {
    return !!value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function';
  }

  /**
   * Load blueprints for current workspace context
   * 載入當前工作區上下文的藍圖
   * ✅ Using AsyncState for automatic state management
   *
   * Note: Auth is guaranteed by shouldLoadBlueprints computed signal
   */
  private async loadBlueprints(): Promise<void> {
    const user = this.authService.currentUser;

    // ✅ Silent guard: Effect guarantees auth, but defensive check for safety
    if (!user) {
      console.warn('[BlueprintList] Unexpected: loadBlueprints called without authenticated user');
      this.blueprintsState.setData([]);
      return;
    }

    // Determine owner type and ID based on workspace context
    const contextType = this.workspaceContext.contextType();
    const contextId = this.workspaceContext.contextId();

    let ownerType: OwnerType;
    let ownerId: string;

    switch (contextType) {
      case ContextType.ORGANIZATION:
        ownerType = OwnerType.ORGANIZATION;
        ownerId = contextId || user.uid;
        break;
      case ContextType.TEAM:
        {
          // Teams belong to organizations, so load organization's blueprints
          const team = this.workspaceContext.teams().find(t => t.id === contextId);
          if (team) {
            ownerType = OwnerType.ORGANIZATION;
            ownerId = team.organization_id;
          } else {
            ownerType = OwnerType.USER;
            ownerId = user.uid;
          }
        }
        break;
      case ContextType.USER:
      default:
        ownerType = OwnerType.USER;
        ownerId = user.uid;
        break;
    }

    try {
      await this.blueprintsState.load(firstValueFrom(this.blueprintService.getByOwner(ownerType, ownerId)));
      this.logger.info('[BlueprintListComponent]', `Loaded ${this.blueprintsState.length()} blueprints for ${ownerType}:${ownerId}`);
    } catch (error) {
      this.message.error('載入藍圖失敗');
      this.logger.error('[BlueprintListComponent]', 'Failed to load blueprints', error as Error);
    }
  }

  /**
   * Refresh blueprint list
   * 重新整理藍圖列表
   */
  refresh(): void {
    this.loadBlueprints();
  }

  /**
   * Handle search input change (debounced)
   * 處理搜尋輸入變更（已去抖動）
   */
  onSearchChange(text: string): void {
    this.searchSubject.next(text);
  }

  /**
   * Handle status filter change
   * 處理狀態篩選變更
   */
  onStatusFilterChange(status: BlueprintStatus | null): void {
    this.filterStatus.set(status);
  }

  /**
   * Handle table change event
   * 處理表格變更事件
   */
  onChange(event: STChange): void {
    // Handle pagination, sorting, etc.
    this.logger.debug('[BlueprintListComponent]', 'Table changed', { event });
  }

  /**
   * Create new blueprint
   * 建立新藍圖
   */
  async create(): Promise<void> {
    const { BlueprintModalComponent } = await import('./blueprint-modal.component');
    this.modal.createStatic(BlueprintModalComponent, {}, { size: 'md' }).subscribe(result => {
      if (result) {
        this.refresh();
      }
    });
  }

  /**
   * View blueprint details
   * 檢視藍圖詳情
   * ✅ Fixed: Use relative navigation to respect workspace context
   */
  view(record: STData): void {
    const blueprint = record as unknown as Blueprint;
    // Navigate relative to current route (preserves /blueprints/user or /blueprints/organization)
    this.router.navigate([blueprint.id], { relativeTo: this.route });
  }

  /**
   * Open blueprint designer
   * 開啟藍圖設計器
   */
  design(record: STData): void {
    const blueprint = record as unknown as Blueprint;
    this.router.navigate([blueprint.id, 'designer'], { relativeTo: this.route });
  }

  /**
   * Edit blueprint
   * 編輯藍圖
   */
  async edit(record: STData): Promise<void> {
    const blueprint = record as unknown as Blueprint;
    const { BlueprintModalComponent } = await import('./blueprint-modal.component');
    this.modal.createStatic(BlueprintModalComponent, { blueprint }, { size: 'md' }).subscribe(result => {
      if (result) {
        this.refresh();
      }
    });
  }

  /**
   * Delete blueprint (soft delete)
   * 刪除藍圖（軟刪除）
   */
  async delete(record: STData): Promise<void> {
    const blueprint = record as unknown as Blueprint;

    try {
      await this.blueprintService.delete(blueprint.id);
      this.message.success('藍圖已刪除');
      this.refresh();
    } catch (error) {
      this.message.error('刪除藍圖失敗');
      this.logger.error('[BlueprintListComponent]', 'Failed to delete blueprint', error as Error);
    }
  }
}
