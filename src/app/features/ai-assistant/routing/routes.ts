import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/ai-assistant.component').then(m => m.AIAssistantComponent),
    data: { title: 'AI 助理' }
  }
];
