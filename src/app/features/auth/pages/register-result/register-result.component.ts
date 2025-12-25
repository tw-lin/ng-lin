import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { I18nPipe } from '@delon/theme';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzResultModule } from 'ng-zorro-antd/result';

@Component({
  selector: 'passport-register-result',
  templateUrl: './register-result.component.html',
  styleUrls: ['./register-result.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzResultModule, NzButtonModule, RouterLink, I18nPipe]
})
export class UserRegisterResultComponent {
  params = inject(ActivatedRoute).snapshot.queryParams as { email?: string };
}
