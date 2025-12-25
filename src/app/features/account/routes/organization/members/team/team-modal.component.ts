import { Component, ChangeDetectionStrategy, inject, input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Team } from '@core';
import { SHARED_IMPORTS } from '@shared';

/**
 * Team Modal Component
 * 團隊 Modal 元件 - 用於建立/編輯團隊
 *
 * Features:
 * - Create new team
 * - Edit existing team
 * - Form validation
 *
 * ✅ Modern Angular pattern with Reactive Forms
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-team-modal',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <form nz-form [formGroup]="form">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>團隊名稱</nz-form-label>
        <nz-form-control [nzSpan]="18" nzErrorTip="請輸入團隊名稱">
          <input nz-input formControlName="name" placeholder="請輸入團隊名稱" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label [nzSpan]="6">描述</nz-form-label>
        <nz-form-control [nzSpan]="18">
          <textarea nz-input formControlName="description" placeholder="請輸入團隊描述（選填）" rows="3"></textarea>
        </nz-form-control>
      </nz-form-item>
    </form>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class TeamModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  // Input: team for edit mode (optional)
  team = input<Team | null>(null);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(200)]]
  });

  ngOnInit(): void {
    // If editing, populate form
    const team = this.team();
    if (team) {
      this.form.patchValue({
        name: team.name,
        description: team.description || ''
      });
    }
  }

  /**
   * Get form data
   * ModalHelper will call this method
   */
  getData(): { name: string; description: string | null } {
    if (!this.form.valid) {
      throw new Error('Form is invalid');
    }

    return {
      name: this.form.value.name.trim(),
      description: this.form.value.description?.trim() || null
    };
  }

  /**
   * Check if form is valid
   */
  isValid(): boolean {
    return this.form.valid;
  }
}
