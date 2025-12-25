import { Routes } from '@angular/router';

import { ContractListComponent } from './components/contract-list.component';
import { ContractShellComponent } from './contract-shell.component';

export const CONTRACT_ROUTES: Routes = [
  {
    path: '',
    component: ContractShellComponent,
    children: [
      {
        path: '',
        component: ContractListComponent
      }
    ]
  }
];
