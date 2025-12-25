/**
 * Edit Partner Modal Component - Modern Angular 20 Implementation
 *
 * 編輯夥伴模態元件 - 現代化 Angular 20 實作
 *
 * Modern Angular 20 Patterns:
 * - Standalone Component
 * - Signals for state management
 * - Reactive Forms with proper validation
 * - OnPush change detection
 *
 * @module routes/organization/partners
 */

import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Partner, PartnerStore, PartnerType } from '@core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  selector: 'app-edit-partner-modal',
  standalone: true,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzSelectModule, NzButtonModule],
  template: `
    <div class="modal-content">
      <form nz-form [formGroup]="form" nzLayout="vertical">
        <nz-form-item>
          <nz-form-label [nzRequired]="true">夥伴名稱</nz-form-label>
          <nz-form-control [nzErrorTip]="nameErrorTip">
            <input nz-input formControlName="name" placeholder="請輸入夥伴名稱（2-50個字符）" [disabled]="loading()" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label [nzRequired]="true">夥伴類型</nz-form-label>
          <nz-form-control [nzErrorTip]="'請選擇夥伴類型'">
            <nz-select formControlName="type" nzPlaceHolder="請選擇夥伴類型" [disabled]="loading()">
              <nz-option nzValue="contractor" nzLabel="承包商"></nz-option>
              <nz-option nzValue="supplier" nzLabel="供應商"></nz-option>
              <nz-option nzValue="consultant" nzLabel="顧問"></nz-option>
              <nz-option nzValue="subcontractor" nzLabel="次承包商"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>公司名稱</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="company_name" placeholder="請輸入公司名稱（選填）" [disabled]="loading()" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>聯絡信箱</nz-form-label>
          <nz-form-control [nzErrorTip]="'請輸入有效的電子郵件地址'">
            <input nz-input formControlName="contact_email" type="email" placeholder="請輸入聯絡信箱（選填）" [disabled]="loading()" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>聯絡電話</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="contact_phone" placeholder="請輸入聯絡電話（選填）" [disabled]="loading()" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>描述</nz-form-label>
          <nz-form-control>
            <textarea
              nz-input
              formControlName="description"
              placeholder="請輸入夥伴描述（選填）"
              [disabled]="loading()"
              rows="4"
            ></textarea>
          </nz-form-control>
        </nz-form-item>
      </form>

      <div class="modal-footer">
        <button nz-button type="button" (click)="cancel()" [disabled]="loading()"> 取消 </button>
        <button nz-button type="button" nzType="primary" (click)="submit()" [nzLoading]="loading()" [disabled]="form.invalid">
          更新夥伴
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-content {
        padding: 8px 0;
      }
      .modal-footer {
        margin-top: 24px;
        padding-top: 16px;
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
export class EditPartnerModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly partnerStore = inject(PartnerStore);
  private readonly modal = inject(NzModalRef);
  private readonly message = inject(NzMessageService);

  // Inject modal data using NZ_MODAL_DATA token
  private readonly modalData = inject<{ partner: Partner }>(NZ_MODAL_DATA);

  loading = signal(false);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    type: ['', [Validators.required]],
    company_name: ['', [Validators.maxLength(100)]],
    contact_email: ['', [Validators.email]],
    contact_phone: ['', [Validators.maxLength(20)]],
    description: ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    // Populate form with existing partner data
    const partner = this.modalData.partner;
    this.form.patchValue({
      name: partner.name,
      type: partner.type,
      company_name: partner.company_name || '',
      contact_email: partner.contact_email || '',
      contact_phone: partner.contact_phone || '',
      description: partner.description || ''
    });
  }

  get nameErrorTip(): string {
    const nameControl = this.form.get('name');
    if (nameControl?.hasError('required')) {
      return '請輸入夥伴名稱';
    }
    if (nameControl?.hasError('minlength')) {
      return '夥伴名稱至少需要 2 個字符';
    }
    if (nameControl?.hasError('maxlength')) {
      return '夥伴名稱最多 50 個字符';
    }
    return '';
  }

  cancel(): void {
    this.modal.close();
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.message.error('表單驗證失敗，請檢查輸入');
      return;
    }

    this.loading.set(true);

    try {
      const formValue = this.form.value;
      await this.partnerStore.updatePartner(this.modalData.partner.id, {
        name: formValue.name.trim(),
        type: formValue.type as PartnerType,
        company_name: formValue.company_name?.trim() || null,
        contact_email: formValue.contact_email?.trim() || null,
        contact_phone: formValue.contact_phone?.trim() || null,
        description: formValue.description?.trim() || null
      });

      const updatedPartner: Partner = {
        ...this.modalData.partner,
        name: formValue.name.trim(),
        type: formValue.type,
        company_name: formValue.company_name?.trim() || null,
        contact_email: formValue.contact_email?.trim() || null,
        contact_phone: formValue.contact_phone?.trim() || null,
        description: formValue.description?.trim() || null
      };

      this.modal.close(updatedPartner);
    } catch (error) {
      console.error('Failed to update partner:', error);
      this.message.error('更新夥伴失敗，請稍後再試');
    } finally {
      this.loading.set(false);
    }
  }
}
