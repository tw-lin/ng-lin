/**
 * Application Route Configuration
 * 
 * @module routes
 * @description
 * Main route definitions for the ng-lin construction site progress tracking system.
 * Implements lazy-loading strategy for optimal performance and code splitting.
 * 
 * Route Architecture:
 * - Feature-based module organization
 * - Lazy loading for all feature modules
 * - Authentication guards on protected routes
 * - Redirect strategy for legacy routes
 * 
 * Feature Modules:
 * 1. **Account Module** (account/*) - User, Organization, Team, Partner, Admin management
 * 2. **Blueprint Module** (blueprints/*) - Construction blueprint management (user/organization)
 * 3. **Explore Module** (explore/*) - Search and discovery features
 * 4. **AI Assistant** (ai-assistant) - Google Generative AI powered chat assistant
 * 5. **Auth Module** (passport/*) - Login, register, password recovery
 * 6. **Exception Module** (exception/*) - Error pages (404, 403, 500)
 * 
 * Multi-Tenancy Model:
 * - Blueprint-based permission boundaries
 * - User blueprints vs Organization blueprints
 * - BlueprintMember role/permission enforcement
 * 
 * Authentication:
 * - Firebase Auth integration
 * - @delon/auth guards (authSimpleCanActivate, authSimpleCanActivateChild)
 * - Custom startPageGuard for initial navigation
 * 
 * @see {@link ./account/routes/routes.ts} for account module routes
 * @see {@link ./blueprint/routes/routes.ts} for blueprint module routes
 * @see {@link ./auth/routes.ts} for authentication routes
 * @see {@link docs/⭐️/整體架構設計.md} for architecture details
 * @see {@link .github/instructions/ng-gighub-architecture.instructions.md} for architecture guidelines
 */

import { Routes } from '@angular/router';
import { startPageGuard } from '@core';
import { authSimpleCanActivate, authSimpleCanActivateChild } from '@delon/auth';

import { LayoutBasicComponent } from '../layout';

export const routes: Routes = [
  {
    path: '',
    component: LayoutBasicComponent,
    canActivate: [startPageGuard, authSimpleCanActivate],
    canActivateChild: [authSimpleCanActivateChild],
    data: {},
    children: [
      // Redirect to user blueprints as default dashboard
      { path: '', redirectTo: 'blueprints/user', pathMatch: 'full' },
      { path: 'dashboard', redirectTo: 'blueprints/user', pathMatch: 'full' },
      { path: 'dashboard/user', redirectTo: 'blueprints/user', pathMatch: 'full' },
      // Account module - User, Organization, Team, Partner, Admin management
      {
        path: 'account',
        loadChildren: () => import('./account/routes/routes').then(m => m.routes),
        data: { title: '帳戶管理' }
      },
      // Legacy routes - redirect to account module
      {
        path: 'user',
        redirectTo: 'account/user',
        pathMatch: 'prefix'
      },
      {
        path: 'organization',
        redirectTo: 'account/organization',
        pathMatch: 'prefix'
      },
      {
        path: 'team',
        redirectTo: 'account/team',
        pathMatch: 'prefix'
      },
      {
        path: 'partner',
        redirectTo: 'account/partner',
        pathMatch: 'prefix'
      },
      // Blueprint module - lazy loaded feature module
      {
        path: 'blueprints/user',
        loadChildren: () => import('./blueprint/routes/routes').then(m => m.routes),
        data: { title: '我的藍圖' }
      },
      {
        path: 'blueprints/organization',
        loadChildren: () => import('./blueprint/routes/routes').then(m => m.routes),
        data: { title: '組織藍圖' }
      },
      // Admin - redirect to account/admin
      {
        path: 'admin',
        redirectTo: 'account/admin',
        pathMatch: 'prefix'
      },
      // Explore search module - lazy loaded
      {
        path: 'explore',
        loadChildren: () => import('./explore/routing/routes').then(m => m.routes),
        data: { title: '探索' }
      },
      // AI Assistant - Google Generative AI powered chat assistant
      {
        path: 'ai-assistant',
        loadComponent: () => import('./ai-assistant/pages/ai-assistant.component').then(m => m.AIAssistantComponent),
        data: { title: 'AI 助理' }
      }
    ]
  },
  // passport - lazy loaded (features/auth)
  { path: '', loadChildren: () => import('./auth/routes').then(m => m.routes) },
  // exception - lazy loaded
  { path: 'exception', loadChildren: () => import('./exception/routing/routes').then(m => m.routes) },
  // 404 fallback
  { path: '**', redirectTo: 'exception/404' }
];
