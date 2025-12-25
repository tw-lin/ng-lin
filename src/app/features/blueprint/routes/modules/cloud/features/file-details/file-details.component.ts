/**
 * File Details Component
 * 檔案詳情元件
 *
 * Purpose: Display selected file information and version history
 * Features: Basic info, version info, version history list
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTagModule } from 'ng-zorro-antd/tag';

import type { CloudFile } from '../../cloud.model';

@Component({
  selector: 'app-file-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzDescriptionsModule, NzEmptyModule, NzListModule, NzTagModule, NzBadgeModule],
  template: `
    <nz-card nzTitle="檔案詳情">
      @if (file()) {
        <nz-descriptions [nzColumn]="1" [nzSize]="'small'">
          <nz-descriptions-item nzTitle="檔案名稱">
            {{ file()!.name }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="大小">
            {{ formatFileSize(file()!.size) }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="類型">
            {{ file()!.mimeType }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="副檔名"> .{{ file()!.extension }} </nz-descriptions-item>
          <nz-descriptions-item nzTitle="上傳者">
            {{ file()!.uploadedBy }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="上傳時間">
            {{ file()!.uploadedAt | date: 'yyyy-MM-dd HH:mm:ss' }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="更新時間">
            {{ file()!.updatedAt | date: 'yyyy-MM-dd HH:mm:ss' }}
          </nz-descriptions-item>
          <nz-descriptions-item nzTitle="狀態">
            <nz-badge
              [nzStatus]="file()!.status === 'synced' ? 'success' : 'processing'"
              [nzText]="file()!.status === 'synced' ? '已同步' : '處理中'"
            />
          </nz-descriptions-item>
        </nz-descriptions>

        <nz-divider />

        <div>
          <h4>版本資訊</h4>
          @if (file()!.version) {
            <nz-descriptions [nzColumn]="1" [nzSize]="'small'">
              <nz-descriptions-item nzTitle="目前版本"> v{{ file()!.version }} </nz-descriptions-item>
              @if (file()!.versionHistory && file()!.versionHistory!.length > 0) {
                <nz-descriptions-item nzTitle="歷史版本"> {{ file()!.versionHistory!.length }} 個版本 </nz-descriptions-item>
              }
            </nz-descriptions>

            @if (file()!.versionHistory && file()!.versionHistory!.length > 0) {
              <nz-divider nzText="版本歷史" nzOrientation="left" />
              <nz-list [nzDataSource]="file()!.versionHistory!" [nzSize]="'small'">
                <ng-template nz-list-item let-item>
                  <nz-list-item>
                    <nz-list-item-meta>
                      <nz-list-item-meta-title>
                        <span nz-icon nzType="history" class="mr-sm"></span>
                        版本 {{ item.versionNumber }}
                        @if (item.isCurrent) {
                          <nz-tag nzColor="blue">當前</nz-tag>
                        }
                      </nz-list-item-meta-title>
                      <nz-list-item-meta-description>
                        <div>{{ item.createdAt | date: 'yyyy-MM-dd HH:mm' }}</div>
                        @if (item.comment) {
                          <div>{{ item.comment }}</div>
                        }
                        <div>大小: {{ formatFileSize(item.size) }}</div>
                      </nz-list-item-meta-description>
                    </nz-list-item-meta>
                  </nz-list-item>
                </ng-template>
              </nz-list>
            }
          } @else {
            <p>目前版本：1.0（尚未啟用版本控制）</p>
            <p>版本控制功能可追蹤檔案變更歷史</p>
          }
        </div>
      } @else {
        <nz-empty nzNotFoundContent="請選擇檔案查看詳情" [nzNotFoundImage]="'simple'" />
      }
    </nz-card>
  `
})
export class FileDetailsComponent {
  // Input
  file = input<CloudFile | null>(null);

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
}
