import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthFacade } from '@core';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'passport-lock',
  templateUrl: './lock.component.html',
  styleUrls: ['./lock.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule, I18nPipe]
})
export class UserLockComponent {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

  form = inject(FormBuilder).nonNullable.group({
    password: ['', [Validators.required]]
  });

  error = signal('');
  loading = signal(false);

  async submit(): Promise<void> {
    this.error.set('');
    if (this.form.invalid) return;

    this.loading.set(true);
    try {
      const email = this.auth.currentEmail();
      const password = this.form.value.password!;
      if (email) {
        await this.auth.signInWithEmailAndPassword(email, password);
        await this.router.navigateByUrl('/');
      } else {
        this.error.set('請重新登入');
      }
    } catch (err: any) {
      this.error.set(err?.message || '解鎖失敗，請重試');
    } finally {
      this.loading.set(false);
    }
  }
}
