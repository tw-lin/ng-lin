/**
 * Diary Form Component
 * 日誌表單元件
 *
 * Reusable form for creating and editing diary entries
 *
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, OnInit, input, output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';

import { Diary } from '../../../diary.model';

@Component({
  selector: 'app-diary-form',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="handleSubmit()">
      <!-- Date -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>日期</nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="請選擇日期">
          <nz-date-picker formControlName="date" nzFormat="yyyy-MM-dd" style="width: 100%;" />
        </nz-form-control>
      </nz-form-item>

      <!-- Title -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>標題</nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="請輸入標題">
          <input nz-input formControlName="title" placeholder="例如：地基開挖" />
        </nz-form-control>
      </nz-form-item>

      <!-- Description -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">描述</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <textarea nz-input formControlName="description" [nzAutosize]="{ minRows: 3, maxRows: 6 }" placeholder="工作內容描述"></textarea>
        </nz-form-control>
      </nz-form-item>

      <!-- Work Hours -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">工時</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-input-number formControlName="workHours" [nzMin]="0" [nzMax]="24" [nzStep]="0.5" style="width: 100%;" />
          <span style="margin-left: 8px;">小時</span>
        </nz-form-control>
      </nz-form-item>

      <!-- Workers -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">工人數</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-input-number formControlName="workers" [nzMin]="0" [nzMax]="1000" style="width: 100%;" />
          <span style="margin-left: 8px;">人</span>
        </nz-form-control>
      </nz-form-item>

      <!-- Equipment -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">設備</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <input nz-input formControlName="equipment" placeholder="例如：挖土機、卡車" />
        </nz-form-control>
      </nz-form-item>

      <!-- Weather -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">天氣</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-select formControlName="weather" nzPlaceHolder="選擇天氣" nzAllowClear style="width: 100%;">
            <nz-option nzValue="晴" nzLabel="晴"></nz-option>
            <nz-option nzValue="多雲" nzLabel="多雲"></nz-option>
            <nz-option nzValue="陰" nzLabel="陰"></nz-option>
            <nz-option nzValue="雨" nzLabel="雨"></nz-option>
            <nz-option nzValue="大雨" nzLabel="大雨"></nz-option>
            <nz-option nzValue="雷雨" nzLabel="雷雨"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <!-- Temperature -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">溫度</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-input-number formControlName="temperature" [nzMin]="-20" [nzMax]="50" style="width: 100%;" />
          <span style="margin-left: 8px;">°C</span>
        </nz-form-control>
      </nz-form-item>

      <!-- Hidden submit button for programmatic submission -->
      <button type="submit" style="display: none;">Submit</button>
    </form>
  `
})
export class DiaryFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  // Inputs
  diary = input<Diary | null>(null);
  isView = input<boolean>(false);

  // Outputs
  formReady = output<FormGroup>();

  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.formReady.emit(this.form);
  }

  private initForm(): void {
    const diary = this.diary();
    const isView = this.isView();

    // Convert diary.date to Date object if it exists
    const diaryDate = diary?.date ? new Date(diary.date) : null;

    this.form = this.fb.group({
      date: [{ value: diaryDate, disabled: isView }, [Validators.required]],
      title: [{ value: diary?.title || '', disabled: isView }, [Validators.required, Validators.maxLength(100)]],
      description: [{ value: diary?.description || '', disabled: isView }, [Validators.maxLength(1000)]],
      workHours: [{ value: diary?.workHours || null, disabled: isView }],
      workers: [{ value: diary?.workers || null, disabled: isView }],
      equipment: [{ value: diary?.equipment || '', disabled: isView }],
      weather: [{ value: diary?.weather || null, disabled: isView }],
      temperature: [{ value: diary?.temperature || null, disabled: isView }]
    });
  }

  handleSubmit(): void {
    if (this.form.valid) {
      // Form submission is handled by parent component
    }
  }
}
