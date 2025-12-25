import { Component, ChangeDetectionStrategy, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthFacade, Blueprint, CreateBlueprintRequest, LoggerService, ModuleType, OwnerType, ContextType } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService } from '@shared';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

import { BlueprintFeatureService } from '../services/blueprint.service';

/**
 * Blueprint Create/Edit Modal Component
 * 藍圖建立/編輯模態元件
 *
 * ✅ Modernized with:
 * - Signals for reactive state
 * - takeUntilDestroyed for subscription management
 * - async/await for operations
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-blueprint-modal',
  standalone: true,
  imports: [SHARED_IMPORTS, NzFormModule],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="submit()">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>名稱</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="請輸入藍圖名稱（至少 3 個字元）">
          <input nz-input formControlName="name" placeholder="輸入藍圖名稱" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>Slug</nz-form-label>
        <nz-form-control
          [nzSpan]="16"
          nzErrorTip="請輸入 slug（小寫字母、數字和連字符）"
          nzExtra="URL 友善的識別碼（小寫字母、數字和連字符）"
        >
          <input nz-input formControlName="slug" placeholder="my-blueprint" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6">描述</nz-form-label>
        <nz-form-control [nzSpan]="16" nzErrorTip="描述不能超過 500 字">
          <textarea
            nz-input
            formControlName="description"
            [nzAutosize]="{ minRows: 3, maxRows: 6 }"
            placeholder="輸入藍圖描述（選填）"
          ></textarea>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6">可見性</nz-form-label>
        <nz-form-control [nzSpan]="16" nzExtra="公開藍圖可被其他使用者檢視">
          <label nz-checkbox formControlName="isPublic"> 公開藍圖 </label>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6">啟用模組</nz-form-label>
        <nz-form-control [nzSpan]="16">
          <nz-checkbox-group formControlName="enabledModules"></nz-checkbox-group>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-control [nzOffset]="6" [nzSpan]="16">
          <button nz-button nzType="primary" type="submit" [nzLoading]="submitting()" [disabled]="!form.valid">
            {{ isEdit ? '更新' : '建立' }}
          </button>
          <button nz-button type="button" class="ml-sm" (click)="cancel()" [disabled]="submitting()"> 取消 </button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `
})
export class BlueprintModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly modal = inject(NzModalRef);
  private readonly message = inject(NzMessageService);
  private readonly logger = inject(LoggerService);
  private readonly blueprintService = inject(BlueprintFeatureService);
  private readonly auth = inject(AuthFacade);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly data: { blueprint?: Blueprint } = inject(NZ_MODAL_DATA, { optional: true }) || {};
  private readonly destroyRef = inject(DestroyRef);

  // ✅ Modern Pattern: Use Signals
  submitting = signal(false);
  isEdit = false;

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    description: ['', [Validators.maxLength(500)]],
    isPublic: [false],
    enabledModules: [[]]
  });

  // Available modules
  availableModules = [
    { label: '任務管理', value: 'tasks' as ModuleType },
    { label: '日誌記錄', value: 'logs' as ModuleType },
    { label: '品質驗收', value: 'quality' as ModuleType },
    { label: '施工日誌', value: 'diary' as ModuleType },
    { label: '儀表板', value: 'dashboard' as ModuleType },
    { label: '文件管理', value: 'files' as ModuleType },
    { label: '待辦事項', value: 'todos' as ModuleType },
    { label: '檢查清單', value: 'checklists' as ModuleType },
    { label: '問題追蹤', value: 'issues' as ModuleType },
    { label: '自動化流程', value: 'bot_workflow' as ModuleType }
  ];

  ngOnInit(): void {
    // Initialize checkbox group options
    this.form.get('enabledModules')?.setValue(this.availableModules);

    // If editing, populate form
    if (this.data.blueprint) {
      this.isEdit = true;
      this.populateForm(this.data.blueprint);
    } else {
      // ✅ Auto-generate slug from name with proper cleanup
      this.form
        .get('name')
        ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(name => {
          if (name && !this.isEdit) {
            const slug = this.generateSlug(name);
            this.form.get('slug')?.setValue(slug, { emitEvent: false });
          }
        });
    }
  }

  /**
   * Populate form with blueprint data
   * 填充表單資料
   */
  private populateForm(blueprint: Blueprint): void {
    this.form.patchValue({
      name: blueprint.name,
      slug: blueprint.slug,
      description: blueprint.description,
      isPublic: blueprint.isPublic,
      enabledModules: this.availableModules.filter(m => blueprint.enabledModules.includes(m.value))
    });
  }

  /**
   * Generate slug from name
   * 從名稱產生 slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');
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

    const user = this.auth.currentUser;
    if (!user || typeof user !== 'object' || !('uid' in user)) {
      this.message.error('請先登入');
      return;
    }

    this.submitting.set(true);

    try {
      const formValue = this.form.value;
      const enabledModules = formValue.enabledModules.filter((m: any) => m.checked).map((m: any) => m.value);

      if (this.isEdit) {
        // Update existing blueprint
        await this.blueprintService.update(this.data.blueprint!.id, {
          name: formValue.name!,
          slug: formValue.slug!,
          description: formValue.description,
          isPublic: formValue.isPublic,
          enabledModules
        });
        this.message.success('藍圖已更新');
      } else {
        // Create new blueprint - use current workspace context (Occam's Razor: single source of truth)
        const contextType = this.workspaceContext.contextType();
        const contextId = this.workspaceContext.contextId();

        // Determine owner based on current context
        // Note: Teams cannot own blueprints - they are organization sub-accounts
        let ownerId: string;
        let ownerType: OwnerType;

        if (contextType === ContextType.ORGANIZATION && contextId) {
          // Creating under organization context
          ownerId = contextId;
          ownerType = OwnerType.ORGANIZATION;
        } else if (contextType === ContextType.TEAM && contextId) {
          // Team context: Create under the team's organization
          // Teams are internal sub-accounts and cannot own blueprints
          // TODO: Fetch team's organization ID and use that as owner
          this.message.error('團隊無法直接擁有藍圖。請切換至組織視角或個人視角建立藍圖。');
          return;
        } else {
          // Default to user context
          ownerId = (user as any).uid;
          ownerType = OwnerType.USER;
        }

        const request: CreateBlueprintRequest = {
          name: formValue.name!,
          slug: formValue.slug!,
          description: formValue.description,
          ownerId,
          ownerType,
          isPublic: formValue.isPublic,
          enabledModules,
          createdBy: (user as any).uid
        };

        const blueprint = await this.blueprintService.create(request);
        this.message.success(`藍圖已在${ownerType === OwnerType.ORGANIZATION ? '組織' : '個人'}視角建立`);
        this.modal.close(blueprint);
        return;
      }

      this.modal.close(true);
    } catch (error) {
      this.message.error(this.isEdit ? '更新藍圖失敗' : '建立藍圖失敗');
      this.logger.error('[BlueprintModalComponent]', 'Failed to save blueprint', error as Error);
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
