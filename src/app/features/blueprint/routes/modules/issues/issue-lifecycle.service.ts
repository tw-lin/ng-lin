import { Injectable } from '@angular/core';

import { Issue } from './issues.model';

@Injectable({ providedIn: 'root' })
export class IssueLifecycleService {
  canEdit(_issue: Issue): boolean {
    return true;
  }

  canDelete(_issue: Issue): boolean {
    return true;
  }
}
