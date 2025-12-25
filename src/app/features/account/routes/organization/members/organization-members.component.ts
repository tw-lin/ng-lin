import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ContextType, InvitationStatus, OrganizationMember, OrganizationRole } from '@core';
import { NotificationType } from '@core/account/types';
import {
  AccountRepository,
  NotificationRepository,
  OrganizationInvitationRepository,
  OrganizationMemberRepository
} from '@core/repositories';
import { FirebaseService } from '@core/services/firebase.service';
import { SHARED_IMPORTS, WorkspaceContextService, createAsyncArrayState } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-organization-members',
  standalone: true,
  imports: [SHARED_IMPORTS, NzAlertModule, NzEmptyModule],
  template: `
    <page-header [title]="'組織成員'" [content]="headerContent"></page-header>

    <ng-template #headerContent>
      <div>管理當前組織的成員與角色。</div>
    </ng-template>

    @if (!isOrganizationContext()) {
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="請切換到組織上下文"
        nzDescription="請從側邊欄切換到目標組織後即可管理成員。"
        class="mb-md"
      />
    }

    @if (isOrganizationContext()) {
      <nz-card nzTitle="邀請成員" class="mb-md">
        <form class="invite-form" (ngSubmit)="sendInvitation()">
          <div class="invite-controls">
            <input
              nz-input
              name="inviteEmail"
              type="email"
              required
              [disabled]="inviteLoading()"
              [ngModel]="inviteEmail()"
              (ngModelChange)="inviteEmail.set($event)"
              placeholder="輸入邀請的電子郵件"
            />
            <button nz-button nzType="primary" type="submit" [disabled]="!inviteEmail()" [nzLoading]="inviteLoading()">送出邀請</button>
          </div>
        </form>

        @if (inviteError()) {
          <nz-alert nzType="error" nzShowIcon [nzMessage]="inviteError()" nzDescription="請確認電子郵件格式，或稍後再試。" class="mt-sm" />
        }
      </nz-card>
    }

    <nz-card nzTitle="成員列表" [nzLoading]="membersState.loading()">
      @if (membersState.error()) {
        <nz-alert
          nzType="error"
          nzShowIcon
          [nzMessage]="'載入失敗'"
          [nzDescription]="membersState.error()?.message || '無法載入成員列表'"
          class="mb-md"
        />
      }

      @if (displayMembers().length > 0) {
        <nz-table #table [nzData]="displayMembers()">
          <thead>
            <tr>
              <th nzWidth="200px">成員 ID</th>
              <th nzWidth="180px">角色</th>
              <th nzWidth="200px">加入時間</th>
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
      .invite-form {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .invite-controls {
        display: flex;
        gap: 12px;
        width: 100%;
      }
      .invite-controls input {
        flex: 1;
      }
      @media (max-width: 767px) {
        .invite-form,
        .invite-controls {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationMembersComponent implements OnInit {
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly memberRepository: OrganizationMemberRepository = inject(OrganizationMemberRepository);
  private readonly invitationRepository = inject(OrganizationInvitationRepository);
  private readonly notificationRepository = inject(NotificationRepository);
  private readonly accountRepository = inject(AccountRepository);
  private readonly firebaseService = inject(FirebaseService);
  private readonly message = inject(NzMessageService);

  // ✅ Modern Pattern: Use AsyncState for unified state management
  readonly membersState = createAsyncArrayState<OrganizationMember>([]);
  readonly inviteEmail = signal('');
  readonly inviteLoading = signal(false);
  readonly inviteError = signal<string | null>(null);

  ngOnInit(): void {
    // Load members when component initializes
    this.loadMembers();
  }

  /**
   * Load organization members from repository
   * 從 Repository 載入組織成員（使用 AsyncState 統一管理）
   */
  private async loadMembers(): Promise<void> {
    const orgId = this.currentOrgId();

    if (!orgId) {
      return;
    }

    try {
      await this.membersState.load(firstValueFrom(this.memberRepository.findByOrganization(orgId)));
    } catch (error) {
      console.error('[OrganizationMembersComponent] ❌ Failed to load members:', error);
      // Error is automatically managed by AsyncState
    }
  }

  readonly currentOrgId = computed(() =>
    this.workspaceContext.contextType() === ContextType.ORGANIZATION ? this.workspaceContext.contextId() : null
  );
  readonly currentOrganization = computed(() => this.workspaceContext.organizations().find(org => org.id === this.currentOrgId()));

  displayMembers = computed(() => this.membersState.data() || []);

  isOrganizationContext(): boolean {
    return this.workspaceContext.contextType() === ContextType.ORGANIZATION;
  }

  async sendInvitation(): Promise<void> {
    const email = this.inviteEmail().trim().toLowerCase();
    const organizationId = this.currentOrgId();
    const invitedBy = this.firebaseService.getCurrentUserId();

    if (!organizationId) {
      this.inviteError.set('請先切換到組織上下文');
      return;
    }

    if (!invitedBy) {
      this.inviteError.set('請先登入後再邀請成員');
      return;
    }

    if (!email) {
      this.inviteError.set('請輸入要邀請的電子郵件');
      return;
    }

    this.inviteLoading.set(true);
    this.inviteError.set(null);

    try {
      const inviterName = this.inviterName();
      const organizationName = this.currentOrgName();
      await this.invitationRepository.create({
        organization_id: organizationId,
        email,
        invited_by: invitedBy,
        status: InvitationStatus.PENDING
      });

      const account = await this.accountRepository.findByEmail(email);

      if (account) {
        await this.notificationRepository.create({
          userId: account.id,
          type: NotificationType.NOTICE,
          title: '組織邀請',
          description: `${inviterName} 邀請你加入 ${organizationName}`,
          datetime: new Date(),
          read: false,
          link: `/organization/${organizationId}/members`,
          extra: `${organizationName}｜邀請人：${inviterName}`
        });
      }

      await this.notificationRepository.create({
        userId: invitedBy,
        type: NotificationType.MESSAGE,
        title: '邀請已送出',
        description: `已邀請 ${email} 加入 ${organizationName}`,
        datetime: new Date(),
        read: false,
        link: `/organization/${organizationId}/members`,
        extra: organizationName
      });

      this.message.success('邀請已送出');
      this.inviteEmail.set('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '送出邀請失敗，請稍後再試';
      this.inviteError.set(message);
      this.message.error(message);
    } finally {
      this.inviteLoading.set(false);
    }
  }

  private inviterName(): string {
    const user = this.firebaseService.getCurrentUser();
    return user?.displayName || user?.email || '組織成員';
  }

  private currentOrgName(): string {
    return this.currentOrganization()?.name || '組織';
  }

  roleLabel(role: OrganizationRole): string {
    switch (role) {
      case OrganizationRole.OWNER:
        return '擁有者';
      case OrganizationRole.ADMIN:
        return '管理員';
      case OrganizationRole.MEMBER:
      default:
        return '成員';
    }
  }

  roleColor(role: OrganizationRole): string {
    switch (role) {
      case OrganizationRole.OWNER:
        return 'gold';
      case OrganizationRole.ADMIN:
        return 'blue';
      case OrganizationRole.MEMBER:
      default:
        return 'default';
    }
  }
}
