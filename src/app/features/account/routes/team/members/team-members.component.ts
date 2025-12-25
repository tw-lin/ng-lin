import { ChangeDetectionStrategy, Component, computed, inject, OnInit, effect, DestroyRef, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContextType, TeamMember, TeamRole, OrganizationMember, TeamStore } from '@core';
import { OrganizationMemberRepository } from '@core/repositories';
import { SHARED_IMPORTS, WorkspaceContextService } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [SHARED_IMPORTS, NzAlertModule, NzEmptyModule, NzSelectModule, NzSpaceModule, FormsModule],
  template: `
    <page-header [title]="'團隊成員'" [content]="headerContent" [breadcrumb]="breadcrumb"></page-header>

    <ng-template #headerContent>
      <div>檢視並管理目前團隊的成員。</div>
    </ng-template>

    <ng-template #breadcrumb>
      <nz-breadcrumb>
        <nz-breadcrumb-item>
          <a routerLink="/">
            <span nz-icon nzType="home"></span>
            首頁
          </a>
        </nz-breadcrumb-item>
        @if (currentTeamId()) {
          <nz-breadcrumb-item>
            <span nz-icon nzType="team"></span>
            {{ organizationName() }}
          </nz-breadcrumb-item>
          <nz-breadcrumb-item>
            <span nz-icon nzType="usergroup-add"></span>
            {{ workspaceContext.contextLabel() }}
          </nz-breadcrumb-item>
        }
        <nz-breadcrumb-item>成員管理</nz-breadcrumb-item>
      </nz-breadcrumb>
    </ng-template>

    @if (!isTeamContext()) {
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="請選擇團隊"
        nzDescription="請從組織管理 → 團隊管理頁面選擇要管理的團隊，或從側邊欄選擇一個團隊。"
        class="mb-md"
      />
    }

    <nz-card nzTitle="成員列表" [nzExtra]="extraTemplate" [nzLoading]="loading()">
      <ng-template #extraTemplate>
        @if (isTeamContext()) {
          <nz-space>
            <button *nzSpaceItem nz-button nzType="primary" (click)="openAddMemberModal()">
              <span nz-icon nzType="user-add"></span>
              新增成員
            </button>
            <button *nzSpaceItem nz-button nzType="default" (click)="refreshMembers()">
              <span nz-icon nzType="reload"></span>
              重新整理
            </button>
          </nz-space>
        }
      </ng-template>

      @if (displayMembers().length > 0) {
        <nz-table #table [nzData]="displayMembers()">
          <thead>
            <tr>
              <th nzWidth="200px">成員 ID</th>
              <th nzWidth="140px">角色</th>
              <th nzWidth="200px">加入時間</th>
              <th nzWidth="200px">操作</th>
            </tr>
          </thead>
          <tbody>
            @for (member of table.data; track member.id) {
              <tr>
                <td>{{ member.user_id }}</td>
                <td>
                  <nz-tag [nzColor]="roleColor(member.role)">{{ roleLabel(member.role) }}</nz-tag>
                </td>
                <td>{{ member.joined_at || '-' }}</td>
                <td>
                  <nz-space>
                    <button *nzSpaceItem nz-button nzType="link" nzSize="small" (click)="changeRole(member)">
                      <span nz-icon nzType="swap"></span>
                      變更角色
                    </button>
                    <button
                      *nzSpaceItem
                      nz-button
                      nzType="link"
                      nzSize="small"
                      nzDanger
                      nz-popconfirm
                      nzPopconfirmTitle="確定移除此成員？"
                      (nzOnConfirm)="removeMember(member)"
                    >
                      <span nz-icon nzType="user-delete"></span>
                      移除
                    </button>
                  </nz-space>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      } @else {
        <nz-empty nzNotFoundContent="暫無成員"></nz-empty>
      }
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .bg-transparent {
        background: transparent;
      }
      .border-0 {
        border: 0;
      }
      .mr-sm {
        margin-right: 8px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
/**
 * Team Members Component
 * 團隊成員管理元件
 *
 * Features:
 * - View team members list
 * - Add new members from organization
 * - Change member roles
 * - Remove members
 *
 * Architecture Compliance:
 * ✅ Modern Angular 20+ with Signals
 * ✅ OnPush change detection strategy
 * ✅ Standalone component
 * ✅ inject() for dependency injection
 * ✅ No business logic in constructor (lifecycle compliant)
 * ✅ Proper effect() usage in ngOnInit
 *
 * @since Angular 20.3.0
 */
export class TeamMembersComponent implements OnInit {
  // Dependency injection using inject()
  readonly workspaceContext = inject(WorkspaceContextService);
  readonly teamStore = inject(TeamStore);
  private readonly orgMemberRepository = inject(OrganizationMemberRepository);
  private readonly modal = inject(NzModalService);
  private readonly message = inject(NzMessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Store previous context to restore on destroy (fix navigation bug)
  private previousContext: { type: ContextType; id: string | null } | null = null;

  // Track if this component switched the context (for proper cleanup)
  private didSwitchContext = false;

  // Convert query params to signal using toSignal (Angular 20+ pattern)
  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Record<string, string> });

  // Computed signal for team ID from query params
  private readonly queryParamTeamId = computed(() => {
    const params = this.queryParams();
    return (params['teamId'] as string) || null;
  });

  // Expose TeamRole enum to template
  readonly TeamRole = TeamRole;

  /**
   * Lifecycle: ngOnInit
   * Initialize component and setup effects
   * ✅ Compliant with ⭐.md lifecycle standards
   * ✅ Follows Occam's Razor (KISS principle)
   * ✅ Performance optimized with untracked()
   * ✅ Properly handles context restoration on navigation
   */
  ngOnInit(): void {
    // Save current context before any potential switch (for restoration on destroy)
    this.previousContext = {
      type: this.workspaceContext.contextType(),
      id: this.workspaceContext.contextId()
    };

    // Register cleanup handler to restore previous context
    this.destroyRef.onDestroy(() => {
      // FIXED: Only restore if THIS component switched the context
      // Check didSwitchContext flag instead of current context type
      // This prevents issues when user navigates away before context check
      if (this.didSwitchContext && this.previousContext && this.previousContext.type !== ContextType.TEAM) {
        console.log('[TeamMembersComponent] Restoring previous context:', this.previousContext);
        this.workspaceContext.switchContext(this.previousContext.type, this.previousContext.id);
      } else {
        console.log('[TeamMembersComponent] Skipping restore - no switch by this component');
      }
    });

    // Monitor query parameters and switch context when teamId is present
    // Use untracked() to read workspaceContext without creating dependencies
    // This prevents unnecessary effect re-runs when workspace changes unrelated to our team
    effect(() => {
      const teamId = this.queryParamTeamId();
      if (teamId) {
        // Use untracked to check context without triggering on workspace updates
        const needsSwitch = untracked(
          () => this.workspaceContext.contextType() !== ContextType.TEAM || this.workspaceContext.contextId() !== teamId
        );

        if (needsSwitch) {
          // Mark that we're switching context (for cleanup tracking)
          this.didSwitchContext = true;
          // Only the actual switch operation, not reading from workspace
          this.workspaceContext.switchToTeam(teamId);
        }
      }
      // Note: When teamId is null/undefined, we don't force any context change
      // This allows navigation back to organization context to work properly
    });

    // Auto-reload members when effective team ID changes
    // CRITICAL FIX: Defer async operation to prevent UI blocking
    // Firestore query preparation is synchronous and can block the main thread
    // Use queueMicrotask to defer to next tick, keeping UI responsive
    effect(() => {
      const teamId = this.effectiveTeamId();
      if (teamId) {
        // Defer async call to next microtask to prevent blocking UI
        // This allows the current synchronous effect to complete first
        queueMicrotask(() => {
          this.teamStore.loadMembers(teamId);
        });
      }
    });
  }

  /**
   * Organization name computed signal (performance optimized)
   * 組織名稱計算信號（效能優化）
   *
   * Memoized to avoid redundant array searches in template
   */
  readonly organizationName = computed(() => {
    const teams = this.workspaceContext.teams();
    const currentTeam = teams.find(t => t.id === this.currentTeamId());
    if (currentTeam) {
      const orgs = this.workspaceContext.organizations();
      const org = orgs.find(o => o.id === currentTeam.organization_id);
      return org?.name || '組織';
    }
    return '組織';
  });

  /**
   * Current team ID from workspace context
   * 從工作區上下文獲取當前團隊 ID
   */
  readonly currentTeamId = computed(() =>
    this.workspaceContext.contextType() === ContextType.TEAM ? this.workspaceContext.contextId() : null
  );

  /**
   * Effective team ID considers both context and query parameters
   * Priority: query param > workspace context
   * 有效團隊 ID（優先級：查詢參數 > 工作區上下文）
   */
  private readonly effectiveTeamId = computed(() => {
    return this.queryParamTeamId() || this.currentTeamId();
  });

  /**
   * Display members filtered by effective team ID
   * 依有效團隊 ID 篩選顯示的成員
   */
  displayMembers = computed(() => {
    const teamId = this.effectiveTeamId();
    if (!teamId) {
      return [];
    }
    return this.teamStore.currentTeamMembers();
  });

  /**
   * Loading state from team store
   * 團隊 Store 的載入狀態
   */
  readonly loading = this.teamStore.loading;

  /**
   * Check if current context is team context (performance optimized)
   * 檢查當前上下文是否為團隊上下文（效能優化）
   *
   * Computed signal to avoid re-evaluation in template
   */
  readonly isTeamContext = computed(() => !!this.effectiveTeamId());

  /**
   * Refresh members list
   * 重新整理成員列表
   */
  refreshMembers(): void {
    const teamId = this.effectiveTeamId();
    if (teamId) {
      this.message.info('正在重新整理...');
      this.teamStore.loadMembers(teamId);
    }
  }

  /**
   * Open modal to add new member
   * Opens a modal with organization members that are not yet in the team
   * 開啟新增成員的 Modal
   */
  openAddMemberModal(): void {
    const teamId = this.effectiveTeamId();
    if (!teamId) {
      this.message.error('無法獲取團隊 ID');
      return;
    }

    // Get current team to find organization
    const currentTeam = this.workspaceContext.teams().find(t => t.id === teamId);
    if (!currentTeam) {
      this.message.error('找不到團隊資訊');
      return;
    }

    // Load organization members
    this.orgMemberRepository
      .findByOrganization(currentTeam.organization_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orgMembers: OrganizationMember[]) => {
          // Filter out members already in team
          const currentMemberIds = this.teamStore.currentTeamMembers().map(m => m.user_id);
          const availableMembers = orgMembers.filter(om => !currentMemberIds.includes(om.user_id));

          if (availableMembers.length === 0) {
            this.message.warning('所有組織成員都已加入此團隊');
            return;
          }

          this.showAddMemberModal(teamId, availableMembers);
        },
        error: (error: Error) => {
          console.error('[TeamMembersComponent] ❌ Failed to load org members:', error);
          this.message.error('載入組織成員失敗');
        }
      });
  }

  /**
   * Show add member modal with available members
   * 顯示新增成員的 Modal
   *
   * @param teamId Team ID
   * @param availableMembers Available organization members
   */
  private showAddMemberModal(teamId: string, availableMembers: OrganizationMember[]): void {
    // Import modal component dynamically for better code splitting
    import('./team-member-modal.component').then(({ TeamMemberModalComponent }) => {
      const modalRef = this.modal.create({
        nzTitle: '新增團隊成員',
        nzContent: TeamMemberModalComponent,
        nzData: { availableMembers },
        nzWidth: 600,
        nzFooter: null,
        nzMaskClosable: false
      });

      // Handle modal result
      modalRef.afterClose.subscribe(async result => {
        if (result) {
          try {
            await this.teamStore.addMember(teamId, result.userId, result.role);
            this.message.success('成員已加入團隊');
          } catch (error) {
            console.error('[TeamMembersComponent] ❌ Failed to add member:', error);
            this.message.error('新增成員失敗');
          }
        }
      });
    });
  }

  /**
   * Change member role
   * 變更成員角色
   *
   * @param member Team member to change role
   */
  changeRole(member: TeamMember): void {
    const teamId = this.effectiveTeamId();
    if (!teamId) return;

    const currentRole = member.role;
    const availableRoles = Object.values(TeamRole).filter(role => role !== currentRole);

    this.modal.create({
      nzTitle: '變更成員角色',
      nzContent: `
        <div>
          <p>當前角色：<strong>${this.roleLabel(currentRole)}</strong></p>
          <div class="mb-md">
            <label class="d-block mb-sm"><strong>選擇新角色</strong></label>
            <nz-radio-group id="roleSelector" style="display: flex; flex-direction: column; gap: 12px;">
              ${availableRoles
                .map(
                  role => `
                <label nz-radio nzValue="${role}" style="display: flex; align-items: center; padding: 8px; border: 1px solid; border-radius: 4px;">
                  <input type="radio" name="role" value="${role}" />
                  <span style="margin-left: 8px;">
                    <strong>${this.roleLabel(role)}</strong>
                    <span style="display: block; font-size: 12px;">
                      ${role === TeamRole.LEADER ? '可管理團隊成員和設定' : '可檢視和執行團隊任務'}
                    </span>
                  </span>
                </label>
              `
                )
                .join('')}
            </nz-radio-group>
          </div>
        </div>
      `,
      nzOnOk: async () => {
        const selectedInput = document.querySelector('input[name="role"]:checked') as HTMLInputElement;
        const newRole = selectedInput?.value as TeamRole;

        if (!newRole) {
          this.message.error('請選擇角色');
          return false;
        }

        try {
          await this.teamStore.updateMemberRole(member.id, teamId, member.user_id, newRole);
          this.message.success('角色已變更');
          return true;
        } catch (error) {
          console.error('[TeamMembersComponent] ❌ Failed to change role:', error);
          this.message.error('變更角色失敗');
          return false;
        }
      }
    });
  }

  /**
   * Remove member from team
   * 從團隊移除成員
   *
   * @param member Team member to remove
   */
  async removeMember(member: TeamMember): Promise<void> {
    try {
      const teamId = this.effectiveTeamId();
      if (!teamId) {
        this.message.error('無法獲取團隊 ID');
        return;
      }

      await this.teamStore.removeMember(member.id, teamId);
      this.message.success('成員已移除');
    } catch (error) {
      console.error('[TeamMembersComponent] ❌ Failed to remove member:', error);
      this.message.error('移除成員失敗');
    }
  }

  /**
   * Get label for team role
   * 獲取團隊角色標籤
   *
   * @param role Team role
   * @returns Role label in Chinese
   */
  roleLabel(role: TeamRole): string {
    switch (role) {
      case TeamRole.LEADER:
        return '領導';
      case TeamRole.MEMBER:
      default:
        return '成員';
    }
  }

  /**
   * Get color for team role badge
   * 獲取團隊角色徽章顏色
   *
   * @param role Team role
   * @returns Color for nz-tag
   */
  roleColor(role: TeamRole): string {
    switch (role) {
      case TeamRole.LEADER:
        return 'purple';
      case TeamRole.MEMBER:
      default:
        return 'default';
    }
  }
}
