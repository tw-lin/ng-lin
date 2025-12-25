/**
 * Folder Name Input Component
 * 資料夾名稱輸入元件
 *
 * Feature: Folder Management
 * Responsibility: Provide folder name input in modal
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-folder-name-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, ReactiveFormsModule, NzInputModule, NzFormModule],
  template: `
    <nz-form-item>
      <nz-form-label>{{ label }}</nz-form-label>
      <nz-form-control>
        <input nz-input [formControl]="folderNameControl" placeholder="請輸入資料夾名稱" autofocus />
      </nz-form-control>
    </nz-form-item>
  `,
  styles: [
    `
      nz-form-item {
        margin-bottom: 0;
      }
    `
  ]
})
export class FolderNameInputComponent {
  folderNameControl!: FormControl;
  label = '資料夾名稱';
}
