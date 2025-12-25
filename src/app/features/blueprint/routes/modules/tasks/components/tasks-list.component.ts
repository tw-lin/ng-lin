import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

import { TasksFacade } from '../services/tasks.facade';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS],
  template: `
    <page-header [title]="'任務 (Tasks)'" />
    <nz-card>
      <p class="text-muted">Tasks 模組雛形，使用 @angular/fire 透過 Repository 讀取資料。</p>
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (tasks().length === 0) {
        <nz-alert nzType="info" nzMessage="尚未有任務資料" />
      } @else {
        <nz-list [nzDataSource]="tasks()" [nzRenderItem]="item">
          <ng-template #item let-task>
            <nz-list-item>
              <nz-list-item-meta [nzTitle]="task.title || '未命名任務'" [nzDescription]="task.status || '未設定狀態'" />
            </nz-list-item>
          </ng-template>
        </nz-list>
      }
    </nz-card>
  `
})
export class TasksListComponent {
  private readonly facade = inject(TasksFacade);

  readonly blueprintId = input.required<string>();
  readonly tasks = computed(() => this.facade.tasksState.data());
  readonly loading = computed(() => this.facade.tasksState.loading());

  constructor() {
    this.facade.ensureLoaded(this.blueprintId);
  }
}
