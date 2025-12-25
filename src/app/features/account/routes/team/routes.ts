import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'members', pathMatch: 'full' },
  {
    path: 'members',
    loadComponent: () => import('./members/team-members.component').then(m => m.TeamMembersComponent),
    data: { title: '團隊成員' }
  },
  {
    path: 'schedule',
    loadComponent: () => import('./schedule/team-schedule.component').then(m => m.TeamScheduleComponent),
    data: { title: '團隊排程' }
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/team-settings.component').then(m => m.TeamSettingsComponent),
    data: { title: '團隊設定' }
  }
];
