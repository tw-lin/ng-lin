import { ChangeDetectionStrategy, Component, effect, inject, input, output, computed, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { Agreement } from './agreement.model';
import { AgreementService } from './agreement.service';

@Component({
  selector: 'app-agreement-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzTableModule, NzTagModule, NzEmptyModule, NzSpinModule, NzIconModule],
  template: `
    <nz-card nzTitle="協議概況" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="8">
          <div class="stat">
            <div class="stat__label">總數</div>
            <div class="stat__value">{{ totalCount() }}</div>
          </div>
        </nz-col>
        <nz-col [nzSpan]="8">
          <div class="stat">
            <div class="stat__label">有效</div>
            <div class="stat__value">{{ activeCount() }}</div>
          </div>
        </nz-col>
        <nz-col [nzSpan]="8">
          <div class="stat">
            <div class="stat__label">草稿</div>
            <div class="stat__value">{{ draftCount() }}</div>
          </div>
        </nz-col>
      </nz-row>
    </nz-card>

    <nz-card nzTitle="協議列表" [nzExtra]="createTpl">
      <ng-template #createTpl>
        <button nz-button nzType="primary" nzSize="small" (click)="createAgreement()">新增協議</button>
      </ng-template>
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (agreements().length === 0) {
        <nz-empty nzNotFoundContent="尚未建立協議" />
      } @else {
        <nz-table [nzData]="agreements()" nzSize="small" [nzShowPagination]="false">
          <thead>
            <tr>
              <th scope="col">序號</th>
              <th scope="col">附件</th>
              <th scope="col">解析狀態</th>
              <th scope="col">欄位4</th>
              <th scope="col">欄位5</th>
              <th scope="col">欄位6</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            @for (agreement of agreements(); track agreement.id; let idx = $index) {
              <tr>
                <td>{{ idx + 1 }}</td>
                <td>
                  <button
                    nz-button
                    nzType="link"
                    [disabled]="uploadingId() === agreement.id"
                    (click)="agreement.attachmentUrl ? viewAttachment(agreement.attachmentUrl) : triggerUpload(fileInput, agreement.id)"
                  >
                    <span nz-icon [nzType]="agreement.attachmentUrl ? 'eye' : 'plus'"></span>
                  </button>
                  <input
                    #fileInput
                    type="file"
                    accept="application/pdf"
                    style="display: none;"
                    (change)="onFileSelected($event, agreement.id)"
                  />
                </td>
                <td>
                  @if (parsingId() === agreement.id) {
                    <span nz-icon nzType="loading" nzTheme="outline"></span>
                    <span class="ml-xs">解析中...</span>
                  } @else if (agreement.parsedJsonUrl) {
                    <nz-tag nzColor="success">已解析</nz-tag>
                  } @else {
                    <nz-tag nzColor="default">未解析</nz-tag>
                  }
                </td>
                <td></td>
                <td></td>
                <td></td>
                <td class="text-right">
                  <button
                    nz-button
                    nzType="link"
                    nzSize="small"
                    [disabled]="!agreement.attachmentUrl || parsingId() === agreement.id"
                    [nzLoading]="parsingId() === agreement.id"
                    (click)="parse(agreement)"
                  >
                    {{ parsingId() === agreement.id ? '解析中' : '解析' }}
                  </button>
                  <button nz-button nzType="link" nzSize="small" (click)="onSelect(agreement)">檢視</button>
                  <button nz-button nzType="link" nzSize="small" (click)="edit(agreement)">編輯</button>
                  <button nz-button nzType="link" nzDanger nzSize="small" (click)="remove(agreement)">刪除</button>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      }
    </nz-card>
  `,
  styles: [
    `
      .stat {
        padding: 12px 8px;
      }

      .stat__label {
        color: #666;
        font-size: 12px;
      }

      .stat__value {
        font-size: 20px;
        font-weight: 600;
      }

      .text-right {
        text-align: right;
      }
    `
  ]
})
export class AgreementModuleViewComponent {
  blueprintId = input.required<string>();
  readonly agreementSelected = output<Agreement>();

  private readonly agreementService = inject(AgreementService);
  private readonly messageService = inject(NzMessageService);

  readonly agreements = this.agreementService.agreements;
  readonly loading = this.agreementService.loading;
  readonly totalCount = computed(() => this.agreements().length);
  readonly activeCount = computed(() => this.agreements().filter(a => a.status === 'active').length);
  readonly draftCount = computed(() => this.agreements().filter(a => a.status === 'draft').length);
  uploadingId = signal<string | null>(null);
  parsingId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.blueprintId();
      void this.agreementService.loadByBlueprint(id);
    });
  }

  async createAgreement(): Promise<void> {
    if (!this.blueprintId()) {
      return;
    }
    try {
      const created = await this.agreementService.createAgreement(this.blueprintId());
      this.messageService.success(`已新增協議 ${created.title}`);
    } catch (error) {
      this.messageService.error('新增協議失敗');
      console.error('[AgreementModuleView]', 'createAgreement failed', error);
    }
  }

  async parse(agreement: Agreement): Promise<void> {
    console.log('[AgreementModuleView] Starting parse', { agreementId: agreement.id });

    this.parsingId.set(agreement.id);
    try {
      await this.agreementService.parseAttachment(agreement);
      this.messageService.success('解析完成');
      console.log('[AgreementModuleView] Parse successful');
    } catch (error) {
      // 顯示詳細錯誤訊息
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      const errorCode = (error as any)?.code;

      let userMessage = '解析失敗';
      if (errorCode === 'functions/internal' || errorCode === 'internal') {
        userMessage =
          '解析失敗：後端伺服器錯誤（500）。請檢查：1) Cloud Function 環境變數是否已設定 (DOCUMENTAI_LOCATION, DOCUMENTAI_PROCESSOR_ID) 2) IAM 權限 3) 後端日誌。';
      } else if (errorCode === 'functions/deadline-exceeded' || errorCode === 'deadline-exceeded') {
        userMessage = '解析失敗：處理超時。請檢查：1) 後端日誌查看實際錯誤 2) Cloud Function 是否正常運作 3) Document AI 配額。';
      } else if (errorCode === 'permission-denied' || errorCode === 'functions/permission-denied') {
        userMessage = '解析失敗：權限不足。請檢查 Firebase 服務帳戶是否有 Document AI API 使用者角色 (roles/documentai.apiUser)。';
      } else if (errorCode === 'failed-precondition' || errorCode === 'functions/failed-precondition') {
        userMessage =
          '解析失敗：配置錯誤。請檢查 Cloud Function 環境變數：DOCUMENTAI_LOCATION=us, DOCUMENTAI_PROCESSOR_ID=d8cd080814899dc4';
      } else if (errorCode === 'unauthenticated' || errorCode === 'functions/unauthenticated') {
        userMessage = '解析失敗：認證失敗，請重新登入';
      } else if (errorMessage) {
        userMessage = `解析失敗：${errorMessage}`;
      }

      this.messageService.error(userMessage);
      console.error('[AgreementModuleView] Parse failed', {
        error,
        errorCode,
        errorMessage
      });
    } finally {
      this.parsingId.set(null);
      console.log('[AgreementModuleView] Parse process ended');
    }
  }

  edit(agreement: Agreement): void {
    const nextTitle = window.prompt('更新協議標題', agreement.title);
    if (nextTitle && nextTitle.trim() && nextTitle !== agreement.title) {
      this.agreementService.updateTitle(agreement.id, nextTitle.trim()).catch(error => {
        this.messageService.error('更新失敗');
        console.error('[AgreementModuleView]', 'edit failed', error);
      });
    }
  }

  remove(agreement: Agreement): void {
    const ok = window.confirm('確定刪除這筆協議？');
    if (!ok) return;
    this.agreementService.deleteAgreement(agreement.id).catch(error => {
      this.messageService.error('刪除失敗');
      console.error('[AgreementModuleView]', 'delete failed', error);
    });
  }

  onSelect(agreement: Agreement): void {
    const parsedPath = agreement.parsedJsonPath ?? `agreements/${agreement.id}/parsed.json`;

    if (!agreement.parsedJsonUrl) {
      this.messageService.info(`解析檔案預期路徑：${parsedPath}（尚未生成解析結果）`);
      this.agreementSelected.emit({ ...agreement, parsedJsonPath: parsedPath });
      return;
    }

    this.messageService.info(`解析檔案路徑：${parsedPath}`, { nzDuration: 6000 });
    window.open(agreement.parsedJsonUrl, '_blank');
    this.agreementSelected.emit({ ...agreement, parsedJsonPath: parsedPath });
  }

  triggerUpload(input: HTMLInputElement, agreementId: string): void {
    this.uploadingId.set(agreementId);
    input.click();
  }

  async onFileSelected(event: Event, agreementId: string): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    target.value = '';
    if (!file || !this.blueprintId()) {
      this.uploadingId.set(null);
      return;
    }
    try {
      await this.agreementService.uploadAttachment(this.blueprintId(), agreementId, file);
    } catch (error) {
      console.error('[AgreementModuleView]', 'Upload failed', error);
    } finally {
      this.uploadingId.set(null);
    }
  }

  viewAttachment(url: string): void {
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    window.open(viewerUrl, '_blank');
  }

  getStatusColor(status: Agreement['status']): string {
    const map: Record<Agreement['status'], string> = {
      draft: 'default',
      active: 'green',
      expired: 'volcano'
    };
    return map[status] ?? 'default';
  }

  getStatusLabel(status: Agreement['status']): string {
    const map: Record<Agreement['status'], string> = {
      draft: '草稿',
      active: '有效',
      expired: '到期'
    };
    return map[status] ?? status;
  }
}
