/**
 * Folder Tree Component
 * 資料夾樹狀導航元件
 *
 * Purpose: Display folder tree with navigation and actions
 * Features: Tree view, folder selection, rename folder
 */

import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTreeModule, NzTreeNodeOptions } from 'ng-zorro-antd/tree';

@Component({
  selector: 'app-folder-tree',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzTreeModule, NzEmptyModule],
  template: `
    <nz-card nzTitle="資料夾">
      @if (treeData().length > 0) {
        <nz-tree [nzData]="treeData()" [nzSelectedKeys]="selectedKeys()" (nzClick)="folderClick.emit($event)">
          <ng-template #nzTreeTemplate let-node let-origin="origin">
            <span class="tree-node-title">
              <span nz-icon [nzType]="node.icon" nzTheme="outline"></span>
              <span class="node-title">{{ node.title }}</span>
              @if (node.key !== 'root') {
                <span class="node-actions" (click)="$event.stopPropagation()">
                  <button nz-button nzType="text" nzSize="small" nz-tooltip="重新命名" (click)="renameFolder.emit(node.key)">
                    <span nz-icon nzType="edit" nzTheme="outline"></span>
                  </button>
                </span>
              }
            </span>
          </ng-template>
        </nz-tree>
      } @else {
        <nz-empty nzNotFoundContent="暫無資料夾" [nzNotFoundImage]="'simple'" />
      }
    </nz-card>
  `,
  styles: [
    `
      .tree-node-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      }

      .node-title {
        margin-left: 8px;
        flex: 1;
      }

      .node-actions {
        opacity: 0;
        transition: opacity 0.3s;
      }

      .tree-node-title:hover .node-actions {
        opacity: 1;
      }
    `
  ]
})
export class FolderTreeComponent {
  // Inputs
  treeData = input.required<NzTreeNodeOptions[]>();
  selectedKeys = input.required<string[]>();

  // Outputs
  folderClick = output<any>();
  renameFolder = output<string>();
}
