import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthFacade } from '@core';

@Component({
  selector: 'passport-callback',
  template: `<div class="p-lg">處理登入中...</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class CallbackComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthFacade);

  constructor() {
    const type = this.route.snapshot.params['type'];
    // TODO: handle OAuth callback types when implemented
    void type;
    // After callback, ensure auth state is refreshed then redirect
    this.auth.refreshUser().finally(() => this.router.navigateByUrl('/'));
  }
}
