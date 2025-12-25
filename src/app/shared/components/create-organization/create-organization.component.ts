/**
 * Create Organization Component
 *
 * 建立組織組件
 * Create organization component
 *
 * Allows users to create a new organization.
 * Integrates with WorkspaceContextService for state management.
 *
 * @module shared/components
 */

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthFacade } from '@core';
import { OrganizationRepository } from '@core/repositories';
import { WorkspaceContextService } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule],
  template: `
    <div class="modal-header">
      <div class="modal-title">建立組織</div>
    </div>

    <div class="modal-body">
      <form nz-form [formGroup]="form" nzLayout="vertical">
        <nz-form-item>
          <nz-form-label [nzRequired]="true">組織名稱</nz-form-label>
          <nz-form-control [nzErrorTip]="'請輸入組織名稱（2-50個字符）'">
            <input nz-input formControlName="name" placeholder="請輸入組織名稱" [disabled]="loading()" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>描述</nz-form-label>
          <nz-form-control>
            <textarea
              nz-input
              formControlName="description"
              placeholder="請輸入組織描述（可選）"
              [disabled]="loading()"
              rows="3"
            ></textarea>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>Logo URL</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="logo_url" placeholder="請輸入組織 Logo URL（可選）" [disabled]="loading()" />
          </nz-form-control>
        </nz-form-item>
      </form>
    </div>

    <div class="modal-footer">
      <button nz-button type="button" (click)="cancel()" [disabled]="loading()">取消</button>
      <button nz-button type="button" nzType="primary" (click)="submit()" [nzLoading]="loading()" [disabled]="form.invalid">
        建立組織
      </button>
    </div>
  `,
  styles: [
    `
      .modal-header {
        padding: 16px 24px;
        border-bottom: 1px solid #f0f0f0;
      }
      .modal-title {
        font-size: 16px;
        font-weight: 500;
      }
      .modal-body {
        padding: 24px;
      }
      .modal-footer {
        padding: 16px 24px;
        border-top: 1px solid #f0f0f0;
        text-align: right;
      }
      .modal-footer button + button {
        margin-left: 8px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateOrganizationComponent {
  private readonly fb = inject(FormBuilder);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly organizationRepository = inject(OrganizationRepository);
  private readonly auth = inject(AuthFacade);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: [''],
    logo_url: ['']
  });

  cancel(): void {
    this.modal.destroy();
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      this.msg.error('請先登入');
      return;
    }

    this.loading.set(true);
    try {
      // Create organization in Firestore
      const creatorId = currentUser.uid;
      const newOrg = await this.organizationRepository.create({
        name: this.form.value.name,
        description: this.form.value.description || null,
        logo_url: this.form.value.logo_url || null,
        created_by: creatorId,
        creator_id: creatorId
      });

      // Reload workspace data to include new organization
      this.workspaceContext.reloadData();

      // Switch to new organization context
      this.workspaceContext.switchToOrganization(newOrg.id);

      this.msg.success('組織建立成功！');
      this.modal.destroy(newOrg);
    } catch (error) {
      console.error('Create organization failed:', error);
      this.msg.error('建立組織失敗，請稍後再試');
      this.loading.set(false);
    }
  }
}
