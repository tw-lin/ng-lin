import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'members', pathMatch: 'full' },
  {
    path: 'members',
    loadComponent: () => import('./members/partner-members.component').then(m => m.PartnerMembersComponent),
    data: { title: '夥伴成員' }
  },
  {
    path: 'schedule',
    loadComponent: () => import('./schedule/partner-schedule.component').then(m => m.PartnerScheduleComponent),
    data: { title: '夥伴排程' }
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/partner-settings.component').then(m => m.PartnerSettingsComponent),
    data: { title: '夥伴設定' }
  }
];
