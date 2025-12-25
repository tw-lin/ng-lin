import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DependencyValidationResult } from '@core/blueprint/services';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

/**
 * 驗證警示元件
 *
 * 顯示藍圖配置的驗證錯誤與警告
 */
@Component({
  selector: 'app-validation-alerts',
  standalone: true,
  imports: [CommonModule, NzAlertModule, NzIconModule, NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="validation-alerts">
      <!-- 錯誤提示 -->
      @if (validationResult() && validationResult()!.errors.length > 0) {
        <nz-alert
          nzType="error"
          nzShowIcon
          [nzMessage]="errorTitle"
          [nzDescription]="errorDescription"
          nzCloseable
          class="validation-alert error-alert"
        >
          <ng-template #errorTitle>
            <strong>發現 {{ validationResult()!.errors.length }} 個配置錯誤</strong>
          </ng-template>
          <ng-template #errorDescription>
            <ul class="error-list">
              @for (error of validationResult()!.errors; track error.message) {
                <li>
                  <span class="error-icon" nz-icon nzType="close-circle" nzTheme="fill"></span>
                  <span class="error-message">{{ error.message }}</span>
                  @if (error.cyclePath && error.cyclePath.length > 0) {
                    <div class="cycle-path"> 循環路徑: {{ error.cyclePath.join(' → ') }} → {{ error.cyclePath[0] }} </div>
                  }
                </li>
              }
            </ul>
          </ng-template>
        </nz-alert>
      }

      <!-- 警告提示 -->
      @if (validationResult() && validationResult()!.warnings.length > 0) {
        <nz-alert
          nzType="warning"
          nzShowIcon
          [nzMessage]="warningTitle"
          [nzDescription]="warningDescription"
          nzCloseable
          class="validation-alert warning-alert"
        >
          <ng-template #warningTitle>
            <strong>發現 {{ validationResult()!.warnings.length }} 個警告</strong>
          </ng-template>
          <ng-template #warningDescription>
            <ul class="warning-list">
              @for (warning of validationResult()!.warnings; track warning.message) {
                <li>
                  <span class="warning-icon" nz-icon nzType="exclamation-circle" nzTheme="fill"></span>
                  <span class="warning-message">{{ warning.message }}</span>
                </li>
              }
            </ul>
          </ng-template>
        </nz-alert>
      }

      <!-- 成功提示 -->
      @if (validationResult() && validationResult()!.isValid && validationResult()!.warnings.length === 0) {
        <nz-alert
          nzType="success"
          nzShowIcon
          nzMessage="配置驗證通過"
          nzDescription="藍圖配置沒有發現錯誤或警告"
          nzCloseable
          class="validation-alert success-alert"
        />
      }
    </div>
  `,
  styles: [
    `
      .validation-alerts {
        margin-bottom: 16px;
      }

      .validation-alert {
        margin-bottom: 12px;
      }

      .error-list,
      .warning-list {
        margin: 8px 0 0 0;
        padding-left: 0;
        list-style: none;
      }

      .error-list li,
      .warning-list li {
        margin-bottom: 8px;
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .error-icon {
        font-size: 14px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .warning-icon {
        font-size: 14px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .error-message,
      .warning-message {
        flex: 1;
        line-height: 1.5;
      }

      .cycle-path {
        margin-top: 4px;
        padding: 8px 12px;
        border-left: 3px solid;
        border-radius: 2px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
      }
    `
  ]
})
export class ValidationAlertsComponent {
  /** 驗證結果 */
  validationResult = input<DependencyValidationResult | null>(null);
}
