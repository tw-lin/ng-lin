import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'members', pathMatch: 'full' },
  {
    path: 'members',
    loadComponent: () => import('./members/organization-members.component').then(m => m.OrganizationMembersComponent),
    data: { title: '組織成員' }
  },
  {
    path: 'teams',
    loadComponent: () => import('./members/team/organization-teams.component').then(m => m.OrganizationTeamsComponent),
    data: { title: '團隊管理' }
  },
  {
    path: 'partners',
    loadComponent: () => import('./members/partner/organization-partners.component').then(m => m.OrganizationPartnersComponent),
    data: { title: '夥伴管理' }
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/organization-settings.component').then(m => m.OrganizationSettingsComponent),
    data: { title: '組織設定' }
  },
  {
    path: 'schedule',
    loadComponent: () => import('./schedule/organization-schedule.component').then(m => m.OrganizationScheduleComponent),
    data: { title: '組織排程' }
  },
  {
    path: 'repository',
    loadComponent: () => import('./repository/organization-repository.component').then(m => m.OrganizationRepositoryComponent),
    data: { title: '組織倉庫' }
  }
];
