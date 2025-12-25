import { Routes } from '@angular/router';

import { ExplorePageComponent } from '../pages/explore-page.component';

/**
 * Explore Module Routes
 *
 * Provides routing for the Explore search feature.
 */
export const routes: Routes = [
  {
    path: '',
    component: ExplorePageComponent,
    data: { title: '探索' }
  }
];
