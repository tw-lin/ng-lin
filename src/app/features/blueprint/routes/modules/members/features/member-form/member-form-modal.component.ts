import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BlueprintMemberType, BlueprintRole, BusinessRole, OwnerType, getAllowedMemberTypes } from '@core';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

import { Member } from '../../members.model';
import { MembersService } from '../../members.service';

/**
 * Member Form Modal Component
 * 成員表單模態元件 - 新增/編輯成員
 *
 * Features:
 * - Add new member with validation
 * - Edit existing member
 * - Role and permission management
 *
 * Part of Members Module - Feature-based architecture
 * ✅ High Cohesion: Focused on member form operations
 * ✅ Low Coupling: Clear interface via modal data
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-member-form-modal',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="submit()">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>成員類型</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請選擇成員類型">
          <nz-radio-group formControlName="memberType" [nzDisabled]="isEdit">
            @for (type of allowedMemberTypes; track type) {
              <label nz-radio [nzValue]="type.value">
                {{ type.label }}
              </label>
            }
          </nz-radio-group>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>帳號 ID</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入帳號 ID">
          <input nz-input formControlName="accountId" placeholder="輸入 User/Team/Partner ID" [disabled]="isEdit" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>系統角色</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請選擇系統角色">
          <nz-radio-group formControlName="role">
            <label nz-radio [nzValue]="BlueprintRole.VIEWER"> 檢視者（唯讀） </label>
            <label nz-radio [nzValue]="BlueprintRole.CONTRIBUTOR"> 貢獻者（編輯） </label>
            <label nz-radio [nzValue]="BlueprintRole.MAINTAINER"> 維護者（完整權限） </label>
          </nz-radio-group>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6">業務角色</nz-form-label>
        <nz-form-control [nzSpan]="16">
          <nz-select formControlName="businessRole" nzPlaceHolder="選擇業務角色（選填）" nzAllowClear>
            @for (role of businessRoles; track role) {
              <nz-option [nzLabel]="role.label" [nzValue]="role.value"></nz-option>
            }
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6">外部成員</nz-form-label>
        <nz-form-control [nzSpan]="16">
          <label nz-checkbox formControlName="isExternal" [nzDisabled]="isExternalDisabled()"> 標記為外部成員（承包商、顧問等） </label>
          @if (isExternalDisabled()) {
            <div class="text-muted mt-xs">
              {{ memberType === BlueprintMemberType.TEAM ? '團隊成員自動標記為內部成員' : '夥伴成員自動標記為外部成員' }}
            </div>
          }
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-control [nzOffset]="6" [nzSpan]="16">
          <button nz-button nzType="primary" type="submit" [nzLoading]="submitting()" [disabled]="!form.valid">
            {{ isEdit ? '更新' : '新增' }}
          </button>
          <button nz-button type="button" class="ml-sm" (click)="cancel()" [disabled]="submitting()"> 取消 </button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `
})
export class MemberFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly modal = inject(NzModalRef);
  private readonly message = inject(NzMessageService);
  private readonly membersService = inject(MembersService);
  private readonly data: { blueprintId: string; blueprintOwnerType: string; member?: Member } = inject(NZ_MODAL_DATA);

  // Expose enums for template
  BlueprintRole = BlueprintRole;
  BlueprintMemberType = BlueprintMemberType;

  submitting = signal(false);
  isEdit = false;
  memberType = BlueprintMemberType.USER; // Track current member type

  // Calculate allowed member types based on blueprint owner type
  allowedMemberTypes = this.calculateAllowedMemberTypes();

  form: FormGroup = this.fb.group({
    memberType: [BlueprintMemberType.USER, [Validators.required]],
    accountId: ['', [Validators.required]],
    role: [BlueprintRole.VIEWER, [Validators.required]],
    businessRole: [null],
    isExternal: [false]
  });

  // Business roles options
  businessRoles = [
    { label: '專案經理', value: BusinessRole.PROJECT_MANAGER },
    { label: '工地主任', value: BusinessRole.SITE_SUPERVISOR },
    { label: '工程師', value: BusinessRole.ENGINEER },
    { label: '品管人員', value: BusinessRole.QUALITY_INSPECTOR },
    { label: '建築師', value: BusinessRole.ARCHITECT },
    { label: '承包商', value: BusinessRole.CONTRACTOR },
    { label: '業主', value: BusinessRole.CLIENT }
  ];

  /**
   * Calculate allowed member types based on blueprint owner type
   */
  private calculateAllowedMemberTypes() {
    const ownerType = this.data.blueprintOwnerType as OwnerType;
    const allowed = getAllowedMemberTypes(ownerType);

    return allowed.map(type => ({
      value: type,
      label: type === BlueprintMemberType.USER ? '用戶' : type === BlueprintMemberType.TEAM ? '團隊' : '夥伴'
    }));
  }

  /**
   * Check if isExternal checkbox should be disabled
   */
  isExternalDisabled = signal(false);

  ngOnInit(): void {
    if (this.data.member) {
      this.isEdit = true;
      this.form.patchValue({
        memberType: this.data.member.memberType,
        accountId: this.data.member.accountId,
        role: this.data.member.role,
        businessRole: this.data.member.businessRole,
        isExternal: this.data.member.isExternal
      });
      this.memberType = this.data.member.memberType;
      this.updateExternalFieldState(this.data.member.memberType);
    }

    // Watch memberType changes to update isExternal field
    this.form.get('memberType')?.valueChanges.subscribe((type: BlueprintMemberType) => {
      this.memberType = type;
      this.updateExternalFieldState(type);
    });
  }

  /**
   * Update isExternal field based on member type
   */
  private updateExternalFieldState(type: BlueprintMemberType): void {
    if (type === BlueprintMemberType.TEAM) {
      // Team members are always internal
      this.form.patchValue({ isExternal: false });
      this.isExternalDisabled.set(true);
    } else if (type === BlueprintMemberType.PARTNER) {
      // Partner members are always external
      this.form.patchValue({ isExternal: true });
      this.isExternalDisabled.set(true);
    } else {
      // User members can be either
      this.isExternalDisabled.set(false);
    }
  }

  /**
   * Submit form
   * 提交表單
   */
  async submit(): Promise<void> {
    if (!this.form.valid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.submitting.set(true);

    try {
      const formValue = this.form.value;
      const ownerType = this.data.blueprintOwnerType as OwnerType;

      if (this.isEdit) {
        // Update existing member
        await this.membersService.updateMember(this.data.blueprintId, this.data.member!.id, {
          role: formValue.role,
          businessRole: formValue.businessRole,
          isExternal: formValue.isExternal
        });
        this.message.success('成員已更新');
      } else {
        // Add new member
        await this.membersService.addMember({
          blueprintId: this.data.blueprintId,
          blueprintOwnerType: ownerType,
          accountId: formValue.accountId,
          memberType: formValue.memberType,
          accountName: undefined, // Will be populated later if needed
          role: formValue.role,
          businessRole: formValue.businessRole,
          isExternal: formValue.isExternal,
          permissions: this.membersService.getDefaultPermissions(formValue.role)
        });
        this.message.success('成員已新增');
      }

      this.modal.close(true);
    } catch (error) {
      this.message.error(this.isEdit ? '更新成員失敗' : '新增成員失敗');
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * Cancel and close modal
   * 取消並關閉模態視窗
   */
  cancel(): void {
    this.modal.close();
  }
}
