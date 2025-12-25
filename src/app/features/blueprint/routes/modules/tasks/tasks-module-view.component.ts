import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TasksListComponent } from './components/tasks-list.component';

@Component({
  selector: 'app-tasks-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TasksListComponent],
  template: ` <app-tasks-list [blueprintId]="blueprintId()" /> `
})
export class TasksModuleViewComponent {
  readonly blueprintId = input.required<string>();
}
