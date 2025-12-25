import { Injectable, inject } from '@angular/core';
import { AuthFacade, BlueprintRole } from '@core';

import { CreateMemberRequest, Member, UpdateMemberRequest } from './members.model';
import { MembersRepository } from './members.repository';

@Injectable({ providedIn: 'root' })
export class MembersService {
  private readonly repository = inject(MembersRepository);
  private readonly auth = inject(AuthFacade);

  list(blueprintId: string): Promise<Member[]> {
    return this.repository.findByBlueprint(blueprintId);
  }

  async addMember(payload: Omit<CreateMemberRequest, 'grantedBy'>): Promise<Member> {
    const currentUser = this.auth.currentUser;
    return this.repository.addMember({
      ...payload,
      grantedBy: currentUser?.uid || 'system'
    });
  }

  updateMember(blueprintId: string, memberId: string, payload: UpdateMemberRequest): Promise<void> {
    return this.repository.updateMember(blueprintId, memberId, payload);
  }

  removeMember(blueprintId: string, memberId: string): Promise<void> {
    return this.repository.removeMember(blueprintId, memberId);
  }

  getDefaultPermissions(role: BlueprintRole): Record<string, boolean> {
    switch (role) {
      case BlueprintRole.MAINTAINER:
        return {
          canManageMembers: true,
          canManageSettings: true,
          canExportData: true,
          canDeleteBlueprint: false
        };
      case BlueprintRole.CONTRIBUTOR:
        return {
          canManageMembers: false,
          canManageSettings: false,
          canExportData: true,
          canDeleteBlueprint: false
        };
      case BlueprintRole.VIEWER:
      default:
        return {
          canManageMembers: false,
          canManageSettings: false,
          canExportData: false,
          canDeleteBlueprint: false
        };
    }
  }
}
