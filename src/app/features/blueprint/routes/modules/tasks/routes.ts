import { Routes } from '@angular/router';

import { TasksListComponent } from './components/tasks-list.component';
import { TasksShellComponent } from './tasks-shell.component';

export const TASKS_ROUTES: Routes = [
  {
    path: '',
    component: TasksShellComponent,
    children: [
      {
        path: '',
        component: TasksListComponent
      }
    ]
  }
];
