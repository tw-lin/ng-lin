import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TeamRole, OrganizationMember, Account } from '@core';
import { AccountRepository } from '@core/repositories';
import { SHARED_IMPORTS } from '@shared';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Organization Member with Account Info
 * 組織成員與帳戶資訊整合介面
 */
export interface OrganizationMemberWithAccount extends OrganizationMember {
  account?: Account;
}

/**
 * Modal Data Interface
 * Modal 資料介面
 */
export interface TeamMemberModalData {
  availableMembers: OrganizationMember[];
}

/**
 * Team Member Modal Component
 * 團隊成員 Modal 元件 - 用於新增團隊成員
 *
 * Features:
 * - Select member from organization with search
 * - Display full user information (name, email, avatar)
 * - Select team role (Leader/Member)
 * - Form validation with Reactive Forms
 * - Dynamic account info loading
 *
 * Architecture Compliance:
 * ✅ Modern Angular 20+ with Signals
 * ✅ OnPush change detection strategy
 * ✅ Standalone component with SHARED_IMPORTS
 * ✅ inject() for dependency injection
 * ✅ Signal-based state management
 * ✅ Computed signals for derived state
 *
 * @since Angular 20.3.0
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-team-member-modal',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <form nz-form [formGroup]="form" nzLayout="vertical">
      <nz-form-item>
        <nz-form-label nzRequired>選擇成員</nz-form-label>
        <nz-form-control nzErrorTip="請選擇要加入的成員">
          <nz-select formControlName="userId" nzPlaceHolder="搜尋或選擇成員" nzShowSearch [nzLoading]="loading()" nzAllowClear>
            <nz-option *ngFor="let member of membersWithAccounts()" [nzValue]="member.user_id" [nzLabel]="getMemberLabel(member)">
              <div class="member-option">
                <nz-avatar [nzSize]="32" [nzSrc]="member.account?.avatar_url || undefined" [nzText]="getMemberInitials(member)"></nz-avatar>
                <div class="member-info">
                  <div class="member-name">{{ member.account?.name || member.user_id }}</div>
                  <div class="member-email">{{ member.account?.email || '載入中...' }}</div>
                </div>
              </div>
            </nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label nzRequired>團隊角色</nz-form-label>
        <nz-form-control nzErrorTip="請選擇角色">
          <nz-select formControlName="role" nzPlaceHolder="請選擇角色">
            <nz-option [nzValue]="TeamRole.MEMBER" nzLabel="團隊成員">
              <div class="role-option">
                <span nz-icon nzType="user" nzTheme="outline"></span>
                <div class="role-info">
                  <div class="role-name">團隊成員</div>
                  <div class="role-desc">可檢視和執行團隊任務</div>
                </div>
              </div>
            </nz-option>
            <nz-option [nzValue]="TeamRole.LEADER" nzLabel="團隊領導">
              <div class="role-option">
                <span nz-icon nzType="crown" nzTheme="fill"></span>
                <div class="role-info">
                  <div class="role-name">團隊領導</div>
                  <div class="role-desc">可管理團隊成員和設定</div>
                </div>
              </div>
            </nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      @if (form.get('userId')?.value && getSelectedMember()) {
        <nz-alert nzType="info" nzShowIcon [nzMessage]="'將加入成員'" [nzDescription]="getSelectedMemberSummary()" class="mb-md" />
      }
    </form>

    <div *nzModalFooter>
      <button nz-button nzType="default" (click)="handleCancel()">取消</button>
      <button nz-button nzType="primary" [nzLoading]="submitting()" [disabled]="!form.valid" (click)="handleOk()"> 確定 </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .member-option {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 0;
      }

      .member-info {
        flex: 1;
        min-width: 0;
      }

      .member-name {
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .member-email {
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .role-option {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 0;
      }

      .role-option [nz-icon] {
        font-size: 20px;
      }

      .role-info {
        flex: 1;
      }

      .role-name {
        font-weight: 500;
      }

      .role-desc {
        font-size: 12px;
      }
    `
  ]
})
export class TeamMemberModalComponent implements OnInit {
  // Dependency injection using inject()
  private readonly fb = inject(FormBuilder);
  private readonly modalRef = inject(NzModalRef);
  private readonly modalData = inject<TeamMemberModalData>(NZ_MODAL_DATA);
  private readonly accountRepository = inject(AccountRepository);

  // Expose TeamRole enum for template
  readonly TeamRole = TeamRole;

  // Signals for component state management
  loading = signal(false);
  submitting = signal(false);
  private readonly _membersWithAccounts = signal<OrganizationMemberWithAccount[]>([]);

  // Computed signal - readonly view of members with accounts
  membersWithAccounts = this._membersWithAccounts.asReadonly();

  // Reactive form for member selection
  form: FormGroup = this.fb.group({
    userId: ['', [Validators.required]],
    role: [TeamRole.MEMBER, [Validators.required]]
  });

  /**
   * Lifecycle: ngOnInit
   * Load member accounts when component initializes
   */
  ngOnInit(): void {
    this.loadMemberAccounts();
  }

  /**
   * Load account information for available members
   * 載入可用成員的帳戶資訊
   *
   * Uses forkJoin to load all accounts in parallel for better performance
   * Handles errors gracefully - continues even if some accounts fail to load
   */
  private loadMemberAccounts(): void {
    if (!this.modalData?.availableMembers || this.modalData.availableMembers.length === 0) {
      this._membersWithAccounts.set([]);
      return;
    }

    this.loading.set(true);

    // Fetch account info for each member in parallel
    const accountRequests = this.modalData.availableMembers.map(member =>
      this.accountRepository.findById(member.user_id).pipe(
        map(account => ({ ...member, account: account || undefined })),
        catchError(() => of({ ...member, account: undefined }))
      )
    );

    forkJoin(accountRequests).subscribe({
      next: membersWithAccounts => {
        this._membersWithAccounts.set(membersWithAccounts);
        this.loading.set(false);
      },
      error: error => {
        console.error('[TeamMemberModalComponent] Failed to load accounts:', error);
        // Fallback: show members without account info
        this._membersWithAccounts.set(this.modalData.availableMembers.map(m => ({ ...m, account: undefined })));
        this.loading.set(false);
      }
    });
  }

  /**
   * Get display label for member in select dropdown
   * 獲取成員在下拉選單中的顯示標籤
   *
   * @param member Organization member with optional account info
   * @returns Display name (account name or user ID)
   */
  getMemberLabel(member: OrganizationMemberWithAccount): string {
    return member.account?.name || member.user_id;
  }

  /**
   * Get member initials for avatar display
   * 獲取成員頭像的縮寫字母
   *
   * @param member Organization member with optional account info
   * @returns Initials (2 characters max)
   */
  getMemberInitials(member: OrganizationMemberWithAccount): string {
    const name = member.account?.name || member.user_id;
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Get currently selected member from form
   * 獲取表單中當前選擇的成員
   *
   * @returns Selected member or undefined
   */
  getSelectedMember(): OrganizationMemberWithAccount | undefined {
    const userId = this.form.get('userId')?.value;
    return this.membersWithAccounts().find(m => m.user_id === userId);
  }

  /**
   * Get summary text for selected member
   * 獲取選擇成員的摘要文字
   *
   * @returns Summary string showing member name, email, and role
   */
  getSelectedMemberSummary(): string {
    const member = this.getSelectedMember();
    const role = this.form.get('role')?.value;
    const roleName = role === TeamRole.LEADER ? '團隊領導' : '團隊成員';

    if (member?.account) {
      return `${member.account.name} (${member.account.email}) - ${roleName}`;
    }
    return `${member?.user_id} - ${roleName}`;
  }

  /**
   * Handle OK button click
   * Validates form and returns data to parent component
   * 處理確定按鈕點擊
   */
  handleOk(): void {
    if (!this.form.valid) {
      // Mark all fields as dirty to show validation errors
      Object.values(this.form.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    this.submitting.set(true);

    // Return form data to parent component
    this.modalRef.close({
      userId: this.form.value.userId,
      role: this.form.value.role
    });
  }

  /**
   * Handle Cancel button click
   * Closes modal without returning data
   * 處理取消按鈕點擊
   */
  handleCancel(): void {
    this.modalRef.close(null);
  }
}
