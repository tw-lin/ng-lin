import { Routes } from '@angular/router';

export const FriendsRoutes: Routes = [
  {
    path: 'friends',
    loadComponent: () => import('../pages/friends.page').then(m => m.FriendsPageComponent)
  }
];

export default FriendsRoutes;
