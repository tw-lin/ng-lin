import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthFacade } from '@core';
import { AccountRepository } from '@core/account/repositories';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <page-header [title]="'個人設定'" [content]="headerContent"></page-header>

    <ng-template #headerContent>
      <div>管理通知與偏好設定。</div>
    </ng-template>

    <nz-card>
      <form nz-form [formGroup]="form" nzLayout="vertical" (ngSubmit)="save()">
        <nz-form-item>
          <nz-form-label [nzRequired]="true">顯示名稱</nz-form-label>
          <nz-form-control [nzErrorTip]="'請輸入 2-50 字元的顯示名稱'">
            <input nz-input formControlName="displayName" placeholder="輸入顯示名稱" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>語言</nz-form-label>
          <nz-form-control>
            <nz-select formControlName="language" nzPlaceHolder="選擇介面語言">
              <nz-option nzLabel="繁體中文" nzValue="zh-TW"></nz-option>
              <nz-option nzLabel="English" nzValue="en-US"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>隱私設定</nz-form-label>
          <nz-form-control>
            <label nz-checkbox formControlName="isDiscoverable">
              允許他人在探索頁面搜尋到我
              <nz-tag nzColor="blue" class="ml-sm">公開</nz-tag>
            </label>
            <div class="form-hint">
              <span nz-icon nzType="info-circle" nzTheme="outline"></span>
              關閉後，其他使用者將無法在探索頁面搜尋到您的帳號
            </div>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>通知偏好</nz-form-label>
          <nz-form-control>
            <label nz-checkbox formControlName="emailUpdates">重要更新 Email 通知</label>
            <br />
            <label nz-checkbox formControlName="weeklySummary">每週摘要推播</label>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-control>
            <button nz-button nzType="primary" [nzLoading]="saving()" [disabled]="form.invalid || loading()"> 儲存設定 </button>
          </nz-form-control>
        </nz-form-item>
      </form>
    </nz-card>
  `,
  styles: [
    `
      .form-hint {
        margin-top: 4px;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.45);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly accountRepository = inject(AccountRepository);
  private readonly auth = inject(AuthFacade);

  saving = signal(false);
  loading = signal(true);

  form = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    language: ['zh-TW', [Validators.required]],
    isDiscoverable: [true],
    emailUpdates: [true],
    weeklySummary: [true]
  });

  async ngOnInit(): Promise<void> {
    await this.loadAccountData();
  }

  private async loadAccountData(): Promise<void> {
    this.loading.set(true);
    try {
      const user = this.auth.currentUser;
      if (!user) {
        this.message.error('無法取得使用者資訊');
        this.loading.set(false);
        return;
      }

      const account = await firstValueFrom(this.accountRepository.findById(user.uid));
      if (account) {
        this.form.patchValue({
          displayName: account.name,
          isDiscoverable: account.is_discoverable !== false // Default to true
        });
      }
    } catch (error) {
      console.error('[UserSettings] Failed to load account:', error);
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

    const user = this.authService.currentUser;
    if (!user) {
      this.message.error('無法取得使用者資訊');
      return;
    }

    this.saving.set(true);
    try {
      const displayName = this.form.value.displayName;
      const isDiscoverable = this.form.value.isDiscoverable;

      await this.accountRepository.update(user.uid, {
        name: displayName!,
        is_discoverable: isDiscoverable!
      });

      const discoverabilityStatus = isDiscoverable ? '公開' : '私密';
      this.message.success(`已更新「${displayName}」的設定（可搜尋性：${discoverabilityStatus}）`);
    } catch (error) {
      console.error('[UserSettings] Failed to save:', error);
      this.message.error('儲存設定失敗');
    } finally {
      this.saving.set(false);
    }
  }
}
