/**
 * Root Application Component
 * 
 * @module AppComponent
 * @description
 * Main application shell component for the ng-lin construction site progress tracking system.
 * Implements Angular 20 standalone component architecture with OnPush change detection.
 * 
 * Responsibilities:
 * 1. Router outlet container for feature modules
 * 2. Navigation event handling (route changes, errors, lazy loading)
 * 3. Application preloader management
 * 4. Page title synchronization
 * 5. Framework version tracking (ng-alain, ng-zorro-antd)
 * 
 * Architecture Patterns:
 * - Standalone component (no NgModule)
 * - OnPush change detection for optimal performance
 * - inject() dependency injection (Angular 20+)
 * - Minimal template (single router-outlet)
 * 
 * Framework Versions:
 * - ng-alain: 20.1.x
 * - ng-zorro-antd: 20.3.x
 * - Angular: 20.x
 * 
 * @see {@link ./app.config.ts} for application configuration
 * @see {@link ./features/routes.ts} for route definitions
 * @see {@link docs/⭐️/ARCHITECTURAL_ANALYSIS_REPORT.md} for architecture analysis
 */

import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, NavigationError, RouteConfigLoadStart, Router, RouterOutlet } from '@angular/router';
import { TitleService, VERSION as VERSION_ALAIN, stepPreloader } from '@delon/theme';
import { environment } from '@env/environment';
import { NzModalService } from 'ng-zorro-antd/modal';
import { VERSION as VERSION_ZORRO } from 'ng-zorro-antd/version';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
  imports: [RouterOutlet],
  host: {
    '[attr.ng-alain-version]': 'ngAlainVersion',
    '[attr.ng-zorro-version]': 'ngZorroVersion'
  }
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly titleSrv = inject(TitleService);
  private readonly modalSrv = inject(NzModalService);
  ngAlainVersion = VERSION_ALAIN.full;
  ngZorroVersion = VERSION_ZORRO.full;

  private donePreloader = stepPreloader();

  ngOnInit(): void {
    let configLoad = false;
    this.router.events.subscribe(ev => {
      if (ev instanceof RouteConfigLoadStart) {
        configLoad = true;
      }
      if (configLoad && ev instanceof NavigationError) {
        this.modalSrv.confirm({
          nzTitle: `提醒`,
          nzContent: environment.production ? `应用可能已发布新版本，请点击刷新才能生效。` : `无法加载路由：${ev.url}`,
          nzCancelDisabled: false,
          nzOkText: '刷新',
          nzCancelText: '忽略',
          nzOnOk: () => location.reload()
        });
      }
      if (ev instanceof NavigationEnd) {
        this.donePreloader();
        this.titleSrv.setTitle();
        this.modalSrv.closeAll();
      }
    });
  }
}
