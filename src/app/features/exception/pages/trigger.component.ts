import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DA_SERVICE_TOKEN } from '@delon/auth';
import { _HttpClient } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMessageService } from 'ng-zorro-antd/message';
import { firstValueFrom } from 'rxjs';

/**
 * Exception Trigger Component
 * 異常觸發元件 - 用於測試錯誤處理
 *
 * ✅ Modernized: Simplified error handling
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'exception-trigger',
  template: `
    <div class="pt-lg">
      <nz-card>
        @for (t of types; track $index) {
          <button (click)="go(t)" nz-button nzDanger>触发{{ t }}</button>
        }
        <button nz-button nzType="link" (click)="refresh()">触发刷新Token</button>
      </nz-card>
    </div>
  `,
  imports: [NzCardModule, NzButtonModule]
})
export class ExceptionTriggerComponent {
  private readonly http = inject(_HttpClient);
  private readonly tokenService = inject(DA_SERVICE_TOKEN);
  private readonly message = inject(NzMessageService);

  types = [401, 403, 404, 500];

  /**
   * Trigger error by type
   * ✅ Using async/await with firstValueFrom for modern RxJS
   */
  async go(type: number): Promise<void> {
    try {
      await firstValueFrom(this.http.get(`/api/${type}`));
    } catch (error) {
      console.log(`Triggered ${type} error:`, error);
      this.message.error(`觸發 ${type} 錯誤`);
    }
  }

  /**
   * Refresh token test
   * ✅ Using async/await with firstValueFrom for modern RxJS
   */
  async refresh(): Promise<void> {
    try {
      this.tokenService.set({ token: 'invalid-token' });
      // 必須提供一個後端地址，無法通過 Mock 來模擬
      await firstValueFrom(this.http.post(`https://localhost:5001/auth`));
      console.log('Token refresh 成功');
      this.message.success('Token 已刷新');
    } catch (error) {
      console.log('Token refresh 失敗:', error);
      this.message.error('Token 刷新失敗');
    }
  }
}
