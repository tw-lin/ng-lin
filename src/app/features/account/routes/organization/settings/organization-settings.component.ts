import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ContextType } from '@core';
import { OrganizationRepository } from '@core/account/repositories';
import { SHARED_IMPORTS, WorkspaceContextService } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzMessageService } from 'ng-zorro-antd/message';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-organization-settings',
  standalone: true,
  imports: [SHARED_IMPORTS, NzAlertModule],
  template: `
    <page-header [title]="'組織設定'" [content]="headerContent"></page-header>

    <ng-template #headerContent>
      <div>調整組織偏好與資訊。</div>
    </ng-template>

    @if (!isOrganizationContext()) {
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="請切換到組織上下文"
        nzDescription="請使用頂部導航列的工作區切換器切換到目標組織後再更新設定。"
        class="mb-md"
      />
    } @else {
      <nz-card nzTitle="基本資訊">
        <form nz-form [formGroup]="form" nzLayout="vertical" (ngSubmit)="save()">
          <nz-form-item>
            <nz-form-label [nzRequired]="true">組織名稱</nz-form-label>
            <nz-form-control [nzErrorTip]="'請輸入 2-50 字元的組織名稱'">
              <input nz-input formControlName="name" placeholder="輸入組織名稱" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>組織描述</nz-form-label>
            <nz-form-control>
              <textarea
                nz-input
                formControlName="description"
                placeholder="輸入組織描述"
                [nzAutosize]="{ minRows: 3, maxRows: 6 }"
              ></textarea>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>隱私設定</nz-form-label>
            <nz-form-control>
              <label nz-checkbox formControlName="isDiscoverable">
                允許他人在探索頁面搜尋到此組織
                <nz-tag nzColor="blue" class="ml-sm">公開</nz-tag>
              </label>
              <div class="form-hint">
                <span nz-icon nzType="info-circle" nzTheme="outline"></span>
                關閉後，其他使用者將無法在探索頁面搜尋到此組織
              </div>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-control>
              <button nz-button nzType="primary" [nzLoading]="saving()" [disabled]="form.invalid || loading()"> 儲存設定 </button>
            </nz-form-control>
          </nz-form-item>
        </form>
      </nz-card>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .form-hint {
        margin-top: 4px;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.45);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly message = inject(NzMessageService);
  private readonly organizationRepository = inject(OrganizationRepository);

  readonly activeLabel = computed(() => this.workspaceContext.contextLabel());
  readonly contextId = computed(() => this.workspaceContext.contextId());

  saving = signal(false);
  loading = signal(true);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: [''],
    isDiscoverable: [true]
  });

  async ngOnInit(): Promise<void> {
    if (this.isOrganizationContext()) {
      await this.loadOrganizationData();
    }
  }

  isOrganizationContext(): boolean {
    return this.workspaceContext.contextType() === ContextType.ORGANIZATION;
  }

  private async loadOrganizationData(): Promise<void> {
    this.loading.set(true);
    try {
      const organizationId = this.contextId();
      if (!organizationId) {
        this.message.error('無法取得組織 ID');
        this.loading.set(false);
        return;
      }

      const organization = await firstValueFrom(this.organizationRepository.findById(organizationId));
      if (organization) {
        this.form.patchValue({
          name: organization.name,
          description: organization.description || '',
          isDiscoverable: organization.is_discoverable !== false // Default to true
        });
      }
    } catch (error) {
      console.error('[OrganizationSettings] Failed to load organization:', error);
      this.message.error('載入設定失敗');
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      });
      return;
    }

    if (!this.isOrganizationContext()) {
      this.message.warning('請先切換到組織上下文');
      return;
    }

    const organizationId = this.contextId();
    if (!organizationId) {
      this.message.error('無法取得組織 ID');
      return;
    }

    this.saving.set(true);
    try {
      const name = this.form.value.name;
      const description = this.form.value.description;
      const isDiscoverable = this.form.value.isDiscoverable;

      await this.organizationRepository.update(organizationId, {
        name: name!,
        description: description || null,
        is_discoverable: isDiscoverable!
      });

      const discoverabilityStatus = isDiscoverable ? '公開' : '私密';
      this.message.success(`已更新「${name}」的設定（可搜尋性：${discoverabilityStatus}）`);
    } catch (error) {
      console.error('[OrganizationSettings] Failed to save:', error);
      this.message.error('儲存設定失敗');
    } finally {
      this.saving.set(false);
    }
  }
}
