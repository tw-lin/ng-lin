import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'settings', pathMatch: 'full' },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.UserSettingsComponent),
    data: { title: '個人設定' }
  },
  {
    path: 'notification-settings',
    loadComponent: () => import('./settings/notification-settings.component').then(m => m.NotificationSettingsComponent),
    data: { title: '通知設定' }
  },
  {
    path: 'todo',
    loadComponent: () => import('./todo/user-todo.component').then(m => m.UserTodoComponent),
    data: { title: '個人待辦' }
  }
];
