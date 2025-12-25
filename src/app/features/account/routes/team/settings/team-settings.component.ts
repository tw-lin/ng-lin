import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-team-settings',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <page-header [title]="'團隊設定'" [content]="headerContent"></page-header>

    <ng-template #headerContent>
      <div class="header-desc">
        <span nz-icon nzType="setting" nzTheme="outline" class="mr-xs"></span>
        配置團隊偏好與工作規範
      </div>
    </ng-template>

    <nz-card [nzTitle]="'基本設定'" class="mb-lg">
      <form nz-form [formGroup]="basicForm" nzLayout="vertical">
        <nz-form-item>
          <nz-form-label [nzRequired]="true">團隊名稱</nz-form-label>
          <nz-form-control [nzErrorTip]="'請輸入團隊名稱'">
            <input nz-input formControlName="teamName" placeholder="輸入團隊名稱" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>團隊描述</nz-form-label>
          <nz-form-control>
            <textarea
              nz-input
              formControlName="description"
              [nzAutosize]="{ minRows: 3, maxRows: 6 }"
              placeholder="輸入團隊簡介（選填）"
            ></textarea>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>時區</nz-form-label>
          <nz-form-control>
            <nz-select formControlName="timezone" nzPlaceHolder="選擇時區">
              <nz-option nzValue="Asia/Taipei" nzLabel="Asia/Taipei (UTC+8)"></nz-option>
              <nz-option nzValue="Asia/Shanghai" nzLabel="Asia/Shanghai (UTC+8)"></nz-option>
              <nz-option nzValue="Asia/Tokyo" nzLabel="Asia/Tokyo (UTC+9)"></nz-option>
              <nz-option nzValue="UTC" nzLabel="UTC (UTC+0)"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-control>
            <button nz-button nzType="primary" [nzLoading]="saving()" (click)="saveBasic()"> 儲存基本設定 </button>
          </nz-form-control>
        </nz-form-item>
      </form>
    </nz-card>

    <nz-card [nzTitle]="'工作偏好'">
      <form nz-form [formGroup]="preferencesForm" nzLayout="vertical">
        <nz-form-item>
          <nz-form-label>工作時間</nz-form-label>
          <nz-form-control>
            <nz-time-picker formControlName="workStartTime" nzFormat="HH:mm" nzPlaceHolder="開始時間" class="mr-sm"></nz-time-picker>
            <span class="mr-sm">至</span>
            <nz-time-picker formControlName="workEndTime" nzFormat="HH:mm" nzPlaceHolder="結束時間"></nz-time-picker>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>每日站會時間</nz-form-label>
          <nz-form-control>
            <nz-time-picker
              formControlName="dailyStandupTime"
              nzFormat="HH:mm"
              nzPlaceHolder="選擇每日站會時間"
              class="w-full"
            ></nz-time-picker>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>Sprint 週期（天）</nz-form-label>
          <nz-form-control>
            <nz-input-number formControlName="sprintDuration" [nzMin]="7" [nzMax]="30" class="w-full"></nz-input-number>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>通知設定</nz-form-label>
          <nz-form-control>
            <label nz-checkbox formControlName="notifyOnTaskAssigned"> 任務分配時通知 </label>
            <br />
            <label nz-checkbox formControlName="notifyOnMeetingReminder"> 會議前提醒 </label>
            <br />
            <label nz-checkbox formControlName="notifyOnDeadline"> 截止日期提醒 </label>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-control>
            <button nz-button nzType="primary" [nzLoading]="saving()" (click)="savePreferences()"> 儲存工作偏好 </button>
          </nz-form-control>
        </nz-form-item>
      </form>
    </nz-card>
  `,
  styles: [
    `
      .header-desc {
        color: #9ca3af;
        font-size: 14px;
      }

      ::ng-deep .ant-form-item {
        margin-bottom: 24px;
      }
    `
  ]
})
export class TeamSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private message = inject(NzMessageService);

  saving = signal(false);

  basicForm = this.fb.group({
    teamName: ['開發團隊 Alpha', [Validators.required, Validators.minLength(2)]],
    description: ['負責核心產品開發與維護'],
    timezone: ['Asia/Taipei']
  });

  preferencesForm = this.fb.group({
    workStartTime: [new Date(2024, 0, 1, 9, 0)],
    workEndTime: [new Date(2024, 0, 1, 18, 0)],
    dailyStandupTime: [new Date(2024, 0, 1, 9, 30)],
    sprintDuration: [14],
    notifyOnTaskAssigned: [true],
    notifyOnMeetingReminder: [true],
    notifyOnDeadline: [true]
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    // TODO: Load from service
  }

  saveBasic(): void {
    if (this.basicForm.invalid) {
      this.message.error('請填寫必填欄位');
      return;
    }

    this.saving.set(true);

    setTimeout(() => {
      this.message.success('已儲存基本設定');
      this.saving.set(false);
    }, 500);
  }

  savePreferences(): void {
    this.saving.set(true);

    setTimeout(() => {
      this.message.success('已儲存工作偏好');
      this.saving.set(false);
    }, 500);
  }
}
