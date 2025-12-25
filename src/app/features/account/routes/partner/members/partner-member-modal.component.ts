import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PartnerRole, OrganizationMember, Account } from '@core';
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
export interface PartnerMemberModalData {
  availableMembers: OrganizationMember[];
}

/**
 * Partner Member Modal Component
 * 夥伴成員 Modal 元件 - 用於新增夥伴成員
 *
 * Features:
 * - Select member from organization with search
 * - Display full user information (name, email, avatar)
 * - Select partner role (Admin/Member)
 * - Form validation with Reactive Forms
 * - Dynamic account info loading
 *
 * Architecture Compliance:
 * ✅ Modern Angular 20+ with Signals
 * ✅ OnPush change detection strategy
 * ✅ Standalone component with SHARED_IMPORTS
 * ✅ inject() for dependency injection
 * ✅ Signal-based state management
 *
 * @since Angular 20.3.0
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-partner-member-modal',
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
        <nz-form-label nzRequired>夥伴角色</nz-form-label>
        <nz-form-control nzErrorTip="請選擇角色">
          <nz-select formControlName="role" nzPlaceHolder="請選擇角色">
            <nz-option [nzValue]="PartnerRole.MEMBER" nzLabel="夥伴成員">
              <div class="role-option">
                <span nz-icon nzType="user" nzTheme="outline"></span>
                <div class="role-info">
                  <div class="role-name">夥伴成員</div>
                  <div class="role-desc">可檢視和執行夥伴任務</div>
                </div>
              </div>
            </nz-option>
            <nz-option [nzValue]="PartnerRole.ADMIN" nzLabel="夥伴管理員">
              <div class="role-option">
                <span nz-icon nzType="crown" nzTheme="fill"></span>
                <div class="role-info">
                  <div class="role-name">夥伴管理員</div>
                  <div class="role-desc">可管理夥伴成員和設定</div>
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
        color: rgba(0, 0, 0, 0.45);
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
        color: rgba(0, 0, 0, 0.45);
      }
    `
  ]
})
export class PartnerMemberModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly modalRef = inject(NzModalRef);
  private readonly modalData = inject<PartnerMemberModalData>(NZ_MODAL_DATA);
  private readonly accountRepository = inject(AccountRepository);

  readonly PartnerRole = PartnerRole;

  loading = signal(false);
  submitting = signal(false);
  private readonly _membersWithAccounts = signal<OrganizationMemberWithAccount[]>([]);
  membersWithAccounts = this._membersWithAccounts.asReadonly();

  form: FormGroup = this.fb.group({
    userId: ['', [Validators.required]],
    role: [PartnerRole.MEMBER, [Validators.required]]
  });

  ngOnInit(): void {
    this.loadMemberAccounts();
  }

  private loadMemberAccounts(): void {
    if (!this.modalData?.availableMembers || this.modalData.availableMembers.length === 0) {
      this._membersWithAccounts.set([]);
      return;
    }

    this.loading.set(true);

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
        console.error('[PartnerMemberModalComponent] Failed to load accounts:', error);
        this._membersWithAccounts.set(this.modalData.availableMembers.map(m => ({ ...m, account: undefined })));
        this.loading.set(false);
      }
    });
  }

  getMemberLabel(member: OrganizationMemberWithAccount): string {
    return member.account?.name || member.user_id;
  }

  getMemberInitials(member: OrganizationMemberWithAccount): string {
    const name = member.account?.name || member.user_id;
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getSelectedMember(): OrganizationMemberWithAccount | undefined {
    const userId = this.form.get('userId')?.value;
    return this.membersWithAccounts().find(m => m.user_id === userId);
  }

  getSelectedMemberSummary(): string {
    const member = this.getSelectedMember();
    const role = this.form.get('role')?.value;
    const roleName = role === PartnerRole.ADMIN ? '夥伴管理員' : '夥伴成員';

    if (member?.account) {
      return `${member.account.name} (${member.account.email}) - ${roleName}`;
    }
    return `${member?.user_id} - ${roleName}`;
  }

  handleOk(): void {
    if (!this.form.valid) {
      Object.values(this.form.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    this.submitting.set(true);

    this.modalRef.close({
      userId: this.form.value.userId,
      role: this.form.value.role
    });
  }

  handleCancel(): void {
    this.modalRef.close(null);
  }
}
